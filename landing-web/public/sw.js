/* Self-destroying service worker — kills the legacy Lovable-era PWA worker.
 *
 * Why this file exists: buffadhd.com used to serve the old Lovable web app,
 * which registered a service worker at this scope. Users from that era (the
 * WhatsApp community cohort) still carry that worker, and it serves the OLD
 * app shell — including its purple "404 Oops! Page not found" screen — for
 * every navigation, no matter what the server ships (IN-2026-07-08-01).
 *
 * The SPA rewrite in vercel.json returns index.html (text/html) for any
 * missing path, so the browser's service-worker update check at this URL got
 * an invalid MIME type and kept the stale worker alive forever. Serving real
 * JavaScript here lets the update succeed; this replacement then unregisters
 * itself, wipes every cache, and reloads open tabs from the network.
 *
 * The marketing landing intentionally has no PWA — do not add caching here.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
