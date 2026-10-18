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

/* ─── Push-meldingen ──────────────────────────────────────────────────────
   De server stuurt een versleutelde push (src/lib/club/push) met alleen wat op
   het scherm komt: { t: titel, b: tekst, u: link binnen /mijn, i: icoon,
   g: tag }. Geen andere ledengegevens. Een tik opent de app (of de link). */

const STANDAARD_LINK = '/mijn?tab=meldingen'
const STANDAARD_ICOON = '/club-app/icoon-192.png'

function veiligeLink(link) {
  return typeof link === 'string' && link.startsWith('/mijn') && !link.startsWith('//') ? link : STANDAARD_LINK
}

function leesPush(event) {
  try {
    const data = event.data ? event.data.json() : {}
    return {
      titel: typeof data.t === 'string' && data.t ? data.t.slice(0, 80) : 'Nieuwe melding',
      tekst: typeof data.b === 'string' ? data.b.slice(0, 240) : '',
      link: veiligeLink(data.u),
      icoon: typeof data.i === 'string' && data.i.startsWith('/') && !data.i.startsWith('//') ? data.i : STANDAARD_ICOON,
      tag: typeof data.g === 'string' ? data.g.slice(0, 80) : undefined,
    }
  } catch {
    return { titel: 'Nieuwe melding', tekst: '', link: STANDAARD_LINK, icoon: STANDAARD_ICOON, tag: undefined }
  }
}

self.addEventListener('push', (event) => {
  const melding = leesPush(event)
  event.waitUntil(
    self.registration.showNotification(melding.titel, {
      body: melding.tekst,
      icon: melding.icoon,
      badge: STANDAARD_ICOON,
      tag: melding.tag,
      data: { link: melding.link },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = veiligeLink(event.notification.data && event.notification.data.link)
  event.waitUntil(
    (async () => {
      const doel = new URL(link, self.location.origin).href
      const vensters = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      // Staat de app al open, gebruik dan dat venster.
      for (const venster of vensters) {
        if (new URL(venster.url).pathname.startsWith('/mijn') && 'focus' in venster) {
          await venster.focus()
          if ('navigate' in venster) await venster.navigate(doel).catch(() => undefined)
          return
        }
      }
      await self.clients.openWindow(doel)
    })(),
  )
})
