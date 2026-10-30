// ─── Club, voeding: het eigen plan van een lid (PUUR) ───────────────────────
// Besluit Kane (30-10-2026): leden stellen zelf hun voeding in, net als een
// trainer. Het plan van de trainer gaat voor: een lid overschrijft dat alleen
// als de sportschool het toestaat (club_voeding_regels, standaard nee), anders
// stuurt het lid een voorstel. Lichaamsgegevens (de berekening) bewaren we
// alleen met uitdrukkelijke toestemming van het lid; een voorstel heeft ze nooit.

import { leesPlan, type Gecontroleerd, type PlanInvoer } from './invoer'
import type { Maaltijd, PlanVoorstel, VoedingPlan } from './model'
import { bereken, STANDAARD_VET_PERCENTAGE, type Activiteit, type RekenGeslacht, type RekenInvoer, type RekenUitkomst, type VoedingDoel } from './rekenhulp'

/** Regels van de sportschool voor eigen plannen van leden. */
export interface VoedingRegels {
  /** Mogen leden het plan van de trainer zelf overschrijven? Standaard nee. */
  ledenOverschrijven: boolean
}

export const STANDAARD_REGELS: VoedingRegels = { ledenOverschrijven: false }

export function regelsUitRij(rij: unknown): VoedingRegels {
  const r = typeof rij === 'object' && rij !== null ? (rij as Record<string, unknown>) : null
  return { ledenOverschrijven: r?.leden_overschrijven === true }
}

/** Wat het lid met zijn plan kan: zelf opslaan, of alleen een voorstel sturen. */
export type LidPlanModus = 'opslaan' | 'voorstel'

export function lidPlanModus(plan: Pick<VoedingPlan, 'bron'> | undefined | null, regels: VoedingRegels): LidPlanModus {
  if (!plan || plan.bron === 'lid') return 'opslaan'
  return regels.ledenOverschrijven ? 'opslaan' : 'voorstel'
}

/** Eiwit in gram per kilo bij een doel (zelfde lijn als de sjablonen van de sportschool). */
export const EIWIT_PER_DOEL: Record<VoedingDoel, number> = { afvallen: 1.8, onderhoud: 1.6, aankomen: 2.0 }

export interface OverJou {
  gewichtKg: number
  lengteCm: number
  leeftijd: number
  geslacht: RekenGeslacht
  activiteit: Activiteit
}

/** De rekenhulp voor een lid: de eiwitnorm volgt het doel, vet 25% van de kcal. */
export function rekenVoorLid(o: OverJou, doel: VoedingDoel): { invoer: RekenInvoer; uitkomst: RekenUitkomst } {
  const invoer: RekenInvoer = { ...o, doel, eiwitPerKg: EIWIT_PER_DOEL[doel], vetPercentage: STANDAARD_VET_PERCENTAGE }
  return { invoer, uitkomst: bereken(invoer) }
}

/** Vaste tijden per aantal maaltijden; de namen komen uit het woordenboek (zelfde volgorde). */
export const INDELING_TIJDEN: Record<3 | 4 | 5 | 6, readonly string[]> = {
  3: ['08:00', '12:30', '18:30'],
  4: ['07:30', '12:30', '15:30', '18:30'],
  5: ['07:30', '10:30', '12:30', '15:30', '18:30'],
  6: ['07:30', '10:30', '12:30', '15:30', '18:30', '21:00'],
}
export const INDELING_AANTALLEN = [3, 4, 5, 6] as const
export type IndelingAantal = (typeof INDELING_AANTALLEN)[number]

/** Een dagindeling met n momenten; bestaande voorbeelden blijven staan waar de naam gelijk is. */
export function indeling(aantal: IndelingAantal, namen: readonly string[], huidig: readonly Maaltijd[] = []): Maaltijd[] {
  return INDELING_TIJDEN[aantal].map((tijd, i) => {
    const naam = namen[i] ?? `${i + 1}`
    const oud = huidig.find((m) => m.naam === naam)
    return { naam, tijd, voorbeelden: oud?.voorbeelden ?? '' }
  })
}

export interface LidPlanInvoer {
  plan: PlanInvoer
  /** Het lid koos om de lichaamsgegevens bij het plan te bewaren. */
  bewaarGegevens: boolean
}

/** Systeemgrens van de leden-API: het eigen plan. Doel verplicht, geen notitie of sjabloon. */
export function leesLidPlan(ruw: unknown): Gecontroleerd<LidPlanInvoer> {
  const b = typeof ruw === 'object' && ruw !== null && !Array.isArray(ruw) ? (ruw as Record<string, unknown>) : null
  if (!b) return { ok: false, fout: 'Ongeldig verzoek.' }
  const p = leesPlan(b.plan)
  if (!p.ok) return p
  if (!p.waarde.doel) return { ok: false, fout: 'Kies een doel: afvallen, onderhoud of aankomen.' }
  const bewaarGegevens = b.bewaarGegevens === true
  return {
    ok: true,
    waarde: { plan: { ...p.waarde, notitie: null, sjabloonId: null, berekening: bewaarGegevens ? p.waarde.berekening : null }, bewaarGegevens: bewaarGegevens && p.waarde.berekening !== null },
  }
}

/** Een voorstel uit de invoer: alleen de inhoud, nooit de lichaamsgegevens. */
export function voorstelVan(p: PlanInvoer): PlanVoorstel {
  return { kcal: p.kcal, eiwitG: p.eiwitG, koolhydratenG: p.koolhydratenG, vetG: p.vetG, doel: p.doel, adviezen: p.adviezen, maaltijden: p.maaltijden }
}

/** Wat een trainer met een eigen plan of een voorstel van het lid doet. */
export type TrainerActie = 'overnemen' | 'voorstelOvernemen' | 'voorstelAfwijzen'

export function isTrainerActie(v: unknown): v is TrainerActie {
  return v === 'overnemen' || v === 'voorstelOvernemen' || v === 'voorstelAfwijzen'
}
