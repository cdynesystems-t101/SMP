import React from 'react';
import { Expense, Group, Member, Settlement } from '../types';
import { calculateGroupBalances } from '../utils/splitMath';
import { getCurrencyDetails } from '../data/currencies';
import { Plus, Camera, Scale, ArrowRightLeft, TrendingUp, TrendingDown, Users, ChevronRight, ShieldCheck, Mic, Sparkles, Share2 } from 'lucide-react';

interface DashboardTabProps {
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
  onOpenAddExpense: () => void;
  onOpenScanReceipt: () => void;
  onOpenVoiceExpense: () => void;
  onOpenSettleUp: (fromId?: string, toId?: string, amt?: number) => void;
  onOpenMembers: () => void;
  onSelectExpense: (expense: Expense) => void;
  onNavigateTab: (tab: 'expenses' | 'balances') => void;
  onOpenShareModal?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  group,
  expenses,
  settlements,
  onOpenAddExpense,
  onOpenScanReceipt,
  onOpenVoiceExpense,
  onOpenSettleUp,
  onOpenMembers,
  onSelectExpense,
  onNavigateTab,
  onOpenShareModal,
}) => {
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);
  const memberBalances = calculateGroupBalances(group, expenses, settlements);

  // Current user balance
  const currentUser = group.members.find((m) => m.isCurrentUser) || group.members[0];
  const currentUserBalance = memberBalances.find((b) => b.member.id === currentUser?.id);

  // Group Total Spent
  const groupTotalBase = expenses.reduce((sum, e) => sum + (e.baseAmount || 0), 0);

  const formatAmount = (num: number) => {
    return `${baseCurrencyObj.symbol}${Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-100 pb-8">
      {/* Group Net Balance Card */}
      <div className="bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-indigo-200/80 mb-1">
          <span className="font-medium flex items-center gap-1.5">
            <span className="text-base">{group.icon || '✈️'}</span>
            <span>{group.name} Total</span>
          </span>
          <div className="flex items-center gap-1.5">
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="bg-indigo-600/40 hover:bg-indigo-600/80 border border-indigo-400/40 px-2 py-0.5 rounded-full text-[10px] text-indigo-100 font-semibold flex items-center gap-1 transition-colors shadow-sm"
                title="Share or Export PWA / Store manifest"
              >
                <Share2 className="w-3 h-3 text-indigo-200" />
                <span>Share / Export</span>
              </button>
            )}
            <span className="bg-indigo-950 border border-indigo-700/50 px-2 py-0.5 rounded-full text-[10px] text-indigo-300 font-semibold">
              {baseCurrencyObj.flag} Base: {group.baseCurrency}
            </span>
          </div>
        </div>

        <div className="text-2xl font-black text-white tracking-tight mb-4">
          {baseCurrencyObj.symbol}{groupTotalBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* User Balance Box */}
        <div className="bg-slate-950/70 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Your Net Balance</div>
              <div className="text-sm font-bold flex items-center gap-1">
                {currentUserBalance && currentUserBalance.netBalanceBase > 0.009 ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    You are owed {formatAmount(currentUserBalance.netBalanceBase)}
                  </span>
                ) : currentUserBalance && currentUserBalance.netBalanceBase < -0.009 ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    You owe {formatAmount(currentUserBalance.netBalanceBase)}
                  </span>
                ) : (
                  <span className="text-slate-300">Settled Up (0.00)</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('balances')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-xl transition-all"
          >
            <span>Breakdown</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onOpenAddExpense}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-semibold text-center leading-tight">Add Expense</span>
        </button>

        <button
          onClick={onOpenVoiceExpense}
          className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/40 text-purple-200 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-md transition-all active:scale-95 relative"
        >
          <div className="relative">
            <Mic className="w-5 h-5 text-purple-300" />
            <span className="absolute -top-1 -right-2 bg-purple-500 text-white text-[8px] font-extrabold px-1 rounded-full animate-pulse">
              AI
            </span>
          </div>
          <span className="text-[10px] font-semibold text-center leading-tight">Voice Input</span>
        </button>

        <button
          onClick={onOpenScanReceipt}
          className="bg-slate-800 hover:bg-slate-700/80 border border-indigo-500/30 text-indigo-300 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <Camera className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] font-semibold text-center leading-tight">AI Scan Bill</span>
        </button>

        <button
          onClick={onOpenSettleUp}
          className="bg-slate-800 hover:bg-slate-700/80 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-semibold text-center leading-tight">Settle Up</span>
        </button>
      </div>

      {/* Voice Expense AI Banner */}
      <div 
        onClick={onOpenVoiceExpense}
        className="bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-110 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-purple-100 flex items-center gap-1.5">
              <span>Voice Expense Log</span>
              <span className="bg-purple-500/30 text-purple-200 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase border border-purple-400/30">
                New
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Say e.g. "Dinner 65 USD paid by Alice"</p>
          </div>
        </div>
        <div className="bg-purple-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md group-hover:bg-purple-500 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Speak</span>
        </div>
      </div>

      {/* Group Members Balances Bar (Horizontal Scroll / Grid for up to 20 members) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Group Member Balances</span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {group.members.length}/20 Users
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('balances')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center"
          >
            See All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
          {memberBalances.map((b) => {
            const isOwed = b.netBalanceBase > 0.009;
            const owes = b.netBalanceBase < -0.009;

            return (
              <div
                key={b.member.id}
                className="flex-shrink-0 w-24 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col items-center text-center space-y-1.5 relative group"
              >
                <div className="relative">
                  <img
                    src={b.member.avatar}
                    alt={b.member.name}
                    className="w-10 h-10 rounded-full object-cover ring-2"
                    style={{ borderColor: b.member.color || '#6366F1' }}
                  />
                  {b.member.isCurrentUser && (
                    <span className="absolute -top-1 -right-1 bg-indigo-500 text-[8px] text-white px-1 rounded-full font-bold">
                      YOU
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-semibold text-slate-200 w-full truncate">
                  {b.member.name.split(' ')[0]}
                </div>

                <div className="text-[10px] font-bold">
                  {isOwed ? (
                    <span className="text-emerald-400">+{formatAmount(b.netBalanceBase)}</span>
                  ) : owes ? (
                    <span className="text-rose-400">-{formatAmount(b.netBalanceBase)}</span>
                  ) : (
                    <span className="text-slate-400">0.00</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Math Ready Banner */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3 text-xs text-slate-300">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-slate-200">100% Offline Split Engine</div>
          <div className="text-[11px] text-slate-400">
            All multi-currency splits and debt simplifications run instantly on device without internet.
          </div>
        </div>
      </div>

      {/* Recent Expenses List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Recent Expenses</h3>
          <button
            onClick={() => onNavigateTab('expenses')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
          >
            View All ({expenses.length}) <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs">
            No expenses logged yet. Tap <strong className="text-indigo-400">+ Add Expense</strong> or <strong className="text-indigo-400">AI Scan Bill</strong>!
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 4).map((exp) => {
              const payer = group.members.find((m) => m.id === exp.payers[0]?.memberId);
              const isMultiCurrency = exp.originalCurrency !== group.baseCurrency;

              return (
                <div
                  key={exp.id}
                  onClick={() => onSelectExpense(exp)}
                  className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-lg shrink-0">
                      {exp.category === 'dining' ? '🍽️' :
                       exp.category === 'transport' ? '🚄' :
                       exp.category === 'accommodation' ? '🏨' :
                       exp.category === 'groceries' ? '🛒' :
                       exp.category === 'entertainment' ? '🎟️' : '💳'}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-100 truncate">{exp.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>Paid by <strong className="text-slate-300">{payer?.name || 'Someone'}</strong></span>
                        <span>•</span>
                        <span>{new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm text-slate-100">
                      {baseCurrencyObj.symbol}{exp.baseAmount.toFixed(2)}
                    </div>
                    {isMultiCurrency && (
                      <div className="text-[10px] text-indigo-400 font-medium">
                        {exp.originalAmount.toLocaleString()} {exp.originalCurrency}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
