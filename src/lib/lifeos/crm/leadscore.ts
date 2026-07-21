// ─── LifeOS — CRM: lead-scoring (koopkans) ──────────────────────────────────
// Welke PT-prospect heeft waarschijnlijk koopintentie? Puur, geen React, geen ML,
// geen verzonnen cijfers: de score komt ALLEEN uit echte signalen die al op de
// kaart staan — de pipeline-fase, een dringende follow-up en de contact-versheid.
// Transparant en getest, zodat de badge iets bewijsbaars zegt en geen orakel is.
//
// Geldt alleen voor `pt_klant` in een pipeline-status. Teams zijn geen sales-leads
// (→ null), een actieve klant is al gewonnen (→ null), en een onbekende status
// geeft ook null: de badge verschijnt enkel waar 'ie betekenis heeft.

import type { Persoon } from './crm'
import { contactVersheid } from './versheid'
import { followUpLabel } from '@/components/lifeos/crm/followUp'

export type Koopkans = 'heet' | 'warm' | 'koud'

export interface Lead {
  /** Opgetelde signaal-score (nooit negatief), puur voor de drempels hieronder. */
  score: number
  niveau: Koopkans
  /** Korte NL-duiding, bv. "afspraak ingepland, recent contact". */
  reden: string
}

interface Fase {
  score: number
  reden: string
}

// Basis-score per fase. NIET de `volgorde` uit crm.ts: daar heeft `inactief` de
// hoogste volgorde (5) terwijl het juist de laagste koopkans is. Verder ín de
// benader-pipeline = warmer; `inactief` zakt bewust onder nul.
const FASEN: Readonly<Record<string, Fase>> = {
  moet_benaderen: { score: 1, reden: 'nog te benaderen' },
  benaderd: { score: 2, reden: 'benaderd' },
  wacht_op_reactie: { score: 3, reden: 'wacht op reactie' },
  afspraak_ingepland: { score: 4, reden: 'afspraak ingepland' },
  inactief: { score: -2, reden: 'inactief' },
}

/** Een follow-up die nú telt (vandaag/te laat) tilt de score. */
const DRINGEND_BONUS = 2
/** Recent gesproken → warmer. */
const RECENT_BONUS = 1
/** Lang niets gehoord → kouder. */
const KOUD_MALUS = -2
/** Tot en met zoveel dagen sinds contact noemen we "recent". */
const VERS_BINNEN_DAGEN = 7

const DREMPEL_HEET = 5
const DREMPEL_WARM = 2

/**
 * De koopkans van een persoon, of `null` als lead-scoring niet van toepassing is
 * (team, al gewonnen, of onbekende status). `vandaag` mag null zijn vóór mount —
 * dan tellen alleen de klok-onafhankelijke signalen mee (de fase).
 */
export function scoorLead(persoon: Persoon, vandaag: Date | null): Lead | null {
  if (persoon.groep !== 'pt_klant') return null
  if (persoon.status === 'actieve_klant') return null

  const fase = FASEN[persoon.status]
  if (!fase) return null

  const redenen = [fase.reden]
  let score = fase.score

  const followUp = persoon.followUpDatum ? followUpLabel(persoon.followUpDatum, vandaag) : null
  if (followUp?.dringend) {
    score += DRINGEND_BONUS
    redenen.push(followUp.tekst === 'te laat' ? 'opvolging te laat' : 'opvolging vandaag')
  }

  const versheid = contactVersheid(persoon.laatsteContactOp, vandaag)
  if (versheid.koud) {
    score += KOUD_MALUS
    redenen.push('lang niets gehoord')
  } else if (versheid.dagen !== null && versheid.dagen <= VERS_BINNEN_DAGEN) {
    score += RECENT_BONUS
    redenen.push('recent contact')
  }

  score = Math.max(0, score)
  return { score, niveau: bepaalNiveau(score), reden: redenen.join(', ') }
}

/** Score → koopkans-niveau via vaste drempels. */
function bepaalNiveau(score: number): Koopkans {
  if (score >= DREMPEL_HEET) return 'heet'
  if (score >= DREMPEL_WARM) return 'warm'
  return 'koud'
}
