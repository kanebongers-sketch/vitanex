// ─── Fit Factory Club, ledenapp: het schema van een lid (PUUR) ──────────────
// Het actieve schema per trainingsdag (A, B, C...) en wat het lid al afvinkte.

import { dagSleutel } from '@/lib/club/cijfers/tijd'
import { alsRij, getal, ingeslotenNaam, tekst } from '@/lib/club/cijfers/rijen'
import { beeldenUitRij, type OefeningBeelden } from '@/lib/club/training/beeld'
import { spierenUitRij } from '@/lib/club/training/rijen'
import type { Spier } from '@/lib/club/training/spieren'

export interface AppOefening {
  id: string
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
  const dag = r ? getal(r.dag) : null
  if (!r || !id || dag === null) return null
  const oef = alsRij(Array.isArray(r.club_oefeningen) ? r.club_oefeningen[0] : r.club_oefeningen)
  return {
    id,
    dag,
    volgorde: getal(r.volgorde) ?? 0,
    naam: ingeslotenNaam(r.club_oefeningen) ?? 'Oefening',
    spiergroep: oef ? tekst(oef.spiergroep) : null,
    ...(oef ? spierenUitRij(oef) : { spierenPrimair: [], spierenSecundair: [] }),
    sets: getal(r.sets),
    herhalingen: tekst(r.herhalingen),
    gewichtKg: getal(r.gewicht_kg),
    rustSec: getal(r.rust_sec),
    notitie: tekst(r.notitie),
    aandachtspunten: oef ? tekst(oef.aandachtspunten) : null,
    uitleg: oef ? tekst(oef.uitleg) : null,
    beeld: oef ? beeldenUitRij(oef) : null,
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

/** "3 x 10 · 40 kg · 90 s rust" */
export function voorschrift(o: AppOefening): string {
  const delen = [
    o.sets && o.herhalingen ? `${o.sets} x ${o.herhalingen}` : o.sets ? `${o.sets} sets` : o.herhalingen,
    o.gewichtKg !== null && o.gewichtKg > 0 ? `${String(o.gewichtKg).replace('.', ',')} kg` : null,
    o.rustSec ? `${o.rustSec} s rust` : null,
  ]
  return delen.filter(Boolean).join(' · ')
}
