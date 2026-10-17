// ─── Club, voeding: startwaarden voor de editor (PUUR) ──────────────────────
// De rekenhulp begint met wat Club al weet: de opgeslagen berekening, anders
// het laatste gewicht en de laatste lengte uit intakes en metingen, plus
// geslacht en leeftijd van het lid. Alles als tekst voor de invoervelden.

import type { MeetPunt } from '@/lib/club/voortgang/tijdlijn'
import type { Lid } from '@/lib/club/kern/lid'
import { leeftijdOp, STANDAARD_EIWIT_PER_KG, STANDAARD_VET_PERCENTAGE, type Activiteit, type RekenGeslacht, type RekenInvoer, type VoedingDoel } from './rekenhulp'
import type { VoedingPlan } from './model'
import type { PlanConcept } from './sjabloon'

export interface RekenVelden {
  gewicht: string
  lengte: string
  leeftijd: string
  geslacht: RekenGeslacht | ''
  activiteit: Activiteit
  doel: VoedingDoel
  eiwitPerKg: string
  vetPercentage: string
}

/** De nieuwste waarde van een meetwaarde, of null. */
export function laatsteMeting(punten: readonly MeetPunt[], sleutel: 'gewicht_kg' | 'lengte_cm'): number | null {
  const met = punten.filter((p) => typeof p.waarden[sleutel] === 'number').sort((a, b) => b.datum.localeCompare(a.datum))
  const w = met[0]?.waarden[sleutel]
  return typeof w === 'number' ? w : null
}

function tekst(n: number | null): string {
  return n === null ? '' : String(n)
}

export function startVelden(plan: VoedingPlan | undefined, lid: Pick<Lid, 'geslacht' | 'geboortedatum'>, punten: readonly MeetPunt[], vandaag: string): RekenVelden {
  const b = plan?.berekening
  if (b) {
    return { gewicht: String(b.gewichtKg), lengte: String(b.lengteCm), leeftijd: String(b.leeftijd), geslacht: b.geslacht, activiteit: b.activiteit, doel: b.doel, eiwitPerKg: String(b.eiwitPerKg), vetPercentage: String(b.vetPercentage) }
  }
  return {
    gewicht: tekst(laatsteMeting(punten, 'gewicht_kg')),
    lengte: tekst(laatsteMeting(punten, 'lengte_cm')),
    leeftijd: tekst(leeftijdOp(lid.geboortedatum, vandaag)),
    geslacht: lid.geslacht ?? '',
    activiteit: 'matig',
    doel: plan?.doel ?? 'onderhoud',
    eiwitPerKg: String(STANDAARD_EIWIT_PER_KG),
    vetPercentage: String(STANDAARD_VET_PERCENTAGE),
  }
}

function getal(v: string): number {
  return v.trim() === '' ? Number.NaN : Number(v.replace(',', '.'))
}

/** De velden als rekeninvoer (getallen kunnen NaN zijn; controleerInvoer vangt dat). */
export function veldenNaarInvoer(v: RekenVelden): Partial<RekenInvoer> {
  return {
    gewichtKg: getal(v.gewicht),
    lengteCm: getal(v.lengte),
    leeftijd: getal(v.leeftijd),
    geslacht: v.geslacht || undefined,
    activiteit: v.activiteit,
    doel: v.doel,
    eiwitPerKg: getal(v.eiwitPerKg),
    vetPercentage: getal(v.vetPercentage),
  }
}

/** Een leeg concept met een redelijk begin, als het lid nog geen plan heeft. */
export function startConcept(plan: VoedingPlan | undefined): PlanConcept {
  if (plan) {
    return { kcal: plan.kcal, eiwitG: plan.eiwitG, koolhydratenG: plan.koolhydratenG, vetG: plan.vetG, doel: plan.doel, adviezen: plan.adviezen, maaltijden: plan.maaltijden, berekening: plan.berekening, sjabloonId: plan.sjabloonId }
  }
  return { kcal: 2000, eiwitG: 120, koolhydratenG: 230, vetG: 65, doel: null, adviezen: [], maaltijden: [], berekening: null, sjabloonId: null }
}
