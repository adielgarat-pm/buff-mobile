/**
 * setupPwa (web) — make the Expo Web build installable as a PWA.
 *
 * This app isn't expo-router, so there's no `app/+html.tsx` to customise the
 * document head. Instead we inject the PWA tags at runtime and register the
 * service worker. Static files (manifest, icons, SW) live in `public/` and are
 * served at the site root by Expo's web bundler.
 *
 * iOS Safari "Add to Home Screen" uses the apple-* meta tags + apple-touch-icon
 * (no service worker required). Android/Chrome's install prompt needs the
 * manifest + a registered service worker with a fetch handler — both provided.
 */
export function setupPwa(): void {
  if (typeof document === 'undefined') return;
  const head = document.head;

  const ensureMeta = (name: string, content: string) => {
    if (document.querySelector(`meta[name="${name}"]`)) return;
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    m.setAttribute('content', content);
    head.appendChild(m);
  };

  const ensureLink = (rel: string, href: string) => {
    if (document.querySelector(`link[rel="${rel}"]`)) return;
    const l = document.createElement('link');
    l.setAttribute('rel', rel);
    l.setAttribute('href', href);
    head.appendChild(l);
  };

  ensureLink('manifest', '/manifest.json');
  ensureLink('apple-touch-icon', '/apple-touch-icon.png');

  ensureMeta('theme-color', '#1a1636');
  ensureMeta('mobile-web-app-capable', 'yes');
  ensureMeta('apple-mobile-web-app-capable', 'yes');
  ensureMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  ensureMeta('apple-mobile-web-app-title', 'BUFF');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        /* registration failures are non-fatal — the app still works, just not installable */
      });
    });
  }
}
