import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Extract total payment amount from Payment Advice PDF using Gemini AI
 * Tries multiple models in order: gemini-2.5-flash → gemini-2.5-pro → gemini-1.5-flash-latest → gemini-pro
 */
export async function extractTotalPaymentFromPDF(base64Pdf: string): Promise<number> {
  const modelNames = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash-latest',
    'gemini-pro'
  ];

  let lastError: unknown;

  for (const modelName of modelNames) {
    try {
      console.log(`🔄 Trying model: ${modelName} for payment extraction`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 256,
        },
      });

      const prompt = `
You are a financial document analyzer.

Find the TOTAL PAYMENT AMOUNT in this Payment Advice document.

CRITICAL RULES:
- Return ONLY the numeric value as a plain number
- No currency symbols (no $, USD, etc.)
- No commas or formatting
- No words or explanations
- Just the raw number

Example valid outputs:
10000000
5250000.50
1234567.89

DO NOT return:
"$10,000,000"
"10000000 USD"
"The total payment is 10000000"

Return ONLY the number.
`;

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Pdf,
          },
        },
        { text: prompt },
      ]);

      const raw = result.response.text().trim();
      console.log(`📄 Raw Gemini response: "${raw}"`);

      // Clean up common formatting
      const cleaned = raw
        .replace(/[,$]/g, '')  // Remove $ and commas
        .replace(/USD|usd/gi, '')  // Remove currency codes
        .trim();

      const value = parseFloat(cleaned);

      if (isNaN(value) || value <= 0) {
        throw new Error(`Invalid numeric value extracted: "${raw}"`);
      }

      console.log(`✅ Successfully extracted payment amount: ${value} using ${modelName}`);
      return value;

    } catch (error: unknown) {
      console.log(`❌ Model ${modelName} failed: ${error instanceof Error ? error.message : String(error)}`);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All models failed to extract payment amount. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
}
