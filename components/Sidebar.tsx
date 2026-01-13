'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, UploadCloud, PieChart, FileBarChart, Zap, PanelLeftClose, PanelLeftOpen, Workflow, TrendingUp } from 'lucide-react';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Upload Financials', icon: UploadCloud, path: '/upload' },
    { label: 'Portfolio', icon: PieChart, path: '/loans' },
    { label: 'Reports', icon: FileBarChart, path: '/reports' },
    { label: 'AgentFlow', icon: Workflow, path: '/agentflow' },
    { label: 'TradeClear', icon: TrendingUp, path: '/tradeclear' },
  ];

  return (
    <>
      <aside 
        className={`
          bg-white h-screen fixed left-0 top-0 border-r border-gray-100 flex flex-col z-20
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-[64px]' : 'w-[240px]'}
        `}
      >
        {/* Logo Area */}
        <div className={`
          flex items-center mb-1 transition-all duration-300
          ${isCollapsed ? 'flex-col justify-center py-4 px-0 gap-4' : 'justify-between px-6 py-6'}
        `}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Zap size={12} fill="currentColor" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-bold text-gray-800 tracking-tight whitespace-nowrap overflow-hidden opacity-100 transition-opacity duration-200">
                LenderFin
              </span>
            )}
          </div>

          {/* Toggle Button */}
          <button 
            onClick={toggleSidebar}
            className={`
              text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md transition-colors
            `}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item, index) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.path}
                className={`
                  flex items-center rounded-lg cursor-pointer transition-all duration-200 group relative
                  ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-2'}
                  ${isActive 
                    ? 'bg-primary text-white shadow-sm shadow-indigo-100' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`
                  ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 transition-opacity'}
                  flex-shrink-0
                `}>
                  <Icon size={16} />
                </span>
                
                {!isCollapsed && (
                  <span className="text-[12px] font-medium tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 block">
                    {item.label}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Profile Placeholder */}
        <div className={`p-6 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <div className={`
            flex items-center rounded-lg bg-gray-50/50 border border-gray-100/50 transition-all duration-300 overflow-hidden
            ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-2'}
          `}>
            <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-[11px] font-semibold text-gray-700 leading-tight truncate">Jane Doe</span>
                <span className="text-[9px] text-gray-400 leading-tight mt-0.5 truncate">Credit Analyst</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area with responsive margin */}
      <main className={`
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'ml-[64px]' : 'ml-[240px]'}
      `}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </>
  );
}
