// ─── LifeOS — 4-weken blok: client-vorm + narrowing ─────────────────────────
// De vorm die /api/lifeos/blok/vandaag teruggeeft, plus de narrowers. Onze eigen
// API is óók een systeemgrens: een `as` zou de UI diep in een render laten crashen
// als het antwoord verandert. `leesBlokVandaag` geeft dan `null` en de kaart toont
// netjes een foutstaat.

export type AdviesSoort = 'verhoog' | 'behoud' | 'let_op' | 'onbekend'

export interface VorigeSet {
  herhalingen: number | null
  gewichtKg: number | null
  rir: number | null
}

export interface GelogdeSet {
  setNummer: number
  herhalingen: number | null
  gewichtKg: number | null
  rir: number | null
}

export interface OefeningVandaag {
  naam: string
  sets: number
  repMin: number
  repMax: number
  stap: number
  rirMin: number
  rirMax: number
  rustSec: number
  tempo: string | null
  notitie: string | null
  perKant: boolean
  vorige: VorigeSet[]
  advies: AdviesSoort
  adviesUitleg: string | null
  voorstelKg: number | null
  gelogd: GelogdeSet[]
}

export interface BlokProfiel {
  naam: string
  doel: string
  advies: string
}

export interface BlokRust {
  toelichting: readonly string[]
}

export interface BlokCardio {
  duurBereik: readonly [number, number]
  rpeDoel: readonly [number, number]
  hartslagZone: readonly [number, number] | null
  stations:
    | readonly { naam: string; meet: string; doelWaarde: number; eenheid: string; belasting?: string; substituut?: string }[]
    | null
  rondes: number | null
  toelichting: readonly string[]
}

export interface BlokSessie {
  trainingId: string
  voltooidOp: string | null
}

export interface BlokVandaag {
  inBlok: boolean
  datum: string
  week?: number
  profiel?: BlokProfiel
  soort?: 'kracht' | 'cardio' | 'rust'
  titel?: string
  focus?: string
  warmup?: readonly string[]
  duurMinuten?: number
  sessie?: BlokSessie | null
  oefeningen?: OefeningVandaag[]
  rust?: BlokRust
  cardio?: BlokCardio
  startDatum?: string
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function getalOfNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function leesVorigeSets(v: unknown): VorigeSet[] {
  if (!Array.isArray(v)) return []
  return v.filter(isObject).map((s) => ({
    herhalingen: getalOfNull(s.herhalingen),
    gewichtKg: getalOfNull(s.gewichtKg),
    rir: getalOfNull(s.rir),
  }))
}

function leesGelogd(v: unknown): GelogdeSet[] {
  if (!Array.isArray(v)) return []
  return v
    .filter(isObject)
    .map((s) => ({
      setNummer: typeof s.setNummer === 'number' ? s.setNummer : 0,
      herhalingen: getalOfNull(s.herhalingen),
      gewichtKg: getalOfNull(s.gewichtKg),
      rir: getalOfNull(s.rir),
    }))
    .filter((s) => s.setNummer >= 1)
}

const ADVIEZEN: readonly AdviesSoort[] = ['verhoog', 'behoud', 'let_op', 'onbekend']

function leesOefening(v: unknown): OefeningVandaag | null {
  if (!isObject(v)) return null
  const naam = tekstOfNull(v.naam)
  if (naam === null) return null
  const advies = typeof v.advies === 'string' && (ADVIEZEN as readonly string[]).includes(v.advies)
    ? (v.advies as AdviesSoort)
    : 'onbekend'
  return {
    naam,
    sets: getalOfNull(v.sets) ?? 3,
    repMin: getalOfNull(v.repMin) ?? 8,
    repMax: getalOfNull(v.repMax) ?? 12,
    stap: getalOfNull(v.stap) ?? 2.5,
    rirMin: getalOfNull(v.rirMin) ?? 1,
    rirMax: getalOfNull(v.rirMax) ?? 2,
    rustSec: getalOfNull(v.rustSec) ?? 90,
    tempo: tekstOfNull(v.tempo),
    notitie: tekstOfNull(v.notitie),
    perKant: v.perKant === true,
    vorige: leesVorigeSets(v.vorige),
    advies,
    adviesUitleg: tekstOfNull(v.adviesUitleg),
    voorstelKg: getalOfNull(v.voorstelKg),
    gelogd: leesGelogd(v.gelogd),
  }
}

/** Het antwoord van GET /api/lifeos/blok/vandaag, of null als het niet klopt. */
export function leesBlokVandaag(ruw: unknown): BlokVandaag | null {
  if (!isObject(ruw)) return null
  if (ruw.inBlok === false) {
    return { inBlok: false, datum: tekstOfNull(ruw.datum) ?? '', startDatum: tekstOfNull(ruw.startDatum) ?? undefined }
  }
  if (ruw.inBlok !== true) return null

  const soort = ruw.soort
  if (soort !== 'kracht' && soort !== 'cardio' && soort !== 'rust') return null

  const basis: BlokVandaag = {
    inBlok: true,
    datum: tekstOfNull(ruw.datum) ?? '',
    week: getalOfNull(ruw.week) ?? undefined,
    profiel: isObject(ruw.profiel)
      ? {
          naam: tekstOfNull(ruw.profiel.naam) ?? '',
          doel: tekstOfNull(ruw.profiel.doel) ?? '',
          advies: tekstOfNull(ruw.profiel.advies) ?? '',
        }
      : undefined,
    soort,
    titel: tekstOfNull(ruw.titel) ?? undefined,
    focus: tekstOfNull(ruw.focus) ?? undefined,
  }

  if (soort === 'rust' && isObject(ruw.rust)) {
    return { ...basis, rust: { toelichting: Array.isArray(ruw.rust.toelichting) ? ruw.rust.toelichting.filter((t): t is string => typeof t === 'string') : [] } }
  }
  if (soort === 'cardio' && isObject(ruw.cardio)) {
    return { ...basis, cardio: leesCardio(ruw.cardio) }
  }
  if (soort === 'kracht') {
    const oefeningen = Array.isArray(ruw.oefeningen)
      ? ruw.oefeningen.map(leesOefening).filter((o): o is OefeningVandaag => o !== null)
      : []
    const sessie = isObject(ruw.sessie) && tekstOfNull(ruw.sessie.trainingId)
      ? { trainingId: ruw.sessie.trainingId as string, voltooidOp: tekstOfNull(ruw.sessie.voltooidOp) }
      : null
    return {
      ...basis,
      warmup: Array.isArray(ruw.warmup) ? ruw.warmup.filter((t): t is string => typeof t === 'string') : [],
      duurMinuten: getalOfNull(ruw.duurMinuten) ?? undefined,
      sessie,
      oefeningen,
    }
  }
  return basis
}

function leesCardio(v: Record<string, unknown>): BlokCardio {
  const paar = (x: unknown): readonly [number, number] => {
    if (Array.isArray(x) && typeof x[0] === 'number' && typeof x[1] === 'number') return [x[0], x[1]]
    return [0, 0]
  }
  return {
    duurBereik: paar(v.duurBereik),
    rpeDoel: paar(v.rpeDoel),
    hartslagZone: Array.isArray(v.hartslagZone) ? paar(v.hartslagZone) : null,
    stations: Array.isArray(v.stations)
      ? v.stations.filter(isObject).map((s) => ({
          naam: tekstOfNull(s.naam) ?? '',
          meet: tekstOfNull(s.meet) ?? 'reps',
          doelWaarde: getalOfNull(s.doelWaarde) ?? 0,
          eenheid: tekstOfNull(s.eenheid) ?? '',
          belasting: tekstOfNull(s.belasting) ?? undefined,
          substituut: tekstOfNull(s.substituut) ?? undefined,
        }))
      : null,
    rondes: getalOfNull(v.rondes),
    toelichting: Array.isArray(v.toelichting) ? v.toelichting.filter((t): t is string => typeof t === 'string') : [],
  }
}
