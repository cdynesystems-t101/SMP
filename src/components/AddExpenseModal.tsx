import React, { useState } from 'react';
import { CurrencyCode, Expense, ExpenseCategory, Group, Member, Payer, SplitType } from '../types';
import { SUPPORTED_CURRENCIES, getCurrencyDetails, getExchangeRate } from '../data/currencies';
import { calculateEqualSplits } from '../utils/splitMath';
import { X, Check, Globe, Calculator, Users, DollarSign, Percent, PieChart, Layers, Plus, Trash2 } from 'lucide-react';

interface AddExpenseModalProps {
  group: Group;
  initialData?: Partial<Expense>;
  onClose: () => void;
  onSaveExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  group,
  initialData,
  onClose,
  onSaveExpense,
}) => {
  const currentUser = group.members.find((m) => m.isCurrentUser) || group.members[0];

  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || 'dining');
  const [amountStr, setAmountStr] = useState(initialData?.originalAmount ? initialData.originalAmount.toString() : '');
  const [currency, setCurrency] = useState<CurrencyCode>(initialData?.originalCurrency || group.baseCurrency);

  // Exchange Rate (Original -> Group Base Currency)
  const defaultRate = getExchangeRate(currency, group.baseCurrency, group.customExchangeRates);
  const [customRate, setCustomRate] = useState<number>(initialData?.exchangeRateUsed || defaultRate);
  const [isEditingRate, setIsEditingRate] = useState(false);

  // Payers (who paid)
  const [payers, setPayers] = useState<Payer[]>(
    initialData?.payers || [{ memberId: currentUser?.id || group.members[0]?.id, amount: initialData?.originalAmount || 0 }]
  );
  const [isMultiPayer, setIsMultiPayer] = useState(payers.length > 1);

  // Split Method
  const [splitType, setSplitType] = useState<SplitType>(initialData?.splitType || 'equal');

  // Equal split member selection
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialData?.splits?.map((s) => s.memberId) || group.members.map((m) => m.id)
  );

  // Unequal split values
  const [unequalAmounts, setUnequalAmounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (initialData?.splits) {
      initialData.splits.forEach((s) => {
        map[s.memberId] = s.amount;
      });
    }
    return map;
  });

  // Percentage split values
  const [percentageValues, setPercentageValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (initialData?.splits) {
      initialData.splits.forEach((s) => {
        map[s.memberId] = s.percentage || 0;
      });
    }
    return map;
  });

  // Shares split values
  const [sharesValues, setSharesValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    group.members.forEach((m) => {
      map[m.id] = 1;
    });
    return map;
  });

  const [date, setDate] = useState(initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const numericAmount = parseFloat(amountStr) || 0;
  const currencyObj = getCurrencyDetails(currency);
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);

  // Handle currency change
  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    const newRate = getExchangeRate(newCurrency, group.baseCurrency, group.customExchangeRates);
    setCustomRate(newRate);
  };

  // Toggle member selection for equal split
  const toggleMemberSelection = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((m) => m !== id));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numericAmount <= 0) return;

    const baseAmount = numericAmount * customRate;

    // Build splits
    let finalSplits: any[] = [];

    if (splitType === 'equal') {
      const calculated = calculateEqualSplits(numericAmount, selectedMemberIds);
      finalSplits = calculated.map((c) => ({
        memberId: c.memberId,
        amount: c.amount,
      }));
    } else if (splitType === 'unequal') {
      finalSplits = group.members.map((m) => ({
        memberId: m.id,
        amount: unequalAmounts[m.id] || 0,
      }));
    } else if (splitType === 'percentage') {
      finalSplits = group.members.map((m) => {
        const pct = percentageValues[m.id] || 0;
        return {
          memberId: m.id,
          amount: Math.round(((numericAmount * pct) / 100) * 100) / 100,
          percentage: pct,
        };
      });
    } else if (splitType === 'shares') {
      const totalShares: number = (Object.values(sharesValues) as number[]).reduce((acc: number, val: number) => acc + (val || 0), 0) || 1;
      finalSplits = group.members.map((m) => {
        const s: number = Number(sharesValues[m.id]) || 0;
        return {
          memberId: m.id,
          amount: Math.round(((numericAmount * s) / totalShares) * 100) / 100,
          shares: s,
        };
      });
    }

    // Single payer sync if not multi-payer
    const finalPayers = isMultiPayer
      ? payers
      : [{ memberId: payers[0]?.memberId || currentUser.id, amount: numericAmount }];

    onSaveExpense({
      groupId: group.id,
      title,
      category,
      originalAmount: numericAmount,
      originalCurrency: currency,
      exchangeRateUsed: customRate,
      baseAmount,
      date: new Date(date).toISOString(),
      payers: finalPayers,
      splitType,
      splits: finalSplits,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <span className="text-lg">➕</span>
            <span>{initialData ? 'Edit Expense' : 'Log Expense'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200 text-xs">
          {/* Title & Category */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Expense Description</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Izakaya Dinner, Bullet Train, Hotel"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-medium placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="dining">🍽️ Dining</option>
                  <option value="transport">🚄 Transport</option>
                  <option value="accommodation">🏨 Lodging</option>
                  <option value="groceries">🛒 Groceries</option>
                  <option value="entertainment">🎟️ Entertainment</option>
                  <option value="shopping">🛍️ Shopping</option>
                  <option value="utilities">💡 Utilities</option>
                  <option value="other">💳 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Amount & Currency Selection */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300">Total Bill Amount</span>
              <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Multi-Currency Supported</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 font-bold text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xl font-black text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Currency Exchange Rate Bar */}
            {currency !== group.baseCurrency && (
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-indigo-400 font-bold">Rate:</span>
                  <span>
                    1 {currency} = {customRate.toFixed(4)} {group.baseCurrency}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingRate(!isEditingRate)}
                  className="text-xs text-indigo-400 underline font-medium hover:text-indigo-300"
                >
                  {isEditingRate ? 'Done' : 'Edit Rate'}
                </button>
              </div>
            )}

            {isEditingRate && currency !== group.baseCurrency && (
              <div className="bg-slate-900 p-3 rounded-xl border border-indigo-500/40 space-y-1">
                <label className="block text-[10px] text-slate-400 font-semibold">
                  Custom Exchange Rate Override (1 {currency} in {group.baseCurrency}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={customRate}
                  onChange={(e) => setCustomRate(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            )}

            {/* Converted Preview */}
            {currency !== group.baseCurrency && numericAmount > 0 && (
              <div className="text-[11px] text-slate-400 text-right">
                Converted to Base Currency: <strong className="text-emerald-400 font-bold">{baseCurrencyObj.symbol}{(numericAmount * customRate).toFixed(2)} {group.baseCurrency}</strong>
              </div>
            )}
          </div>

          {/* Paid By Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">Paid By</label>
              <button
                type="button"
                onClick={() => setIsMultiPayer(!isMultiPayer)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {isMultiPayer ? 'Single Payer' : 'Multiple Payers'}
              </button>
            </div>

            {!isMultiPayer ? (
              <select
                value={payers[0]?.memberId || currentUser?.id}
                onChange={(e) => setPayers([{ memberId: e.target.value, amount: numericAmount }])}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {group.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.isCurrentUser ? '(You)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <p className="text-[10px] text-slate-400">Enter how much each person paid towards the total:</p>
                {group.members.map((m) => {
                  const currentPayer = payers.find((p) => p.memberId === m.id);
                  const paidVal = currentPayer?.amount || 0;

                  return (
                    <div key={m.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-200">{m.name}</span>
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-slate-500">{currencyObj.symbol}</span>
                        <input
                          type="number"
                          step="any"
                          value={paidVal || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const filtered = payers.filter((p) => p.memberId !== m.id);
                            if (val > 0) {
                              setPayers([...filtered, { memberId: m.id, amount: val }]);
                            } else {
                              setPayers(filtered);
                            }
                          }}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-right text-slate-100"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Split Type Selector Tabs */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-300">Split Method</label>
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  splitType === 'equal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Equal
              </button>
              <button
                type="button"
                onClick={() => setSplitType('unequal')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  splitType === 'unequal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Exact
              </button>
              <button
                type="button"
                onClick={() => setSplitType('percentage')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  splitType === 'percentage' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                % Percent
              </button>
              <button
                type="button"
                onClick={() => setSplitType('shares')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  splitType === 'shares' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Shares
              </button>
            </div>

            {/* Split Details Body */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              {splitType === 'equal' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Split equally among ({selectedMemberIds.length} members):</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMemberIds(
                          selectedMemberIds.length === group.members.length
                            ? [currentUser.id]
                            : group.members.map((m) => m.id)
                        )
                      }
                      className="text-indigo-400 hover:underline text-[10px]"
                    >
                      {selectedMemberIds.length === group.members.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {group.members.map((m) => {
                      const isSelected = selectedMemberIds.includes(m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => toggleMemberSelection(m.id)}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800'}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-xs font-medium truncate">{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {splitType === 'unequal' && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {group.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-200 truncate">{m.name}</span>
                      <div className="flex items-center gap-1 w-28 shrink-0">
                        <span className="text-slate-500">{currencyObj.symbol}</span>
                        <input
                          type="number"
                          step="any"
                          value={unequalAmounts[m.id] || ''}
                          onChange={(e) => setUnequalAmounts({ ...unequalAmounts, [m.id]: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-right text-slate-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {splitType === 'percentage' && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {group.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-200 truncate">{m.name}</span>
                      <div className="flex items-center gap-1 w-24 shrink-0">
                        <input
                          type="number"
                          step="any"
                          value={percentageValues[m.id] || ''}
                          onChange={(e) => setPercentageValues({ ...percentageValues, [m.id]: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-right text-slate-100"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {splitType === 'shares' && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {group.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-200 truncate">{m.name}</span>
                      <div className="flex items-center gap-1 w-24 shrink-0">
                        <input
                          type="number"
                          value={sharesValues[m.id] || 0}
                          onChange={(e) => setSharesValues({ ...sharesValues, [m.id]: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center text-slate-100"
                        />
                        <span className="text-slate-400">shares</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Notes / Reminders</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid cash, tip included..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim() || numericAmount <= 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              Save Expense ({baseCurrencyObj.symbol}{(numericAmount * customRate).toFixed(2)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
