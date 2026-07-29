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
          <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-3.5 space-y-3">
            <div className="font-bold text-xs text-indigo-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>PWA Manifest & PWABuilder Guide</span>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">
                Play Store Ready
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Because AI Studio links are protected by an interactive auth cookie, PWABuilder will display a <strong className="text-amber-400">"Missing Name"</strong> timeout notice. Follow these 3 simple visual steps to add the manifest in 10 seconds:
            </p>

            {/* Visual Step-by-Step Diagrams */}
            <div className="space-y-2 pt-1">
              {/* Step 1 Visual Card */}
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Click "Edit Your Manifest" on PWABuilder</span>
                </div>
                {/* SVG Illustration Mockup of PWABuilder screen */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded">
                    <span className="text-amber-400 flex items-center gap-1">⚠️ Missing Name</span>
                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[9px] font-sans font-bold shadow animate-pulse">
                      Edit Your Manifest ↗
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 italic">Click the blue button in the bottom right popover or manifest card.</div>
                </div>
              </div>

              {/* Step 2 Visual Card */}
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Paste Manifest JSON or Fill Fields</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] space-y-1.5">
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500 font-mono text-[8px]">NAME</div>
                      <div className="text-emerald-400 font-medium truncate">SplitMate Pro</div>
                    </div>
                    <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500 font-mono text-[8px]">SHORT NAME</div>
                      <div className="text-emerald-400 font-medium truncate">SplitMate</div>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px]">
                    <div className="text-slate-500 font-mono text-[8px]">DESCRIPTION</div>
                    <div className="text-emerald-400 font-medium truncate">Multi-currency travel expense splitter</div>
                  </div>
                  {/* Icons breakdown */}
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px] space-y-1">
                    <div className="text-slate-500 font-mono text-[8px] flex justify-between items-center">
                      <span>PWA ICONS (AUTOMATICALLY INCLUDED IN MANIFEST)</span>
                      <span className="text-indigo-400">4 Assets</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[8px] text-slate-300">
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded">
                        <img src="/icon-192.png" alt="192" className="w-3.5 h-3.5 rounded" />
                        <span>192x192 PNG</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded">
                        <img src="/icon-512.png" alt="512" className="w-3.5 h-3.5 rounded" />
                        <span>512x512 PNG</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded">
                        <img src="/maskable-icon-512.png" alt="maskable" className="w-3.5 h-3.5 rounded" />
                        <span>512x512 Maskable</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded">
                        <img src="/icon.svg" alt="svg" className="w-3.5 h-3.5 rounded" />
                        <span>Vector SVG</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 Visual Card */}
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Save & Click "Package For Stores"</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] flex items-center justify-between">
                  <span className="text-slate-400">Status: <span className="text-emerald-400 font-bold">Manifest Ready ✓</span></span>
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] font-bold">Package APK / Store</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
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
                className="flex-1 bg-indigo-900/50 hover:bg-indigo-800/80 text-indigo-200 font-medium py-2 px-3 rounded-xl text-[11px] border border-indigo-500/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copy Manifest JSON</span>
              </button>

              <a
                href="/icon-512.png"
                download="icon-512.png"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-purple-900/50 hover:bg-purple-800/80 text-purple-200 font-medium py-2 px-3 rounded-xl text-[11px] border border-purple-500/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-300" />
                <span>Download 512x512 Icon</span>
              </a>

              <a
                href="/manifest.json"
                download="manifest.json"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>manifest.json</span>
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
