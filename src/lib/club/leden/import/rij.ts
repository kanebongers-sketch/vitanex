// ─── Fit Factory Club: een rij uit het ledenbestand controleren (PUUR) ──────
// Systeemgrens. Dezelfde controle draait in de browser (voorbeeld) en op de
// server (voor het opslaan). Een rij zonder naam is een fout; een rare datum of
// een ongeldig e-mailadres is een waarschuwing: dat veld laten we dan leeg.

import type { LidStatus } from '@/lib/club/kern/lid'
import { IMPORT_VELDEN, type RuweRij } from './kolommen'

export interface LidImport {
  voornaam: string
  achternaam: string
  email: string | null
  telefoon: string | null
  geboortedatum: string | null
  geslacht: 'man' | 'vrouw' | 'anders' | null
  abonnement: string | null
  status: LidStatus
  /** Kwam de status uit het bestand (status of einddatum)? Zo niet, dan laten we een bestaand lid zijn status houden. */
  statusGegeven: boolean
  lidSinds: string | null
  einddatum: string | null
  lidnummer: string | null
  sportivityId: string | null
}

export type RijUitslag =
  | { ok: true; lid: LidImport; waarschuwingen: string[] }
  | { ok: false; fout: string }

const MAX = { voornaam: 60, achternaam: 80, email: 160, telefoon: 40, abonnement: 80, lidnummer: 40, sportivityId: 80 } as const

/** Een datum in een van de gangbare vormen naar JJJJ-MM-DD, of null als het geen echte datum is. */
export function leesDatum(ruw: string): string | null {
  const tekst = ruw.trim().split(/[ T]/)[0] ?? ''
  let j: number, m: number, d: number
  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(tekst)
  const nl = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(tekst)
  if (iso) [j, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  else if (nl) [d, m, j] = [Number(nl[1]), Number(nl[2]), Number(nl[3])]
  else return null
  if (j < 1900 || j > 2100) return null
  const datum = new Date(Date.UTC(j, m - 1, d))
  if (datum.getUTCFullYear() !== j || datum.getUTCMonth() !== m - 1 || datum.getUTCDate() !== d) return null
  return datum.toISOString().slice(0, 10)
}

const GESLACHT: Record<string, LidImport['geslacht']> = {
  m: 'man', man: 'man', male: 'man', dhr: 'man', heer: 'man', mannelijk: 'man',
  v: 'vrouw', vrouw: 'vrouw', f: 'vrouw', female: 'vrouw', mevr: 'vrouw', mw: 'vrouw', mevrouw: 'vrouw', vrouwelijk: 'vrouw',
  x: 'anders', anders: 'anders', other: 'anders', o: 'anders', divers: 'anders',
}

export function leesGeslacht(ruw: string): LidImport['geslacht'] | undefined {
  return GESLACHT[ruw.trim().toLowerCase().replace(/[^a-z]/g, '')]
}

const STATUS: Record<string, LidStatus> = {
  actief: 'actief', active: 'actief', lopend: 'actief', ja: 'actief',
  gepauzeerd: 'gepauzeerd', pauze: 'gepauzeerd', gepauseerd: 'gepauzeerd', bevroren: 'gepauzeerd', paused: 'gepauzeerd', frozen: 'gepauzeerd', geblokkeerd: 'gepauzeerd',
  opgezegd: 'opgezegd', cancelled: 'opgezegd', canceled: 'opgezegd', inopzegging: 'opgezegd',
  gestopt: 'gestopt', beeindigd: 'gestopt', inactief: 'gestopt', inactive: 'gestopt', ended: 'gestopt', expired: 'gestopt', verlopen: 'gestopt', nee: 'gestopt',
  proef: 'proef', proeflid: 'proef', trial: 'proef', proefles: 'proef', gratis: 'proef',
}

export function leesStatus(ruw: string): LidStatus | undefined {
  const sleutel = ruw.trim().toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')
  return STATUS[sleutel]
}

/** Zonder (bruikbare) status: een einddatum in het verleden = gestopt, in de toekomst = opgezegd, anders actief. */
export function statusUitEinddatum(einddatum: string | null, vandaag: string): LidStatus {
  if (!einddatum) return 'actief'
  return einddatum < vandaag ? 'gestopt' : 'opgezegd'
}

/**
 * Een hele naam in voornaam en achternaam: "Jan de Vries" wordt Jan en
 * "de Vries"; "Vries, Jan de" (achternaam eerst) ook. Een naam van een woord
 * kan niet: dan weten we niet wat de achternaam is.
 */
export function splitsNaam(ruw: string | undefined): { voornaam: string; achternaam: string } | null {
  const naam = (ruw ?? '').trim().replace(/\s+/g, ' ')
  if (!naam) return null
  const komma = naam.indexOf(',')
  if (komma !== -1) {
    const achter = naam.slice(0, komma).trim()
    const [voornaam, ...tussen] = naam.slice(komma + 1).trim().split(' ').filter(Boolean)
    return achter && voornaam ? { voornaam, achternaam: [...tussen, achter].join(' ') } : null
  }
  const [voornaam, ...rest] = naam.split(' ')
  return rest.length > 0 ? { voornaam, achternaam: rest.join(' ') } : null
}

/**
 * Een ontbrekende achternaam (en voornaam) uit de kolom met de hele naam. Is er
 * al een voornaam, dan is de rest van de naam de achternaam ("Jan" en "Jan de
 * Vries" wordt "de Vries"); begint de naam er niet mee, dan is die kolom zelf de
 * achternaam (sommige systemen noemen de achternaam "Naam").
 */
function naamAanvullen(voornaam: string | null, volledig: string | undefined): { voornaam: string; achternaam: string } | null {
  const naam = (volledig ?? '').trim().replace(/\s+/g, ' ')
  if (!naam) return null
  if (!voornaam) return splitsNaam(naam)
  const rest = naam.toLowerCase().startsWith(`${voornaam.toLowerCase()} `) ? naam.slice(voornaam.length + 1).trim() : naam
  return rest ? { voornaam, achternaam: rest } : null
}

function kort(waarde: string | undefined, max: number): string | null {
  const w = (waarde ?? '').trim().replace(/\s+/g, ' ')
  return w ? w.slice(0, max) : null
}

function leesEmail(ruw: string | undefined, waarschuwingen: string[]): string | null {
  const email = (ruw ?? '').trim().toLowerCase()
  if (!email) return null
  if (email.length > MAX.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    waarschuwingen.push('E-mailadres klopt niet en is leeg gelaten.')
    return null
  }
  return email
}

function leesTelefoon(ruw: string | undefined): string | null {
  const tel = (ruw ?? '').replace(/[^0-9+() -]/g, '').trim()
  return tel ? tel.slice(0, MAX.telefoon) : null
}

function datumVeld(ruw: string | undefined, label: string, waarschuwingen: string[]): string | null {
  if (!ruw?.trim()) return null
  const datum = leesDatum(ruw)
  if (!datum) waarschuwingen.push(`${label} "${ruw.slice(0, 20)}" is geen geldige datum en is leeg gelaten.`)
  return datum
}

/** Uit onbekende invoer (van de pagina) een RuweRij met alleen bekende velden en tekst. */
export function ruweRijUit(invoer: unknown): RuweRij | null {
  if (typeof invoer !== 'object' || invoer === null || Array.isArray(invoer)) return null
  const o = invoer as Record<string, unknown>
  const rij: RuweRij = {}
  for (const veld of IMPORT_VELDEN) {
    const waarde = o[veld]
    if (typeof waarde === 'string' && waarde.length <= 500) rij[veld] = waarde
  }
  return rij
}

/** Een rij controleren en omzetten naar een lid. `vandaag` als JJJJ-MM-DD (voor de status). */
export function controleerRij(rij: RuweRij, vandaag: string): RijUitslag {
  const eigenAchternaam = kort(rij.achternaam, MAX.achternaam)
  const uitNaam = eigenAchternaam ? null : naamAanvullen(kort(rij.voornaam, MAX.voornaam), rij.volledigeNaam)
  const voornaam = kort(rij.voornaam, MAX.voornaam) ?? kort(uitNaam?.voornaam, MAX.voornaam)
  const achternaamZonder = eigenAchternaam ?? kort(uitNaam?.achternaam, MAX.achternaam)
  if (!voornaam || !achternaamZonder) return { ok: false, fout: 'Voornaam of achternaam ontbreekt.' }
  // Een tussenvoegsel hoort bij een eigen kolom achternaam; uit de hele naam zit het er al in.
  const tussen = eigenAchternaam ? kort(rij.tussenvoegsel, 20) : null
  const achternaam = (tussen ? `${tussen} ${achternaamZonder}` : achternaamZonder).slice(0, MAX.achternaam)

  const waarschuwingen: string[] = []
  const einddatum = datumVeld(rij.einddatum, 'Einddatum', waarschuwingen)
  let geslacht: LidImport['geslacht'] = null
  if (rij.geslacht?.trim()) {
    const g = leesGeslacht(rij.geslacht)
    if (g === undefined) waarschuwingen.push(`Geslacht "${rij.geslacht.slice(0, 20)}" is onbekend en is leeg gelaten.`)
    else geslacht = g
  }
  let status = statusUitEinddatum(einddatum, vandaag)
  if (rij.status?.trim()) {
    const s = leesStatus(rij.status)
    if (s === undefined) waarschuwingen.push(`Status "${rij.status.slice(0, 20)}" is onbekend, gekozen is ${status}.`)
    else status = s
  }

  return {
    ok: true,
    waarschuwingen,
    lid: {
      voornaam,
      achternaam,
      email: leesEmail(rij.email, waarschuwingen),
      telefoon: leesTelefoon(rij.telefoon),
      geboortedatum: datumVeld(rij.geboortedatum, 'Geboortedatum', waarschuwingen),
      geslacht,
      abonnement: kort(rij.abonnement, MAX.abonnement),
      status,
      statusGegeven: Boolean(rij.status?.trim()) || einddatum !== null,
      lidSinds: datumVeld(rij.lidSinds, 'Lid sinds', waarschuwingen),
      einddatum,
      lidnummer: kort(rij.lidnummer, MAX.lidnummer),
      sportivityId: kort(rij.sportivityId, MAX.sportivityId),
    },
  }
}
