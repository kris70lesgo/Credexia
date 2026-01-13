'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ControlBar } from '@/components/ControlBar';
import { LoanTable } from '@/components/LoanTablerevamp';
import { generateData } from '@/services/mockData';
import { LoanFacility, LoanStatus, FilterState } from '@/types';

const initialFilterState: FilterState = {
  status: [],
  covenantTypes: [],
  ratioMin: '',
  ratioMax: '',
  amountMin: '',
  amountMax: '',
  dateFrom: '',
  dateTo: '',
};

export default function LoansPage() {
  const [data, setData] = useState<LoanFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState<LoanStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(initialFilterState);

  // Fetch live portfolio data and merge with mock data
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        
        // Start with mock data
        const mockData = generateData(40);
        setData(mockData);

        // Fetch real portfolio data
        const response = await fetch('/api/portfolio');
        const result = await response.json();
        
        console.log('📊 Portfolio API response:', {
          ok: response.ok,
          loanCount: result.loans?.length || 0,
          loans: result.loans
        });

        if (response.ok && result.loans && result.loans.length > 0) {
          // Transform API response to match LoanFacility interface
          const liveLoans: LoanFacility[] = result.loans.map((loan: {
            id: string;
            borrowerName: string;
            facilityAmount: number;
            outstandingAmount: number;
            covenantType: string;
            currentRatio: number | null;
            covenantLimit: number;
            status: string;
            lastTestDate: string | null;
            isSealed: boolean;
          }) => ({
            loanId: loan.id,
            borrowerName: loan.borrowerName,
            facilityAmount: loan.facilityAmount,
            outstandingAmount: loan.outstandingAmount,
            covenantType: loan.covenantType,
            currentRatio: loan.currentRatio ?? 0,
            covenantLimit: loan.covenantLimit,
            status: loan.status === 'GREEN' ? 'Compliant' as LoanStatus : 
                   loan.status === 'AMBER' ? 'Warning' as LoanStatus :
                   loan.status === 'RED' ? 'Breach' as LoanStatus :
                   'Pending' as LoanStatus,
            lastTestDate: loan.lastTestDate ?? new Date().toISOString().split('T')[0],
            nextTestDate: calculateNextTestDate(loan.lastTestDate),
            isSealed: loan.isSealed,
          }));

          // Create a map of loan IDs that have real data
          const liveLoanIds = new Set(liveLoans.map(l => l.loanId));

          // Merge: Real data overrides mock data, keep mock for loans without events
          const mergedData = [
            ...liveLoans,
            ...mockData.filter(mockLoan => !liveLoanIds.has(mockLoan.loanId))
          ];

          setData(mergedData);
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        // Keep mock data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  // Helper to calculate next test date (quarterly + 45 days)
  const calculateNextTestDate = (lastTest: string | null): string => {
    if (!lastTest) return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const last = new Date(lastTest);
    last.setDate(last.getDate() + 135); // 3 months + 45 days
    return last.toISOString().split('T')[0];
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Quick Filter (Pills)
      const matchesQuickStatus = quickFilter === 'All' || item.status === quickFilter;
      
      // 2. Search (with null checks)
      const matchesSearch = (item.borrowerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.loanId?.toLowerCase().includes(searchTerm.toLowerCase())) ?? true;

      // 3. Advanced Filters
      
      // Status (Multi-select from popover)
      const matchesAdvStatus = advancedFilters.status.length === 0 || advancedFilters.status.includes(item.status);

      // Covenant Type
      const matchesCovenant = advancedFilters.covenantTypes.length === 0 || advancedFilters.covenantTypes.includes(item.covenantType);

      // Ratio Range
      const ratio = item.currentRatio;
      const minRatio = advancedFilters.ratioMin ? parseFloat(advancedFilters.ratioMin) : -Infinity;
      const maxRatio = advancedFilters.ratioMax ? parseFloat(advancedFilters.ratioMax) : Infinity;
      const matchesRatio = ratio >= minRatio && ratio <= maxRatio;

      // Outstanding Amount
      const amount = item.outstandingAmount;
      const minAmount = advancedFilters.amountMin ? parseFloat(advancedFilters.amountMin) : -Infinity;
      const maxAmount = advancedFilters.amountMax ? parseFloat(advancedFilters.amountMax) : Infinity;
      const matchesAmount = amount >= minAmount && amount <= maxAmount;

      // Date Range
      const date = new Date(item.lastTestDate).getTime();
      const fromDate = advancedFilters.dateFrom ? new Date(advancedFilters.dateFrom).getTime() : -Infinity;
      const toDate = advancedFilters.dateTo ? new Date(advancedFilters.dateTo).getTime() : Infinity;
      const matchesDate = date >= fromDate && date <= toDate;

      return matchesQuickStatus && matchesSearch && matchesAdvStatus && matchesCovenant && matchesRatio && matchesAmount && matchesDate;
    });
  }, [data, quickFilter, searchTerm, advancedFilters]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Main Content Area */}
      <main className="flex-grow p-6 sm:p-8 max-w-[1600px] mx-auto w-full flex flex-col h-screen">
        
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Loan Facilities</h1>
          <p className="text-sm text-gray-500 mt-1">Manage compliance, covenants, and testing schedules across your portfolio.</p>
        </div>

        <ControlBar 
          currentFilter={quickFilter} 
          onFilterChange={setQuickFilter} 
          onSearch={setSearchTerm}
          advancedFilters={advancedFilters}
          onApplyAdvancedFilters={setAdvancedFilters}
          onClearAdvancedFilters={() => setAdvancedFilters(initialFilterState)}
        />

        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-gray-500">Loading portfolio data...</div>
          </div>
        ) : (
          <div className="flex-grow overflow-hidden relative pb-1">
            <LoanTable data={filteredData} />
          </div>
        )}
      </main>
    </div>
  );
}
