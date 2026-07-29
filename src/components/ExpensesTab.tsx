import React, { useState } from 'react';
import { Expense, Group, Member } from '../types';
import { getCurrencyDetails } from '../data/currencies';
import { Search, Plus, Filter, Receipt, Trash2, Edit2, Calendar, FileText, ChevronRight, Mic } from 'lucide-react';

interface ExpensesTabProps {
  group: Group;
  expenses: Expense[];
  onOpenAddExpense: () => void;
  onOpenScanReceipt: () => void;
  onOpenVoiceExpense: () => void;
  onSelectExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  group,
  expenses,
  onOpenAddExpense,
  onOpenScanReceipt,
  onOpenVoiceExpense,
  onSelectExpense,
  onDeleteExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);

  const categories = [
    { id: 'all', label: 'All', icon: '✨' },
    { id: 'dining', label: 'Dining', icon: '🍽️' },
    { id: 'transport', label: 'Transport', icon: '🚄' },
    { id: 'accommodation', label: 'Lodging', icon: '🏨' },
    { id: 'groceries', label: 'Groceries', icon: '🛒' },
    { id: 'entertainment', label: 'Fun', icon: '🎟️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  ];

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    if (exp.groupId !== group.id) return false;
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-100 pb-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 tracking-tight">Expenses Log</h1>
          <p className="text-xs text-slate-400">
            {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''} in {group.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenVoiceExpense}
            className="p-2 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-300 rounded-xl transition-all shadow-sm flex items-center gap-1"
            title="Log via Voice Input"
          >
            <Mic className="w-4 h-4 text-purple-300" />
            <span className="text-[10px] font-bold">Voice</span>
          </button>
          <button
            onClick={onOpenScanReceipt}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-indigo-400 rounded-xl transition-all"
            title="Scan Receipt"
          >
            <Receipt className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAddExpense}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search expenses, restaurants, trains..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Expense List */}
      <div className="space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-2">
            <div className="text-3xl">🧾</div>
            <div className="text-sm font-bold text-slate-200">No Expenses Found</div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {searchQuery ? 'Try matching another search term.' : 'Log an expense or scan a receipt bill.'}
            </p>
            <button
              onClick={onOpenAddExpense}
              className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              + Create First Expense
            </button>
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const primaryPayer = group.members.find((m) => m.id === exp.payers[0]?.memberId);
            const isMultiCurrency = exp.originalCurrency !== group.baseCurrency;

            return (
              <div
                key={exp.id}
                onClick={() => onSelectExpense(exp)}
                className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800/90 rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.99] space-y-2 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-lg shrink-0 mt-0.5">
                      {exp.category === 'dining' ? '🍽️' :
                       exp.category === 'transport' ? '🚄' :
                       exp.category === 'accommodation' ? '🏨' :
                       exp.category === 'groceries' ? '🛒' :
                       exp.category === 'entertainment' ? '🎟️' : '💳'}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-100 truncate">{exp.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <img
                          src={primaryPayer?.avatar}
                          alt={primaryPayer?.name}
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                        <span className="truncate">
                          Paid by <strong className="text-slate-200">{primaryPayer?.name || 'Unknown'}</strong>
                        </span>
                        <span>•</span>
                        <span>{new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-slate-100">
                      {baseCurrencyObj.symbol}{exp.baseAmount.toFixed(2)}
                    </div>
                    {isMultiCurrency && (
                      <div className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/80 border border-indigo-800/40 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                        {exp.originalAmount.toLocaleString()} {exp.originalCurrency}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-bar: split info & actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="capitalize bg-slate-800 px-2 py-0.5 rounded-md font-medium text-slate-300">
                      {exp.splitType} split ({exp.splits.length} people)
                    </span>
                    {exp.receiptImageUrl && (
                      <span className="text-indigo-400 flex items-center gap-0.5">
                        <Receipt className="w-3 h-3" />
                        <span>Receipt attached</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteExpense(exp.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
