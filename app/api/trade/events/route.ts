import { NextRequest, NextResponse } from 'next/server';
import { tradeEvents } from '@/lib/trade-state';

/**
 * Get Trade Events endpoint
 * Returns all trade events with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loan_id = searchParams.get('loan_id');
    const status = searchParams.get('status');

    let filteredEvents = [...tradeEvents];

    // Filter by loan_id if provided
    if (loan_id) {
      filteredEvents = filteredEvents.filter(t => t.loan_id === loan_id);
    }

    // Filter by status if provided
    if (status) {
      filteredEvents = filteredEvents.filter(t => t.status === status);
    }

    // Sort by created_at descending (newest first)
    filteredEvents.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      count: filteredEvents.length,
      events: filteredEvents,
    });

  } catch (error) {
    console.error('Get trade events error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve trade events' },
      { status: 500 }
    );
  }
}
