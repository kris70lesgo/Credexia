import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not configured. Trade parsing will fail.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface TradeData {
  seller: string;
  buyer: string;
  amount: number;
  loan_id: string;
  percentage: number;
  confidence: number;
}

/**
 * AI Parsing endpoint using Gemini 2.5 Pro
 * Extracts trade data from Notice of Assignment PDF
 */
export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { base64, mimeType = 'application/pdf' } = body;

    if (!base64) {
      return NextResponse.json(
        { error: 'No file data provided' },
        { status: 400 }
      );
    }

    console.log('🤖 Starting Gemini AI trade extraction...');

    // Try models in order: Gemini 2.5 Flash → Gemini 2.5 Pro → Gemini 1.5 Flash → Gemini Pro
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-2.5-pro', 
      'gemini-1.5-flash-latest',
      'gemini-pro'
    ];
    
    let result;
    let lastError;
    let successModel = '';
    
    for (const modelName of modelNames) {
      try {
        console.log(`🔄 Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1, // Low temperature for precise extraction
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
          },
        });

        const prompt = `
You are a legal document analysis expert specializing in loan trade assignments.

Extract the following information from this Notice of Assignment document:

1. **Seller** - The party transferring ownership (e.g., "Pacific Rim Traders", "HSBC Bank")
2. **Buyer** - The party receiving ownership (e.g., "Quantum Capital Partners")
3. **Trade Amount** - The dollar value of the transaction (convert to absolute USD)
4. **Loan ID** - The loan facility identifier (e.g., "LN-2024-8392", "loan-001")
5. **Ownership Percentage** - The percentage of ownership being transferred (e.g., 45.0 for 45%)

CRITICAL RULES:
- Extract exact legal entity names (do not abbreviate)
- Convert all amounts to absolute USD (e.g., "15M" → 15000000)
- Percentage should be a decimal (45% → 45.0, not 0.45)
- Confidence score: 1.0 = certain, 0.6-0.8 = likely, <0.6 = uncertain
- Return NULL for any field you cannot find
- If confidence < 0.6 for ANY field, set overall confidence < 0.6

Output ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "seller": "string or null",
  "buyer": "string or null",
  "amount": number or null,
  "loan_id": "string or null",
  "percentage": number or null,
  "confidence": number between 0 and 1
}

Example valid outputs:
{"seller": "Pacific Rim Traders", "buyer": "Quantum Capital Partners", "amount": 15000000, "loan_id": "LN-2024-8392", "percentage": 45.0, "confidence": 0.95}
{"seller": "Bank A", "buyer": "Fund X", "amount": 5000000, "loan_id": "loan-001", "percentage": 20.0, "confidence": 0.85}
{"seller": null, "buyer": "Fund Y", "amount": null, "loan_id": "LN-999", "percentage": 10.0, "confidence": 0.55}
`;

        result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: base64,
            },
          },
          { text: prompt },
        ]);
        
        successModel = modelName;
        console.log(`✅ Successfully used model: ${modelName}`);
        break; // Success, exit loop
      } catch (error: any) {
        console.log(`❌ Model ${modelName} failed: ${error.message}`);
        lastError = error;
        continue; // Try next model
      }
    }
    
    if (!result) {
      console.error('❌ All models failed:', lastError);
      return NextResponse.json(
        { error: `All models failed. Last error: ${lastError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    const response = result.response;
    const text = response.text();

    console.log('📄 Raw Gemini response:', text);

    // Parse JSON response
    let extracted: TradeData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      extracted = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini JSON response:', parseError);
      return NextResponse.json(
        { error: 'AI returned invalid JSON format' },
        { status: 500 }
      );
    }

    // Validate confidence threshold
    if (extracted.confidence < 0.6) {
      return NextResponse.json(
        {
          error: 'Low confidence extraction',
          confidence: extracted.confidence,
          data: extracted,
        },
        { status: 422 }
      );
    }

    // Validate required fields
    const missingFields = [];
    if (!extracted.seller) missingFields.push('seller');
    if (!extracted.buyer) missingFields.push('buyer');
    if (!extracted.amount) missingFields.push('amount');
    if (!extracted.loan_id) missingFields.push('loan_id');
    if (!extracted.percentage) missingFields.push('percentage');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missing: missingFields,
          data: extracted,
        },
        { status: 422 }
      );
    }

    console.log('✅ Trade data extracted successfully:', extracted);

    return NextResponse.json({
      success: true,
      data: extracted,
    });

  } catch (error) {
    console.error('❌ Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse document' },
      { status: 500 }
    );
  }
}
