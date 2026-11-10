// Service worker de "Mi saldo": guarda la pantalla de la app para que abra aunque no haya internet.
// NUNCA guarda ni toca las llamadas al servidor (saldo, compras): eso siempre va directo a la red.
const VERSION = 'saldo-v2';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', '../icon-192.png', '../icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('saldo-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // el servidor (otro dominio) no se toca
  // Primero la red (así siempre ves la versión nueva); si no hay internet, la copia guardada.
  e.respondWith(fetch(req).then((r) => {
    if (r && r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
