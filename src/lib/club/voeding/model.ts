// ─── Club, voeding: het model (PUUR) ────────────────────────────────────────
// Een voedingsplan per lid, door de trainer: dagdoelen (kcal en macro's in
// gram), vrije adviezen en een eenvoudige dagindeling met voorbeeldproducten
// als vrije tekst. Geen productdatabase en geen medische claims: het plan is
// een richtlijn. Sjablonen per sportschool vullen een plan snel in.

import { ACTIVITEITEN, DOELEN, GESLACHTEN, GRENZEN, type RekenInvoer, type VoedingDoel } from './rekenhulp'

export const MAX_ADVIEZEN = 12
export const MAX_ADVIES = 200
export const MAX_MAALTIJDEN = 8
export const MAX_MAALTIJD_NAAM = 40
export const MAX_VOORBEELDEN = 400
export const MAX_NOTITIE = 1000
export const MAX_SJABLOON_NAAM = 60
export const MAX_OMSCHRIJVING = 300

export const GRENS_KCAL = { min: 800, max: 6000 } as const
export const GRENS_EIWIT = { min: 0, max: 500 } as const
export const GRENS_KH = { min: 0, max: 1000 } as const
export const GRENS_VET = { min: 0, max: 400 } as const

/** De zin die bij elk plan staat, in Club en in de ledenapp. */
export const DISCLAIMER =
  'Dit plan is een richtlijn van je trainer, geen medisch of dieetadvies. Heb je een aandoening, gebruik je medicijnen, ben je zwanger of heb je andere medische vragen over voeding? Een diëtist of je huisarts helpt je verder.'

export interface Maaltijd {
  naam: string
  /** "07:30" of null. */
  tijd: string | null
  /** Vrije tekst met voorbeeldproducten. */
  voorbeelden: string
}

export interface Doelen {
  kcal: number
  eiwitG: number
  koolhydratenG: number
  vetG: number
}

export interface VoedingPlan extends Doelen {
  id: string
  lidId: string
  doel: VoedingDoel | null
  adviezen: string[]
  maaltijden: Maaltijd[]
  /** Interne notitie voor trainers; nooit in de ledenapp. */
  notitie: string | null
  /** De invoer van de rekenhulp, zodat je later verder rekent. */
  berekening: RekenInvoer | null
  sjabloonId: string | null
  bijgewerktDoor: string | null
  bijgewerktOp: string
  demo: boolean
}

export interface VoedingSjabloon {
  id: string
  naam: string
  omschrijving: string | null
  doel: VoedingDoel | null
  /** Bij toepassen: eiwit in gram per kilo, als de rekenhulp is ingevuld. */
  eiwitPerKg: number | null
  /** Vaste dagdoelen als de rekenhulp niet is ingevuld; elk mag leeg. */
  kcal: number | null
  eiwitG: number | null
  koolhydratenG: number | null
  vetG: number | null
  adviezen: string[]
  maaltijden: Maaltijd[]
  demo: boolean
}

export const PLAN_KOLOMMEN =
  'id, lid_id, doel, kcal, eiwit_g, koolhydraten_g, vet_g, adviezen, maaltijden, notitie, berekening, sjabloon_id, bijgewerkt_door, bijgewerkt_op, demo'

export const SJABLOON_KOLOMMEN = 'id, naam, omschrijving, doel, eiwit_per_kg, kcal, eiwit_g, koolhydraten_g, vet_g, adviezen, maaltijden, demo'

const TIJD = /^([01]\d|2[0-3]):[0-5]\d$/

export function isDoel(v: unknown): v is VoedingDoel {
  return typeof v === 'string' && (DOELEN as readonly string[]).includes(v)
}

export function isTijd(v: unknown): v is string {
  return typeof v === 'string' && TIJD.test(v)
}

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function getal(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function heel(v: unknown): number | null {
  const n = getal(v)
  return n !== null && Number.isInteger(n) && n >= 0 ? n : null
}

function teksten(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.trim() !== '') : []
}

/** Een maaltijd uit de database of uit JSON, of null. */
export function maaltijdUit(v: unknown): Maaltijd | null {
  const r = obj(v)
  if (!r || typeof r.naam !== 'string' || !r.naam.trim()) return null
  return { naam: r.naam, tijd: isTijd(r.tijd) ? r.tijd : null, voorbeelden: typeof r.voorbeelden === 'string' ? r.voorbeelden : '' }
}

export function maaltijdenUit(v: unknown): Maaltijd[] {
  return Array.isArray(v) ? v.map(maaltijdUit).filter((m): m is Maaltijd => m !== null) : []
}

/** De opgeslagen rekenhulp-invoer, alleen als die helemaal klopt. */
export function berekeningUit(v: unknown): RekenInvoer | null {
  const r = obj(v)
  if (!r) return null
  const g = getal(r.gewichtKg)
  const l = getal(r.lengteCm)
  const a = heel(r.leeftijd)
  const e = getal(r.eiwitPerKg)
  const f = getal(r.vetPercentage)
  const binnen = (n: number | null, b: { min: number; max: number }): n is number => n !== null && n >= b.min && n <= b.max
  if (!binnen(g, GRENZEN.gewicht) || !binnen(l, GRENZEN.lengte) || !binnen(a, GRENZEN.leeftijd)) return null
  if (!binnen(e, GRENZEN.eiwitPerKg) || !binnen(f, GRENZEN.vetPercentage)) return null
  const geslacht = (GESLACHTEN as readonly unknown[]).includes(r.geslacht) ? (r.geslacht as RekenInvoer['geslacht']) : null
  const activiteit = (ACTIVITEITEN as readonly unknown[]).includes(r.activiteit) ? (r.activiteit as RekenInvoer['activiteit']) : null
  if (!geslacht || !activiteit || !isDoel(r.doel)) return null
  return { gewichtKg: g, lengteCm: l, leeftijd: a, geslacht, activiteit, doel: r.doel, eiwitPerKg: e, vetPercentage: f }
}

/** Systeemgrens: een databaserij naar een VoedingPlan, of null. */
export function planUitRij(rij: unknown): VoedingPlan | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || typeof r.lid_id !== 'string') return null
  const kcal = heel(r.kcal)
  const eiwitG = heel(r.eiwit_g)
  const koolhydratenG = heel(r.koolhydraten_g)
  const vetG = heel(r.vet_g)
  if (kcal === null || eiwitG === null || koolhydratenG === null || vetG === null) return null
  return {
    id: r.id,
    lidId: r.lid_id,
    doel: isDoel(r.doel) ? r.doel : null,
    kcal,
    eiwitG,
    koolhydratenG,
    vetG,
    adviezen: teksten(r.adviezen),
    maaltijden: maaltijdenUit(r.maaltijden),
    notitie: typeof r.notitie === 'string' && r.notitie.trim() ? r.notitie : null,
    berekening: berekeningUit(r.berekening),
    sjabloonId: typeof r.sjabloon_id === 'string' ? r.sjabloon_id : null,
    bijgewerktDoor: typeof r.bijgewerkt_door === 'string' ? r.bijgewerkt_door : null,
    bijgewerktOp: typeof r.bijgewerkt_op === 'string' ? r.bijgewerkt_op : '',
    demo: r.demo === true,
  }
}

/** Systeemgrens: een databaserij naar een VoedingSjabloon, of null. */
export function sjabloonUitRij(rij: unknown): VoedingSjabloon | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string' || !r.naam.trim()) return null
  return {
    id: r.id,
    naam: r.naam,
    omschrijving: typeof r.omschrijving === 'string' && r.omschrijving.trim() ? r.omschrijving : null,
    doel: isDoel(r.doel) ? r.doel : null,
    eiwitPerKg: getal(r.eiwit_per_kg),
    kcal: heel(r.kcal),
    eiwitG: heel(r.eiwit_g),
    koolhydratenG: heel(r.koolhydraten_g),
    vetG: heel(r.vet_g),
    adviezen: teksten(r.adviezen),
    maaltijden: maaltijdenUit(r.maaltijden),
    demo: r.demo === true,
  }
}

/** Wat een lid in de ledenapp ziet: zonder interne notitie en rekenhulp. */
export interface PlanVoorLid extends Doelen {
  doel: VoedingDoel | null
  adviezen: string[]
  maaltijden: Maaltijd[]
  bijgewerktOp: string
}

export function planVoorLid(p: VoedingPlan): PlanVoorLid {
  return { kcal: p.kcal, eiwitG: p.eiwitG, koolhydratenG: p.koolhydratenG, vetG: p.vetG, doel: p.doel, adviezen: p.adviezen, maaltijden: p.maaltijden, bijgewerktOp: p.bijgewerktOp }
}

/** Wat de ledenapp bij voeding toont: het plan, nog geen plan, of een leesfout. */
export type VoedingInApp = { staat: 'plan'; plan: PlanVoorLid } | { staat: 'geen' } | { staat: 'fout' }

/** Uit haalPlan(): undefined = er is geen plan, null = leesfout (dan niet doen alsof er geen plan is). */
export function voedingVoorApp(p: VoedingPlan | undefined | null): VoedingInApp {
  if (p === null) return { staat: 'fout' }
  return p === undefined ? { staat: 'geen' } : { staat: 'plan', plan: planVoorLid(p) }
}
