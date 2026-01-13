/**
 * Global In-Memory State for Trade Management
 * Single source of truth for ownership and trade events
 */

export interface Owner {
  name: string;
  share: number; // Percentage (0-100)
}

export interface TradeEvent {
  id: string;
  loan_id: string;
  seller: string;
  buyer: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  hash?: string;
}

// Use global singleton to prevent state loss during hot reloads
declare global {
  var __tradeState: {
    loanOwners: Record<string, Owner[]>;
    tradeEvents: TradeEvent[];
  } | undefined;
}

if (!global.__tradeState) {
  global.__tradeState = {
    loanOwners: {
      'loan-001': [
        { name: 'Bank A', share: 40.0 },
        { name: 'Bank B', share: 60.0 },
      ],
      'LN-2024-8392': [
        { name: 'Pacific Rim Traders', share: 45.0 },
        { name: 'Sovereign Wealth I', share: 30.0 },
        { name: 'Maritime Ventures', share: 25.0 },
      ],
    },
    tradeEvents: [],
  };
  console.log('🔄 Initialized global trade state');
}

// Export references to the global singleton
export const loanOwners = global.__tradeState.loanOwners;
export const tradeEvents = global.__tradeState.tradeEvents;

// Helper to generate trade ID
export function generateTradeId(): string {
  return `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Helper to create hash
export function createTradeHash(trade: TradeEvent): string {
  const tradeString = JSON.stringify({
    id: trade.id,
    loan_id: trade.loan_id,
    seller: trade.seller,
    buyer: trade.buyer,
    amount: trade.amount,
    percentage: trade.percentage,
    status: trade.status,
    approved_at: trade.approved_at,
  });
  
  // Create a realistic-looking hash using FNV-1a algorithm
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < tradeString.length; i++) {
    hash ^= tradeString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  
  // Generate additional entropy from timestamp and random data
  const timestamp = Date.now();
  const random1 = Math.floor(Math.random() * 0xFFFFFFFF);
  const random2 = Math.floor(Math.random() * 0xFFFFFFFF);
  
  // Create 8 hex parts (8 chars each = 64 total)
  const parts = [
    (hash >>> 0).toString(16).padStart(8, '0'),
    (timestamp & 0xFFFFFFFF).toString(16).padStart(8, '0'),
    random1.toString(16).padStart(8, '0'),
    random2.toString(16).padStart(8, '0'),
    ((hash ^ timestamp) >>> 0).toString(16).padStart(8, '0'),
    ((random1 ^ random2) >>> 0).toString(16).padStart(8, '0'),
    ((hash ^ random1) >>> 0).toString(16).padStart(8, '0'),
    ((timestamp ^ random2) >>> 0).toString(16).padStart(8, '0'),
  ];
  
  // Combine all parts to form 64-character hash
  return parts.join('');
}
