import { NextRequest, NextResponse } from 'next/server';
import { mockComplianceEvents, mockLoans } from '@/lib/mock-data';
import { 
  rateLimit, 
  validateLoanId,
  sanitizeError,
  addSecurityHeaders,
  logSecurityEvent
} from '@/lib/security';

/**
 * Compliance Events API - Historical Event Log
 * Returns all covenant test submissions in chronological order
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Validate loanId if provided
    if (loanId && !validateLoanId(loanId)) {
      logSecurityEvent('Invalid loan ID in compliance-events', { loanId });
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid loanId format' },
        { status: 400 }
      ));
    }

    const maxLimit = Math.min(limit, 1000);
    const filteredEvents = mockComplianceEvents
      .filter((event) => !loanId || event.loanId === loanId)
      .slice(0, maxLimit);
    const loanLookup = new Map(mockLoans.map((loan) => [loan.id, loan]));

    const formattedEvents = filteredEvents.map((event) => {
      const loan = loanLookup.get(event.loanId);

      return {
        id: event.id,
        eventId: `EVT-${event.id.slice(0, 8).toUpperCase()}`,
        loanId: event.loanId,
        borrowerName: loan?.borrowerName || 'Unknown',
        covenantType: 'Debt/EBITDA',
        exposure: loan?.outstandingAmount ?? null,
        totalDebt: event.totalDebt,
        ebitda: event.ebitda,
        ratio: event.ratio,
        covenantLimit: loan?.covenantLimit || 3.5,
        status: event.status,
        testDate: event.timestamp,
        txHash: event.txHash,
        blockNumber: event.blockNumber,
        uploadId: event.documentId,
        source: 'mock',
      };
    });

    return addSecurityHeaders(NextResponse.json({
      success: true,
      events: formattedEvents,
      count: formattedEvents.length,
    }));

  } catch (error) {
    logSecurityEvent('Compliance events API error', { error: sanitizeError(error) });
    return addSecurityHeaders(NextResponse.json(
      { error: 'Error formatting compliance events' },
      { status: 500 }
    ));
  }
}
