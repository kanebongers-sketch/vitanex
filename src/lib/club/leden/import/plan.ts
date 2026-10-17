// ─── Fit Factory Club: wat het inlezen gaat doen (PUUR) ─────────────────────
// Elke rij uit het bestand wordt vergeleken met de leden die er al zijn:
//   1. zelfde Sportivity-ID (in elke vestiging, een lid kan verhuizen),
//   2. zelfde lidnummer, 3. zelfde e-mail, 4. zelfde naam en geboortedatum
//   (2 tot 4 binnen de gekozen vestiging).
// Demoleden doen niet mee. Lege cellen wissen nooit iets: alleen wat in het
// bestand staat wordt bijgewerkt. Coach, tags en de QR-code blijven altijd staan.

import type { Lid } from '@/lib/club/kern/lid'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { LidImport } from './rij'

export type ImportActie = 'nieuw' | 'bijwerken' | 'gelijk' | 'dubbel'

export interface GeplandeRij {
  /** Regelnummer in het bestand (de kopregel is 1). */
  regel: number
  actie: ImportActie
  naam: string
  /** Bij bijwerken of gelijk: het bestaande lid. */
  lidId: string | null
  /** Bij bijwerken: de kolommen die veranderen, als databasekolom en nieuwe waarde. */
  wijziging: Record<string, string | null>
  /** Bij nieuw: het Sportivity-ID hoort al bij een ander (demo)lid, dus voegen we het lid zonder ID toe. */
  zonderSportivityId: boolean
}

export interface ImportPlan {
  rijen: GeplandeRij[]
  telling: Record<ImportActie, number>
  /** Echte leden van deze vestiging die niet in het bestand staan (we doen er niets mee). */
  nietInBestand: number
}

export interface ImportRegel {
  regel: number
  lid: LidImport
}

type Bestaand = Pick<
  Lid,
  'id' | 'vestiging' | 'voornaam' | 'achternaam' | 'email' | 'telefoon' | 'geboortedatum' | 'geslacht' | 'abonnement' | 'status' | 'lidSinds' | 'einddatum' | 'lidnummer' | 'sportivityId' | 'demo'
>

/** De databasekolommen van een lid uit het bestand. null = niet in het bestand. */
export function lidKolommen(lid: LidImport): Record<string, string | null> {
  return {
    voornaam: lid.voornaam,
    achternaam: lid.achternaam,
    email: lid.email,
    telefoon: lid.telefoon,
    geboortedatum: lid.geboortedatum,
    geslacht: lid.geslacht,
    abonnement: lid.abonnement,
    status: lid.statusGegeven ? lid.status : null,
    lid_sinds: lid.lidSinds,
    einddatum: lid.einddatum,
    lidnummer: lid.lidnummer,
    sportivity_id: lid.sportivityId,
  }
}

function bestaandeKolommen(b: Bestaand): Record<string, string | null> {
  return {
    vestiging: b.vestiging,
    voornaam: b.voornaam,
    achternaam: b.achternaam,
    email: b.email,
    telefoon: b.telefoon,
    geboortedatum: b.geboortedatum,
    geslacht: b.geslacht,
    abonnement: b.abonnement,
    status: b.status,
    lid_sinds: b.lidSinds,
    einddatum: b.einddatum,
    lidnummer: b.lidnummer,
    sportivity_id: b.sportivityId,
  }
}

/** Alleen de kolommen die in het bestand staan en anders zijn dan nu. */
export function verschil(lid: LidImport, bestaand: Bestaand, vestiging: Vestiging): Record<string, string | null> {
  const nu = bestaandeKolommen(bestaand)
  const nieuw: Record<string, string | null> = { ...lidKolommen(lid), vestiging }
  const uit: Record<string, string | null> = {}
  for (const [kolom, waarde] of Object.entries(nieuw)) {
    const gelijk = ZONDER_HOOFDLETTERS.has(kolom) ? klein(waarde) === klein(nu[kolom]) : waarde === nu[kolom]
    if (waarde !== null && !gelijk) uit[kolom] = waarde
  }
  return uit
}

/** Bij deze kolommen telt alleen hoofdletters anders niet als wijziging. */
const ZONDER_HOOFDLETTERS = new Set(['email', 'lidnummer'])

function klein(v: string | null | undefined): string | null {
  return v ? v.trim().toLowerCase() : null
}
const naamSleutel = (l: { voornaam: string; achternaam: string; geboortedatum: string | null }) =>
  l.geboortedatum ? `${klein(l.voornaam)}|${klein(l.achternaam)}|${l.geboortedatum}` : null

/** Per sleutel het lid, of null als meerdere leden die sleutel delen (dan koppelen we er niet op). */
type Sleutels = Map<string, Bestaand | null>

interface Index {
  sportivity: Sleutels
  lidnummer: Sleutels
  email: Sleutels
  naamDatum: Sleutels
  naam: Sleutels
}

function zet(map: Sleutels, sleutel: string | null, b: Bestaand): void {
  if (!sleutel) return
  map.set(sleutel, map.has(sleutel) ? null : b)
}

function maakIndex(bestaand: readonly Bestaand[], vestiging: Vestiging): Index {
  const index: Index = { sportivity: new Map(), lidnummer: new Map(), email: new Map(), naamDatum: new Map(), naam: new Map() }
  for (const b of bestaand) {
    if (b.demo) continue
    zet(index.sportivity, b.sportivityId, b)
    if (b.vestiging !== vestiging) continue
    zet(index.lidnummer, klein(b.lidnummer), b)
    zet(index.email, klein(b.email), b)
    zet(index.naamDatum, naamSleutel(b), b)
    zet(index.naam, `${klein(b.voornaam)}|${klein(b.achternaam)}`, b)
  }
  return index
}

/** Ander ID, lidnummer of geboortedatum = een ander mens, ook bij hetzelfde e-mailadres of dezelfde naam. */
function botst(lid: LidImport, b: Bestaand): boolean {
  const verschilt = (a: string | null, c: string | null) => a !== null && c !== null && klein(a) !== klein(c)
  return verschilt(lid.sportivityId, b.sportivityId) || verschilt(lid.lidnummer, b.lidnummer) || verschilt(lid.geboortedatum, b.geboortedatum)
}

function zoek(index: Index, lid: LidImport): Bestaand | null {
  if (lid.sportivityId) {
    const op = index.sportivity.get(lid.sportivityId)
    if (op) return op
  }
  const kandidaten = [
    index.lidnummer.get(klein(lid.lidnummer) ?? ''),
    index.email.get(klein(lid.email) ?? ''),
    index.naamDatum.get(naamSleutel(lid) ?? ''),
    // Alleen op naam als het bestand niets anders heeft om op te koppelen.
    !lid.sportivityId && !lid.lidnummer && !lid.email ? index.naam.get(`${klein(lid.voornaam)}|${klein(lid.achternaam)}`) : undefined,
  ]
  return kandidaten.find((b): b is Bestaand => b !== undefined && b !== null && !botst(lid, b)) ?? null
}

/** Een sleutel om dubbele regels in het bestand zelf te vinden. */
function bestandSleutel(lid: LidImport): string {
  if (lid.sportivityId) return `s:${lid.sportivityId}`
  if (lid.lidnummer) return `l:${klein(lid.lidnummer)}`
  if (lid.email) return `e:${klein(lid.email)}`
  return `n:${naamSleutel(lid) ?? `${klein(lid.voornaam)}|${klein(lid.achternaam)}`}`
}

/** Een Sportivity-ID dat al bij een ander lid hoort, schrijven we niet over (unieke index). */
function zonderBezetId(wijziging: Record<string, string | null>, bezet: ReadonlySet<string>): Record<string, string | null> {
  const id = wijziging.sportivity_id
  if (!id || !bezet.has(id)) return wijziging
  return Object.fromEntries(Object.entries(wijziging).filter(([kolom]) => kolom !== 'sportivity_id'))
}

export function maakPlan(regels: readonly ImportRegel[], bestaand: readonly Bestaand[], vestiging: Vestiging): ImportPlan {
  const index = maakIndex(bestaand, vestiging)
  const bezet = new Set(bestaand.flatMap((b) => (b.sportivityId ? [b.sportivityId] : [])))
  const gezien = new Set<string>()
  const geraakt = new Set<string>()
  const rijen: GeplandeRij[] = regels.map(({ regel, lid }) => {
    const naam = `${lid.voornaam} ${lid.achternaam}`
    const sleutel = bestandSleutel(lid)
    const leeg = { regel, naam, lidId: null, wijziging: {}, zonderSportivityId: false }
    if (gezien.has(sleutel)) return { ...leeg, actie: 'dubbel' }
    gezien.add(sleutel)
    const match = zoek(index, lid)
    if (!match) return { ...leeg, actie: 'nieuw', zonderSportivityId: lid.sportivityId !== null && bezet.has(lid.sportivityId) }
    if (geraakt.has(match.id)) return { ...leeg, actie: 'dubbel', lidId: match.id }
    geraakt.add(match.id)
    const wijziging = zonderBezetId(verschil(lid, match, vestiging), bezet)
    return { ...leeg, actie: Object.keys(wijziging).length > 0 ? 'bijwerken' : 'gelijk', lidId: match.id, wijziging }
  })
  const telling: Record<ImportActie, number> = { nieuw: 0, bijwerken: 0, gelijk: 0, dubbel: 0 }
  for (const r of rijen) telling[r.actie]++
  const nietInBestand = bestaand.filter((b) => !b.demo && b.vestiging === vestiging && !geraakt.has(b.id)).length
  return { rijen, telling, nietInBestand }
}
