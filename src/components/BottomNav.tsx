import React from 'react';
import { LayoutDashboard, Receipt, Camera, Scale, Globe, Mic, Sparkles } from 'lucide-react';

export type TabType = 'dashboard' | 'expenses' | 'scan' | 'balances' | 'rates';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenVoiceExpense?: () => void;
  pendingExpenseCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenVoiceExpense,
  pendingExpenseCount = 0,
}) => {
  return (
    <div className="w-full bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around text-slate-400 shrink-0 z-30 shadow-2xl relative">
      {/* Overview */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
          activeTab === 'dashboard' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Overview</span>
        {activeTab === 'dashboard' && (
          <span className="absolute bottom-0 w-7 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>

      {/* Expenses */}
      <button
        onClick={() => setActiveTab('expenses')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
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
          <span className="absolute bottom-0 w-7 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>

      {/* CENTRAL UX ICON: AI Voice Input Button */}
      <div className="relative flex flex-col items-center justify-center -mt-6">
        <button
          onClick={() => {
            if (onOpenVoiceExpense) {
              onOpenVoiceExpense();
            }
          }}
          className="relative group p-3.5 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white shadow-xl shadow-purple-600/35 ring-4 ring-slate-950 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
          title="Speak to Log Expense with AI Voice"
        >
          {/* Subtle pulse aura */}
          <span className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping pointer-events-none" />
          
          <Mic className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          
          {/* AI Badge */}
          <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow border border-slate-950 flex items-center gap-0.5">
            <Sparkles className="w-2 h-2 fill-slate-950" />
            <span>AI</span>
          </span>
        </button>
        <span className="text-[9px] font-bold text-purple-300 mt-1 tracking-tight flex items-center gap-0.5">
          <span>Voice</span>
        </span>
      </div>

      {/* AI Scan Receipt */}
      <button
        onClick={() => setActiveTab('scan')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
          activeTab === 'scan' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
        }`}
      >
        <Camera className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">AI Scan</span>
        {activeTab === 'scan' && (
          <span className="absolute bottom-0 w-7 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>

      {/* Balances */}
      <button
        onClick={() => setActiveTab('balances')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
          activeTab === 'balances' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
        }`}
      >
        <Scale className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Balances</span>
        {activeTab === 'balances' && (
          <span className="absolute bottom-0 w-7 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>

      {/* Rates */}
      <button
        onClick={() => setActiveTab('rates')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
          activeTab === 'rates' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
        }`}
      >
        <Globe className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Rates</span>
        {activeTab === 'rates' && (
          <span className="absolute bottom-0 w-7 h-0.5 bg-indigo-500 rounded-full" />
        )}
      </button>
    </div>
  );
};
