/* BUFF PWA service worker — minimal.
 *
 * Purpose: satisfy the installability criteria (a registered SW with a fetch
 * handler) so Chrome/Android offers "Install app", and so the app launches in
 * standalone mode from the home screen. We deliberately do NOT cache the Expo
 * JS bundle for offline use yet (the hashed bundle + Supabase data make real
 * offline non-trivial) — this is a network passthrough. Offline support can be
 * layered on later.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network passthrough. The fetch handler must exist for installability;
  // we don't intercept/cache responses yet.
  event.respondWith(fetch(event.request).catch(() => Response.error()));
});

// ─── Web Push ────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let title = 'BUFF';
  let body = '';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title ?? title;
      body = payload.body ?? body;
      data = payload.data ?? {};
    } catch {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/assets/BUFF_LOGO.png',
      badge: '/assets/BUFF_LOGO.png',
      data,
      // Keep the notification until the user interacts with it.
      requireInteraction: false,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Focus the existing PWA window or open a new one.
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        return self.clients.openWindow('/');
      }),
  );
});
