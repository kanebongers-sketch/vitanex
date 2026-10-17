// ─── AI Your Gym: de stappen van het aanmeldformulier (PUUR) ────────────────

import type { AanmeldVeld } from '@/lib/aiyourgym/aanmelding'

export const STAPPEN = [
  { sleutel: 'pakket', titel: 'Pakket', velden: ['pakket'] },
  { sleutel: 'sportschool', titel: 'Sportschool', velden: ['sportschoolNaam', 'aantalVestigingen', 'slug'] },
  { sleutel: 'eigenaar', titel: 'Eigenaar', velden: ['eigenaarNaam', 'eigenaarEmail', 'eigenaarTelefoon'] },
  { sleutel: 'akkoord', titel: 'Bevestigen', velden: ['akkoord'] },
] as const satisfies readonly { sleutel: string; titel: string; velden: readonly AanmeldVeld[] }[]

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
export function isStripeCheckout(url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'checkout.stripe.com'
  } catch {
    return false
  }
}
