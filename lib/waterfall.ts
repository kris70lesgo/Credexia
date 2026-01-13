/**
 * Payment Waterfall Engine
 * Calculates lender distributions with strict rounding control
 */

export interface Owner {
  name: string;
  bic: string;
  account: string;
  share: number; // 0.0 to 1.0 (e.g., 0.40 = 40%)
}

export interface Distribution {
  name: string;
  bic: string;
  account: string;
  amount: number;
}

/**
 * Calculate waterfall distribution with exact rounding integrity
 * 
 * BUSINESS RULES:
 * - No rounding until final output formatting
 * - Floating point remainder ALWAYS goes to Agent Bank (last entry)
 * - Final sum MUST equal total cash exactly
 * 
 * @param totalCash Total payment amount to distribute
 * @param owners Array of ownership entities with shares
 * @returns Distribution array with exact amounts
 */
export function calculateWaterfall(totalCash: number, owners: Owner[]): Distribution[] {
  if (!owners || owners.length === 0) {
    throw new Error('At least one owner is required');
  }

  // Validate total shares sum to 1.0 (within floating point tolerance)
  const totalShares = owners.reduce((sum, o) => sum + o.share, 0);
  if (Math.abs(totalShares - 1.0) > 0.0001) {
    throw new Error(`Total shares must equal 1.0, got ${totalShares}`);
  }

  const distribution: Distribution[] = [];

  // Calculate each owner's share (no rounding yet)
  owners.forEach(owner => {
    distribution.push({
      name: owner.name,
      bic: owner.bic,
      account: owner.account,
      amount: totalCash * owner.share,
    });
  });

  // Calculate total distributed (may have floating point error)
  const totalDistributed = distribution.reduce((sum, d) => sum + d.amount, 0);

  // Calculate rounding difference
  const roundingDiff = totalCash - totalDistributed;

  console.log(`💰 Total cash: ${totalCash}`);
  console.log(`📊 Total distributed (before adjustment): ${totalDistributed}`);
  console.log(`🔧 Rounding adjustment: ${roundingDiff}`);

  // Agent Bank (last entry) absorbs the rounding difference
  distribution[distribution.length - 1].amount += roundingDiff;

  // Verify integrity
  const finalSum = distribution.reduce((sum, d) => sum + d.amount, 0);
  console.log(`✅ Final sum: ${finalSum}`);

  if (Math.abs(finalSum - totalCash) > 0.0001) {
    throw new Error(`Waterfall integrity failed: ${finalSum} !== ${totalCash}`);
  }

  return distribution;
}
