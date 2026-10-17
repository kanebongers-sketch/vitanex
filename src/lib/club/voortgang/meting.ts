// ─── Club, voortgang: een losse meting (PUUR) ────────────────────────────────
// Validatie van wat de trainer invult en het lezen van een opgeslagen rij.
//
// AVG: lichaamsmetingen zijn gezondheidsgegevens. Een losse meting bestaat
// alleen met expliciete toestemming van het lid; zonder vinkje slaan we niets op
// (de database dwingt dat ook af, migratie 414).

import { leesBloeddruk } from '@/lib/club/training/intake'
import { isRij, tekstOfNull } from '@/lib/club/training/rijen'
import { isUuid } from '@/lib/club/training/typen'

/** Meetwaarden met een getal. Volgorde = volgorde in formulier en wissel. */
export const MEETWAARDEN = [
  { sleutel: 'gewicht_kg', label: 'Gewicht', kort: 'Gewicht', eenheid: 'kg', min: 30, max: 300, stap: '0.1' },
  { sleutel: 'vetpercentage', label: 'Vetpercentage', kort: 'Vet', eenheid: '%', min: 3, max: 70, stap: '0.1' },
  { sleutel: 'spiermassa_kg', label: 'Spiermassa', kort: 'Spier', eenheid: 'kg', min: 10, max: 120, stap: '0.1' },
  { sleutel: 'buikomtrek_cm', label: 'Buikomtrek', kort: 'Buik', eenheid: 'cm', min: 40, max: 200, stap: '0.5' },
  { sleutel: 'heupomtrek_cm', label: 'Heupomtrek', kort: 'Heup', eenheid: 'cm', min: 50, max: 200, stap: '0.5' },
  { sleutel: 'rusthartslag', label: 'Rusthartslag', kort: 'Hartslag', eenheid: 'per min', min: 30, max: 220, stap: '1' },
  { sleutel: 'lengte_cm', label: 'Lengte', kort: 'Lengte', eenheid: 'cm', min: 100, max: 230, stap: '1' },
] as const

export type MeetSleutel = (typeof MEETWAARDEN)[number]['sleutel']
export type MeetWaarden = Partial<Record<MeetSleutel, number>> & { bloeddruk?: string }

export const MEET_SLEUTELS: readonly MeetSleutel[] = MEETWAARDEN.map((m) => m.sleutel)

export interface Meting {
  id: string
  lidId: string
  medewerkerId: string | null
  datum: string
  waarden: MeetWaarden
  notitie: string | null
}

export interface MetingVelden {
  medewerkerId: string | null
  datum: string
  waarden: MeetWaarden
  notitie: string | null
}

export interface MetingInvoer extends MetingVelden {
  lidId: string
}

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export const METING_KOLOMMEN =
  'id, lid_id, medewerker_id, datum, gewicht_kg, lengte_cm, vetpercentage, buikomtrek_cm, heupomtrek_cm, spiermassa_kg, rusthartslag, bloeddruk, notitie'

export const GEEN_TOESTEMMING = 'Zonder toestemming van het lid leg je geen metingen vast. Vraag het eerst en vink het dan aan.'

function isDatum(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`))
}

function getal(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v.trim().replace(',', '.')) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function leeg(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
}

/** Lees de meetwaarden; een waarde buiten de grens is een tikfout. */
export function leesWaarden(ruw: unknown): Uitslag<MeetWaarden> {
  if (!isRij(ruw)) return { ok: false, fout: 'De metingen zijn ongeldig.' }
  const uit: MeetWaarden = {}
  for (const m of MEETWAARDEN) {
    if (leeg(ruw[m.sleutel])) continue
    const n = getal(ruw[m.sleutel])
    if (n === null || n < m.min || n > m.max) return { ok: false, fout: `${m.label} moet tussen ${m.min} en ${m.max} liggen.` }
    uit[m.sleutel] = m.sleutel === 'rusthartslag' ? Math.round(n) : Math.round(n * 10) / 10
  }
  if (!leeg(ruw.bloeddruk)) {
    const bd = leesBloeddruk(ruw.bloeddruk)
    if (!bd) return { ok: false, fout: 'Bloeddruk schrijf je als boven/onder, bijvoorbeeld 120/80.' }
    uit.bloeddruk = bd
  }
  if (Object.keys(uit).length === 0) return { ok: false, fout: 'Vul minstens een meting in.' }
  return { ok: true, waarde: uit }
}

/** De velden van een meting (nieuw of wijzigen). `vandaag` is yyyy-mm-dd. */
export function leesMetingVelden(body: unknown, vandaag: string): Uitslag<MetingVelden> {
  if (!isRij(body)) return { ok: false, fout: 'Ongeldig verzoek.' }
  if (body.toestemmingGezondheid !== true) return { ok: false, fout: GEEN_TOESTEMMING }
  if (!leeg(body.medewerkerId) && !isUuid(body.medewerkerId)) return { ok: false, fout: 'Onbekende medewerker.' }
  const datum = leeg(body.datum) ? vandaag : body.datum
  if (!isDatum(datum) || datum > vandaag) return { ok: false, fout: 'De datum is ongeldig of ligt in de toekomst.' }
  const waarden = leesWaarden(body.waarden)
  if (!waarden.ok) return waarden
  const notitie = tekstOfNull(body.notitie)
  return {
    ok: true,
    waarde: {
      medewerkerId: isUuid(body.medewerkerId) ? body.medewerkerId : null,
      datum,
      waarden: waarden.waarde,
      notitie: notitie ? notitie.trim().slice(0, 1000) : null,
    },
  }
}

/** Een nieuwe meting: de velden plus het lid. */
export function leesNieuweMeting(body: unknown, vandaag: string): Uitslag<MetingInvoer> {
  if (!isRij(body) || !isUuid(body.lidId)) return { ok: false, fout: 'Kies eerst een lid.' }
  const velden = leesMetingVelden(body, vandaag)
  if (!velden.ok) return velden
  return { ok: true, waarde: { ...velden.waarde, lidId: body.lidId } }
}

/** De kolommen voor insert of update (alle meetwaarden, leeg = null). */
export function metingKolommen(v: MetingVelden): Record<string, string | number | boolean | null> {
  const kolommen: Record<string, string | number | boolean | null> = {
    medewerker_id: v.medewerkerId,
    datum: v.datum,
    bloeddruk: v.waarden.bloeddruk ?? null,
    notitie: v.notitie,
    toestemming_gezondheid: true,
  }
  for (const s of MEET_SLEUTELS) kolommen[s] = v.waarden[s] ?? null
  return kolommen
}

/** Een rij uit club_metingen; een kapot veld valt weg, een kapotte rij wordt null. */
export function metingUitRij(rij: unknown): Meting | null {
  if (!isRij(rij)) return null
  const id = tekstOfNull(rij.id)
  const lidId = tekstOfNull(rij.lid_id)
  const datum = tekstOfNull(rij.datum)
  if (!id || !lidId || !datum) return null
  const waarden: MeetWaarden = {}
  for (const m of MEETWAARDEN) {
    const n = getal(rij[m.sleutel])
    if (n !== null && n >= m.min && n <= m.max) waarden[m.sleutel] = n
  }
  const bd = leesBloeddruk(rij.bloeddruk)
  if (bd) waarden.bloeddruk = bd
  return { id, lidId, medewerkerId: tekstOfNull(rij.medewerker_id), datum: datum.slice(0, 10), waarden, notitie: tekstOfNull(rij.notitie) }
}
