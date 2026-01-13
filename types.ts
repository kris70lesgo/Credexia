export interface SalesData {
  month: string;
  visitors: number;
  sales: number; // purple segment
  ads: number;   // green segment
}

export interface TimelineEvent {
  year: string;
  title?: string;
  active?: boolean;
}

export interface Transaction {
  id: string;
  pair: string;
  avatars: string[];
}

export interface ForecastData {
  btcPrice: number;
  marketCap: number; // in Trillions
}

export interface AnalyticsData {
  label: string;
  amount: number;
  percentage: number;
}

export interface User {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export interface StatisticsData {
  label: string;
  value: number;
}

// Loan Management Types
export enum LoanStatus {
  COMPLIANT = 'Compliant',
  WARNING = 'Warning',
  BREACH = 'Breach',
}

export interface LoanFacility {
  loanId: string;
  borrowerName: string;
  covenantType: string;
  currentRatio: number;
  limitRatio: number;
  status: LoanStatus;
  outstandingAmount: number;
  creditLimit: number;
  lastTestDate: string;
  nextTestDate: string;
}

export interface PaymentData {
  totalAmount: number;
  currency: string;
  confidenceScore: number;
  extractedDate: string;
}

export interface FilterState {
  status: LoanStatus[];
  covenantTypes: string[];
  ratioMin: string;
  ratioMax: string;
  amountMin: string;
  amountMax: string;
  dateFrom: string;
  dateTo: string;
}

export interface SortConfig {
  field: keyof LoanFacility;
  direction: 'asc' | 'desc';
}