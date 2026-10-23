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

/**
 * De betaalpagina van een testbetaling (geen Stripe): op dezelfde plek als
 * waar Stripe na het betalen naartoe zou sturen, dus dezelfde regels als hierboven.
 */
export function testbetaalAdres(oorsprong: string, host: string, siteAan: boolean, sessieId: string): string {
  const naarSite = siteAan && !isAygHost(host) && !isLokaal(host)
  const basis = naarSite ? AYG_WEBSITE : oorsprong
  const h = naarSite ? CLUB_DOMEIN : host
  return `${basis}${zichtbaarPad(h, '/aiyourgym/testbetaling', siteAan)}?sessie=${encodeURIComponent(sessieId)}`
}

/** Waar de testbetaalpagina na het afronden naartoe gaat: de welkomstpagina op hetzelfde domein. */
export function welkomPad(host: string, siteAan: boolean, sessieId: string): string {
  return `${zichtbaarPad(host, '/aiyourgym/welkom', siteAan)}?sessie=${encodeURIComponent(sessieId)}`
}

