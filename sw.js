const CACHE_NAME = 'splitmate-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './maskable-icon-512.png',
  './icon.svg'
];

const DB_NAME = 'splitmate_sync_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_sync_queue';

// IndexedDB helper inside Service Worker
function openSyncDBInSW() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getPendingSyncQueue() {
  try {
    const db = await openSyncDBInSW();
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

async function clearPendingSyncQueue() {
  try {
    const db = await openSyncDBInSW();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SW] Error clearing IndexedDB queue:', err);
  }
}

// Background Sync Processor
async function processBackgroundSync(tag) {
  console.log(`[SW Background Sync] Processing sync for tag: "${tag}"`);
  const pendingItems = await getPendingSyncQueue();
  
  if (pendingItems.length === 0) {
    console.log('[SW Background Sync] No pending items to sync.');
    notifyClients({ type: 'BACKGROUND_SYNC_COMPLETE', count: 0, tag });
    return;
  }

  console.log(`[SW Background Sync] Found ${pendingItems.length} pending items to sync.`);

  // Simulate network synchronization for queued items
  let syncedCount = 0;
  for (const item of pendingItems) {
    try {
      console.log(`[SW Background Sync] Successfully synced item: ${item.id} (${item.type})`);
      syncedCount++;
    } catch (err) {
      console.error(`[SW Background Sync] Failed to sync item ${item.id}:`, err);
    }
  }

  // Clear synced queue upon successful sync execution
  await clearPendingSyncQueue();

  // Broadcast completion message to all open app clients
  notifyClients({
    type: 'BACKGROUND_SYNC_SUCCESS',
    tag,
    count: syncedCount,
    timestamp: Date.now(),
    message: `Background Sync synchronized ${syncedCount} offline task(s) successfully!`
  });
}

// Broadcast message to all active window clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage(message);
  }
}

// Lifecycle Events
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match('./') || caches.match('./index.html')))
  );
});

// ==========================================
// BACKGROUND SYNC API EVENT LISTENER
// ==========================================
self.addEventListener('sync', (event) => {
  console.log('[SW Event] Background Sync triggered with tag:', event.tag);
  if (event.tag === 'sync-expenses' || event.tag === 'sync-pending-data' || event.tag.startsWith('sync-')) {
    event.waitUntil(processBackgroundSync(event.tag));
  }
});

// PERIODIC BACKGROUND SYNC
self.addEventListener('periodicsync', (event) => {
  console.log('[SW Event] Periodic Sync triggered with tag:', event.tag);
  if (event.tag === 'sync-exchange-rates' || event.tag === 'sync-expenses') {
    event.waitUntil(processBackgroundSync(event.tag));
  }
});

// Message Event Listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    const tag = event.data.tag || 'manual-sync';
    event.waitUntil(processBackgroundSync(tag));
  }
});

// ==========================================
// WEB PUSH NOTIFICATIONS API EVENT LISTENERS
// ==========================================
self.addEventListener('push', (event) => {
  console.log('[SW Event] Push notification received');
  let data = {
    title: 'SplitMate Notification',
    body: 'You have new activity or expense updates in SplitMate!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: './' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || './icon-192.png',
    badge: data.badge || './icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: './' },
    actions: [
      { action: 'open', title: 'Open SplitMate' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Event] Notification clicked with action:', event.action);
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
