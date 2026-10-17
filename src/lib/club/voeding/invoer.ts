// ─── Club, voeding: invoer controleren (PUUR) ───────────────────────────────
// Systeemgrens voor de API: alles wat binnenkomt is unknown tot het hier klopt.

import type { RekenInvoer, VoedingDoel } from './rekenhulp'
import { GRENZEN } from './rekenhulp'
import {
  berekeningUit,
  GRENS_EIWIT,
  GRENS_KCAL,
  GRENS_KH,
  GRENS_VET,
  isDoel,
  isTijd,
  MAX_ADVIES,
  MAX_ADVIEZEN,
  MAX_MAALTIJD_NAAM,
  MAX_MAALTIJDEN,
  MAX_NOTITIE,
  MAX_OMSCHRIJVING,
  MAX_SJABLOON_NAAM,
  MAX_VOORBEELDEN,
  type Maaltijd,
} from './model'

export type Gecontroleerd<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const mis = <T>(fout: string): Gecontroleerd<T> => ({ ok: false, fout })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface PlanInvoer {
  doel: VoedingDoel | null
  kcal: number
  eiwitG: number
  koolhydratenG: number
  vetG: number
  adviezen: string[]
  maaltijden: Maaltijd[]
  notitie: string | null
  berekening: RekenInvoer | null
  sjabloonId: string | null
}

export interface SjabloonInvoer {
  naam: string
  omschrijving: string | null
  doel: VoedingDoel | null
  eiwitPerKg: number | null
  kcal: number | null
  eiwitG: number | null
  koolhydratenG: number | null
  vetG: number | null
  adviezen: string[]
  maaltijden: Maaltijd[]
}

function alsObject(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function schoon(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/[ \t]+/g, ' ') : ''
}

function leesHeel(v: unknown, grens: { min: number; max: number }, wat: string, verplicht: boolean): Gecontroleerd<number | null> {
  if (!verplicht && (v === null || v === undefined || v === '')) return { ok: true, waarde: null }
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) return mis(`Vul ${wat} in als getal.`)
  const rond = Math.round(n)
  if (rond < grens.min || rond > grens.max) return mis(`${wat[0].toUpperCase()}${wat.slice(1)} moet tussen ${grens.min} en ${grens.max} liggen.`)
  return { ok: true, waarde: rond }
}

/** Adviezen: losse regels, lege weg, dubbele eruit. */
export function leesAdviezen(v: unknown): Gecontroleerd<string[]> {
  if (v === null || v === undefined) return { ok: true, waarde: [] }
  if (!Array.isArray(v)) return mis('De adviezen zijn niet goed doorgekomen.')
  const lijst = [...new Set(v.map(schoon).filter(Boolean))]
  if (lijst.length > MAX_ADVIEZEN) return mis(`Hoogstens ${MAX_ADVIEZEN} adviezen.`)
  if (lijst.some((a) => a.length > MAX_ADVIES)) return mis(`Een advies mag hoogstens ${MAX_ADVIES} tekens zijn.`)
  return { ok: true, waarde: lijst }
}

/** De dagindeling: maaltijden met een naam; zonder naam en zonder voorbeelden vallen weg. */
export function leesMaaltijden(v: unknown): Gecontroleerd<Maaltijd[]> {
  if (v === null || v === undefined) return { ok: true, waarde: [] }
  if (!Array.isArray(v)) return mis('De dagindeling is niet goed doorgekomen.')
  const uit: Maaltijd[] = []
  for (const ruw of v) {
    const m = alsObject(ruw)
    if (!m) return mis('De dagindeling is niet goed doorgekomen.')
    const naam = schoon(m.naam)
    const voorbeelden = typeof m.voorbeelden === 'string' ? m.voorbeelden.trim() : ''
    const tijd = schoon(m.tijd)
    if (!naam && !voorbeelden) continue
    if (!naam) return mis('Geef elke maaltijd een naam, bijvoorbeeld Ontbijt.')
    if (naam.length > MAX_MAALTIJD_NAAM) return mis(`De naam van een maaltijd mag hoogstens ${MAX_MAALTIJD_NAAM} tekens zijn.`)
    if (voorbeelden.length > MAX_VOORBEELDEN) return mis(`De voorbeelden bij ${naam} mogen hoogstens ${MAX_VOORBEELDEN} tekens zijn.`)
    if (tijd && !isTijd(tijd)) return mis(`Vul bij ${naam} een tijd in als 07:30, of laat hem leeg.`)
    uit.push({ naam, tijd: tijd || null, voorbeelden })
  }
  if (uit.length > MAX_MAALTIJDEN) return mis(`Hoogstens ${MAX_MAALTIJDEN} maaltijden.`)
  return { ok: true, waarde: uit }
}

function leesDoelVeld(v: unknown): Gecontroleerd<VoedingDoel | null> {
  if (v === null || v === undefined || v === '') return { ok: true, waarde: null }
  return isDoel(v) ? { ok: true, waarde: v } : mis('Kies een doel: afvallen, onderhoud of aankomen.')
}

/** Het plan van een lid uit de editor. */
export function leesPlan(ruw: unknown): Gecontroleerd<PlanInvoer> {
  const b = alsObject(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  const kcal = leesHeel(b.kcal, GRENS_KCAL, 'het aantal kcal', true)
  if (!kcal.ok) return kcal
  const eiwit = leesHeel(b.eiwitG, GRENS_EIWIT, 'eiwit (gram)', true)
  if (!eiwit.ok) return eiwit
  const kh = leesHeel(b.koolhydratenG, GRENS_KH, 'koolhydraten (gram)', true)
  if (!kh.ok) return kh
  const vet = leesHeel(b.vetG, GRENS_VET, 'vet (gram)', true)
  if (!vet.ok) return vet
  const doel = leesDoelVeld(b.doel)
  if (!doel.ok) return doel
  const adviezen = leesAdviezen(b.adviezen)
  if (!adviezen.ok) return adviezen
  const maaltijden = leesMaaltijden(b.maaltijden)
  if (!maaltijden.ok) return maaltijden
  const notitie = typeof b.notitie === 'string' ? b.notitie.trim() : ''
  if (notitie.length > MAX_NOTITIE) return mis(`De notitie mag hoogstens ${MAX_NOTITIE} tekens zijn.`)
  // De rekenhulp is optioneel: onvolledig of onzinnig = niet bewaren.
  const berekening = b.berekening === null || b.berekening === undefined ? null : berekeningUit(b.berekening)
  const sjabloonId = typeof b.sjabloonId === 'string' && UUID.test(b.sjabloonId) ? b.sjabloonId : null
  return {
    ok: true,
    waarde: {
      doel: doel.waarde,
      kcal: kcal.waarde as number,
      eiwitG: eiwit.waarde as number,
      koolhydratenG: kh.waarde as number,
      vetG: vet.waarde as number,
      adviezen: adviezen.waarde,
      maaltijden: maaltijden.waarde,
      notitie: notitie || null,
      berekening,
      sjabloonId,
    },
  }
}

function leesEiwitPerKg(v: unknown): Gecontroleerd<number | null> {
  if (v === null || v === undefined || v === '') return { ok: true, waarde: null }
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  const g = GRENZEN.eiwitPerKg
  if (typeof n !== 'number' || !Number.isFinite(n) || n < g.min || n > g.max) return mis(`Eiwit per kilo moet tussen ${g.min} en ${g.max} liggen.`)
  return { ok: true, waarde: Math.round(n * 10) / 10 }
}

/** Een sjabloon uit het formulier. Dagdoelen mogen leeg: dan rekent de trainer per lid. */
export function leesSjabloon(ruw: unknown): Gecontroleerd<SjabloonInvoer> {
  const b = alsObject(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  const naam = schoon(b.naam)
  if (!naam) return mis('Geef het sjabloon een naam.')
  if (naam.length > MAX_SJABLOON_NAAM) return mis(`De naam mag hoogstens ${MAX_SJABLOON_NAAM} tekens zijn.`)
  const omschrijving = typeof b.omschrijving === 'string' ? b.omschrijving.trim() : ''
  if (omschrijving.length > MAX_OMSCHRIJVING) return mis(`De omschrijving mag hoogstens ${MAX_OMSCHRIJVING} tekens zijn.`)
  const doel = leesDoelVeld(b.doel)
  if (!doel.ok) return doel
  const eiwitPerKg = leesEiwitPerKg(b.eiwitPerKg)
  if (!eiwitPerKg.ok) return eiwitPerKg
  const kcal = leesHeel(b.kcal, GRENS_KCAL, 'het aantal kcal', false)
  if (!kcal.ok) return kcal
  const eiwit = leesHeel(b.eiwitG, GRENS_EIWIT, 'eiwit (gram)', false)
  if (!eiwit.ok) return eiwit
  const kh = leesHeel(b.koolhydratenG, GRENS_KH, 'koolhydraten (gram)', false)
  if (!kh.ok) return kh
  const vet = leesHeel(b.vetG, GRENS_VET, 'vet (gram)', false)
  if (!vet.ok) return vet
  const adviezen = leesAdviezen(b.adviezen)
  if (!adviezen.ok) return adviezen
  const maaltijden = leesMaaltijden(b.maaltijden)
  if (!maaltijden.ok) return maaltijden
  return {
    ok: true,
    waarde: {
      naam,
      omschrijving: omschrijving || null,
      doel: doel.waarde,
      eiwitPerKg: eiwitPerKg.waarde,
      kcal: kcal.waarde,
      eiwitG: eiwit.waarde,
      koolhydratenG: kh.waarde,
      vetG: vet.waarde,
      adviezen: adviezen.waarde,
      maaltijden: maaltijden.waarde,
    },
  }
}
