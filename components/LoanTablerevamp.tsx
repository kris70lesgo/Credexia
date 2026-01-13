import React, { useState } from 'react';
import { MoreVertical, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { LoanFacility, LoanStatus, SortConfig } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate, getStatusColor } from '../utils';

interface LoanTableProps {
  data: LoanFacility[];
}

export const LoanTable: React.FC<LoanTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'status', direction: 'asc' });

  const handleSort = (field: keyof LoanFacility) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (a[sortConfig.field] < b[sortConfig.field]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.field] > b[sortConfig.field]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const SortIcon = ({ field }: { field: keyof LoanFacility }) => {
    if (sortConfig.field !== field) return <div className="w-3 h-3 opacity-0 group-hover:opacity-30 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 ml-1 text-gray-500" /> 
      : <ChevronDown className="w-3 h-3 ml-1 text-gray-500" />;
  };

  const HeaderCell = ({ field, label, align = 'left', className = '' }: { field: keyof LoanFacility, label: string, align?: 'left' | 'right', className?: string }) => (
    <th 
      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group select-none hover:bg-gray-50 transition-colors border-b border-gray-200 sticky top-0 bg-white z-10 ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-auto custom-scrollbar flex-grow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <HeaderCell field="borrowerName" label="Borrower" />
              <HeaderCell field="outstandingAmount" label="Outstanding" />
              <HeaderCell field="covenantType" label="Covenant" />
              <HeaderCell field="currentRatio" label="Ratio" />
              <HeaderCell field="limitRatio" label="Limit" align="right" />
              <HeaderCell field="status" label="Status" />
              <HeaderCell field="lastTestDate" label="Last Test" align="right" />
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right border-b border-gray-200 sticky top-0 bg-white z-10 w-12">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((loan) => (
              <tr 
                key={loan.loanId} 
                className="group hover:bg-gray-50/80 transition-colors duration-150 ease-in-out cursor-default"
              >
                {/* Borrower */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{loan.borrowerName}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 font-mono mt-0.5">{loan.loanId}</span>
                  </div>
                </td>

                {/* Outstanding */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 font-mono tracking-tight">
                      {formatCurrency(loan.outstandingAmount)}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gray-400 rounded-full" 
                          style={{ width: `${(loan.outstandingAmount / loan.creditLimit) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500">of {formatCompactCurrency(loan.creditLimit)}</span>
                    </div>
                  </div>
                </td>

                {/* Covenant */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    {loan.covenantType}
                  </span>
                </td>

                {/* Ratio */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-sm font-mono font-medium ${
                    loan.status === LoanStatus.BREACH ? 'text-rose-600' : 
                    loan.status === LoanStatus.WARNING ? 'text-amber-600' : 'text-gray-700'
                  }`}>
                    {loan.currentRatio != null ? `${loan.currentRatio.toFixed(2)}x` : '—'}
                  </span>
                </td>

                {/* Limit */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-500 font-mono">
                    {loan.limitRatio != null ? `${loan.limitRatio.toFixed(2)}x` : '—'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                    {loan.status === LoanStatus.COMPLIANT && <CheckCircle2 className="w-3 h-3" />}
                    {loan.status === LoanStatus.WARNING && <Clock className="w-3 h-3" />}
                    {loan.status === LoanStatus.BREACH && <AlertCircle className="w-3 h-3" />}
                    {loan.status}
                  </div>
                </td>

                {/* Last Test */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500 font-mono">
                  {formatDate(loan.lastTestDate)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Pagination stub */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">Showing {data.length} of 142 records</span>
        <div className="flex gap-1">
           <button className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
           <button className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  );
};