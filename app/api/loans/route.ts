import { NextRequest, NextResponse } from 'next/server';
import { Loan } from '@/lib/types';
import { mockLoans } from '@/lib/mock-data';
import { 
  rateLimit, 
  validateNumber,
  sanitizeError,
  addSecurityHeaders,
  logSecurityEvent 
} from '@/lib/security';

// GET /api/loans - Fetch all loans with aggregated data
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    const loans: Loan[] = [...mockLoans];

    return addSecurityHeaders(NextResponse.json({
      loans,
      source: 'mock',
      count: loans.length,
    }));
  } catch (error) {
    logSecurityEvent('Error fetching loans', { error: sanitizeError(error) });
    return addSecurityHeaders(NextResponse.json(
      { error: sanitizeError(error), loans: [] },
      { status: 500 }
    ));
  }
}

// POST /api/loans - Create a new loan
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    const body = await request.json();
    
    // Input validation
    if (!body.borrower || typeof body.borrower !== 'string') {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid borrower name' },
        { status: 400 }
      ));
    }

    if (!validateNumber(body.loanAmount, 1, 1e15)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid loan amount' },
        { status: 400 }
      ));
    }
    
    return addSecurityHeaders(NextResponse.json(
      {
        error: 'Loan creation is disabled in mock-data mode.',
      },
      { status: 501 }
    ));
  } catch (error) {
    logSecurityEvent('Error creating loan', { error: sanitizeError(error) });
    return addSecurityHeaders(NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    ));
  }
}
