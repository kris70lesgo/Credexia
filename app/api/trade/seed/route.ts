import { NextRequest, NextResponse } from 'next/server';
import { loanOwners } from '@/lib/trade-state';

/**
 * Seed endpoint - Initialize ownership registry with test data
 * Call this endpoint to populate initial ownership before testing trades
 */

/**
 * GET - View all current ownership
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    loans: Object.keys(loanOwners).map(loan_id => ({
      loan_id,
      owners: loanOwners[loan_id],
      total: loanOwners[loan_id].reduce((sum, o) => sum + o.share, 0),
    })),
  });
}

/**
 * POST - Add or overwrite loan ownership
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loan_id, owners } = body;

    if (!loan_id || !owners || !Array.isArray(owners)) {
      return NextResponse.json(
        { error: 'loan_id and owners array required' },
        { status: 400 }
      );
    }

    // Validate owners structure
    for (const owner of owners) {
      if (!owner.name || typeof owner.share !== 'number') {
        return NextResponse.json(
          { error: 'Each owner must have name (string) and share (number)' },
          { status: 400 }
        );
      }
    }

    // Set ownership
    loanOwners[loan_id] = owners;

    console.log(`✅ Seeded ownership for ${loan_id}:`, owners);

    return NextResponse.json({
      success: true,
      loan_id: loan_id,
      owners: owners,
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}

/**
 * Reset all ownership data
 */
export async function DELETE() {
  try {
    // Clear all ownership
    Object.keys(loanOwners).forEach(key => delete loanOwners[key]);

    console.log('🗑️ All ownership data cleared');

    return NextResponse.json({
      success: true,
      message: 'All ownership data cleared',
    });

  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset data' },
      { status: 500 }
    );
  }
}
