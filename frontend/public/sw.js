const CACHE_NAME = 'claribox-student-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/f5.png',
  '/manifest.json',
];

// ── Install: pre-cache static assets ─────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch strategy ────────────────────────────────────────────────────────
// - API calls: network only (never cache)
// - Everything else: network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never cache API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Cache a clone of every successful response
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push notifications ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'ClariBox', body: 'You have a new update.' };
  try { data = event.data.json(); } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/f5.png',
      badge:   '/f5.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' },
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});