import React, { useState } from 'react';
import { CurrencyCode, Group, Settlement } from '../types';
import { SUPPORTED_CURRENCIES, getCurrencyDetails, getExchangeRate } from '../data/currencies';
import { X, ArrowRightLeft, Check, Globe } from 'lucide-react';

interface SettleUpModalProps {
  group: Group;
  initialFromId?: string;
  initialToId?: string;
  initialAmount?: number;
  onClose: () => void;
  onSaveSettlement: (settlement: Omit<Settlement, 'id'>) => void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  group,
  initialFromId,
  initialToId,
  initialAmount,
  onClose,
  onSaveSettlement,
}) => {
  const currentUser = group.members.find((m) => m.isCurrentUser) || group.members[0];
  const secondMember = group.members.find((m) => m.id !== currentUser.id) || group.members[1];

  const [fromMemberId, setFromMemberId] = useState(initialFromId || currentUser.id);
  const [toMemberId, setToMemberId] = useState(initialToId || secondMember?.id || group.members[0].id);
  const [amountStr, setAmountStr] = useState(initialAmount ? initialAmount.toString() : '');
  const [currency, setCurrency] = useState<CurrencyCode>(group.baseCurrency);
  const [notes, setNotes] = useState('');

  const numericAmount = parseFloat(amountStr) || 0;
  const currencyObj = getCurrencyDetails(currency);
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);
  const exchangeRate = getExchangeRate(currency, group.baseCurrency, group.customExchangeRates);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromMemberId === toMemberId || numericAmount <= 0) return;

    onSaveSettlement({
      groupId: group.id,
      fromMemberId,
      toMemberId,
      amount: numericAmount,
      currency,
      exchangeRateUsed: exchangeRate,
      baseAmount: numericAmount * exchangeRate,
      date: new Date().toISOString(),
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <span>Record Settlement</span>
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-slate-200 text-xs">
          {/* Who pays whom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Payer (Who Paid)</label>
              <select
                value={fromMemberId}
                onChange={(e) => setFromMemberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {group.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Receiver (Who got paid)</label>
              <select
                value={toMemberId}
                onChange={(e) => setToMemberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {group.members.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.id === fromMemberId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <label className="block text-[11px] font-bold text-slate-300">Payment Amount</label>
            <div className="flex items-center gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 font-bold text-xs"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">
                  {currencyObj.symbol}
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xl font-black text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {currency !== group.baseCurrency && numericAmount > 0 && (
              <div className="text-[10px] text-emerald-400 text-right">
                Equivalent: {baseCurrencyObj.symbol}{(numericAmount * exchangeRate).toFixed(2)} {group.baseCurrency}
              </div>
            )}
          </div>

          {/* Payment Notes / Method */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Payment Method / Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Venmo, Cash, Revolut, Bank Transfer"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Save Action */}
          <button
            type="submit"
            disabled={fromMemberId === toMemberId || numericAmount <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50 text-xs"
          >
            Record Payment ({currencyObj.symbol}{numericAmount.toFixed(2)})
          </button>
        </form>
      </div>
    </div>
  );
};
