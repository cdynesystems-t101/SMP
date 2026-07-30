import React from 'react';
import { Expense, Group, Member, Settlement, ExpenseCategory } from '../types';
import { calculateGroupBalances } from '../utils/splitMath';
import { getCurrencyDetails } from '../data/currencies';
import { Plus, Camera, ArrowRightLeft, TrendingUp, TrendingDown, Users, ChevronRight, ShieldCheck, Mic, Sparkles, Share2, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  dining: { label: 'Food & Dining', icon: '🍽️', color: '#F59E0B' },
  transport: { label: 'Transport', icon: '🚄', color: '#3B82F6' },
  accommodation: { label: 'Lodging', icon: '🏨', color: '#8B5CF6' },
  groceries: { label: 'Groceries', icon: '🛒', color: '#10B981' },
  entertainment: { label: 'Entertainment', icon: '🎟️', color: '#EC4899' },
  shopping: { label: 'Shopping', icon: '🛍️', color: '#F43F5E' },
  utilities: { label: 'Utilities', icon: '⚡', color: '#06B6D4' },
  other: { label: 'Other', icon: '💳', color: '#64748B' },
};

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

  // Category breakdown for PieChart
  const categoryData = React.useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'other';
      totals[cat] = (totals[cat] || 0) + (e.baseAmount || 0);
    });

    return Object.entries(totals)
      .filter(([_, val]) => val > 0)
      .map(([catKey, value]) => {
        const config = CATEGORY_CONFIG[catKey as ExpenseCategory] || CATEGORY_CONFIG.other;
        return {
          name: config.label,
          categoryKey: catKey,
          value: Math.round(value * 100) / 100,
          color: config.color,
          icon: config.icon,
          percentage: groupTotalBase > 0 ? Math.round((value / groupTotalBase) * 100) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, groupTotalBase]);

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
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={onOpenAddExpense}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-semibold text-center leading-tight">Add Expense</span>
        </button>

        <button
          onClick={onOpenScanReceipt}
          className="bg-slate-800 hover:bg-slate-700/80 border border-indigo-500/30 text-indigo-300 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <Camera className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-semibold text-center leading-tight">AI Scan Bill</span>
        </button>

        <button
          onClick={onOpenSettleUp}
          className="bg-slate-800 hover:bg-slate-700/80 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold text-center leading-tight">Settle Up</span>
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

      {/* Expenses Breakdown by Category (Recharts Pie Chart) */}
      {categoryData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              <span>Category Breakdown</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {categoryData.length} {categoryData.length === 1 ? 'Category' : 'Categories'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 pt-1">
            {/* Recharts Pie Chart */}
            <div className="shrink-0 w-36 h-36 relative flex items-center justify-center mx-auto md:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={52}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#0f172a"
                    strokeWidth={2}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.categoryKey} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      `${baseCurrencyObj.symbol}${Number(value).toFixed(2)}`,
                      'Amount',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    }}
                    itemStyle={{ color: '#c084fc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-xs font-extrabold text-white">
                  {baseCurrencyObj.symbol}{groupTotalBase > 1000 ? `${(groupTotalBase / 1000).toFixed(1)}k` : groupTotalBase.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Category Legend List */}
            <div className="flex-1 w-full space-y-2 text-xs">
              {categoryData.map((cat) => (
                <div key={cat.categoryKey} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm shrink-0">{cat.icon}</span>
                    <span className="text-xs font-semibold text-slate-100 whitespace-nowrap">{cat.name}</span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">
                      {baseCurrencyObj.symbol}{cat.value.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-indigo-300 font-bold bg-indigo-950/80 border border-indigo-800/50 px-1.5 py-0.5 rounded-md">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
