'use client';

import React from 'react';
import SalesStatisticsCard from '@/components/SalesStatisticsCard';
import RecentTransactionsCard from '@/components/RecentTransactionsCard';
import CurrentBalanceCard from '@/components/CurrentBalanceCard';
import MarketForecastCard from '@/components/MarketForecastCard';
import StatisticsCard from '@/components/Statistics';
import AnalyticsCard from '@/components/AnalyticsCard';
import PaymentTemplatesCard from '@/components/PaymentTemplateCard';
import ExpandableChatDemo from '@/components/expandablechatbot';
import { AnalyticsData, StatisticsData, User } from '@/types';
import { ShieldCheck } from 'lucide-react';

export default function PortfolioDashboard() {
  const complianceData: StatisticsData[] = [
    { label: 'Mon', value: 142 },
    { label: 'Tue', value: 145 },
    { label: 'Wed', value: 140 },
    { label: 'Thu', value: 138 },
    { label: 'Fri', value: 144 },
    { label: 'Sat', value: 144 },
    { label: 'Sun', value: 145 },
  ];

  const extractionData: AnalyticsData[] = [
    { label: 'Auto Extracted', percentage: 92, amount: 92 },
    { label: 'Manual Confirmed', percentage: 6, amount: 6 },
    { label: 'Failed Extraction', percentage: 2, amount: 2 },
  ];

  const agreements: User[] = [
    { id: '1021', name: 'Alpha Corp', role: 'Term Loan A', imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&h=100' },
    { id: '1022', name: 'Beta Ltd', role: 'Revolver', imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100' },
    { id: '1023', name: 'Gamma Inc', role: 'Bridge', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100' },
    { id: '1024', name: 'Delta LLC', role: 'Term Loan B', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100' },
  ];

  return (
    <div
      className="min-h-screen font-sans text-gray-900 pb-14 -m-6"
      style={{
        background: 'radial-gradient(circle at 20% 20%, #eef5ee 0%, #e2ebdf 40%, #d9e5d8 75%, #d4dfd3 100%)'
      }}
    >
      <header className="max-w-7xl mx-auto px-5 pt-7 pb-5 flex justify-between items-end border-b border-gray-200/60 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E]">Covenant Monitoring Dashboard</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Real-time covenant compliance across all active loans</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 cursor-help group relative">
          <ShieldCheck size={16} className="text-[#00C255]" />
          <span className="text-xs font-medium text-gray-700 tracking-wide uppercase">Blockchain Verified</span>
          <div className="absolute top-full right-0 mt-2 w-64 bg-[#1C1C1E] text-white text-xs p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            All compliance events are cryptographically timestamped on Polygon.
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 flex flex-col gap-8">
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Compliance Summary</h2>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-1">
              <CurrentBalanceCard />
            </div>
            <div className="lg:col-span-1">
              <AnalyticsCard data={extractionData} />
            </div>
            <div className="lg:col-span-1">
              <StatisticsCard total="145 Compliant" points={complianceData} />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Covenant Trend Analysis</h2>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesStatisticsCard />
            <MarketForecastCard />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Portfolio Activity</h2>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <RecentTransactionsCard />
            <PaymentTemplatesCard total="$842M" users={agreements} />
          </div>
        </section>
      </main>

      <ExpandableChatDemo />
    </div>
  );
}
