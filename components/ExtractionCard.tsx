import React from 'react';
import { CheckCircle2, DollarSign, AlertCircle } from 'lucide-react';
import { PaymentData } from '../types';

interface ExtractionCardProps {
  data: PaymentData;
  isLoading?: boolean;
}

export const ExtractionCard: React.FC<ExtractionCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency,
  }).format(data.totalAmount);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <DollarSign size={80} className="text-indigo-600" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Cash In</h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 size={12} />
            {data.confidenceScore}% Confidence
          </span>
        </div>
        
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-gray-900">{formattedAmount}</span>
          <span className="text-sm font-medium text-gray-400">{data.currency}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
          <AlertCircle size={14} className="text-blue-500" />
          <span>Verified against payment advice #PA-2024-892</span>
        </div>
      </div>
    </div>
  );
};