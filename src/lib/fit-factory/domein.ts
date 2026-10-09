// ─── Fit Factory PT — eigen domein (puur) ───────────────────────────────────
// De PT-app van Fit Factory draait in dezelfde Next-app als MentaForce, maar
// hoort op zijn eigen domein: fitfactorypt.nl/<naam> i.p.v. mentaforce.nl/<naam>.
// Dit bestand beslist per verzoek wat er moet gebeuren; `src/proxy.ts` voert het
// uit en `src/app/[pt]/layout.tsx` stuurt oude PT-links door.
//
// ─── DE SCHAKELAAR ──────────────────────────────────────────────────────────
// Doorsturen van mentaforce.nl naar fitfactorypt.nl gebeurt pas als
// FIT_FACTORY_DOMEIN_ACTIEF=1 staat (Render-env). Zo kan deze code live staan
// vóór de DNS klopt: zonder schakelaar blijven de huidige links gewoon werken.
// Op fitfactorypt.nl zelf werkt alles altijd (dat domein bereik je alleen als de
// DNS er al naartoe wijst).
//
// Geen fetch, geen env-lezen hier: de aanroeper geeft `actief` mee, zodat dit
// zonder omgeving te testen is.

export const PT_DOMEIN = 'fitfactorypt.nl'

/** Header waarin de proxy het oorspronkelijke pad + query meegeeft aan de app. */
export const PAD_HEADER = 'x-ff-pad'

/** De ingang van het PT-team; op het eigen domein is dat gewoon de homepage. */
export const PT_INGANG = '/FitFactoryPT'

/** De Fit Factory-variant van het inlogscherm (alleen de beheerder logt zo in). */
export const PT_LOGIN = '/FitFactoryPT/login'

/** Het Fit Factory-icoon voor het browsertabblad, i.p.v. het MentaForce-favicon. */
export const PT_FAVICON = '/icons/pt-192.png'

/** Komma-lijst uit de build-env (next.config) → set. Leeg = niets bekend. */
export function leesRoutes(lijst: string | undefined): ReadonlySet<string> {
  return new Set((lijst ?? '').split(',').map((r) => r.trim()).filter(Boolean))
}

/** Host zonder poort en in kleine letters ("FitFactoryPT.nl:443" → "fitfactorypt.nl"). */
function schoon(host: string | null | undefined): string {
  return (host ?? '').split(':')[0].trim().toLowerCase()
}

export function isPtHost(host: string | null | undefined): boolean {
  const h = schoon(host)
  return h === PT_DOMEIN || h === `www.${PT_DOMEIN}`
}

export function isMentaforceHost(host: string | null | undefined): boolean {
  const h = schoon(host)
  return h === 'mentaforce.nl' || h === 'www.mentaforce.nl'
}

/** Een absolute URL op het PT-domein. `pad` begint met "/" (mag een query bevatten). */
export function ptUrl(pad: string): string {
  return `https://${PT_DOMEIN}${pad.startsWith('/') ? pad : `/${pad}`}`
}

/** Wat de proxy met een verzoek moet doen. */
export type Beslissing =
  | { soort: 'door' }
  | { soort: 'omleiden'; url: string }
  | { soort: 'herschrijven'; pad: string }

/**
 * Per host en pad: doorlaten, omleiden (308) of intern herschrijven.
 *
 *  fitfactorypt.nl
 *    www.…           → omleiden naar het kale domein (één adres, één set cookies)
 *    /               → herschrijven naar de ingang (de URL blijft "/")
 *    /FitFactoryPT   → omleiden naar "/" (geen twee adressen voor dezelfde pagina)
 *    /login          → herschrijven naar de Fit Factory-login
 *    /favicon.ico    → herschrijven naar het Fit Factory-icoon
 *    MentaForce-route (/home, /lifeos, …) → omleiden naar "/": op dit domein is
 *                      niets van MentaForce te zien
 *    rest            → door (/<naam>, /api, …)
 *
 *  mentaforce.nl, alleen met de schakelaar aan
 *    /FitFactoryPT   → fitfactorypt.nl/
 *    /<naam>/…       → fitfactorypt.nl/<naam>/… (alles wat geen MentaForce-route,
 *                      API of bestand is; in één echte 308, met pad en query)
 */
export function beslis(
  host: string | null | undefined,
  pad: string,
  zoek: string,
  actief: boolean,
  mentaforceRoutes: ReadonlySet<string> = new Set(),
): Beslissing {
  const h = schoon(host)
  if (h === `www.${PT_DOMEIN}`) return { soort: 'omleiden', url: ptUrl(`${pad}${zoek}`) }

  if (isPtHost(h)) {
    if (pad === '/') return { soort: 'herschrijven', pad: PT_INGANG }
    if (pad === PT_INGANG) return { soort: 'omleiden', url: ptUrl(`/${zoek}`) }
    if (pad === '/login') return { soort: 'herschrijven', pad: PT_LOGIN }
    if (pad === '/favicon.ico') return { soort: 'herschrijven', pad: PT_FAVICON }
    const eerste = pad.split('/')[1] ?? ''
    if (mentaforceRoutes.has(eerste)) return { soort: 'omleiden', url: ptUrl('/') }
    return { soort: 'door' }
  }

  if (actief && isMentaforceHost(h)) {
    if (pad === PT_INGANG) return { soort: 'omleiden', url: ptUrl(`/${zoek}`) }
    if (isPtPad(pad, mentaforceRoutes)) return { soort: 'omleiden', url: ptUrl(`${pad}${zoek}`) }
  }
  return { soort: 'door' }
}

/** Mappen en paden op mentaforce.nl die nooit een PT-naam zijn (API, Next, public/). */
const NOOIT_PT = new Set(['api', '_next', 'icons', 'fonts', 'models', 'brand', 'fitfactory', 'lead'])

/**
 * Is dit pad op mentaforce.nl een PT-link (/joey, /joey/lead, /lifeoskane)? Ja als
 * het eerste segment geen MentaForce-route, geen bestand en geen vaste map is.
 * Zonder routelijst (bv. een kapotte build) nooit: dan liever een omweg via de
 * PT-layout dan heel MentaForce wegsturen.
 */
function isPtPad(pad: string, mentaforceRoutes: ReadonlySet<string>): boolean {
  const eerste = pad.split('/')[1] ?? ''
  if (eerste === '' || mentaforceRoutes.size === 0) return false
  if (eerste.includes('.') || NOOIT_PT.has(eerste)) return false
  return !mentaforceRoutes.has(eerste)
}

/**
 * Moet een PT-pagina die op mentaforce.nl geopend wordt naar het eigen domein?
 * Alleen met de schakelaar aan en alleen vanaf mentaforce.nl (niet localhost,
 * niet een Render-preview), zodat ontwikkelen en testen gewoon blijft werken.
 */
export function ptDoorsturen(host: string | null | undefined, actief: boolean): boolean {
  return actief && isMentaforceHost(host)
}
