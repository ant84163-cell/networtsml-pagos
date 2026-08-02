// Súbele el número cada vez que hagas un cambio grande
const CACHE_NAME = 'networtsml-pagos-v3';

// Solo guardo lo decorativo. El index.html NUNCA se cachea:
// si no hay internet, la app no abre.
const ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Pantalla que sale cuando no hay internet
const PAGINA_SIN_INTERNET = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0b1524">
<title>Sin conexión · networtsml</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    padding:24px;background:radial-gradient(900px 380px at 50% -120px,rgba(56,189,248,.14),transparent 70%),#0b1524;
    color:#e8eef8;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;text-align:center}
  .caja{background:#111e31;border:1px solid rgba(148,163,184,.15);border-radius:20px;
    padding:30px 24px;max-width:340px;width:100%}
  .ico{width:64px;height:64px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;
    font-size:1.9rem;background:rgba(248,113,113,.14);border:1px solid rgba(248,113,113,.45)}
  h1{font-size:1.15rem;margin:0 0 8px;font-weight:800}
  p{color:#8fa3bf;font-size:.9rem;line-height:1.6;margin:0}
  .marca{margin-top:20px;padding-top:16px;border-top:1px solid rgba(148,163,184,.15);
    color:#8fa3bf;font-size:.75rem}
  .marca b{color:#38bdf8}
  button{margin-top:20px;width:100%;border:none;border-radius:12px;padding:13px;
    font:700 .88rem system-ui;cursor:pointer;
    background:linear-gradient(180deg,#38bdf8,#0ea5e9);color:#04121f}
  button:active{transform:scale(.97)}
</style></head><body>
  <div class="caja">
    <div class="ico">📡</div>
    <h1>Sin conexión a internet</h1>
    <p>El control de mensualidades necesita internet para mostrarte los datos al día.
       Conéctate y vuelve a intentar.</p>
    <button onclick="location.reload()">Reintentar</button>
    <div class="marca"><b>networtsml</b> · «Sin WiFi no hay Paraíso»</div>
  </div>
</body></html>`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firebase y CDNs van directo a la red

  const esHTML =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/');

  if (esHTML) {
    // SOLO RED. Sin internet -> pantalla de "sin conexión", nunca la app.
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() =>
        new Response(PAGINA_SIN_INTERNET, {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      )
    );
    return;
  }

  // Íconos y manifest: cache primero (no cambian)
  event.respondWith(
    caches.match(request).then(cacheRes =>
      cacheRes ||
      fetch(request).then(networkRes => {
        const copia = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copia));
        return networkRes;
      })
    )
  );
});
