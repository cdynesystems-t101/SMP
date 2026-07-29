import React, { useState } from 'react';
import { Expense, Group, Settlement } from '../types';
import { calculateGroupBalances, simplifyGroupDebts } from '../utils/splitMath';
import { getCurrencyDetails } from '../data/currencies';
import { X, Copy, Share2, Check, Download, Upload, FileText, Smartphone } from 'lucide-react';

interface ExportShareModalProps {
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
  onClose: () => void;
  onImportData?: (importedData: any) => void;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  group,
  expenses,
  settlements,
  onClose,
  onImportData,
}) => {
  const [copied, setCopied] = useState(false);
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);

  const memberBalances = calculateGroupBalances(group, expenses, settlements);
  const simplifiedDebts = simplifyGroupDebts(memberBalances);
  const groupTotalBase = expenses.reduce((sum, e) => sum + (e.baseAmount || 0), 0);

  // Generate formatted group message string
  const generateGroupSummaryText = () => {
    let msg = `===============================\n`;
    msg += `📊 ${group.name} - Split Summary\n`;
    msg += `===============================\n`;
    msg += `Base Currency: ${group.baseCurrency} (${baseCurrencyObj.symbol})\n`;
    msg += `Total Expenses Logged: ${baseCurrencyObj.symbol}${groupTotalBase.toFixed(2)}\n\n`;

    msg += `💰 SIMPLIFIED DEBTS TO SETTLE:\n`;
    if (simplifiedDebts.length === 0) {
      msg += `✨ Everyone is fully settled up! No debts owed.\n`;
    } else {
      simplifiedDebts.forEach((debt) => {
        const debtor = group.members.find((m) => m.id === debt.fromMemberId);
        const creditor = group.members.find((m) => m.id === debt.toMemberId);
        msg += `• ${debtor?.name} pays ${creditor?.name}: ${baseCurrencyObj.symbol}${debt.amount.toFixed(2)}\n`;
      });
    }

    msg += `\n👤 MEMBER BALANCES:\n`;
    memberBalances.forEach((b) => {
      const isOwed = b.netBalanceBase > 0.009;
      const owes = b.netBalanceBase < -0.009;
      const status = isOwed
        ? `owed +${baseCurrencyObj.symbol}${b.netBalanceBase.toFixed(2)}`
        : owes
        ? `owes -${baseCurrencyObj.symbol}${Math.abs(b.netBalanceBase).toFixed(2)}`
        : `settled (0.00)`;
      msg += `• ${b.member.name}: ${status}\n`;
    });

    msg += `\nShared via SplitMate Pro App`;
    return msg;
  };

  const handleCopyText = () => {
    const text = generateGroupSummaryText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const backupData = {
      group,
      expenses,
      settlements,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group.name.replace(/\s+/g, '_')}_backup.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-sm text-slate-100">Share & Export Group Data</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-slate-200 text-xs overflow-y-auto">
          {/* Copy Message Preview */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-300">
              WhatsApp / Group Chat Summary Preview
            </label>
            <textarea
              readOnly
              rows={8}
              value={generateGroupSummaryText()}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-[11px] font-mono text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleCopyText}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Chat Summary Text'}</span>
            </button>
          </div>

          {/* PWA Manifest for PWABuilder / Play Store */}
          <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>PWA Web App Manifest (PWABuilder)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              PWABuilder can use this Web Manifest to package SplitMate into an Android APK / Google Play Store App.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const manifestObj = {
                    id: "/",
                    short_name: "SplitMate",
                    name: "SplitMate Pro - Multi-Currency Expense Splitter",
                    description: "Multi-currency travel expense splitter and receipt scanner with offline-first greedy minimum cash flow math.",
                    icons: [
                      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                      { src: "/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
                      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" }
                    ],
                    start_url: "/",
                    scope: "/",
                    background_color: "#0f172a",
                    theme_color: "#4f46e5",
                    display: "standalone",
                    display_override: ["standalone", "minimal-ui", "browser"],
                    orientation: "portrait",
                    dir: "ltr",
                    lang: "en-US",
                    categories: ["finance", "travel", "utilities"]
                  };
                  navigator.clipboard.writeText(JSON.stringify(manifestObj, null, 2));
                  alert('Manifest JSON copied to clipboard!');
                }}
                className="flex-1 bg-indigo-900/50 hover:bg-indigo-800/80 text-indigo-200 font-medium py-1.5 rounded-xl text-[11px] border border-indigo-500/40 flex items-center justify-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Manifest JSON</span>
              </button>
              <a
                href="/manifest.json"
                download="manifest.json"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-sm"
              >
                <Download className="w-3 h-3" />
                <span>Download manifest.json</span>
              </a>
            </div>
          </div>

          {/* Backup / Export Options */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>JSON Backup Export</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Download complete group configuration, expenses, and settlements into a portable JSON file.
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-2 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
