import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const SalesStatisticsCard: React.FC = () => {
  const [period, setPeriod] = useState<'Quarterly' | 'Yearly'>('Quarterly');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const data = [
    { label: 'Q1 2024', compliant: 82, atRisk: 12, breached: 6, hatched: false }, 
    { label: 'Q2 2024', compliant: 79, atRisk: 14, breached: 7, hatched: false },
    { label: 'Q3 2024', compliant: 85, atRisk: 10, breached: 5, hatched: false },
    { label: 'Q4 2024', compliant: 80, atRisk: 13, breached: 7, hatched: true }
  ];

  return (
    <div className="bg-[#0f1112] text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[330px] relative overflow-visible border border-black/30">
      
      {/* Header */}
      <div className="flex justify-between items-start z-20">
        <div>
          <h2 className="text-sm font-medium tracking-wide text-white">Covenant Status Trend</h2>
          <p className="text-xs text-gray-400 mt-1.5 font-normal">Status changes per quarter</p>
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-full border border-gray-700 bg-[#1a1c1e] text-xs text-gray-200 hover:bg-[#1f2224] transition-colors duration-200"
          >
            {period}
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <div className={`absolute right-0 top-full mt-2 w-32 bg-[#2C2C2E] border border-gray-700 rounded-2xl shadow-xl overflow-hidden transition-all duration-200 origin-top-right z-50 ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
            {['Quarterly', 'Yearly'].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setPeriod(opt as 'Quarterly' | 'Yearly');
                  setIsOpen(false);
                  setMounted(false);
                  setTimeout(() => setMounted(true), 50); 
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 transition-colors first:border-b first:border-gray-700/50"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-end justify-between mt-4 flex-1">
        <div className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-xs font-medium">Total Monitored</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-white">
            145
          </div>
        </div>

        {/* Chart */}
        <div className="flex gap-6 items-end h-[200px] relative w-full">
          <div className="absolute inset-0 flex justify-between opacity-25 pointer-events-none">
            {data.map((_, i) => (
              <div key={i} className="w-px h-full bg-white/30" />
            ))}
          </div>
          {data.map((item) => {
            const totalHeight = item.compliant + item.atRisk + item.breached;

            return (
              <div key={item.label} className="flex flex-col items-center gap-4 group/bar cursor-pointer">
                 <div className="relative w-[70px] h-[170px] flex items-end">
                    {item.hatched && (
                      <div className="absolute inset-0 w-full h-full rounded-2xl border border-dashed border-white/15 opacity-80 pointer-events-none" />
                    )}
                    <div 
                      className="w-full relative flex flex-col-reverse overflow-hidden rounded-2xl transition-transform duration-300 group-hover/bar:scale-[1.02]"
                      style={{ 
                        height: `${totalHeight}%`, 
                        transition: 'height 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        opacity: mounted ? 1 : 0
                      }}
                    >
                       {/* Red: Breached */}
                       <div 
                         className="w-full bg-[#ef4444] transition-all duration-700 ease-out"
                         style={{ height: `${(item.breached / totalHeight) * 100}%` }}
                       />
                       {/* Amber: At Risk */}
                       <div 
                         className="w-full bg-[#f59e0b] transition-all duration-700 ease-out delay-75"
                         style={{ height: `${(item.atRisk / totalHeight) * 100}%` }}
                       />
                       {/* Green: Compliant */}
                       <div 
                         className="w-full bg-[#10b981] transition-all duration-700 ease-out delay-150"
                         style={{ height: `${(item.compliant / totalHeight) * 100}%` }}
                       />
                    </div>
                </div>
                <span className={`text-xs font-medium tracking-wide transition-colors duration-300 ${item.hatched ? 'text-gray-500' : 'text-white'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesStatisticsCard;
