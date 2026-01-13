import { NextRequest, NextResponse } from "next/server";
import { extractTotalPaymentFromPDF } from "@/lib/gemini-waterfall";
import { calculateWaterfall, Owner } from "@/lib/waterfall";
import { generateCSV, validateCSVIntegrity } from "@/lib/csv";

/**
 * POST /api/waterfall
 * Payment Waterfall Engine - Extracts payment amount and calculates lender distributions
 * 
 * Request:
 * {
 *   "loanId": "loan-001",
 *   "owners": [
 *     { "name": "New Capital LLP", "bic": "CHASGB2L", "account": "12345678", "share": 0.40 },
 *     { "name": "Bank B", "bic": "BOFAGB2L", "account": "87654321", "share": 0.60 }
 *   ],
 *   "base64Pdf": "<BASE64_STRING>"
 * }
 * 
 * Response:
 * {
 *   "loan_id": "loan-001",
 *   "total_cash_in": 10000000,
 *   "distribution": [...],
 *   "csv": "..."
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { loanId, base64Pdf, owners } = body;

    // Validate required fields
    if (!base64Pdf) {
      return NextResponse.json(
        { error: "base64Pdf is required" },
        { status: 400 }
      );
    }

    if (!owners || !Array.isArray(owners) || owners.length === 0) {
      return NextResponse.json(
        { error: "owners array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate owner structure
    for (const owner of owners) {
      if (!owner.name || !owner.bic || !owner.account || typeof owner.share !== 'number') {
        return NextResponse.json(
          { error: "Each owner must have name, bic, account, and share (number)" },
          { status: 400 }
        );
      }
    }

    console.log('🚀 Starting waterfall calculation...');
    console.log(`📋 Loan ID: ${loanId || 'N/A'}`);
    console.log(`👥 Owners: ${owners.length}`);

    // STEP 1: AI Extraction
    console.log('\n🤖 STEP 1: Extracting payment amount from PDF...');
    const extractionStart = Date.now();
    
    let totalCash: number;
    try {
      totalCash = await extractTotalPaymentFromPDF(base64Pdf);
    } catch (error: unknown) {
      console.error('❌ AI extraction failed:', error instanceof Error ? error.message : String(error));
      return NextResponse.json(
        { error: `AI extraction failed: ${error instanceof Error ? error.message : String(error)}` },
        { status: 422 }
      );
    }

    const extractionTime = Date.now() - extractionStart;
    console.log(`✅ Extracted: $${totalCash.toLocaleString()} in ${extractionTime}ms`);

    // STEP 2: Waterfall Calculation
    console.log('\n💰 STEP 2: Calculating waterfall distribution...');
    let distribution;
    try {
      distribution = calculateWaterfall(totalCash, owners as Owner[]);
    } catch (error: unknown) {
      console.error('❌ Waterfall calculation failed:', error instanceof Error ? error.message : String(error));
      return NextResponse.json(
        { error: `Waterfall calculation failed: ${error instanceof Error ? error.message : String(error)}` },
        { status: 422 }
      );
    }

    // Verify integrity
    const finalSum = distribution.reduce((sum, d) => sum + d.amount, 0);
    if (Math.abs(finalSum - totalCash) > 0.0001) {
      return NextResponse.json(
        { error: "Waterfall rounding integrity failed" },
        { status: 500 }
      );
    }

    // STEP 3: CSV Generation
    console.log('\n📄 STEP 3: Generating CSV...');
    const csv = generateCSV(distribution);

    // Validate CSV integrity
    if (!validateCSVIntegrity(csv, totalCash)) {
      return NextResponse.json(
        { error: "CSV integrity validation failed" },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Waterfall completed in ${totalTime}ms`);
    console.log(`   - AI extraction: ${extractionTime}ms`);
    console.log(`   - Calculation: ${totalTime - extractionTime}ms`);

    // Return response
    return NextResponse.json({
      loan_id: loanId,
      total_cash_in: totalCash,
      distribution: distribution.map(d => ({
        name: d.name,
        bic: d.bic,
        account: d.account,
        amount: d.amount,
      })),
      csv: csv,
      processing_time_ms: totalTime,
      extraction_time_ms: extractionTime,
    });

  } catch (error: unknown) {
    console.error('❌ Waterfall error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
