/* ============================================================
   LIKENET · SERVICE WORKER · v1.0.0
   ============================================================ */
const VERSION = 'likenet-v1.0.0';
const CACHE_STATIC  = `${VERSION}-static`;
const CACHE_CDN     = `${VERSION}-cdn`;
const CACHE_IMAGES  = `${VERSION}-images`;
const CACHE_RUNTIME = `${VERSION}-runtime`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/likenet.jpg',
  '/likenet2.jpg'
];

const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

/* ---------- INSTALL ---------- */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando:', VERSION);
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(c =>
        Promise.all(STATIC_ASSETS.map(u =>
          c.add(u).catch(e => console.warn('[SW] skip:', u, e.message))
        ))
      ),
      caches.open(CACHE_CDN).then(c =>
        Promise.all(CDN_ASSETS.map(u =>
          c.add(new Request(u, { mode: 'no-cors' }))
            .catch(e => console.warn('[SW] cdn skip:', u, e.message))
        ))
      )
    ]).then(() => self.skipWaiting())
  );
});

/* ---------- ACTIVATE ---------- */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando:', VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !k.startsWith(VERSION))
            .map(k => { console.log('[SW] Borrando caché viejo:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------- FETCH ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  // Firebase RTDB: siempre red (datos en tiempo real)
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firebasedatabase.app') ||
      url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('googleapis.com')) return;

  if (!url.protocol.startsWith('http')) return;

  // Recursos locales
  if (url.origin === self.location.origin) {
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
      event.respondWith(cacheFirst(req, CACHE_IMAGES));
      return;
    }
    if (/\.(html|js|css|json)$/i.test(url.pathname) ||
        url.pathname === '/' || url.pathname.endsWith('/')) {
      event.respondWith(networkFirst(req, CACHE_STATIC));
      return;
    }
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  // CDN
  if (url.hostname.includes('tailwindcss') ||
      url.hostname.includes('cloudflare') ||
      url.hostname.includes('fonts.') ||
      url.hostname.includes('gstatic')) {
    event.respondWith(cacheFirst(req, CACHE_CDN));
    return;
  }

  // Resto: runtime
  event.respondWith(
    cacheFirst(req, CACHE_RUNTIME)
      .catch(() => caches.match('/index.html'))
  );
});

/* ---------- ESTRATEGIAS ---------- */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === 'opaque') && res.status !== 206) {
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const fb = await cache.match(request, { ignoreSearch: true });
    if (fb) return fb;
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.ok && res.status !== 206) {
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const shell = await caches.match('/index.html');
    if (shell) return shell;
    throw err;
  }
}

/* ---------- MENSAJES ---------- */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => event.ports?.[0]?.postMessage({ ok: true }));
  }
});

console.log('[SW] Likenet SW cargado · versión:', VERSION);