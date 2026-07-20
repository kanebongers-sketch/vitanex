// ─── LifeOS — CRM: bord-overzicht ───────────────────────────────────────────
// Eerlijke, uit de data afgeleide cijfers voor de bord-kop. Puur, geen React.
//
// GEEN verzonnen statistiek (zie branding: geen nep-cijfers): elk getal telt
// echte personen uit de meegegeven lijst. Verandert de lijst, dan verandert het
// cijfer — er is geen losse teller die kan gaan afwijken.

import type { Persoon, StatusDef } from '@/lib/lifeos/crm/crm'
import { contactVersheid } from '@/lib/lifeos/crm/versheid'
import { followUpLabel } from './followUp'

export interface BordOverzicht {
  /** Iedereen in deze groep. */
  totaal: number
  /** Follow-up staat op vandaag of is verlopen — dit vraagt nú iets van je. */
  opvolgen: number
  /** In een 'goed'-status (op koers / actief). */
  actief: number
  /** Koud contact: te lang niets van je laten horen (zie `versheid`). */
  koud: number
}

/**
 * Telt de bord-cijfers uit de personen van één groep. `statussen` bepaalt welke
 * status als 'goed' (actief) telt — dat staat in de status-tint, niet hier
 * hardgecodeerd. `vandaag` mag null zijn (SSR/eerste render): dan zijn de
 * tijdsafhankelijke cijfers 0 tot de klok bekend is.
 */
export function bouwOverzicht(
  personen: readonly Persoon[],
  statussen: readonly StatusDef[],
  vandaag: Date | null,
): BordOverzicht {
  const goedeStatussen = new Set(statussen.filter((s) => s.tint === 'goed').map((s) => s.key))

  let opvolgen = 0
  let actief = 0
  let koud = 0

  for (const p of personen) {
    if (p.followUpDatum) {
      const fu = followUpLabel(p.followUpDatum, vandaag)
      if (fu?.dringend) opvolgen++
    }
    if (goedeStatussen.has(p.status)) actief++
    if (contactVersheid(p.laatsteContactOp, vandaag).koud) koud++
  }

  return { totaal: personen.length, opvolgen, actief, koud }
}
