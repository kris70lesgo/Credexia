import { LoanFacility, LoanStatus } from '../types';

export const COMPANIES = [
  "Apex Logistics Intl", "North Star Shipping", "Meridian Supply Chain", "Horizon Freight", 
  "Pacific Rim Traders", "Atlas Global Ops", "Vertex Distribution", "Summit Capital Flow",
  "Pioneer Heavy Industries", "Vanguard Maritime", "Echo Base Systems", "Quantum Mechanics Ltd",
  "Blue Yonder Transport", "Silverline Carriers", "Ironclad Security", "Rapid Transit Corp",
  "Global Linkage Grp", "Stellar Dynamics", "Omicron Engineering", "Delta Force Logistics"
];

export const COVENANTS = [
  "Net Leverage", "Interest Coverage", "Debt Service", "Fixed Charge", "Current Ratio", "Capex Limit"
];

const generateLoanId = (index: number) => `LN-${2024000 + index}`;

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

export const generateData = (count: number = 50): LoanFacility[] => {
  return Array.from({ length: count }).map((_, i) => {
    const statusValues = Object.values(LoanStatus);
    // Weighted random for realistic status distribution
    const r = Math.random();
    let status = LoanStatus.COMPLIANT;
    if (r > 0.85) status = LoanStatus.BREACH;
    else if (r > 0.70) status = LoanStatus.WARNING;

    const limit = Math.floor(Math.random() * 50) * 1000000 + 5000000; // 5M to 55M
    const usage = limit * (0.4 + Math.random() * 0.55); // 40% to 95% usage

    const limitRatio = Math.floor((1.5 + Math.random() * 2) * 10) / 10;
    // Correlate ratio with status slightly
    let currentRatio = limitRatio - (Math.random() * 0.5);
    if (status === LoanStatus.BREACH) currentRatio = limitRatio + 0.2;
    if (status === LoanStatus.WARNING) currentRatio = limitRatio - 0.05;

    return {
      loanId: generateLoanId(i),
      borrowerName: COMPANIES[i % COMPANIES.length],
      covenantType: COVENANTS[i % COVENANTS.length],
      currentRatio: parseFloat(currentRatio.toFixed(2)),
      limitRatio: limitRatio,
      status: status,
      outstandingAmount: usage,
      creditLimit: limit,
      lastTestDate: getRandomDate(new Date('2023-09-01'), new Date('2024-03-15')),
      nextTestDate: getRandomDate(new Date('2024-04-01'), new Date('2024-06-30')),
    };
  });
};