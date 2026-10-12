// ─── MentaForce op releasev.nl/mentaforce (puur) ────────────────────────────
// Besluit Kane (12-10-2026): MentaForce komt terug onder releasev.nl/mentaforce.
// De app zelf blijft gebouwd alsof hij in de hoofdmap staat (/dashboard, /login);
// src/proxy.ts herschrijft releasev.nl/mentaforce/… intern naar /… en dit bestand
// beslist wat er per verzoek op releasev.nl gebeurt. Geen Next, geen env: alles
// wat nodig is komt als argument binnen, zodat het zonder omgeving te testen is.
//
//  releasev.nl
//    /mentaforce, /mentaforce/…  → herschrijven naar /, /… (alleen MentaForce-
//                                  routes en API's; Fit Factory-paden niet)
//    /<MentaForce-route>/…       → omleiden naar /mentaforce/… (een link die de
//                                  basis mist, bv. een redirect('/login') van de
//                                  server, komt zo toch goed uit)
//    /api/<MentaForce-api>/…     → door (de webshop-API's blijven van de webshop)
//    rest                        → niet van mij: de webshop handelt het af
//
// Op elk ander domein (fitfactorypt.nl, localhost, Render) verandert er niets.

export const MF_BASIS = '/mentaforce'

/** Header waarmee de proxy aan de app doorgeeft dat MentaForce onder MF_BASIS draait. */
export const MF_BASIS_HEADER = 'x-mf-basis'

export type MfBeslissing =
  | { soort: 'niet-van-mij' }
  | { soort: 'door' }
  | { soort: 'omleiden'; url: string }
  | { soort: 'herschrijven'; pad: string }

function eersteSegment(pad: string): string {
  return pad.split('/')[1] ?? ''
}

export function isMfPad(pad: string): boolean {
  return pad === MF_BASIS || pad.startsWith(`${MF_BASIS}/`)
}

/** /mentaforce/dashboard → /dashboard, /mentaforce → /. Andere paden blijven gelijk. */
export function zonderBasis(pad: string): string {
  if (!isMfPad(pad)) return pad
  return pad.slice(MF_BASIS.length) || '/'
}

/**
 * Beslissing voor een verzoek op releasev.nl (de aanroeper controleert de host).
 *
 * @param mentaforceRoutes  top-level routes van MentaForce (uit de build)
 * @param webshopRoutes     top-level paden die van de webshop zijn (pagina's + API's)
 */
export function beslisMentaforce(
  pad: string,
  zoek: string,
  mentaforceRoutes: ReadonlySet<string>,
  webshopRoutes: ReadonlySet<string>,
  webshopApis: ReadonlySet<string>,
): MfBeslissing {
  if (isMfPad(pad)) {
    // Alleen wat echt van MentaForce is: de landing, MentaForce-routes en API's.
    // Iets anders (bv. een Fit Factory-pagina als /joey) blijft een 404 van de webshop.
    const intern = zonderBasis(pad)
    const segment = eersteSegment(intern)
    if (intern === '/' || segment === 'api' || mentaforceRoutes.has(segment)) {
      return { soort: 'herschrijven', pad: intern }
    }
    return { soort: 'niet-van-mij' }
  }

  const eerste = eersteSegment(pad)
  if (eerste === 'api') {
    const api = pad.split('/')[2] ?? ''
    if (api === '' || webshopApis.has(api)) return { soort: 'niet-van-mij' }
    return { soort: 'door' }
  }

  if (eerste !== '' && mentaforceRoutes.has(eerste) && !webshopRoutes.has(eerste)) {
    return { soort: 'omleiden', url: `${MF_BASIS}${pad}${zoek}` }
  }
  return { soort: 'niet-van-mij' }
}

/**
 * Een intern MentaForce-pad ("/dashboard") als link voor de browser. Onder
 * releasev.nl/mentaforce krijgt het de basis ervoor; elders blijft het gelijk.
 * Externe links, ankers en paden die de basis al hebben blijven ongemoeid.
 */
export function metBasis(pad: string, basis: string): string {
  if (!basis || !pad.startsWith('/') || pad.startsWith('//')) return pad
  if (pad === basis || pad.startsWith(`${basis}/`) || pad.startsWith(`${basis}?`) || pad.startsWith(`${basis}#`)) return pad
  if (pad === '/') return basis
  if (pad.startsWith('/?') || pad.startsWith('/#')) return `${basis}${pad.slice(1)}`
  return `${basis}${pad}`
}

/** Leest de basis uit een browserpad: "/mentaforce/…" → "/mentaforce", anders "". */
export function basisVanPad(pad: string): string {
  return isMfPad(pad) ? MF_BASIS : ''
}
