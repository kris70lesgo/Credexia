'use client';

import React, { useState, useMemo } from 'react';
import { AnalyticsData } from '../types';

interface AnalyticsCardProps {
  data: AnalyticsData[];
}

/**
 * AnalyticsCard
 * 
 * Interaction Logic:
 * - Manages `activeIndex` state to track the currently selected data point.
 * - Derived `currentTotal` based on the active index.
 * - Clicking a bar updates the index and the main displayed total.
 * - Supports Keyboard navigation (Tab to focus, Enter/Space to select).
 * 
 * Animation:
 * - Bars animate height and color using CSS transitions (`transition-all`).
 * - The card lifts slightly on hover (`hover:-translate-y-1`).

 */
const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Derive the total from the currently selected bar
  const currentTotal = useMemo(() => {
    const value = data[activeIndex]?.amount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }, [activeIndex, data]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveIndex(index);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[320px] relative overflow-hidden border border-gray-200/60">
      {/* Header */}
      <div className="flex justify-between items-start mb-2 z-20 relative">
        <h3 className="text-gray-900 font-medium text-sm">Compliance Extraction</h3>
      </div>

      {/* Amount - transitions when value changes */}
      <div className="z-20 relative">
        <div className="text-3xl font-semibold text-gray-900 tracking-tight transition-all duration-300">
          {data[activeIndex]?.percentage}%
        </div>
        <p className="text-xs text-gray-500 mt-1 font-medium transition-opacity duration-300">
          {data[activeIndex]?.label}
        </p>
      </div>

      {/* Chart Area */}
      <div className="flex-1 flex items-end justify-between gap-4 relative mt-4">
        {/* Background Stripes Pattern Overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 6px, #eef2ec 6px, #eef2ec 12px)'
          }}
        />

        {/* Vertical grid lines */}
        <div className="absolute inset-0 flex justify-between z-0 opacity-40 pointer-events-none">
          {data.map((_, i) => (
            <div key={i} className="w-px h-full bg-gray-200" />
          ))}
        </div>

        {data.map((item, index) => {
          const isActive = index === activeIndex;
          
          return (
            <div key={index} className="flex flex-col items-center w-full z-10 h-full justify-end">
              {/* Bar Container */}
              <div 
                className="relative w-full flex items-end h-full cursor-pointer group"
                onClick={() => setActiveIndex(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={`Select ${item.label} with revenue ${item.amount}`}
                aria-pressed={isActive}
              > 
                {/* The Bar (stacked tint + accent) */}
                <div 
                  className="w-full rounded-2xl transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ height: `${item.percentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#dfe3e0] to-[#f4f6f3]" />
                  <div 
                    className={`absolute inset-x-0 bottom-0 transition-all duration-500 ease-out ${isActive ? 'bg-[#cfd3cf]' : 'bg-[#e6e9e4]'}`}
                    style={{ height: '30%' }}
                  />
                  <div 
                    className={`absolute inset-x-0 bottom-[30%] transition-all duration-500 ease-out ${isActive ? 'bg-[#e5e7e4]' : 'bg-[#f2f4f0]'}`}
                    style={{ height: '60%' }}
                  />
                  <div className="absolute inset-0 opacity-25 mix-blend-multiply" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(255,255,255,0.45) 6px, rgba(255,255,255,0.45) 12px)' }} />
                  <div 
                    className={`absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-500
                    ${isActive ? 'bg-black/15 opacity-100' : 'bg-transparent opacity-0'}`} 
                  />
                  
                  <span className={`absolute top-6 left-1/2 -translate-x-1/2 font-medium text-xs transition-colors duration-300
                     ${isActive ? 'text-gray-800' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}>
                    {Math.round(item.percentage)}%
                  </span>
                </div>
              </div>
              
              {/* X-Axis Label */}
              <span className={`mt-3 text-xs font-medium transition-colors duration-300 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsCard;