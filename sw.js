/* WS Quick service worker - lets the app open with no signal.
   Only the app shell is cached. Google Sheets calls are never cached. */
var CACHE = 'ws-quick-v2';
var SHELL = ['./quick.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;           /* leave Apps Script / Google alone */
  if (req.mode === 'navigate') {                        /* page loads: newest copy if online, else cached */
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./quick.html', copy); });
        return res;
      }).catch(function () { return caches.match('./quick.html'); })
    );
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
