// ─── Fit Factory Club, training: een schema kopieren (PUUR) ─────────────────
// Naar een sjabloon of naar een (ander) lid. Gewichten zijn persoonlijk: die
// gaan alleen mee als de trainer daarvoor kiest. Supersets, tijd, RPE/RIR en
// tempo gaan altijd mee; de groepen worden opnieuw genummerd.

import { normaliseerGroepen } from './blokken'
import type { RegelInvoer } from './invoer'
import type { SchemaRegel } from './rijen'

export interface KopieKeuze {
  metGewicht: boolean
}

export function kopieRegels(regels: readonly SchemaRegel[], keuze: KopieKeuze): RegelInvoer[] {
  const gesorteerd = [...regels].sort((a, b) => a.dag - b.dag || a.volgorde - b.volgorde)
  const invoer: RegelInvoer[] = gesorteerd.map((r) => ({
    dag: r.dag,
    oefeningId: r.oefeningId,
    sets: r.sets,
    herhalingen: r.herhalingen,
    gewichtKg: keuze.metGewicht ? r.gewichtKg : null,
    rustSec: r.rustSec,
    notitie: r.notitie,
    groep: r.groep,
    tijdSec: r.tijdSec,
    rpe: r.rpe,
    rir: r.rir,
    tempo: r.tempo,
  }))
  return normaliseerGroepen(invoer)
}

/**
 * Gaan gewichten mee? Naar een sjabloon nooit. Van een sjabloon naar een lid
 * wel (een sjabloon heeft zelden gewichten). Van lid naar ander lid alleen als
 * de trainer het vraagt.
 */
export function gewichtMee(doelLidId: string | null, bronLidId: string | null, gevraagd: boolean): boolean {
  if (doelLidId === null) return false
  if (bronLidId === null || bronLidId === doelLidId) return true
  return gevraagd
}
