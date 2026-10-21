// ─── AI Your Gym: adressen voor Stripe en de inloglink (PUUR) ───────────────

import { CLUB_DOMEIN, adresVan } from '@/lib/club/kern/subdomein'
import { isAygHost, zichtbaarPad } from './host'

const EIGEN_HOSTS: ReadonlySet<string> = new Set(['fitfactorypt.nl', 'www.fitfactorypt.nl'])

/** Het adres van de website zelf; met de site aan wijst alles naar buiten hiernaartoe. */
export const AYG_WEBSITE = `https://${CLUB_DOMEIN}`

function hostnaam(host: string | null | undefined): string {
  return (host ?? '').split(':')[0].trim().toLowerCase()
}

function isLokaal(host: string | null | undefined): boolean {
  const naam = hostnaam(host)
  return naam === 'localhost' || naam.endsWith('.localhost')
}

/** aiyourgym.com of een subdomein ervan (of lokaal): een adres van AI Your Gym zelf. */
function isAygDomein(host: string | null | undefined): boolean {
  const naam = hostnaam(host)
  return isLokaal(naam) || naam === CLUB_DOMEIN || naam.endsWith(`.${CLUB_DOMEIN}`)
}

/**
 * De publieke oorsprong van een verzoek. De host is al gecontroleerd (zelfde
 * oorsprong), dus hij is van ons. Lokaal http, verder altijd https.
 */
export function oorsprongVan(host: string | null | undefined): string | null {
  const h = (host ?? '').trim().toLowerCase()
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/.test(h)) return null
  const naam = h.split(':')[0]
  const lokaal = isLokaal(naam)
  // Alleen eigen domeinen: een zelfbedachte Host-kop mag nooit het doel van Stripe of de inloglink worden.
  if (!lokaal && !isAygHost(h) && !EIGEN_HOSTS.has(naam)) return null
  return `${lokaal ? 'http' : 'https'}://${h}`
}

/**
 * success_url en cancel_url voor Stripe Checkout. Met de site aan altijd op
 * aiyourgym.com (ook als de aanmelding van een ander eigen domein kwam), anders
 * op het domein waar de bezoeker is. Lokaal blijft lokaal.
 */
export function checkoutAdressen(oorsprong: string, host: string, siteAan: boolean): { succes: string; terug: string } {
  const naarSite = siteAan && !isAygHost(host) && !isLokaal(host)
  const basis = naarSite ? AYG_WEBSITE : oorsprong
  const h = naarSite ? CLUB_DOMEIN : host
  return {
    // {CHECKOUT_SESSION_ID} vult Stripe zelf in.
    succes: `${basis}${zichtbaarPad(h, '/aiyourgym/welkom', siteAan)}?sessie={CHECKOUT_SESSION_ID}`,
    terug: `${basis}${zichtbaarPad(h, '/aiyourgym/aanmelden', siteAan)}?geannuleerd=1`,
  }
}

export interface PortaalInvoer {
  code: string
  slug: string | null
  subdomeinenAan: boolean
  /** AIYOURGYM_PORTAAL_URL, als die gezet is. */
  portaalUrl: string | null
  /** De oorsprong van de bezoeker van de welkomstpagina. */
  oorsprong: string | null
  host: string | null
  /** AIYOURGYM_SITE_ACTIEF: dan alleen links op aiyourgym.com of een subdomein ervan. */
  siteAan: boolean
}

/**
 * De persoonlijke inloglink naar het portaal. Met subdomeinen aan op het eigen
 * adres (daar werkt de sessie); anders op de app zelf. Op aiyourgym.com zonder
 * subdomeinen bestaat /clubinloggen niet: dan alleen met AIYOURGYM_PORTAAL_URL.
 * Met de site aan wijst de link nooit buiten AI Your Gym (geen ander domein van
 * de app): kan dat niet, dan geen link en sturen we hem apart.
 */
export function portaalLink(p: PortaalInvoer): string | null {
  const pad = `/clubinloggen/${p.code}`
  if (p.subdomeinenAan && p.slug) return `https://${adresVan(p.slug)}${pad}`
  const basis = p.portaalUrl?.replace(/\/+$/, '')
  const geldig = basis && /^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(basis) ? basis : null
  if (geldig && (!p.siteAan || isAygDomein(new URL(geldig).host))) return `${geldig}${pad}`
  if (p.oorsprong && !isAygHost(p.host) && (!p.siteAan || isLokaal(p.host))) return `${p.oorsprong}${pad}`
  return null
}
