import React, { useState, useEffect, useRef } from 'react';
import { CurrencyCode, Expense, ExpenseCategory, Group, Member } from '../types';
import { getCurrencyDetails, getExchangeRate } from '../data/currencies';
import { calculateEqualSplits } from '../utils/splitMath';
import { Mic, MicOff, Sparkles, Volume2, Loader2, Check, X, ArrowRight, Edit3, AlertCircle, RefreshCw, Zap, Play, Square } from 'lucide-react';

interface VoiceExpenseModalProps {
  group: Group;
  onClose: () => void;
  onSaveExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>) => void;
  onEditInFullModal: (partialData: Partial<Expense>) => void;
}

export const VoiceExpenseModal: React.FC<VoiceExpenseModalProps> = ({
  group,
  onClose,
  onSaveExpense,
  onEditInFullModal,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed result from Gemini
  const [parsedResult, setParsedResult] = useState<{
    title: string;
    totalAmount: number;
    currency: CurrencyCode;
    category: ExpenseCategory;
    payerName?: string;
    notes?: string;
  } | null>(null);

  // MediaRecorder & Web Speech API refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentUser = group.members.find((m) => m.isCurrentUser) || group.members[0];
  const baseCurrencyObj = getCurrencyDetails(group.baseCurrency);

  // Suggested voice examples
  const examplePrompts = [
    `"Dinner for 85 ${group.baseCurrency} paid by ${currentUser.name}"`,
    `"Taxi to airport 45 USD paid by ${group.members[1]?.name || 'Alice'}"`,
    `"Grocery shopping 120 EUR paid by ${currentUser.name} split with everyone"`,
  ];

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setTranscript(currentTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Start Voice Capture
  const startListening = async () => {
    setErrorMessage(null);
    setTranscript('');
    setParsedResult(null);

    // 1. Try Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition start issue:', e);
      }
    }

    // 2. Audio recording stream via MediaRecorder
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
    } catch (err: any) {
      console.warn('Microphone stream access denied or not available:', err);
      if (!recognitionRef.current) {
        setErrorMessage('Microphone access requested or not available. You can also type or use speech text.');
      }
    }
  };

  // Stop Voice Capture & Process
  const stopListeningAndAnalyze = async () => {
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    let audioBase64: string | undefined = undefined;
    let mimeType = 'audio/webm';

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });
      }
    }

    processVoiceWithGemini(transcript, audioBase64, mimeType);
  };

  // Call server-side Gemini API
  const processVoiceWithGemini = async (
    textToProcess: string,
    audioB64?: string,
    mime: string = 'audio/webm'
  ) => {
    if (!textToProcess.trim() && !audioB64) {
      setErrorMessage('Please speak or type a short expense description first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/parse-voice-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToProcess,
          audioBase64: audioB64,
          mimeType: mime,
          groupMembers: group.members.map((m) => ({ id: m.id, name: m.name })),
          baseCurrency: group.baseCurrency,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse voice expense');
      }

      const extracted = data.data;

      // Ensure valid currency
      const currency = (extracted.currency || group.baseCurrency).toUpperCase() as CurrencyCode;
      
      setParsedResult({
        title: extracted.title || 'Voice Expense',
        totalAmount: typeof extracted.totalAmount === 'number' && !isNaN(extracted.totalAmount) ? extracted.totalAmount : 0,
        currency,
        category: (extracted.category as ExpenseCategory) || 'dining',
        payerName: extracted.payerName || '',
        notes: extracted.notes || textToProcess,
      });
    } catch (err: any) {
      console.error('Voice parsing error:', err);
      setErrorMessage(err?.message || 'Could not analyze voice input. Try speaking more clearly.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Match payer name to group member
  const matchedPayer = parsedResult?.payerName
    ? group.members.find(
        (m) => m.name.toLowerCase().includes(parsedResult.payerName!.toLowerCase())
      ) || currentUser
    : currentUser;

  // Confirm and directly save expense
  const handleConfirmSave = () => {
    if (!parsedResult || parsedResult.totalAmount <= 0) return;

    const rate = getExchangeRate(parsedResult.currency, group.baseCurrency, group.customExchangeRates);
    const baseAmt = parsedResult.totalAmount * rate;

    // Default equal splits across all active members
    const allMemberIds = group.members.map((m) => m.id);
    const splits = calculateEqualSplits(parsedResult.totalAmount, allMemberIds);

    onSaveExpense({
      groupId: group.id,
      title: parsedResult.title,
      category: parsedResult.category,
      originalAmount: parsedResult.totalAmount,
      originalCurrency: parsedResult.currency,
      exchangeRateUsed: rate,
      baseAmount: baseAmt,
      payers: [{ memberId: matchedPayer.id, amount: parsedResult.totalAmount }],
      splitType: 'equal',
      splits,
      date: new Date().toISOString(),
      notes: parsedResult.notes ? `🎤 Voice entry: ${parsedResult.notes}` : '🎤 Logged via AI Voice',
    });
  };

  // Send to full Add Expense Modal for fine-tuning
  const handleOpenInFullEditor = () => {
    if (!parsedResult) return;

    const rate = getExchangeRate(parsedResult.currency, group.baseCurrency, group.customExchangeRates);

    onEditInFullModal({
      groupId: group.id,
      title: parsedResult.title,
      category: parsedResult.category,
      originalAmount: parsedResult.totalAmount,
      originalCurrency: parsedResult.currency,
      exchangeRateUsed: rate,
      payers: [{ memberId: matchedPayer.id, amount: parsedResult.totalAmount }],
      splitType: 'equal',
      notes: parsedResult.notes ? `🎤 Voice entry: ${parsedResult.notes}` : '🎤 Logged via AI Voice',
    });
  };

  const currObj = parsedResult ? getCurrencyDetails(parsedResult.currency) : baseCurrencyObj;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5 text-white">
                <span>AI Voice Expense</span>
                <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Gemini 3.6
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Speak naturally in any currency to add expense</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Microphone Action Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden space-y-4">
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute inset-0 bg-indigo-600/10 transition-opacity duration-500 pointer-events-none ${
              isListening ? 'opacity-100 animate-pulse' : 'opacity-0'
            }`}
          />

          {/* Glowing Animated Mic Circle */}
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute -inset-4 bg-indigo-500/30 rounded-full blur-xl animate-ping opacity-75" />
                <div className="absolute -inset-2 bg-indigo-500/20 rounded-full animate-pulse" />
              </>
            )}

            <button
              onClick={isListening ? stopListeningAndAnalyze : startListening}
              disabled={isAnalyzing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl relative z-10 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 ring-4 ring-rose-500/50 scale-105'
                  : isAnalyzing
                  ? 'bg-indigo-900 border border-indigo-500/50 cursor-wait'
                  : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 hover:scale-105 active:scale-95 text-white ring-4 ring-indigo-500/20 shadow-indigo-600/30'
              }`}
            >
              {isListening ? (
                <Square className="w-8 h-8 text-white fill-white" />
              ) : isAnalyzing ? (
                <Loader2 className="w-8 h-8 text-indigo-300 animate-spin" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          <div>
            <div className="text-sm font-bold text-white">
              {isListening
                ? 'Listening... Speak your expense now'
                : isAnalyzing
                ? 'AI is analyzing your voice input...'
                : 'Tap microphone to start speaking'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isListening
                ? 'Tap square button when finished'
                : 'Supports currencies, payers, amounts & categories'}
            </p>
          </div>

          {/* Recognized Live Speech Text Box */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 min-h-[50px] flex items-center justify-center text-xs text-slate-200">
            {transcript ? (
              <p className="italic text-indigo-200 font-medium text-center">"{transcript}"</p>
            ) : (
              <p className="text-slate-500 text-center italic">"e.g. 50 dollars for lunch paid by Alice"</p>
            )}
          </div>

          {/* Or Manual Speech Text Input */}
          {!isListening && (
            <div className="w-full flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Or type voice text here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') processVoiceWithGemini(transcript);
                }}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
              />
              <button
                onClick={() => processVoiceWithGemini(transcript)}
                disabled={!transcript.trim() || isAnalyzing}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse</span>
              </button>
            </div>
          )}
        </div>

        {/* Error Message if any */}
        {errorMessage && (
          <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3 flex items-start gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Gemini Extracted Result Card */}
        {parsedResult && !isAnalyzing && (
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Extracted Expense Details
              </span>
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Ready to Save
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-white">{parsedResult.title}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span className="capitalize bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                      {parsedResult.category}
                    </span>
                    <span>• Paid by <strong className="text-indigo-300">{matchedPayer.name}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-emerald-400">
                    {currObj.symbol}
                    {parsedResult.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {parsedResult.currency}
                    {parsedResult.currency !== group.baseCurrency && (
                      <span>
                        {' '}
                        (≈ {baseCurrencyObj.symbol}
                        {(
                          parsedResult.totalAmount *
                          getExchangeRate(parsedResult.currency, group.baseCurrency, group.customExchangeRates)
                        ).toFixed(2)}{' '}
                        {group.baseCurrency})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {parsedResult.notes && (
                <div className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                  "{parsedResult.notes}"
                </div>
              )}
            </div>

            {/* Action Buttons for Parsed Result */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleConfirmSave}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Add Expense</span>
              </button>

              <button
                onClick={handleOpenInFullEditor}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                title="Edit details, change splits or dates"
              >
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Customize</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Example Prompts */}
        {!parsedResult && !isListening && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-400">Try saying or tapping an example:</div>
            <div className="space-y-1">
              {examplePrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(promptText.replace(/^"/, '').replace(/"$/, ''));
                    processVoiceWithGemini(promptText.replace(/^"/, '').replace(/"$/, ''));
                  }}
                  className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 p-2 rounded-xl text-[11px] text-indigo-200 transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{promptText}</span>
                  <Zap className="w-3 h-3 text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
