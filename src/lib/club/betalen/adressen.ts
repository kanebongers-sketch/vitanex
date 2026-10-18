// ─── Club, betalen: adressen voor Stripe (PUUR) ─────────────────────────────
// Stripe stuurt het lid of de eigenaar na afloop terug naar de host van het
// verzoek. Alleen onze eigen domeinen: een zelfbedachte Host-kop mag nooit het
// doel van een terugverwijzing worden.

import { oorsprongVan } from '@/lib/aiyourgym/links'
import { slugUitHost } from '@/lib/club/kern/subdomein'

/** De oorsprong (https://host) als de host van ons is: fitfactorypt.nl, aiyourgym.com of <slug>.aiyourgym.com, of lokaal. */
export function betaalOorsprong(host: string | null | undefined): string | null {
  const eigen = oorsprongVan(host)
  if (eigen) return eigen
  const h = (host ?? '').trim().toLowerCase()
  if (!/^[a-z0-9.-]+$/.test(h) || !slugUitHost(h)) return null
  return `https://${h}`
}

/** Waar het lid na Stripe Checkout terugkomt (in de ledenapp, tab Kopen). */
export function kopenAdressen(oorsprong: string, voorvertoningLid: string | null): { succes: string; terug: string } {
  const basis = new URLSearchParams(voorvertoningLid ? { lid: voorvertoningLid } : {})
  basis.set('tab', 'kopen')
  return { succes: `${oorsprong}/mijn?${basis}&betaald=1`, terug: `${oorsprong}/mijn?${basis}&geannuleerd=1` }
}

/** Waar de eigenaar na de onboarding van Stripe terugkomt. */
export function onboardingAdressen(oorsprong: string): { terug: string; opnieuw: string } {
  return { terug: `${oorsprong}/clubkane/beheer/betalen?onboarding=klaar`, opnieuw: `${oorsprong}/clubkane/beheer/betalen?onboarding=opnieuw` }
}
