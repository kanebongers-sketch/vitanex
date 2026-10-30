// ─── Ledenapp, eigen voedingsplan: de staat van de stappen (PUUR) ───────────
// Alles als tekst voor de invoervelden; naar getallen pas bij rekenen en opslaan.

import { EIWIT_PER_DOEL, indeling, INDELING_AANTALLEN, type IndelingAantal } from '@/lib/club/voeding/eigen'
import type { Maaltijd, PlanVoorLid } from '@/lib/club/voeding/model'
import { bereken, controleerInvoer, STANDAARD_VET_PERCENTAGE, type Activiteit, type RekenGeslacht, type RekenInvoer, type VoedingDoel } from '@/lib/club/voeding/rekenhulp'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

export interface OverVelden {
  gewicht: string
  lengte: string
  leeftijd: string
  geslacht: RekenGeslacht | ''
  activiteit: Activiteit
}

export interface Concept {
  doel: VoedingDoel | null
  over: OverVelden
  /** Het lid wil de lichaamsgegevens bij het plan bewaren (toestemming). */
  bewaar: boolean
  /** De laatst gebruikte rekeninvoer, of null (zelf ingevuld). */
  berekening: RekenInvoer | null
  verbruik: { rust: number; dag: number } | null
  kcal: string
  eiwit: string
  kh: string
  vet: string
  aantal: IndelingAantal
  maaltijden: Maaltijd[]
  adviezen: string[]
}

export type Indelingen = Record<IndelingAantal, readonly string[]>

/** Het aantal momenten dat het dichtst bij een bestaande dagindeling ligt. */
export function aantalVan(maaltijden: readonly Maaltijd[]): IndelingAantal {
  const n = maaltijden.length
  return INDELING_AANTALLEN.find((a) => a === n) ?? (n > 6 ? 6 : n > 0 && n < 3 ? 3 : 4)
}

export function startConcept(plan: PlanVoorLid | null, namen: Indelingen): Concept {
  const b = plan?.eigenBerekening ?? null
  const maaltijden = plan?.maaltijden.length ? plan.maaltijden.map((m) => ({ ...m })) : indeling(4, namen[4])
  return {
    doel: plan?.doel ?? null,
    over: b
      ? { gewicht: String(b.gewichtKg), lengte: String(b.lengteCm), leeftijd: String(b.leeftijd), geslacht: b.geslacht, activiteit: b.activiteit }
      : { gewicht: '', lengte: '', leeftijd: '', geslacht: '', activiteit: 'matig' },
    bewaar: b !== null,
    berekening: b,
    verbruik: null,
    kcal: String(plan?.kcal ?? 2000),
    eiwit: String(plan?.eiwitG ?? 120),
    kh: String(plan?.koolhydratenG ?? 230),
    vet: String(plan?.vetG ?? 65),
    aantal: aantalVan(maaltijden),
    maaltijden,
    adviezen: plan?.adviezen ? [...plan.adviezen] : [],
  }
}

function getal(v: string): number {
  return v.trim() === '' ? Number.NaN : Number(v.replace(',', '.'))
}

export type RekenUitslag = { ok: true; concept: Concept } | { ok: false; fouten: string[] }

/** De rekenhulp toepassen: dagdoel en macro's uit gewicht, lengte, leeftijd, lichaam, activiteit en doel. */
export function reken(c: Concept, taal: Taal): RekenUitslag {
  const doel = c.doel ?? 'onderhoud'
  const o = c.over
  const invoer: Partial<RekenInvoer> = {
    gewichtKg: getal(o.gewicht),
    lengteCm: getal(o.lengte),
    leeftijd: Math.round(getal(o.leeftijd)),
    geslacht: o.geslacht || undefined,
    activiteit: o.activiteit,
    doel,
    eiwitPerKg: EIWIT_PER_DOEL[doel],
    vetPercentage: STANDAARD_VET_PERCENTAGE,
  }
  const fouten = controleerInvoer(invoer, taal)
  if (fouten.length) return { ok: false, fouten }
  const volledig = invoer as RekenInvoer
  const u = bereken(volledig)
  return {
    ok: true,
    concept: { ...c, berekening: volledig, verbruik: { rust: u.rustverbruik, dag: u.dagverbruik }, kcal: String(u.kcal), eiwit: String(u.eiwitG), kh: String(u.koolhydratenG), vet: String(u.vetG) },
  }
}

/** De macro's als getallen (NaN als iets niet klopt), voor de live verdeling. */
export function macros(c: Concept): { kcal: number; eiwitG: number; koolhydratenG: number; vetG: number } {
  return { kcal: Math.round(getal(c.kcal)), eiwitG: Math.round(getal(c.eiwit)), koolhydratenG: Math.round(getal(c.kh)), vetG: Math.round(getal(c.vet)) }
}

export function macrosGeldig(c: Concept): boolean {
  const m = macros(c)
  return Number.isFinite(m.kcal) && m.kcal >= 800 && m.kcal <= 6000 && [m.eiwitG, m.koolhydratenG, m.vetG].every((n) => Number.isFinite(n) && n >= 0)
}

/** Wat naar /api/club/lid/voeding/plan gaat. Lichaamsgegevens alleen met het vinkje. */
export function verzoekVan(c: Concept): { plan: Record<string, unknown>; bewaarGegevens: boolean } {
  const m = macros(c)
  const bewaar = c.bewaar && c.berekening !== null
  return {
    plan: {
      doel: c.doel,
      kcal: m.kcal,
      eiwitG: m.eiwitG,
      koolhydratenG: m.koolhydratenG,
      vetG: m.vetG,
      adviezen: c.adviezen,
      maaltijden: c.maaltijden,
      berekening: bewaar ? c.berekening : null,
    },
    bewaarGegevens: bewaar,
  }
}
