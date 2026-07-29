import React, { useState } from 'react';
import { Smartphone, Monitor, Battery, Wifi, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState<'iphone' | 'pixel' | 'fullscreen'>('iphone');
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  // Update clock every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (deviceMode === 'fullscreen') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Floating device mode switch pill */}
        <div className="fixed top-3 right-3 z-50 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-xl text-xs font-medium text-slate-300">
          <button
            onClick={() => setDeviceMode('iphone')}
            className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Frame View</span>
          </button>
        </div>
        <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col min-h-screen bg-slate-900 shadow-2xl">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-6 font-sans">
      {/* Device Toolbar Controls */}
      <div className="mb-4 bg-slate-900/90 border border-slate-800 rounded-full p-1.5 flex items-center gap-1 shadow-lg text-xs">
        <button
          onClick={() => setDeviceMode('iphone')}
          className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all font-medium ${
            deviceMode === 'iphone' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iOS Frame</span>
        </button>
        <button
          onClick={() => setDeviceMode('pixel')}
          className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all font-medium ${
            deviceMode === 'pixel' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Frame</span>
        </button>
        <button
          onClick={() => setDeviceMode('fullscreen')}
          className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all font-medium ${
            deviceMode === 'fullscreen' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Full View</span>
        </button>
      </div>

      {/* Realistic Mobile Device Container */}
      <div
        className={`relative w-full max-w-[410px] h-[850px] max-h-[92vh] bg-slate-900 border-[10px] sm:border-[12px] ${
          deviceMode === 'iphone' ? 'border-slate-800 rounded-[48px]' : 'border-slate-800 rounded-[36px]'
        } shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(99,102,241,0.15)] flex flex-col overflow-hidden transition-all duration-300`}
      >
        {/* Dynamic Island / Camera Notch */}
        {deviceMode === 'iphone' ? (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-end px-2 gap-1.5 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            <div className="w-2 h-2 rounded-full bg-indigo-950 border border-indigo-900/50" />
          </div>
        ) : (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50 ring-1 ring-slate-800" />
        )}

        {/* Mobile Status Bar */}
        <div className="w-full pt-3 pb-1 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-300 z-40 bg-slate-900/80 backdrop-blur-sm shrink-0">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-emerald-400">100%</span>
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* App Content Frame */}
        <div className="flex-1 w-full flex flex-col overflow-hidden relative bg-slate-900">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="w-full py-2 bg-slate-950 flex justify-center shrink-0">
          <div className="w-32 h-1 bg-slate-600/60 rounded-full" />
        </div>
      </div>
    </div>
  );
};
