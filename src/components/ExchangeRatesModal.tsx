import React, { useState } from 'react';
import { CurrencyCode, Group } from '../types';
import { SUPPORTED_CURRENCIES, getCurrencyDetails } from '../data/currencies';
import { Globe, RefreshCw, Lock, Save, ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface ExchangeRatesModalProps {
  group: Group;
  onUpdateGroupRates: (customRates: Record<string, number>) => void;
}

export const ExchangeRatesModal: React.FC<ExchangeRatesModalProps> = ({
  group,
  onUpdateGroupRates,
}) => {
  const [ratesMap, setRatesMap] = useState<Record<string, number>>(group.customExchangeRates || {});
  const [isSavedToast, setIsSavedToast] = useState(false);
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);

  const handleRateChange = (currencyCode: string, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setRatesMap((prev) => ({
      ...prev,
      [currencyCode]: val,
    }));
  };

  const handleResetToDefault = () => {
    setRatesMap({});
  };

  const handleSave = () => {
    onUpdateGroupRates(ratesMap);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-100 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 tracking-tight">Currency Exchange Rates</h1>
          <p className="text-xs text-slate-400">
            Base Currency: {baseCurrencyObj.flag} {group.baseCurrency} ({baseCurrencyObj.symbol})
          </p>
        </div>
        <button
          onClick={handleResetToDefault}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Offline Guarantee Card */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Custom Offline Exchange Rate Lock</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          When traveling, exchange counters or cash conversions may differ from official daily bank rates. Set custom rates below to ensure offline calculations match your exact travel receipts.
        </p>
      </div>

      {/* Rates Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
          <span>Supported Currencies ({SUPPORTED_CURRENCIES.length})</span>
          <span>1 Base ({group.baseCurrency}) =</span>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {SUPPORTED_CURRENCIES.filter((c) => c.code !== group.baseCurrency).map((curr) => {
            const isCustom = ratesMap[curr.code] !== undefined;
            // Default rate relative to USD
            const baseUsd = baseCurrencyObj.defaultRateToBase;
            const foreignUsd = curr.defaultRateToBase;
            const defaultConv = foreignUsd / baseUsd;

            const currentRateVal = isCustom ? ratesMap[curr.code] : defaultConv;

            return (
              <div
                key={curr.code}
                className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl leading-none">{curr.flag}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{curr.code}</span>
                      <span className="text-slate-500 font-normal">({curr.name})</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Symbol: {curr.symbol} {isCustom ? '• Custom Rate Locked' : '• Default Market Rate'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step="any"
                    value={currentRateVal || ''}
                    onChange={(e) => handleRateChange(curr.code, e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] font-bold text-slate-400">{curr.code}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-xs flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        <span>Save Group Custom Exchange Rates</span>
      </button>

      {isSavedToast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-in fade-in z-50">
          ✓ Exchange rates updated for group!
        </div>
      )}
    </div>
  );
};
