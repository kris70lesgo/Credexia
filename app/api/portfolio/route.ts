import { NextRequest, NextResponse } from 'next/server';
import { mockLoans } from '@/lib/mock-data';
import { 
  rateLimit, 
  sanitizeError,
  addSecurityHeaders,
  logSecurityEvent,
} from '@/lib/security';

/**
 * Portfolio API - Latest Compliance Status per Loan
 * Returns loan facilities with their most recent covenant test results
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    const portfolioData = mockLoans.map((loan) => ({
      id: loan.id,
      borrowerName: loan.borrowerName,
      facilityAmount: loan.facilityAmount,
      outstandingAmount: loan.outstandingAmount,
      covenantType: loan.covenantType,
      covenantLimit: loan.covenantLimit,
      maturityDate: loan.maturityDate,
      currentRatio: loan.debtToEbitda,
      status: loan.status,
      lastTestDate: loan.lastTestDate,
      lastTxHash: loan.lastTxHash ?? null,
      isSealed: loan.isSealed,
      source: 'mock',
    }));

    return addSecurityHeaders(NextResponse.json({
      success: true,
      loans: portfolioData,
      count: portfolioData.length,
    }));

  } catch (error) {
    logSecurityEvent('Portfolio API mock error', { error: sanitizeError(error) });
    return addSecurityHeaders(NextResponse.json(
      { error: 'Failed to build mock portfolio data' },
      { status: 500 }
    ));
  }
}
