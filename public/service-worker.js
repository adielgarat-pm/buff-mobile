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
