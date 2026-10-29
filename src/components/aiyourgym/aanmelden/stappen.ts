// ─── AI Your Gym: de stappen van het aanmeldformulier (PUUR) ────────────────

import type { AanmeldVeld } from '@/lib/aiyourgym/aanmelding'

// Welke velden bij welke stap horen. De titel en de regel `hierna` (wat er na
// deze stap komt) staan per taal in het woordenboek van de aanmeldpagina.
export const STAPPEN = [
  { sleutel: 'pakket', velden: ['pakketten'] },
  { sleutel: 'sportschool', velden: ['sportschoolNaam', 'aantalVestigingen', 'slug'] },
  { sleutel: 'eigenaar', velden: ['eigenaarNaam', 'eigenaarEmail', 'eigenaarTelefoon', 'wachtwoord', 'wachtwoordHerhaal'] },
  { sleutel: 'akkoord', velden: ['akkoord'] },
] as const satisfies readonly { sleutel: string; velden: readonly AanmeldVeld[] }[]

export type Fouten = Partial<Record<AanmeldVeld, string>>

/** Alleen de fouten van de velden in deze stap. */
export function foutenVanStap(stap: number, fouten: Fouten): Fouten {
  const velden: readonly AanmeldVeld[] = STAPPEN[stap]?.velden ?? []
  return Object.fromEntries(Object.entries(fouten).filter(([veld]) => velden.includes(veld as AanmeldVeld))) as Fouten
}

/** De eerste stap met een fout, of null. Zo springt het formulier na een serverfout naar de juiste plek. */
export function eersteStapMetFout(fouten: Fouten): number | null {
  const i = STAPPEN.findIndex((s) => (s.velden as readonly AanmeldVeld[]).some((v) => fouten[v]))
  return i === -1 ? null : i
}

/** Alleen een echte Stripe Checkout-pagina; nooit een adres dat ergens anders heen stuurt. */
/** De eigen testbetaalpagina (zolang Stripe er niet is): alleen op dezelfde site als de bezoeker. */
export function isTestbetaalAdres(url: unknown, oorsprong: string = typeof window === 'undefined' ? '' : window.location.origin): url is string {
  if (typeof url !== 'string') return false
  try {
    const u = new URL(url, oorsprong || undefined)
    return (u.origin === oorsprong || u.origin === 'https://aiyourgym.com') && /\/testbetaling$/.test(u.pathname)
  } catch {
    return false
  }
}

export function isStripeCheckout(url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'checkout.stripe.com'
  } catch {
    return false
  }
}
