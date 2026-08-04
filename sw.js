const CACHE = 'nova-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Audio must go straight to the network. A service worker can't serve a
  // partial (206) response, so intercepting these breaks seeking inside the
  // sprite files — the browser's own HTTP cache handles them just fine.
  if (req.headers.has('range') || /\.mp3(\?|$)/i.test(req.url)) return;

  e.respondWith(
    fetch(req)
      .then(r => {
        const copy = r.clone();
        if (r.ok && r.status === 200) {
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return r;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
