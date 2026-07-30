import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Cloud, ShieldCheck } from 'lucide-react';
import {
  getPendingSyncItems,
  requestBackgroundSync,
  isBackgroundSyncSupported,
  PendingSyncItem
} from '../utils/syncManager';

interface BackgroundSyncBannerProps {
  onSyncCompleted?: () => void;
}

export const BackgroundSyncBanner: React.FC<BackgroundSyncBannerProps> = ({ onSyncCompleted }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const hasSyncSupport = isBackgroundSyncSupported();

  // Refresh pending count from IndexedDB
  const refreshPendingQueue = async () => {
    const items = await getPendingSyncItems();
    setPendingCount(items.length);
  };

  useEffect(() => {
    refreshPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      console.log('[BackgroundSync UI] Network restored to online.');
      // Automatically trigger background sync when coming back online
      handleTriggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[BackgroundSync UI] Network status changed to offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for ServiceWorker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC_SUCCESS') {
        setIsSyncing(false);
        setPendingCount(0);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setSyncToast(`Background Sync completed: ${event.data.message || 'Synced offline data'}`);
        if (onSyncCompleted) onSyncCompleted();

        setTimeout(() => {
          setSyncToast(null);
        }, 5000);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Interval check for queue
    const interval = setInterval(refreshPendingQueue, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      clearInterval(interval);
    };
  }, []);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    await requestBackgroundSync('sync-expenses');
    setTimeout(async () => {
      await refreshPendingQueue();
      setIsSyncing(false);
    }, 1500);
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border-b border-indigo-500/20 text-slate-100 text-xs px-3 py-2 transition-all duration-300">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full text-[11px]">
              <Wifi size={12} className="animate-pulse" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full text-[11px]">
              <WifiOff size={12} />
              Offline Mode
            </span>
          )}

          {/* Background Sync Badge */}
          <span className="hidden sm:inline-flex items-center gap-1 text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-full text-[11px]">
            <Cloud size={12} className="text-indigo-400" />
            Background Sync {hasSyncSupport ? 'Ready' : 'Active'}
          </span>
        </div>

        {/* Pending Queue & Actions */}
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold animate-pulse">
              {pendingCount} offline edit{pendingCount > 1 ? 's' : ''} queued
            </span>
          ) : (
            lastSyncTime && (
              <span className="text-slate-400 text-[11px] hidden xs:inline">
                Synced {lastSyncTime}
              </span>
            )
          )}

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors disabled:opacity-50"
            title="Force Background Sync now"
          >
            <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="mt-2 bg-emerald-900/90 border border-emerald-500/50 text-emerald-100 p-2 rounded-lg text-center font-medium flex items-center justify-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}
    </div>
  );
};
