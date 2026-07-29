import React from 'react';
import { LayoutDashboard, Receipt, Camera, Scale, Globe } from 'lucide-react';

export type TabType = 'dashboard' | 'expenses' | 'scan' | 'balances' | 'rates';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingExpenseCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingExpenseCount = 0,
}) => {
  return (
    <div className="w-full bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around text-slate-400 shrink-0 z-30 shadow-2xl">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
          activeTab === 'dashboard' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Overview</span>
        {activeTab === 'dashboard' && (
          <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>

      <button
        onClick={() => setActiveTab('expenses')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
          activeTab === 'expenses' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Receipt className="w-5 h-5 mb-0.5" />
          {pendingExpenseCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-slate-950">
              {pendingExpenseCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">Expenses</span>
        {activeTab === 'expenses' && (
          <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>

      {/* Main AI Receipt Scanner Button */}
      <button
        onClick={() => setActiveTab('scan')}
        className={`flex flex-col items-center justify-center -mt-5 p-3.5 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-slate-900 transition-all hover:scale-105 active:scale-95 ${
          activeTab === 'scan' ? 'ring-indigo-400/50 scale-105' : ''
        }`}
        title="Scan Bill / Receipt with AI"
      >
        <Camera className="w-6 h-6" />
      </button>

      <button
        onClick={() => setActiveTab('balances')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
          activeTab === 'balances' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
        }`}
      >
        <Scale className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Balances</span>
        {activeTab === 'balances' && (
          <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>

      <button
        onClick={() => setActiveTab('rates')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
          activeTab === 'rates' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
        }`}
      >
        <Globe className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Rates</span>
        {activeTab === 'rates' && (
          <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>
    </div>
  );
};
