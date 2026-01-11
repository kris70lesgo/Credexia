'use client';

import React, { useMemo, useState, useRef } from 'react';
import { StatisticsData } from '../types';

interface StatisticsCardProps {
  total: string;
  points: StatisticsData[];
}

/**
 * StatisticsCard
 * 
 * Interaction Logic:
 * - Uses `onMouseMove` on the chart container to calculate the cursor's relative X position.
 * - Maps the X position to the nearest data point index (`interactionIndex`).
 * - Updates the vertical highlight bar and tooltip based on this index.
 * - Resets to the last data point when the mouse leaves (`onMouseLeave`).
 * 
 * Animation:
 * - Tooltip and Highlight Bar use CSS transitions to snap smoothly between points.
 * - SVG path generation logic remains smooth (cubic bezier).
 */
const StatisticsCard: React.FC<StatisticsCardProps> = ({ total, points }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Default to the last item being highlighted
  const [highlightIndex, setHighlightIndex] = useState<number>(points.length - 1);
  const [isHovering, setIsHovering] = useState(false);

  // Calculate SVG path
  const pathData = useMemo(() => {
    if (points.length === 0) return { d: '', coords: [] };
    
    // Grid dimensions
    const width = 100; // viewBox units
    const height = 40;
    
    // Normalize data
    const maxVal = Math.max(...points.map(p => p.value)) * 1.2;
    const minVal = Math.min(...points.map(p => p.value)) * 0.8;
    const range = (maxVal - minVal) || 1;
    
    const coords = points.map((p, i) => ({
      x: (i / (Math.max(points.length - 1, 1))) * width,
      y: height - ((p.value - minVal) / range) * height
    }));

    if (coords.length === 0) return { d: '', coords: [] };

    let d = `M ${coords[0].x},${coords[0].y}`;
    
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) * 0.2;
      const cp1y = p1.y + (p2.y - p0.y) * 0.2;
      const cp2x = p2.x - (p3.x - p1.x) * 0.2;
      const cp2y = p2.y - (p3.y - p1.y) * 0.2;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    
    return { d, coords };
  }, [points]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || points.length === 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Calculate index 0..N-1
    const rawIndex = (x / width) * (points.length - 1);
    const index = Math.round(rawIndex);
    
    // Clamp
    const safeIndex = Math.max(0, Math.min(index, points.length - 1));
    
    setHighlightIndex(safeIndex);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Optional: reset to last index or keep last interaction
    setHighlightIndex(points.length - 1); 
  };

  const highlightPoint = pathData.coords[highlightIndex];
  const activeValue = points[highlightIndex]?.value;

  return (
    <div className="bg-[#8df4a8] rounded-3xl p-6 shadow-sm flex flex-col h-[320px] text-gray-900 relative overflow-hidden border border-[#6ed58c]/60">
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="flex justify-between items-start mb-2 pointer-events-auto">
          <h3 className="font-medium text-sm text-gray-900">Loans Under Covenant Monitoring</h3>
        </div>

        <div className="mb-6 pointer-events-auto">
          <div className="text-3xl font-semibold tracking-tight transition-all duration-300">
             {total}
          </div>
          <div className="text-xs text-gray-500 font-medium h-5">
            {isHovering ? `Compliant: ${activeValue}` : 'Weekly Status Changes'}
          </div>
        </div>
      </div>

      {/* Interactive Chart Area */}
      <div 
        ref={containerRef}
        className="absolute inset-x-6 bottom-6 top-28 z-20 cursor-crosshair touch-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
          {/* Vertical Grid Lines (Visual only) */}
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-35">
            {points.map((_, i) => (
              <div key={i} className="w-px h-full bg-black/20" />
            ))}
          </div>

          {/* Highlight Column */}
          {highlightPoint && points.length > 1 && (
            <div 
              className="absolute top-0 bottom-0 w-px bg-black/35 pointer-events-none transition-all duration-150 ease-out"
              style={{ 
                left: `${(highlightIndex / (points.length - 1)) * 100}%`,
              }}
            >
              <div className="absolute top-0 -translate-x-1/2 w-12 h-full bg-gradient-to-b from-black/10 to-transparent" />
            </div>
          )}

           {/* Tooltip */}
           {highlightPoint && (
             <div 
              className={`absolute bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md transform -translate-x-1/2 -translate-y-full mb-3 pointer-events-none transition-all duration-150 ease-out z-30
                ${isHovering ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
              `}
              style={{ 
                left: points.length > 1 ? `${(highlightIndex / (points.length - 1)) * 100}%` : '50%',
                top: `${highlightPoint.y / 40 * 100}%`
              }}
            >
               {activeValue}
            </div>
           )}

          {/* SVG Graph */}
          <div className="absolute inset-0 pointer-events-none">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 100 40" 
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              <defs>
                <linearGradient id="stat-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f0f0f" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0f0f0f" stopOpacity="0" />
                </linearGradient>
              </defs>
              {pathData.d && (
                <>
                  <path d={`${pathData.d} L 100,40 L 0,40 Z`} fill="url(#stat-fill)" opacity="0.35" />
                  <path 
                    d={pathData.d} 
                    fill="none" 
                    stroke="#0f0f0f" 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                  />
                </>
              )}
              
              {highlightPoint && (
                <circle 
                  cx={highlightPoint.x} 
                  cy={highlightPoint.y} 
                  r="2.5" 
                  fill="#0f0f0f"
                  className={`drop-shadow-sm transition-all duration-150 ease-out ${isHovering ? 'opacity-100' : 'opacity-0'}`}
                />
              )}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs font-medium text-gray-500 pointer-events-none translate-y-6">
             {points.map((p, i) => (
               <span key={i} className={`w-8 text-center transition-colors duration-200 ${i === highlightIndex && isHovering ? 'text-gray-800' : ''}`}>
                 {p.label}
               </span>
             ))}
          </div>
        </div>
    </div>
  );
};

export default StatisticsCard;