'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Plus, Check } from 'lucide-react';
import { User } from '../types';

interface PaymentTemplatesCardProps {
  total: string;
  users: User[];
  visibleCount?: number;
}

/**
 * PaymentTemplatesCard
 * 
 * Interaction Logic:
 * - `expanded` state toggles the visibility of the "extra" users list.
 * - `selectedUser` state tracks which avatar is clicked.
 * - Clicking "+N" expands the list.
 * 
 * Animation:
 * - Expansion uses `max-h` transition to animate height smoothly from 0 to full.
 * - Avatar hover/active states scale and add border rings.
 */
const PaymentTemplatesCard: React.FC<PaymentTemplatesCardProps> = ({ 
  total, 
  users, 
  visibleCount = 3 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const visibleUsers = users.slice(0, visibleCount);
  const hiddenUsers = users.slice(visibleCount);
  const extraCount = Math.max(0, users.length - visibleCount);

  // Find currently selected user object for display
  const activeUser = users.find(u => u.id === selectedUser);

  return (
    <div className="bg-[#f8faf7] rounded-3xl p-6 shadow-sm flex flex-col min-h-[320px] h-auto transition-transform duration-300 border border-gray-200/60">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <h3 className="text-gray-900 font-medium text-sm">Covenant Portfolio</h3>
      </div>

      {/* Amount */}
      <div className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">
        {total}
      </div>

      <div className="flex-1 flex flex-col justify-end">
        {/* Selected User Detail View (Conditional) */}
        <div className={`mb-4 transition-all duration-300 overflow-hidden ${activeUser ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'}`}>
           {activeUser && (
             <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                <img src={activeUser.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{activeUser.name}</p>
                  <p className="text-xs text-green-700">{activeUser.role}</p>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="ml-auto p-1 hover:bg-green-100 rounded-full text-green-700"
                >
                  <Check className="w-4 h-4" />
                </button>
             </div>
           )}
        </div>

        {/* Sub-card: Mandatory Payments */}
        <div className={`bg-white rounded-2xl p-5 relative transition-all duration-500 ease-in-out border border-gray-100`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Monitored Loans</h4>
              <p className="text-xs text-gray-500 mt-1">Active covenant tracking</p>
            </div>
            <div className="w-8 h-8" />
          </div>

          {/* Avatar Stack Row */}
          <div className="flex items-center pl-2 flex-wrap gap-y-2">
            {visibleUsers.map((user, i) => {
              const isSelected = selectedUser === user.id;
              return (
                <button 
                  key={user.id}
                  onClick={() => setSelectedUser(isSelected ? null : user.id)}
                  className={`w-10 h-10 rounded-full border-2 relative -ml-3 first:ml-0 overflow-hidden transition-all duration-200 
                    ${isSelected ? 'border-[#00C255] z-20 scale-110' : 'border-white z-0 hover:z-10 hover:scale-110'}
                  `}
                  aria-label={`Select ${user.name}`}
                  title={user.name}
                >
                  <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                </button>
              );
            })}
            
            {/* Extra Count Circle (Toggle) */}
            {extraCount > 0 && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className={`w-10 h-10 rounded-full border-2 border-white bg-[#00C255] hover:bg-[#00A347] text-white flex items-center justify-center text-sm font-semibold -ml-3 z-10 transition-all duration-300
                  ${expanded ? 'rotate-180 bg-gray-800 border-gray-800' : ''}
                `}
                aria-expanded={expanded}
                aria-label="Show more users"
              >
                {expanded ? <Plus className="w-4 h-4 rotate-45" /> : `+${extraCount}`}
              </button>
            )}
          </div>

          {/* Expanded List */}
          <div 
            className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out
              ${expanded ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
            `}
          >
             <div className="pt-2 border-t border-gray-100 grid grid-cols-4 gap-2">
                {hiddenUsers.map((user) => (
                   <button 
                     key={user.id} 
                     onClick={() => setSelectedUser(user.id === selectedUser ? null : user.id)}
                     className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors
                        ${selectedUser === user.id ? 'bg-white shadow-sm ring-1 ring-green-400' : 'hover:bg-gray-100'}
                     `}
                   >
                      <img src={user.imageUrl} className="w-8 h-8 rounded-full" alt={user.name} />
                      <span className="text-[10px] text-gray-500 truncate w-full text-center">{user.name.split(' ')[0]}</span>
                   </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTemplatesCard;