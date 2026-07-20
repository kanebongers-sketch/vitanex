// ─── LifeOS — CRM: contact-ritme ────────────────────────────────────────────
// Puur, geen React. De kern van de teams-weergave: niet "in welke pipeline-fase
// zit iemand" (dat is overbodig als iedereen actief is), maar "wie moet ik deze
// week nog spreken". Verdeelt de mensen in twee emmers op basis van wanneer je ze
// voor het laatst sprak.
//
// "Elke week een keer spreken": wie ≥ RITME_DAGEN dagen niet gesproken is (of
// nooit) staat deze week op de belronde; wie recenter gesproken is, is deze week
// al gehad.

import type { Persoon } from '@/lib/lifeos/crm/crm'
import { contactVersheid } from '@/lib/lifeos/crm/versheid'

/** Het ritme: eens per week. Wie langer dan dit niets hoorde, is aan de beurt. */
export const RITME_DAGEN = 7

export interface RitmeVerdeling {
  /** Nooit gesproken of ≥ RITME_DAGEN geleden — deze week aan de beurt. */
  teSpreken: Persoon[]
  /** Binnen RITME_DAGEN gesproken — deze week al gehad. */
  gesproken: Persoon[]
}

/** ms van het laatste contact; nooit-gesproken telt als "oneindig lang geleden". */
function contactWaarde(p: Persoon): number {
  if (!p.laatsteContactOp) return Number.NEGATIVE_INFINITY
  const t = new Date(p.laatsteContactOp).getTime()
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t
}

/**
 * Verdeelt de mensen in "deze week spreken" en "gesproken", en sorteert beide
 * zinvol: aan de beurt met de langst-genegeerde (en nooit-gesproken) bovenaan,
 * gesproken met de meest recente bovenaan. Puur en stabiel — muteert de invoer
 * niet.
 */
export function verdeelRitme(personen: readonly Persoon[], vandaag: Date | null): RitmeVerdeling {
  const teSpreken: Persoon[] = []
  const gesproken: Persoon[] = []

  for (const p of personen) {
    const versheid = contactVersheid(p.laatsteContactOp, vandaag)
    if (versheid.dagen === null || versheid.dagen >= RITME_DAGEN) teSpreken.push(p)
    else gesproken.push(p)
  }

  // Aan de beurt: langst geleden eerst (nooit = −∞ = bovenaan). Gelijk? Op naam.
  teSpreken.sort((a, b) => contactWaarde(a) - contactWaarde(b) || a.naam.localeCompare(b.naam, 'nl'))
  // Gesproken: meest recent eerst.
  gesproken.sort((a, b) => contactWaarde(b) - contactWaarde(a) || a.naam.localeCompare(b.naam, 'nl'))

  return { teSpreken, gesproken }
}
