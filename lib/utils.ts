import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CovenantStatus } from "./types";
import { LoanStatus } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount?: number | null): string {
  if (amount === null || amount === undefined) return "—";
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount?: number | null): string {
  if (amount === null || amount === undefined) return "—";
  
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return "—";
  
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: CovenantStatus | LoanStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  // Handle LoanStatus enum
  if (typeof status === 'string' && Object.values(LoanStatus).includes(status as LoanStatus)) {
    switch (status as LoanStatus) {
      case LoanStatus.COMPLIANT:
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          dot: 'bg-green-500',
        };
      case LoanStatus.WARNING:
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
        };
      case LoanStatus.BREACH:
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          dot: 'bg-red-500',
        };
    }
  }
  
  // Handle CovenantStatus
  switch (status) {
    case 'GREEN':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        dot: 'bg-green-500',
      };
    case 'AMBER':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'RED':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        dot: 'bg-gray-500',
      };
  }
}

export function getStatusLabel(status: CovenantStatus): string {
  switch (status) {
    case 'GREEN':
      return 'Compliant';
    case 'AMBER':
      return 'Warning';
    case 'RED':
      return 'Breach';
  }
}

export function truncateHash(hash: string, chars: number = 8): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function getExplorerUrl(txHash: string): string {
  // Polygon Amoy testnet explorer
  return `https://www.oklink.com/amoy/tx/${txHash}`;
}
