// ─── Fit Factory Club, ledenapp: het schema van een lid (PUUR) ──────────────
// Het actieve schema per trainingsdag (A, B, C...) en wat het lid al afvinkte.

import { dagSleutel } from '@/lib/club/cijfers/tijd'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
import { alsRij, getal, ingeslotenNaam, tekst } from '@/lib/club/cijfers/rijen'
import type { OefeningBeelden } from '@/lib/club/training/beeld'
import { oudBeeldUitRij, spierenUitRij } from '@/lib/club/training/rijen'
import type { Spier } from '@/lib/club/training/spieren'

export interface AppOefening {
  id: string
  /** club_oefeningen.id (voor de set-logs en het verloop). */
  oefeningId: string
  dag: number
  volgorde: number
  naam: string
  spiergroep: string | null
  /** Waar de oefening vooral op werkt, en wat meewerkt (leeg als nog niet ingevuld). */
  spierenPrimair: Spier[]
  spierenSecundair: Spier[]
  sets: number | null
  herhalingen: string | null
  gewichtKg: number | null
  rustSec: number | null
  notitie: string | null
  /** Superset of circuit (zelfde nummer, direct na elkaar). */
  groep: number | null
  tijdSec: number | null
  rpe: number | null
  rir: number | null
  tempo: string | null
  aandachtspunten: string | null
  uitleg: string | null
  /** Begin- en eindhouding, of null als er (nog) geen tekening is. */
  beeld: OefeningBeelden | null
}

export interface AppSchemaDag {
  dag: number
  letter: string
  oefeningen: AppOefening[]
}

export interface AppLog {
  id: string
  schemaId: string | null
  dag: number | null
  /** ISO-tijdstip */
  op: string
}

/** Dag 1 = A, 2 = B, ... */
export function dagLetter(dag: number): string {
  return String.fromCharCode(64 + Math.min(Math.max(dag, 1), 26))
}

export function oefeningUitRij(v: unknown): AppOefening | null {
  const r = alsRij(v)
  const id = r ? tekst(r.id) : null
  const oefeningId = r ? tekst(r.oefening_id) : null
  const dag = r ? getal(r.dag) : null
  if (!r || !id || !oefeningId || dag === null) return null
  const oef = alsRij(Array.isArray(r.club_oefeningen) ? r.club_oefeningen[0] : r.club_oefeningen)
  const naam = ingeslotenNaam(r.club_oefeningen) ?? 'Oefening'
  return {
    id,
    oefeningId,
    dag,
    volgorde: getal(r.volgorde) ?? 0,
    naam,
    spiergroep: oef ? tekst(oef.spiergroep) : null,
    ...(oef ? spierenUitRij(oef) : { spierenPrimair: [], spierenSecundair: [] }),
    sets: getal(r.sets),
    herhalingen: tekst(r.herhalingen),
    gewichtKg: getal(r.gewicht_kg),
    rustSec: getal(r.rust_sec),
    notitie: tekst(r.notitie),
    groep: getal(r.groep),
    tijdSec: getal(r.tijd_sec),
    rpe: getal(r.rpe),
    rir: getal(r.rir),
    tempo: tekst(r.tempo),
    aandachtspunten: oef ? tekst(oef.aandachtspunten) : null,
    uitleg: oef ? tekst(oef.uitleg) : null,
    // Met een eigen Blender-render geen oude illustratie (en dus ook geen RepDB-vermelding).
    beeld: oef ? oudBeeldUitRij(naam, oef) : null,
  }
}

/** Oefeningen gegroepeerd per trainingsdag, in volgorde. */
export function perDag(oefeningen: readonly AppOefening[]): AppSchemaDag[] {
  const dagen = [...new Set(oefeningen.map((o) => o.dag))].sort((a, b) => a - b)
  return dagen.map((dag) => ({
    dag,
    letter: dagLetter(dag),
    oefeningen: oefeningen.filter((o) => o.dag === dag).sort((a, b) => a.volgorde - b.volgorde),
  }))
}

/** De log van vandaag voor deze schemadag, of null. */
export function gedaanVandaag(logs: readonly AppLog[], schemaId: string, dag: number, nu: Date): AppLog | null {
  const vandaag = dagSleutel(nu)
  return logs.find((l) => l.schemaId === schemaId && l.dag === dag && dagSleutel(new Date(l.op)) === vandaag) ?? null
}

/** Welke dag is logisch de volgende: na de laatst gedane dag, anders dag A. */
export function volgendeDag(dagen: readonly AppSchemaDag[], logs: readonly AppLog[], schemaId: string): number | null {
  if (dagen.length === 0) return null
  const laatste = [...logs].filter((l) => l.schemaId === schemaId && l.dag !== null).sort((a, b) => b.op.localeCompare(a.op))[0]
  if (!laatste || laatste.dag === null) return dagen[0].dag
  const i = dagen.findIndex((d) => d.dag === laatste.dag)
  return dagen[(i + 1) % dagen.length].dag
}

/** "3 x 8 tot 10 · 40 kg · RIR 2 · tempo 3110 · 90 s rust" */
export function voorschrift(o: AppOefening, taal: Taal = 'nl'): string {
  const t = LEDENAPP[taal].voorschrift
  const dec = taal === 'nl' ? ',' : '.'
  const herh = o.herhalingen ? o.herhalingen.replace(/(\d)\s*-\s*(\d)/g, `$1 ${t.tot} $2`) : o.tijdSec ? `${o.tijdSec} ${t.sec}` : null
  const delen = [
    o.sets && herh ? `${o.sets} x ${herh}` : o.sets ? `${o.sets} ${t.sets}` : herh,
    o.gewichtKg !== null && o.gewichtKg > 0 ? `${String(o.gewichtKg).replace('.', dec)} kg` : null,
    o.rpe !== null ? `RPE ${String(o.rpe).replace('.', dec)}` : o.rir !== null ? `RIR ${o.rir}` : null,
    o.tempo ? `${t.tempo} ${o.tempo}` : null,
    o.rustSec ? `${o.rustSec} ${t.rust}` : null,
  ]
  return delen.filter(Boolean).join(' · ')
}

export interface VorigeSet {
  setNr: number
  herhalingen: number | null
  gewichtKg: number | null
  tijdSec: number | null
}

export interface OefeningHistorie {
  /** De laatste keer dat het lid deze oefening logde. */
  vorige: { op: string; sets: VorigeSet[] } | null
  /** Zwaarste gewicht ooit, met de meeste herhalingen daarop (voor records). */
  beste: { gewichtKg: number | null; herhalingen: number | null }
}

export interface SetLogRij extends VorigeSet {
  oefeningId: string
  trainingId: string
  op: string
}

/** Per oefening de vorige keer en het beste resultaat. */
export function historiePerOefening(rijen: readonly SetLogRij[]): Record<string, OefeningHistorie> {
  const uit: Record<string, OefeningHistorie> = {}
  const perOefening = new Map<string, SetLogRij[]>()
  for (const r of rijen) perOefening.set(r.oefeningId, [...(perOefening.get(r.oefeningId) ?? []), r])
  for (const [id, lijst] of perOefening) {
    const laatste = [...lijst].sort((a, b) => b.op.localeCompare(a.op))[0]
    const vorigeSets = lijst.filter((r) => r.trainingId === laatste.trainingId).sort((a, b) => a.setNr - b.setNr)
    const gewichten = lijst.filter((r) => r.gewichtKg !== null && r.gewichtKg > 0)
    const zwaarst = gewichten.length > 0 ? Math.max(...gewichten.map((r) => r.gewichtKg as number)) : null
    uit[id] = {
      vorige: { op: laatste.op, sets: vorigeSets.map(({ setNr, herhalingen, gewichtKg, tijdSec }) => ({ setNr, herhalingen, gewichtKg, tijdSec })) },
      beste: {
        gewichtKg: zwaarst,
        herhalingen: zwaarst === null ? null : Math.max(...gewichten.filter((r) => r.gewichtKg === zwaarst).map((r) => r.herhalingen ?? 0)),
      },
    }
  }
  return uit
}
