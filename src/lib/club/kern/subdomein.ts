// ─── Club: subdomein per sportschool (PUUR) ─────────────────────────────────
// Elke sportschool krijgt een eigen adres: <slug>.aiyourgym.com, zoals
// <naam>.virtuagym.com (besluit Kane 17-10-2026). Puur en zonder Next of env,
// zodat het te testen is; src/proxy.ts voert het uit en src/lib/club/toegang.ts
// kiest op een subdomein de sportschool uit de slug.
//
//  <slug>.aiyourgym.com (schakelaar aan)
//    /club/...   door (alle bestaande links blijven werken)
//    /api/...        door
//    /clubinloggen/  door (persoonlijke inloglink van een eigenaar of clubmanager)
//    /mijn, /mijn/   door (de ledenapp voor leden, src/app/(aiyourgym)/(club)/mijn)
//    /club-app/      door (service worker en iconen van de ledenapp)
//    /...            herschrijven naar /club/...
//  www.aiyourgym.com, aiyourgym.com, gereserveerde namen: niet van Club (nog)
//  elk ander domein: niet van Club
//
// Lokaal: <slug>.club.localhost:3000 (werkt in Chrome en Firefox).
// Schakelaar uit: alles is "niet van Club", er verandert niets. Dan staat elke
// sportschool op aiyourgym.com/<slug> (besluit Kane 23-10-2026, pad-adres.ts);
// het subdomein komt pas bij de volledige livegang (Render Pro nodig).

export const CLUB_DOMEIN = 'aiyourgym.com'
export const CLUB_LOKAAL = 'club.localhost'
export const CLUB_PREFIX = '/club'

/** Een slug: kleine letters, cijfers en koppeltekens, 3 tot 40 tekens, niet beginnen of eindigen met een koppelteken. */
export const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/

/**
 * Namen die nooit een sportschool kunnen zijn: eigen diensten, verwarrende
 * namen, en alles wat als eerste deel van een pad op aiyourgym.com al iets is
 * (pagina's van de website, Club, de ledenapp, bestanden). Tot de subdomeinen
 * live gaan staat een sportschool op aiyourgym.com/<slug> (besluit Kane
 * 23-10-2026), dus een slug mag nooit een bestaande route raken.
 * subdomein.test.ts leest de routemappen en public/ en eist dat elke naam hier staat.
 */
export const GERESERVEERD: ReadonlySet<string> = new Set([
  // Diensten en verwarrende namen
  'www', 'app', 'api', 'admin', 'beheer', 'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'status', 'help', 'support',
  'docs', 'blog', 'login', 'inloggen', 'uitloggen', 'account', 'auth', 'demo', 'test', 'dev', 'staging', 'club', 'aiyourgym', 'portaal',
  'platform', 'registreren', 'aanmeldingen', 'wachtwoord', 'contact', 'over', 'nieuws', 'faq', 'pers', 'vacatures', 'partners',
  'kennisbank', 'home', 'start', 'abonnement', 'betalen', 'kopen', 'checkout', 'stripe', 'webhook', 'sitemap', 'robots', 'favicon',
  'icon', 'apple-icon', 'opengraph-image', 'twitter-image', 'manifest', 'next',
  // Talen van de website (aiyourgym.com/en/..., src/lib/aiyourgym/taal/pad.ts). Korter dan
  // een slug mag zijn, maar zo blijft het ook gereserveerd als die grens ooit verandert.
  'en', 'nl',
  // Pagina's van de website (src/app/(aiyourgym)/(website)/aiyourgym)
  'aanmelden', 'welkom', 'testbetaling', 'functies', 'prijzen', 'privacy', 'voorwaarden', 'overstappen', 'trainingsschemas',
  'voor-wie', 'demo-aanvragen', 'ledenapp', 'prijs-op-maat', 'privacy-en-beveiliging', 'nieuw', 'overstapchecklist',
  // Club, ledenapp, widget en inloggen (src/app/(aiyourgym)/(club) en api)
  'mijn', 'clubinloggen', 'club-app', 'club-afmelden', 'club-betalen', 'widget',
  // Mappen in public/ en andere apps op dezelfde server. Niet "fitfactory": dat
  // is de slug van Fit Factory zelf, en public/fitfactory heeft alleen beelden
  // (de proxy slaat bestanden met zo'n extensie over, een pagina heeft er geen).
  'brand', 'icons', 'models', 'releasev', 'fonts', 'clubkane', 'lifeoskane', 'mentaforce', 'oefenbeelden',
])

export type SlugUitslag = { ok: true; slug: string } | { ok: false; fout: string }

export function leesSlug(ruw: unknown): SlugUitslag {
  const slug = typeof ruw === 'string' ? ruw.trim().toLowerCase() : ''
  if (!SLUG.test(slug)) return { ok: false, fout: 'Gebruik 3 tot 40 kleine letters, cijfers of koppeltekens (niet aan het begin of eind).' }
  if (slug.includes('--')) return { ok: false, fout: 'Gebruik geen twee koppeltekens achter elkaar.' }
  if (GERESERVEERD.has(slug)) return { ok: false, fout: 'Dit adres is gereserveerd. Kies een ander.' }
  return { ok: true, slug }
}

/** Een voorstel voor de slug uit de naam van de sportschool: "Fit Factory" wordt "fitfactory". */
export function slugVoorstel(naam: string): string {
  const basis = naam
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'en')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40)
  return basis.length >= 3 ? basis : `${basis}club`.slice(0, 40)
}

function schoon(host: string | null | undefined): string {
  return (host ?? '').split(':')[0].trim().toLowerCase()
}

/** De slug uit de host, of null als dit geen subdomein van een sportschool is. */
export function slugUitHost(host: string | null | undefined): string | null {
  const h = schoon(host)
  for (const domein of [CLUB_DOMEIN, CLUB_LOKAAL]) {
    if (!h.endsWith(`.${domein}`)) continue
    const deel = h.slice(0, -(domein.length + 1))
    if (deel.includes('.')) return null
    const uitslag = leesSlug(deel)
    return uitslag.ok ? uitslag.slug : null
  }
  return null
}

/** Een volledig adres op aiyourgym.com, voor alles buiten de browser (mails, Stripe, push). */
export function aygUrl(pad: string): string {
  return `https://${CLUB_DOMEIN}${pad.startsWith('/') ? pad : `/${pad}`}`
}

/**
 * Het adres van een sportschool zoals we het tonen en mailen, zonder https://.
 * Met subdomeinen aan <slug>.aiyourgym.com, anders aiyourgym.com/<slug>
 * (besluit Kane 23-10-2026: subdomeinen pas bij de volledige livegang).
 */
export function adresVan(slug: string, subdomeinen: boolean): string {
  return subdomeinen ? `${slug}.${CLUB_DOMEIN}` : `${CLUB_DOMEIN}/${slug}`
}

/** Het volledige adres met een pad erachter: https://aiyourgym.com/<slug>/mijn of https://<slug>.aiyourgym.com/mijn. */
export function sportschoolUrl(slug: string, subdomeinen: boolean, pad = ''): string {
  const achter = pad === '' || pad.startsWith('/') ? pad : `/${pad}`
  return `https://${adresVan(slug, subdomeinen)}${achter}`
}

/** Wat er bij het invulveld van de slug staat: "aiyourgym.com/" ervoor, of ".aiyourgym.com" erachter. */
export function adresVeld(subdomeinen: boolean): { voor: string | null; achter: string | null } {
  return subdomeinen ? { voor: null, achter: `.${CLUB_DOMEIN}` } : { voor: `${CLUB_DOMEIN}/`, achter: null }
}

export type ClubBeslissing = { soort: 'niet-van-mij' } | { soort: 'door'; slug: string } | { soort: 'herschrijven'; slug: string; pad: string }

/** Wat de proxy doet met een verzoek. Met de schakelaar uit altijd "niet van Club". */
export function beslisClub(host: string | null | undefined, pad: string, actief: boolean): ClubBeslissing {
  if (!actief) return { soort: 'niet-van-mij' }
  const slug = slugUitHost(host)
  if (!slug) return { soort: 'niet-van-mij' }
  const doel = clubDoelPad(pad)
  return doel === null ? { soort: 'door', slug } : { soort: 'herschrijven', slug, pad: doel }
}

/**
 * Waar een pad binnen de omgeving van een sportschool heen gaat: null = het pad
 * bestaat zo al (Club, API, inloglinks, ledenapp), anders het pad in de app.
 * Gedeeld door het subdomein (<slug>.aiyourgym.com/<pad>) en het adres als pad
 * (aiyourgym.com/<slug>/<pad>, zie pad-adres.ts).
 */
export function clubDoelPad(pad: string): string | null {
  const door = pad === CLUB_PREFIX || pad.startsWith(`${CLUB_PREFIX}/`) || pad.startsWith('/api/') || pad.startsWith('/clubinloggen/')
    || pad === '/mijn' || pad.startsWith('/mijn/') || pad.startsWith('/club-app/')
  if (door) return null
  // Inloggen met e-mailadres en wachtwoord op het eigen adres.
  if (pad === '/inloggen') return '/aiyourgym/inloggen'
  return pad === '/' || pad === '' ? CLUB_PREFIX : `${CLUB_PREFIX}${pad}`
}
