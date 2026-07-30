// Background Sync & IndexedDB Manager for Service Worker Sync

const DB_NAME = 'splitmate_sync_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_sync_queue';

export interface PendingSyncItem {
  id: string;
  type: 'ADD_EXPENSE' | 'EDIT_EXPENSE' | 'DELETE_EXPENSE' | 'ADD_SETTLEMENT';
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced';
}

// Open IndexedDB database
export function openSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Queue an item for Background Sync
export async function queuePendingSyncItem(
  type: PendingSyncItem['type'],
  payload: any
): Promise<PendingSyncItem> {
  const item: PendingSyncItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    payload,
    timestamp: Date.now(),
    status: 'pending',
  };

  try {
    const db = await openSyncDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Request Background Sync via Service Worker
    await requestBackgroundSync('sync-expenses');
  } catch (err) {
    console.warn('[SyncManager] Failed to queue item in IndexedDB:', err);
  }

  return item;
}

// Fetch all pending sync items
export async function getPendingSyncItems(): Promise<PendingSyncItem[]> {
  try {
    const db = await openSyncDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// Clear or remove synced items
export async function clearSyncedItems(): Promise<void> {
  try {
    const db = await openSyncDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SyncManager] Failed to clear IndexedDB store:', err);
  }
}

// Register Background Sync tag with Service Worker
export async function requestBackgroundSync(tag = 'sync-expenses'): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      console.log(`[SyncManager] Background Sync registered for tag: ${tag}`);
      return true;
    } else {
      console.log('[SyncManager] Background Sync API not supported on this browser, triggering fallback sync message');
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_SYNC', tag });
      }
      return false;
    }
  } catch (err) {
    console.warn('[SyncManager] Background Sync registration error:', err);
    return false;
  }
}

// Helper to check if Background Sync API is supported in current browser environment
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

// Register service worker with sync readiness
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[ServiceWorker] Registered with scope:', registration.scope);

    // Prompt Background Sync capability if supported
    if ('sync' in registration) {
      console.log('[ServiceWorker] Background Sync API capability detected and active');
    }

    return registration;
  } catch (err) {
    console.warn('[ServiceWorker] Registration failed:', err);
    return null;
  }
}
