'use client';

import React, { useState } from 'react';

const MarketForecastCard: React.FC = () => {
  const [sliderVal, setSliderVal] = useState(28); 
  
  const timeline = [
    { year: 'Q4 23', label: 'Covenant\nIntroduced', active: false },
    { year: 'Q1 24', label: 'EBITDA\nDecline', active: false },
    { year: 'Q2 24', label: 'Threshold\nBreached', active: false },
    { year: 'Q3 24', label: 'Waiver\nIssued', active: true },
  ];

  const handleSliderChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderVal(percentage);
  };

  const volatility = 12 + (sliderVal * 0.1);
  const exposure = 28 + (sliderVal * 0.05);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 min-h-[360px] border border-gray-200/60">
      
      {/* LEFT: Timeline */}
      <div className="w-full md:w-[35%] flex flex-col relative pl-2">
         <div className="mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-200">
                <div className="w-4 h-4 border-[3px] border-gray-900 rounded-full" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 leading-[1.3] uppercase tracking-[0.18em]">Compliance Timeline</h3>
         </div>

         <div className="flex-1 relative flex flex-col justify-between py-2">
             <div className="absolute left-[5.5px] top-2 bottom-2 w-[2px] bg-gray-100" />
             {timeline.map((item, i) => (
                <div key={i} className="relative pl-6 group cursor-pointer">
                                        <div className={`absolute left-0 top-[5px] w-[13px] h-[13px] rounded-full border-[2.5px] z-10 transition-all duration-300
                                             ${item.active 
                                                 ? 'bg-black border-black scale-110 shadow-lg' 
                                                 : 'bg-white border-gray-300 group-hover:border-gray-500'}`} 
                                        />
                    <div className="transition-opacity duration-300">
                        <span className={`block font-semibold text-xs mb-0.5 ${item.active ? 'text-black' : 'text-gray-600 group-hover:text-gray-800'}`}>
                            {item.year}
                        </span>
                        <p className="text-xs text-gray-500 font-medium leading-snug whitespace-pre-line">
                            {item.label}
                        </p>
                    </div>
                </div>
             ))}
         </div>
      </div>

      {/* RIGHT: Stacked Cards */}
      <div className="w-full md:w-[65%] flex flex-col gap-4">
        
        {/* Breach Probability Card */}
        <div className="bg-[#8ff4aa] rounded-3xl p-5 flex flex-col justify-between h-[170px] relative overflow-hidden border border-[#6fd68e]/70">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-800/70">Breach Probability Index</h4>
                    <div className="text-3xl font-semibold mt-1 text-gray-900 tabular-nums tracking-tight">
                        {(sliderVal * 0.65).toFixed(0)}%
                    </div>
                    <p className="text-xs text-gray-700 mt-1 font-medium">Likelihood in next quarter</p>
                </div>
                <div className="w-6 h-6" />
            </div>

            <div className="mt-auto">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">Risk Score: {sliderVal.toFixed(0)}</span>
                </div>
                <div 
                   className="relative h-11 w-full rounded-xl border border-black/10 overflow-hidden cursor-pointer group"
                   onMouseDown={(e) => handleSliderChange(e)}
                   onMouseMove={(e) => { if (e.buttons === 1) handleSliderChange(e); }}
                >
                    <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wLDQgbDQsLTQiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')]"></div>
                    <div 
                        className="absolute left-0 top-0 bottom-0 bg-black/5 transition-all duration-100 ease-out"
                        style={{ width: `${sliderVal}%` }}
                    />
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-2 border-[#6f5bd6] shadow-md z-10 transition-all duration-100 ease-out flex items-center justify-center group-hover:scale-110"
                        style={{ left: `calc(${sliderVal}% - 14px)` }}
                    >
                        <div className="w-1.5 h-1.5 bg-[#6f5bd6] rounded-full" />
                    </div>
                </div>
            </div>
        </div>

        {/* Covenant Cushion Card */}
        <div className="bg-[#a28cff] rounded-3xl p-5 flex flex-col justify-between h-[170px] relative overflow-hidden border border-purple-300/70">
             <div className="flex justify-between items-start z-10">
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/80">Projected Covenant Cushion</h4>
                    <div className="text-3xl font-semibold mt-1 text-white tracking-tight">1.8x</div>
                    <p className="text-xs text-white/70 mt-1 font-medium">Forecasted ratio</p>
                </div>
                <div className="w-6 h-6" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[100px] pointer-events-none">
                 <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                     <defs>
                         <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                             <stop offset="100%" stopColor="white" stopOpacity="0" />
                         </linearGradient>
                     </defs>
                                         <path d="M0,100 L0,70 C50,60 80,80 140,40 S240,50 300,10 L300,100 Z" fill="url(#chartGrad)" />
                                         <path d="M0,70 C50,60 80,80 140,40 S240,50 300,10" fill="none" stroke="#3a2b76" strokeWidth="2" strokeLinecap="round" className="opacity-60" />
                     <g className="animate-pulse">
                                                <circle cx="140" cy="40" r="12" fill="white" fillOpacity="0.2" />
                                                <circle cx="140" cy="40" r="5" fill="#7ee5a4" stroke="#2d215f" strokeWidth="1.5" />
                     </g>
                 </svg>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketForecastCard;