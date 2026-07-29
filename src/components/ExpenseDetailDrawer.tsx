import React from 'react';
import { Expense, Group } from '../types';
import { getCurrencyDetails } from '../data/currencies';
import { X, Calendar, Receipt, User, Trash2, Edit2, FileText, ArrowLeft } from 'lucide-react';

interface ExpenseDetailDrawerProps {
  expense: Expense;
  group: Group;
  onClose: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseDetailDrawer: React.FC<ExpenseDetailDrawerProps> = ({
  expense,
  group,
  onClose,
  onEditExpense,
  onDeleteExpense,
}) => {
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);
  const isMultiCurrency = expense.originalCurrency !== group.baseCurrency;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white flex items-center gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                onEditExpense(expense);
              }}
              className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-xl bg-indigo-500/10 border border-indigo-500/30"
              title="Edit Expense"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onDeleteExpense(expense.id);
                onClose();
              }}
              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-xl bg-rose-500/10 border border-rose-500/30"
              title="Delete Expense"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-slate-200 text-xs overflow-y-auto">
          {/* Amount Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 text-center space-y-1">
            <div className="text-2xl font-black text-slate-100">
              {baseCurrencyObj.symbol}{expense.baseAmount.toFixed(2)} {group.baseCurrency}
            </div>
            {isMultiCurrency && (
              <div className="text-xs text-indigo-400 font-bold">
                Original: {expense.originalAmount.toLocaleString()} {expense.originalCurrency} (Rate: {expense.exchangeRateUsed.toFixed(4)})
              </div>
            )}
            <h3 className="text-sm font-bold text-slate-300 pt-1">{expense.title}</h3>
            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(expense.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              <span>•</span>
              <span className="capitalize">{expense.category}</span>
            </div>
          </div>

          {/* Payers Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-300">Paid By</div>
            <div className="space-y-1.5">
              {expense.payers.map((p, idx) => {
                const payerObj = group.members.find((m) => m.id === p.memberId);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <img src={payerObj?.avatar} alt={payerObj?.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="font-semibold text-slate-200">{payerObj?.name}</span>
                    </div>
                    <span className="font-bold text-slate-100">
                      {expense.originalCurrency} {p.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Splits Breakdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-300 capitalize">
              Splits ({expense.splitType} split among {expense.splits.length} members)
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {expense.splits.map((s, idx) => {
                const memberObj = group.members.find((m) => m.id === s.memberId);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <img src={memberObj?.avatar} alt={memberObj?.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="font-medium text-slate-200">{memberObj?.name}</span>
                    </div>
                    <span className="font-bold text-indigo-300">
                      {expense.originalCurrency} {s.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt Image Attachment if any */}
          {expense.receiptImageUrl && (
            <div className="space-y-2">
              <div className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-400" />
                <span>Attached Receipt Image</span>
              </div>
              <img
                src={expense.receiptImageUrl}
                alt="Receipt"
                className="w-full rounded-2xl border border-slate-800 max-h-48 object-cover"
              />
            </div>
          )}

          {expense.notes && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1">
              <div className="font-bold text-xs text-slate-400">Notes</div>
              <p className="text-xs text-slate-300">{expense.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
