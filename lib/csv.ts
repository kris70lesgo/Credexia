import { Distribution } from "./waterfall";

/**
 * Generate CSV output for payment execution
 * Format: Bank Name,BIC Code,Currency,Account Number,Amount
 */
export function generateCSV(distribution: Distribution[]): string {
  const headers = "Bank Name,BIC Code,Currency,Account Number,Amount\n";
  
  const rows = distribution.map(d => {
    // Format amount to 2 decimal places for banking systems
    const formattedAmount = d.amount.toFixed(2);
    return `${d.name},${d.bic},USD,${d.account},${formattedAmount}`;
  }).join('\n');

  return headers + rows;
}

/**
 * Validate CSV sum equals original total
 */
export function validateCSVIntegrity(csv: string, expectedTotal: number): boolean {
  const lines = csv.split('\n').filter(line => line.trim() && !line.startsWith('Bank Name'));
  
  const sum = lines.reduce((total, line) => {
    const amount = parseFloat(line.split(',').pop() || '0');
    return total + amount;
  }, 0);

  const diff = Math.abs(sum - expectedTotal);
  
  if (diff > 0.01) {
    console.error(`❌ CSV integrity check failed: ${sum} !== ${expectedTotal} (diff: ${diff})`);
    return false;
  }

  console.log(`✅ CSV integrity verified: ${sum} === ${expectedTotal}`);
  return true;
}
