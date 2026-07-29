import React, { useState, useRef } from 'react';
import { CurrencyCode, ExpenseCategory, Group, ScannedReceiptData } from '../types';
import { SAMPLE_RECEIPTS, SampleReceipt } from '../data/sampleReceipts';
import { X, Camera, Upload, Sparkles, CheckCircle, AlertCircle, Loader2, FileText, ArrowRight, Layers } from 'lucide-react';

interface ReceiptScannerModalProps {
  group: Group;
  onClose: () => void;
  onUseScannedData: (data: ScannedReceiptData, imageBase64?: string) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  group,
  onClose,
  onUseScannedData,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      processImageWithGemini(base64);
    };
    reader.readAsDataURL(file);
  };

  // Handle Sample Receipt Selection
  const handleSelectSample = (sample: SampleReceipt) => {
    setSelectedImage(sample.imageUrl);
    setIsScanning(true);
    setErrorMsg(null);

    // Simulate scanning delay for realistic AI feel
    setTimeout(() => {
      setScannedResult(sample.data);
      setIsScanning(false);
    }, 1200);
  };

  // Process Real Upload Image with Gemini Server Endpoint
  const processImageWithGemini = async (base64Image: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setScannedResult(null);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: 'image/jpeg',
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to scan receipt image');
      }

      setScannedResult(resData.data);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMsg(err.message || 'Error processing image. Please try another image.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">AI Receipt Scanner</h2>
              <p className="text-[10px] text-slate-400">Gemini 3.6 Multimodal Vision OCR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200 text-xs">
          {/* Upload or Camera Capture Box */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {!selectedImage ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-950 hover:bg-slate-950/80 border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 rounded-3xl p-6 text-center space-y-3 cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-100">Take Photo or Upload Receipt</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Auto-extracts merchant, total, currency & itemized items
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image</span>
                </div>
              </div>

              {/* Sample Receipts Preset */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Or Test with Sample Receipts:
                </div>
                <div className="space-y-2">
                  {SAMPLE_RECEIPTS.map((sample) => (
                    <div
                      key={sample.id}
                      onClick={() => handleSelectSample(sample)}
                      className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <img
                        src={sample.imageUrl}
                        alt={sample.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-slate-200 truncate">{sample.name}</div>
                        <div className="text-[10px] text-indigo-400 font-medium">{sample.subtitle}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-48 bg-slate-950 flex items-center justify-center">
                <img src={selectedImage} alt="Receipt preview" className="max-h-48 object-contain w-full" />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setScannedResult(null);
                  }}
                  className="absolute top-2 right-2 bg-slate-900/90 text-white p-1.5 rounded-full border border-slate-700"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scanning State */}
              {isScanning && (
                <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <div>
                    <div className="font-bold text-sm text-slate-100">Scanning Bill with Gemini AI...</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Detecting line items, tax, and currency</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {errorMsg && (
                <div className="bg-rose-950/50 border border-rose-800 p-3 rounded-2xl flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Extracted Receipt Result */}
              {scannedResult && (
                <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs text-slate-100">{scannedResult.title}</span>
                    </div>
                    <span className="bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-xs">
                      {scannedResult.currency} {scannedResult.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Line Items extracted */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Extracted Line Items ({scannedResult.lineItems.length}):</div>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {scannedResult.lineItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                          <span className="text-slate-300 truncate">{item.name}</span>
                          <span className="font-semibold text-slate-100 shrink-0">
                            {scannedResult.currency} {item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onUseScannedData(scannedResult, selectedImage)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Use in Expense Form</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
