import { NextRequest, NextResponse } from 'next/server';
import { loanOwners } from '@/lib/trade-state';

interface ValidationRequest {
  seller: string;
  buyer: string;
  amount: number;
  loan_id: string;
  percentage: number;
}

/**
 * Validation endpoint for trade data
 * Ensures seller exists, has sufficient ownership, and buyer is valid
 */
export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { seller, buyer, loan_id, percentage } = body;

    const errors: string[] = [];

    // Rule 1: loan_id must exist in loanOwners
    console.log(`🔍 Validating loan: ${loan_id}`);
    console.log(`📊 All loans in registry: ${Object.keys(loanOwners).join(', ')}`);
    
    if (!loanOwners[loan_id]) {
      errors.push(`Loan ID "${loan_id}" does not exist in ownership registry`);
    } else {
      const owners = loanOwners[loan_id];
      console.log(`👥 Owners for ${loan_id}: ${owners.map(o => `${o.name} (${o.share}%)`).join(', ')}`);
      console.log(`🔎 Looking for seller: "${seller}"`);

      // Rule 2: seller must exist in that loan
      const sellerOwner = owners.find(o => o.name === seller);
      if (!sellerOwner) {
        console.error(`❌ Seller "${seller}" not found in owners list`);
        console.error(`   Available owners: ${owners.map(o => `"${o.name}"`).join(', ')}`);
        errors.push(`Seller "${seller}" is not an owner of loan ${loan_id}`);
      } else {
        console.log(`✅ Found seller: ${sellerOwner.name} with ${sellerOwner.share}% ownership`);
        // Rule 3: seller.share ≥ percentage
        if (sellerOwner.share < percentage) {
          errors.push(
            `Seller "${seller}" has insufficient ownership (${sellerOwner.share}%) to transfer ${percentage}%`
          );
        }
      }
    }

    // Rule 4: buyer must not be empty
    if (!buyer || buyer.trim() === '') {
      errors.push('Buyer name cannot be empty');
    }

    // Rule 5: percentage > 0 and ≤ 100
    if (percentage <= 0) {
      errors.push('Percentage must be greater than 0');
    }
    if (percentage > 100) {
      errors.push('Percentage cannot exceed 100');
    }

    // Return validation result
    if (errors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors: errors,
      });
    }

    return NextResponse.json({
      valid: true,
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
