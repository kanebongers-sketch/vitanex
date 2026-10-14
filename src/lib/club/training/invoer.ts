// ─── Fit Factory Club, training: invoer van schema's en oefeningen (PUUR) ───
// Strenge validatie op de grens. Alles wat de database weigert, weigeren wij
// eerder en in begrijpelijk Nederlands.

import type { Uitslag } from './intake'
import { isRij, tekstOfNull } from './rijen'
import { leesSpierKeuze, type Spier } from './spieren'
import {
  MAX_DAGEN, isDoel, isMateriaal, isNiveau, isPatroon, isSchemaStatus, isSpiergroep, isUuid, isZone, ZONES,
  type Doel, type Materiaal, type Niveau, type Patroon, type SchemaStatus, type Spiergroep, type Zone,
} from './typen'

export const MAX_REGELS = 120

export interface RegelInvoer {
  dag: number
  oefeningId: string
  sets: number | null
  herhalingen: string | null
  gewichtKg: number | null
  rustSec: number | null
  notitie: string | null
}

export interface SchemaInvoer {
  naam: string
  doel: Doel | null
  niveau: Niveau
  weken: number | null
  status: SchemaStatus
  medewerkerId: string | null
  notitie: string | null
  dagTitels: string[]
  regels: RegelInvoer[]
}

function kort(v: unknown, max: number): string | null {
  const t = tekstOfNull(v)
  return t ? t.trim().slice(0, max) : null
}

function leeg(v: unknown): boolean {
  return v === undefined || v === null || v === ''
}

/** Een optioneel getal binnen grenzen; `null` als leeg, `undefined` als ongeldig. */
function optGetal(v: unknown, min: number, max: number, geheel = true): number | null | undefined {
  if (leeg(v)) return null
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) return undefined
  if (geheel && !Number.isInteger(n)) return undefined
  return geheel ? n : Math.round(n * 100) / 100
}

/** Herhalingen als korte tekst: "10", "8-10", "8 tot 10", "30 sec", "AMRAP". */
export function leesHerhalingen(v: unknown): string | null | undefined {
  if (leeg(v)) return null
  if (typeof v !== 'string' && typeof v !== 'number') return undefined
  const t = String(v).trim().replace(/\s+tot\s+/gi, '-').replace(/\s*[-–—]\s*/g, '-')
  if (t.length === 0 || t.length > 20 || !/^[0-9a-zA-Z .,/+-]+$/.test(t)) return undefined
  return t
}

function leesRegel(r: unknown, i: number): Uitslag<RegelInvoer> {
  const fout = (tekst: string): Uitslag<RegelInvoer> => ({ ok: false, fout: `Oefening ${i + 1}: ${tekst}` })
  if (!isRij(r)) return fout('ongeldig.')
  const dag = optGetal(r.dag, 1, MAX_DAGEN)
  if (!dag) return fout('ongeldige dag.')
  if (!isUuid(r.oefeningId)) return fout('onbekende oefening.')
  const sets = optGetal(r.sets, 1, 20)
  if (sets === undefined) return fout('sets moet tussen 1 en 20 liggen.')
  const herhalingen = leesHerhalingen(r.herhalingen)
  if (herhalingen === undefined) return fout('herhalingen zijn ongeldig (bijvoorbeeld 10 of 8-10).')
  const gewichtKg = optGetal(r.gewichtKg, 0, 1000, false)
  if (gewichtKg === undefined) return fout('gewicht moet tussen 0 en 1000 kg liggen.')
  const rustSec = optGetal(r.rustSec, 0, 600)
  if (rustSec === undefined) return fout('rust moet tussen 0 en 600 seconden liggen.')
  return { ok: true, waarde: { dag, oefeningId: r.oefeningId, sets, herhalingen, gewichtKg, rustSec, notitie: kort(r.notitie, 300) } }
}

function leesRegels(ruw: unknown): Uitslag<RegelInvoer[]> {
  if (!Array.isArray(ruw)) return { ok: false, fout: 'De oefeningen ontbreken.' }
  if (ruw.length > MAX_REGELS) return { ok: false, fout: `Maximaal ${MAX_REGELS} oefeningen per schema.` }
  const regels: RegelInvoer[] = []
  for (let i = 0; i < ruw.length; i++) {
    const r = leesRegel(ruw[i], i)
    if (!r.ok) return r
    regels.push(r.waarde)
  }
  return { ok: true, waarde: regels }
}

export function leesSchema(body: unknown): Uitslag<SchemaInvoer> {
  if (!isRij(body)) return { ok: false, fout: 'Ongeldig verzoek.' }
  const naam = kort(body.naam, 80)
  if (!naam) return { ok: false, fout: 'Geef het schema een naam.' }
  if (!leeg(body.doel) && !isDoel(body.doel)) return { ok: false, fout: 'Onbekend doel.' }
  const niveau = typeof body.niveau === 'string' ? Number(body.niveau) : body.niveau
  if (!isNiveau(niveau)) return { ok: false, fout: 'Kies een niveau.' }
  const weken = optGetal(body.weken, 1, 52)
  if (weken === undefined) return { ok: false, fout: 'Weken moet tussen 1 en 52 liggen.' }
  if (!isSchemaStatus(body.status)) return { ok: false, fout: 'Onbekende status.' }
  if (!leeg(body.medewerkerId) && !isUuid(body.medewerkerId)) return { ok: false, fout: 'Onbekende trainer.' }
  const titels = Array.isArray(body.dagTitels) ? body.dagTitels.slice(0, MAX_DAGEN).map((t) => kort(t, 40) ?? '') : []
  const regels = leesRegels(body.regels)
  if (!regels.ok) return regels
  return {
    ok: true,
    waarde: {
      naam,
      doel: isDoel(body.doel) ? body.doel : null,
      niveau,
      weken,
      status: body.status,
      medewerkerId: isUuid(body.medewerkerId) ? body.medewerkerId : null,
      notitie: kort(body.notitie, 1000),
      dagTitels: titels,
      regels: regels.waarde,
    },
  }
}

/** Volgorde per dag: de index binnen de dag, in de volgorde waarin ze binnenkomen. */
export function metVolgorde(regels: readonly RegelInvoer[]): (RegelInvoer & { volgorde: number })[] {
  const teller = new Map<number, number>()
  return regels.map((r) => {
    const volgorde = teller.get(r.dag) ?? 0
    teller.set(r.dag, volgorde + 1)
    return { ...r, volgorde }
  })
}

export interface OefeningInvoer {
  naam: string
  spiergroep: Spiergroep
  spierenPrimair: Spier[]
  spierenSecundair: Spier[]
  materiaal: Materiaal
  niveau: Niveau
  patroon: Patroon | null
  belast: Zone[]
  uitleg: string | null
  aandachtspunten: string | null
  actief: boolean
}

export function leesOefening(body: unknown): Uitslag<OefeningInvoer> {
  if (!isRij(body)) return { ok: false, fout: 'Ongeldig verzoek.' }
  const naam = kort(body.naam, 80)
  if (!naam) return { ok: false, fout: 'Geef de oefening een naam.' }
  if (!isSpiergroep(body.spiergroep)) return { ok: false, fout: 'Kies een spiergroep.' }
  if (!isMateriaal(body.materiaal)) return { ok: false, fout: 'Kies het materiaal.' }
  const niveau = typeof body.niveau === 'string' ? Number(body.niveau) : body.niveau
  if (!isNiveau(niveau)) return { ok: false, fout: 'Kies een niveau.' }
  if (!leeg(body.patroon) && !isPatroon(body.patroon)) return { ok: false, fout: 'Onbekend bewegingspatroon.' }
  const belast = Array.isArray(body.belast) ? body.belast.filter(isZone) : []
  const spieren = leesSpierKeuze(body.spierenPrimair, body.spierenSecundair)
  if (!spieren.ok) return spieren
  return {
    ok: true,
    waarde: {
      naam,
      spiergroep: body.spiergroep,
      spierenPrimair: spieren.primair,
      spierenSecundair: spieren.secundair,
      materiaal: body.materiaal,
      niveau,
      patroon: isPatroon(body.patroon) ? body.patroon : null,
      belast: ZONES.filter((z) => belast.includes(z)),
      uitleg: kort(body.uitleg, 1200),
      aandachtspunten: kort(body.aandachtspunten, 600),
      actief: body.actief !== false,
    },
  }
}

/** Naar de kolommen van club_oefeningen (spieren als snake_case). */
export function oefeningNaarRij(o: OefeningInvoer) {
  const { spierenPrimair, spierenSecundair, ...rest } = o
  return { ...rest, spieren_primair: spierenPrimair, spieren_secundair: spierenSecundair }
}
