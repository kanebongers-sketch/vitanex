// ─── Club, lidgeld-inbox: toestand van een betaling, alleen vooruit (PUUR) ──
// Bouwplan 1.5: klaar → aangeboden → in_behandeling → geslaagd | mislukt |
// geannuleerd; geslaagd → gestorneerd → storno_teruggedraaid. Een oudere stand
// wordt genegeerd. Terugbetalingen worden per id precies een keer geboekt.
//
// De graaf komt uit contract/overgangen.ts (BETALING_GRAAF). Via de kleine
// interface `BetaalOvergangen` blijft deze logica los te testen.

import { BETALING_GRAAF, BETALING_TOESTANDEN, type BetalingToestand as GraafToestand } from '../contract/overgangen'

export const BETAAL_STATUSSEN = BETALING_TOESTANDEN
export type BetaalStatus = GraafToestand

export function isBetaalStatus(v: unknown): v is BetaalStatus {
  return typeof v === 'string' && (BETAAL_STATUSSEN as readonly string[]).includes(v)
}

/** Welke directe stappen mogen. */
export interface BetaalOvergangen {
  volgende(van: BetaalStatus): readonly BetaalStatus[]
}

export const STANDAARD_OVERGANGEN: BetaalOvergangen = { volgende: (van) => BETALING_GRAAF[van] }

/**
 * Het kortste pad van `van` naar `naar` (zonder `van`), of null als `naar` niet
 * vooruit bereikbaar is. De database krijgt elke stap apart (een stap per
 * aanroep van club_betalen_betaling_overgang), met de boekingen die erbij horen.
 */
export function padNaar(van: BetaalStatus, naar: BetaalStatus, regels: BetaalOvergangen = STANDAARD_OVERGANGEN): BetaalStatus[] | null {
  if (van === naar) return []
  const vorige = new Map<BetaalStatus, BetaalStatus>()
  const rij: BetaalStatus[] = [van]
  const gezien = new Set<BetaalStatus>([van])
  while (rij.length > 0) {
    const nu = rij.shift() as BetaalStatus
    for (const v of regels.volgende(nu)) {
      if (gezien.has(v)) continue
      gezien.add(v)
      vorige.set(v, nu)
      if (v === naar) return terugLezen(vorige, van, naar)
      rij.push(v)
    }
  }
  return null
}

function terugLezen(vorige: Map<BetaalStatus, BetaalStatus>, van: BetaalStatus, naar: BetaalStatus): BetaalStatus[] {
  const pad: BetaalStatus[] = []
  let nu: BetaalStatus = naar
  while (nu !== van) {
    pad.unshift(nu)
    nu = vorige.get(nu) as BetaalStatus
  }
  return pad
}

// ─── Wat Stripe nu zegt ─────────────────────────────────────────────────────

export type GeschilStand = 'geen' | 'open' | 'verloren' | 'gewonnen'

/** De actuele stand bij Stripe, samengevat (uit een opgehaalde PaymentIntent of sessie). */
export interface StripeBetaalStand {
  /** De status die Stripe nu geeft, vertaald naar onze woorden (zonder geschil). */
  basis: Extract<BetaalStatus, 'aangeboden' | 'in_behandeling' | 'geslaagd' | 'mislukt' | 'geannuleerd'>
  /** Geslaagde terugbetalingen bij Stripe, elk met een eigen id. */
  terugbetalingen: readonly Terugbetaling[]
  geschil: GeschilStand
}

export interface Terugbetaling {
  id: string
  cent: number
}

/** De stand waar we heen willen volgens Stripe. */
export function doelStatus(s: StripeBetaalStand): BetaalStatus {
  if (s.basis !== 'geslaagd') return s.basis
  if (s.geschil === 'open' || s.geschil === 'verloren') return 'gestorneerd'
  if (s.geschil === 'gewonnen') return 'storno_teruggedraaid'
  return 'geslaagd'
}

/** Wat wij nu van de betaling weten. */
export interface BetalingToestand {
  status: BetaalStatus
  /** Ids van terugbetalingen die al in het kasboek staan. */
  terugIds: readonly string[]
}

export interface Overgang {
  wijzigt: boolean
  naar: BetaalStatus
  pad: BetaalStatus[]
  /** Terugbetalingen die nog geboekt moeten worden (uniek per id, dus veilig te herhalen). */
  nieuweTerug: Terugbetaling[]
  /** Geboekte terugbetalingen die Stripe niet meer als geslaagd geeft: melden, nooit stil. */
  verdwenenTerug: string[]
}

const BETAALD: ReadonlySet<BetaalStatus> = new Set(['geslaagd', 'gestorneerd', 'storno_teruggedraaid'])

/**
 * De volgende toestand (PUUR, getest): alleen vooruit. Een oudere of
 * onbereikbare stand van Stripe laat de status staan. Terugbetalingen tellen
 * alleen bij een betaalde betaling en worden per id een keer geboekt.
 */
export function volgendeToestand(huidig: BetalingToestand, stripe: StripeBetaalStand, regels: BetaalOvergangen = STANDAARD_OVERGANGEN): Overgang {
  const doel = doelStatus(stripe)
  const pad = padNaar(huidig.status, doel, regels) ?? []
  const naar = pad.length > 0 ? doel : huidig.status
  const bekend = new Set(huidig.terugIds)
  const nieuweTerug = BETAALD.has(naar) ? stripe.terugbetalingen.filter((t) => !bekend.has(t.id)) : []
  const nuGeslaagd = new Set(stripe.terugbetalingen.map((t) => t.id))
  const verdwenenTerug = huidig.terugIds.filter((id) => !nuGeslaagd.has(id))
  return { wijzigt: pad.length > 0 || nieuweTerug.length > 0, naar, pad, nieuweTerug, verdwenenTerug }
}
