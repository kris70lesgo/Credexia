import { NextRequest, NextResponse } from 'next/server';
import { loanOwners } from '@/lib/trade-state';

/**
 * Get Loan Owners endpoint
 * Returns ownership structure for a specific loan
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loan_id = searchParams.get('loan_id');

    // If no loan_id provided, return all loans
    if (!loan_id) {
      return NextResponse.json({
        success: true,
        loans: Object.keys(loanOwners).map(id => ({
          loan_id: id,
          owners: loanOwners[id],
          total_ownership: loanOwners[id].reduce((sum, o) => sum + o.share, 0),
        })),
      });
    }

    // Check if loan exists
    if (!loanOwners[loan_id]) {
      return NextResponse.json(
        { error: `Loan ${loan_id} not found` },
        { status: 404 }
      );
    }

    const owners = loanOwners[loan_id];
    const totalOwnership = owners.reduce((sum, o) => sum + o.share, 0);

    return NextResponse.json({
      success: true,
      loan_id: loan_id,
      owners: owners,
      total_ownership: Math.round(totalOwnership * 10000) / 10000,
    });

  } catch (error) {
    console.error('Get owners error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve ownership data' },
      { status: 500 }
    );
  }
}
