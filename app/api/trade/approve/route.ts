import { NextRequest, NextResponse } from 'next/server';
import { tradeEvents, loanOwners, createTradeHash, TradeEvent } from '@/lib/trade-state';

interface ApproveRequest {
  trade_id: string;
}

/**
 * Approve Trade endpoint
 * Executes ownership transfer and updates trade status
 */
export async function POST(request: NextRequest) {
  try {
    const body: ApproveRequest = await request.json();
    const { trade_id } = body;

    if (!trade_id) {
      return NextResponse.json(
        { error: 'Trade ID is required' },
        { status: 400 }
      );
    }

    // Find trade event by ID
    console.log(`🔍 Looking for trade ID: ${trade_id}`);
    console.log(`📊 Total trades in memory: ${tradeEvents.length}`);
    console.log(`📋 Available trade IDs: ${tradeEvents.map(t => t.id).join(', ')}`);
    
    const tradeIndex = tradeEvents.findIndex(t => t.id === trade_id);
    if (tradeIndex === -1) {
      console.error(`❌ Trade not found: ${trade_id}`);
      return NextResponse.json(
        { error: `Trade event not found. Available trades: ${tradeEvents.length}` },
        { status: 404 }
      );
    }

    const trade = tradeEvents[tradeIndex];

    // Check if already approved
    if (trade.status === 'approved') {
      return NextResponse.json(
        { error: 'Trade already approved' },
        { status: 400 }
      );
    }

    // Verify loan exists
    if (!loanOwners[trade.loan_id]) {
      return NextResponse.json(
        { error: `Loan ${trade.loan_id} not found` },
        { status: 404 }
      );
    }

    const owners = loanOwners[trade.loan_id];

    // Find seller
    const sellerIndex = owners.findIndex(o => o.name === trade.seller);
    if (sellerIndex === -1) {
      return NextResponse.json(
        { error: `Seller "${trade.seller}" not found in ownership registry` },
        { status: 404 }
      );
    }

    const seller = owners[sellerIndex];

    // Verify seller has sufficient ownership
    if (seller.share < trade.percentage) {
      return NextResponse.json(
        {
          error: `Seller has insufficient ownership (${seller.share}% < ${trade.percentage}%)`,
        },
        { status: 400 }
      );
    }

    // Execute ownership transfer
    console.log('🔄 Executing ownership transfer...');
    console.log(`  Before: ${trade.seller} has ${seller.share}%`);

    // Subtract from seller
    seller.share -= trade.percentage;
    seller.share = Math.round(seller.share * 10000) / 10000; // Avoid floating point errors

    console.log(`  After: ${trade.seller} has ${seller.share}%`);

    // Find or create buyer
    const buyerIndex = owners.findIndex(o => o.name === trade.buyer);
    if (buyerIndex === -1) {
      // Buyer doesn't exist - add them
      owners.push({
        name: trade.buyer,
        share: trade.percentage,
      });
      console.log(`  Added new owner: ${trade.buyer} with ${trade.percentage}%`);
    } else {
      // Buyer exists - add to their share
      const buyer = owners[buyerIndex];
      const oldShare = buyer.share;
      buyer.share += trade.percentage;
      buyer.share = Math.round(buyer.share * 10000) / 10000;
      console.log(`  Updated buyer: ${trade.buyer} from ${oldShare}% to ${buyer.share}%`);
    }

    // Remove seller if they have 0 share
    if (seller.share === 0) {
      owners.splice(sellerIndex, 1);
      console.log(`  Removed ${trade.seller} (0% ownership)`);
    }

    // Update trade status
    const updatedTrade: TradeEvent = {
      ...trade,
      status: 'approved',
      approved_at: new Date().toISOString(),
    };

    // Create blockchain hash
    updatedTrade.hash = createTradeHash(updatedTrade);

    // Update in global state
    tradeEvents[tradeIndex] = updatedTrade;

    console.log('✅ Trade approved and ownership updated');
    console.log(`  Trade hash: ${updatedTrade.hash}`);
    console.log(`  New ownership structure:`, owners);

    return NextResponse.json({
      success: true,
      trade: updatedTrade,
      ownership: owners,
    });

  } catch (error) {
    console.error('Approve trade error:', error);
    return NextResponse.json(
      { error: 'Failed to approve trade' },
      { status: 500 }
    );
  }
}
