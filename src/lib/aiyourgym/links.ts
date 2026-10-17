// ─── AI Your Gym: adressen voor Stripe en de inloglink (PUUR) ───────────────

import { adresVan } from '@/lib/club/kern/subdomein'
import { isAygHost, zichtbaarPad } from './host'

/**
 * De publieke oorsprong van een verzoek. De host is al gecontroleerd (zelfde
 * oorsprong), dus hij is van ons. Lokaal http, verder altijd https.
 */
export function oorsprongVan(host: string | null | undefined): string | null {
  const h = (host ?? '').trim().toLowerCase()
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/.test(h)) return null
  const lokaal = h.split(':')[0] === 'localhost' || h.split(':')[0].endsWith('.localhost')
  return `${lokaal ? 'http' : 'https'}://${h}`
}

/** success_url en cancel_url voor Stripe Checkout, op het domein waar de bezoeker is. */
export function checkoutAdressen(oorsprong: string, host: string, siteAan: boolean): { succes: string; terug: string } {
  return {
    // {CHECKOUT_SESSION_ID} vult Stripe zelf in.
    succes: `${oorsprong}${zichtbaarPad(host, '/aiyourgym/welkom', siteAan)}?sessie={CHECKOUT_SESSION_ID}`,
    terug: `${oorsprong}${zichtbaarPad(host, '/aiyourgym/aanmelden', siteAan)}?geannuleerd=1`,
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
}

/**
 * De persoonlijke inloglink naar het portaal. Met subdomeinen aan op het eigen
 * adres (daar werkt de sessie); anders op de app zelf. Op aiyourgym.com zonder
 * subdomeinen bestaat /clubinloggen niet: dan alleen met AIYOURGYM_PORTAAL_URL.
 */
export function portaalLink(p: PortaalInvoer): string | null {
  const pad = `/clubinloggen/${p.code}`
  if (p.subdomeinenAan && p.slug) return `https://${adresVan(p.slug)}${pad}`
  const basis = p.portaalUrl?.replace(/\/+$/, '')
  if (basis && /^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(basis)) return `${basis}${pad}`
  if (p.oorsprong && !isAygHost(p.host)) return `${p.oorsprong}${pad}`
  return null
}
