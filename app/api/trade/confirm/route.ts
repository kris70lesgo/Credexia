import { NextRequest, NextResponse } from 'next/server';
import { tradeEvents, generateTradeId } from '@/lib/trade-state';

interface ConfirmRequest {
  seller: string;
  buyer: string;
  amount: number;
  loan_id: string;
  percentage: number;
}

/**
 * Confirm Trade endpoint
 * Records trade event in pending state (does NOT update ownership yet)
 */
export async function POST(request: NextRequest) {
  try {
    const body: ConfirmRequest = await request.json();
    const { seller, buyer, amount, loan_id, percentage } = body;

    // Validate required fields
    if (!seller || !buyer || !amount || !loan_id || !percentage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create trade event
    const tradeEvent = {
      id: generateTradeId(),
      loan_id: loan_id,
      seller: seller,
      buyer: buyer,
      amount: amount,
      percentage: percentage,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
    };

    // Push to global trade events
    tradeEvents.push(tradeEvent);

    console.log('✅ Trade event recorded:', tradeEvent);
    console.log(`📊 Total trade events: ${tradeEvents.length}`);
    console.log(`📋 All trade IDs: ${tradeEvents.map(t => t.id).join(', ')}`);
    console.log(`🔑 New trade ID: ${tradeEvent.id}`);
    
    // Verify it was actually added
    const verify = tradeEvents.find(t => t.id === tradeEvent.id);
    console.log(`🔍 Verification - Trade found in array: ${!!verify}`);

    return NextResponse.json({
      success: true,
      trade: tradeEvent,
    });

  } catch (error) {
    console.error('Confirm trade error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm trade' },
      { status: 500 }
    );
  }
}
