/* ─── Club ledenapp: service worker (scope /mijn) ──────────────────────────
   Wat wel in de cache mag: de schil en statische bestanden (JS, CSS, letters,
   iconen, oefenbeelden). Die tonen we meteen uit de cache en verversen we op
   de achtergrond (stale-while-revalidate).

   Wat NOOIT in de cache mag: ledengegevens. Daarom:
   * /api/... gaat altijd over het netwerk, de service worker raakt het niet aan;
   * pagina's van /mijn (en hun server-data, RSC) ook: die bevatten gegevens van
     het lid. Zonder netwerk tonen we de offline-pagina.

   Een nieuwe versie: VERSIE ophogen. Bij activeren ruimen we dan alle oude
   club-app-caches op. Registratie: src/components/club/ledenapp-pwa/RegistreerSw.tsx.
   Nodig op dit bestand: de kop Service-Worker-Allowed: /mijn (next.config). */

const VERSIE = 'v1'
const VOORVOEGSEL = 'club-app-'
const SCHIL = `${VOORVOEGSEL}schil-${VERSIE}`
const STATISCH = `${VOORVOEGSEL}statisch-${VERSIE}`
const OFFLINE = '/club-app/offline.html'
const VOORAF = [OFFLINE, '/club-app/icoon-192.png']
const MAX_STATISCH = 250

const STATISCHE_PADEN = ['/_next/static/', '/club-app/', '/fonts/', '/icons/', '/club/oefeningen']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SCHIL)
      .then((cache) => cache.addAll(VOORAF))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const namen = await caches.keys()
      await Promise.all(
        namen.filter((naam) => naam.startsWith(VOORVOEGSEL) && naam !== SCHIL && naam !== STATISCH).map((naam) => caches.delete(naam)),
      )
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
      await self.clients.claim()
    })(),
  )
})

function isStatisch(url) {
  if (url.pathname === '/club-app/sw.js') return false
  return STATISCHE_PADEN.some((pad) => url.pathname.startsWith(pad))
}

function isServerData(request, url) {
  return request.headers.get('RSC') === '1' || url.searchParams.has('_rsc') || request.headers.has('Next-Router-State-Tree')
}

async function paginaOfOffline(event) {
  try {
    const vooraf = await event.preloadResponse
    if (vooraf) return vooraf
    return await fetch(event.request)
  } catch {
    const offline = await caches.match(OFFLINE)
    return offline || new Response('Je bent offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}

async function ruimOp(cache) {
  const sleutels = await cache.keys()
  const teVeel = sleutels.length - MAX_STATISCH
  for (let i = 0; i < teVeel; i++) await cache.delete(sleutels[i])
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(STATISCH)
  const bewaard = await cache.match(event.request)
  const vers = fetch(event.request)
    .then(async (antwoord) => {
      // Alleen eigen, geslaagde antwoorden; nooit iets dat "geen opslag" vraagt.
      const magBewaren = antwoord.ok && antwoord.type === 'basic' && !/no-store|private/.test(antwoord.headers.get('Cache-Control') || '')
      if (magBewaren) {
        await cache.put(event.request, antwoord.clone())
        await ruimOp(cache)
      }
      return antwoord
    })
    .catch(() => undefined)
  event.waitUntil(vers)
  if (bewaard) return bewaard
  return (await vers) || Response.error()
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Ledengegevens: altijd het netwerk, nooit de cache.
  if (url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') {
    event.respondWith(paginaOfOffline(event))
    return
  }
  if (isServerData(request, url)) return
  if (isStatisch(url)) event.respondWith(staleWhileRevalidate(event))
})
