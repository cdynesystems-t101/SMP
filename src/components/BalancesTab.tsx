import React, { useState } from 'react';
import { Expense, Group, Member, Settlement, SimplifiedDebt } from '../types';
import { calculateGroupBalances, simplifyGroupDebts } from '../utils/splitMath';
import { getCurrencyDetails } from '../data/currencies';
import { Scale, ArrowRightLeft, TrendingUp, TrendingDown, Info, ShieldCheck, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface BalancesTabProps {
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
  onOpenSettleUp: (fromId?: string, toId?: string, amount?: number) => void;
}

export const BalancesTab: React.FC<BalancesTabProps> = ({
  group,
  expenses,
  settlements,
  onOpenSettleUp,
}) => {
  const [showMathModal, setShowMathModal] = useState(false);
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);

  const memberBalances = calculateGroupBalances(group, expenses, settlements);
  const simplifiedDebts = simplifyGroupDebts(memberBalances);

  const formatAmount = (num: number) => {
    return `${baseCurrencyObj.symbol}${Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-100 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 tracking-tight">Balances & Settlement</h1>
          <p className="text-xs text-slate-400">
            Offline Math calculated in {baseCurrencyObj.flag} {group.baseCurrency}
          </p>
        </div>
        <button
          onClick={() => onOpenSettleUp()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-emerald-600/20"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Settle Up</span>
        </button>
      </div>

      {/* Simplified Debts Box (Min Cash Flow Engine) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-100">Simplified Group Debts</div>
              <div className="text-[10px] text-indigo-300">Minimum payments needed to settle all debts</div>
            </div>
          </div>
          <button
            onClick={() => setShowMathModal(true)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why this math?</span>
          </button>
        </div>

        {simplifiedDebts.length === 0 ? (
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
            <div className="font-bold text-xs text-emerald-300">Everyone is fully settled up!</div>
            <p className="text-[10px] text-slate-400">No outstanding debts remain in this group.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {simplifiedDebts.map((debt, idx) => {
              const debtor = group.members.find((m) => m.id === debt.fromMemberId);
              const creditor = group.members.find((m) => m.id === debt.toMemberId);

              return (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={debtor?.avatar}
                      alt={debtor?.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-500 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {debtor?.name.split(' ')[0]} <span className="text-slate-400 font-normal">pays</span> {creditor?.name.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-rose-400 font-semibold">
                        Owes {formatAmount(debt.amount)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenSettleUp(debt.fromMemberId, debt.toMemberId, debt.amount)}
                    className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shrink-0"
                  >
                    Pay {formatAmount(debt.amount)}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Net Balances Table (Up to 20 users) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
          <span>All Member Balances ({group.members.length})</span>
          <span className="text-[10px] font-medium text-slate-400">Base Currency: {group.baseCurrency}</span>
        </div>

        <div className="space-y-2">
          {memberBalances.map((b) => {
            const isOwed = b.netBalanceBase > 0.009;
            const owes = b.netBalanceBase < -0.009;

            return (
              <div
                key={b.member.id}
                className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={b.member.avatar}
                    alt={b.member.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 shrink-0"
                    style={{ borderColor: b.member.color || '#6366F1' }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                      <span>{b.member.name}</span>
                      {b.member.isCurrentUser && (
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] px-1.5 rounded-md">You</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Paid: {formatAmount(b.totalPaidBase)}</span>
                      <span>•</span>
                      <span>Share: {formatAmount(b.totalOwedBase)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-xs font-black ${isOwed ? 'text-emerald-400' : owes ? 'text-rose-400' : 'text-slate-400'}`}>
                    {isOwed ? `+${formatAmount(b.netBalanceBase)}` : owes ? `-${formatAmount(b.netBalanceBase)}` : 'Settled'}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-tight">
                    {isOwed ? 'gets back' : owes ? 'owes group' : 'zero balance'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Settlements History */}
      {settlements.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Settlement History</h3>
          <div className="space-y-2">
            {settlements.map((s) => {
              const sender = group.members.find((m) => m.id === s.fromMemberId);
              const receiver = group.members.find((m) => m.id === s.toMemberId);

              return (
                <div key={s.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate text-slate-200">
                      <strong className="text-slate-100">{sender?.name.split(' ')[0]}</strong> paid <strong className="text-slate-100">{receiver?.name.split(' ')[0]}</strong>
                    </span>
                  </div>
                  <div className="font-bold text-emerald-400 shrink-0">
                    {baseCurrencyObj.symbol}{s.baseAmount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Offline Math Explanation Modal */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Offline Min Cash Flow Proof</span>
              </h3>
              <button onClick={() => setShowMathModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              SplitMate Pro uses the <strong>Greedy Minimum Cash Flow algorithm</strong> running entirely client-side on your device.
            </p>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="font-bold text-slate-200">How it works:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Converts all expenses into the Group Base Currency ({group.baseCurrency}).</li>
                <li>Calculates each member's net position: (Total Paid − Total Share).</li>
                <li>Pairs the largest debtor with the largest creditor to minimize transfer count.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowMathModal(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
