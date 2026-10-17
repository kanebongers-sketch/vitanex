// ─── Fit Factory Club: agenda (PUUR, ook client) ────────────────────────────
// De afspraken van een vestiging: teamoverleg, een intake, onderhoud aan een
// apparaat, een gesprek. Per week bekeken (maandag eerst), met optioneel een
// medewerker. Tijden zijn Nederlandse tijd; opgeslagen als tijdstip (UTC).
// Tabel: club_agenda (migratie 399). Groepslessen en diensten staan in hun eigen
// rooster; die komen hier (nog) niet in.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { isDatum, isTijd, nlDelen, nlNaarUtc, plusDagen } from '@/lib/club/rooster/tijd'

export const SOORTEN = ['afspraak', 'overleg', 'intake', 'pt', 'onderhoud', 'overig'] as const
export type AgendaSoort = (typeof SOORTEN)[number]
export const SOORT_LABEL: Record<AgendaSoort, string> = {
  afspraak: 'Afspraak',
  overleg: 'Overleg',
  intake: 'Intake',
  pt: 'PT',
  onderhoud: 'Onderhoud',
  overig: 'Overig',
}
export const isSoort = (v: unknown): v is AgendaSoort => typeof v === 'string' && (SOORTEN as readonly string[]).includes(v)

export const MAX_TITEL = 160
export const MAX_NOTITIE = 2000

export interface AgendaItem {
  id: string
  vestiging: Vestiging
  titel: string
  soort: AgendaSoort
  /** ISO-tijdstip. */
  beginOp: string
  eindOp: string
  heleDag: boolean
  medewerkerId: string | null
  notitie: string | null
  auteur: string | null
}

export const AGENDA_KOLOMMEN = 'id, vestiging, titel, soort, begin_op, eind_op, hele_dag, medewerker_id, notitie, auteur'

export function agendaUitRij(ruw: unknown): AgendaItem | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const r = ruw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.titel !== 'string' || !isVestigingSlug(r.vestiging)) return null
  if (typeof r.begin_op !== 'string' || typeof r.eind_op !== 'string') return null
  return {
    id: r.id,
    vestiging: r.vestiging,
    titel: r.titel,
    soort: isSoort(r.soort) ? r.soort : 'afspraak',
    beginOp: new Date(r.begin_op).toISOString(),
    eindOp: new Date(r.eind_op).toISOString(),
    heleDag: r.hele_dag === true,
    medewerkerId: typeof r.medewerker_id === 'string' ? r.medewerker_id : null,
    notitie: typeof r.notitie === 'string' ? r.notitie : null,
    auteur: typeof r.auteur === 'string' ? r.auteur : null,
  }
}

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export interface AgendaInvoer {
  /** Zoals ingevuld (Nederlandse tijd), voor het herhalen. */
  datum: string
  begin: string
  eind: string
  vestiging: Vestiging
  titel: string
  soort: AgendaSoort
  beginOp: string
  eindOp: string
  heleDag: boolean
  medewerkerId: string | null
  notitie: string | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Het formulier → een afspraak. Datum + begin- en eindtijd in Nederlandse tijd;
 * een hele dag loopt van 00:00 tot 23:59. Eind vóór begin = fout.
 */
export function leesAgendaInvoer(body: unknown): Lees<AgendaInvoer> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = body as Record<string, unknown>
  if (!isVestigingSlug(o.vestiging)) return { ok: false, fout: 'Kies een vestiging.' }
  const titel = typeof o.titel === 'string' ? o.titel.replace(/\s+/g, ' ').trim().slice(0, MAX_TITEL) : ''
  if (!titel) return { ok: false, fout: 'Geef de afspraak een titel.' }
  if (!isDatum(o.datum)) return { ok: false, fout: 'Kies een datum.' }
  const heleDag = o.heleDag === true
  const begin = heleDag ? '00:00' : o.begin
  const eind = heleDag ? '23:59' : o.eind
  if (!isTijd(begin) || !isTijd(eind)) return { ok: false, fout: 'Vul een begin- en eindtijd in.' }
  if (eind < begin) return { ok: false, fout: 'De eindtijd ligt vóór de begintijd.' }
  const medewerkerId = typeof o.medewerkerId === 'string' && UUID.test(o.medewerkerId) ? o.medewerkerId : null
  const notitie = typeof o.notitie === 'string' && o.notitie.trim() ? o.notitie.trim().slice(0, MAX_NOTITIE) : null
  return {
    ok: true,
    waarde: {
      datum: o.datum,
      begin,
      eind,
      vestiging: o.vestiging,
      titel,
      soort: isSoort(o.soort) ? o.soort : 'afspraak',
      beginOp: nlNaarUtc(o.datum, begin).toISOString(),
      eindOp: nlNaarUtc(o.datum, eind).toISOString(),
      heleDag,
      medewerkerId,
      notitie,
    },
  }
}

/** Maximaal zoveel weken vooruit herhalen (een half jaar). */
export const MAX_HERHAAL_WEKEN = 26

/** Het aantal extra weken uit de invoer: 0 (geen herhaling) tot en met 26. */
export function leesHerhaal(body: unknown): number {
  const v = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).herhaalWeken : 0
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0
  return Number.isInteger(n) && n > 0 ? Math.min(n, MAX_HERHAAL_WEKEN) : 0
}

/**
 * De afspraak plus `weken` keer dezelfde afspraak een week later. Elke keer
 * opnieuw vanuit de Nederlandse kloktijd berekend, zodat 09:00 ook na de
 * overgang naar winter- of zomertijd 09:00 blijft.
 */
export function herhalingen(a: AgendaInvoer, weken: number): AgendaInvoer[] {
  return Array.from({ length: weken + 1 }, (_, i) => {
    const datum = plusDagen(a.datum, i * 7)
    return { ...a, datum, beginOp: nlNaarUtc(datum, a.begin).toISOString(), eindOp: nlNaarUtc(datum, a.eind).toISOString() }
  })
}

/** Datum, begin- en eindtijd (Nederlandse tijd) van een afspraak, voor het formulier. */
export function formWaarden(a: Pick<AgendaItem, 'beginOp' | 'eindOp'>): { datum: string; begin: string; eind: string } {
  const b = nlDelen(new Date(a.beginOp))
  const e = nlDelen(new Date(a.eindOp))
  return { datum: b.datum, begin: b.tijd, eind: e.tijd }
}

/** De afspraken per dag van de week (maandag eerst): hele dag eerst, dan op begintijd. */
export function perDag(items: readonly AgendaItem[], maandag: string): { datum: string; items: AgendaItem[] }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const datum = plusDagen(maandag, i)
    const lijst = items
      .filter((a) => nlDelen(new Date(a.beginOp)).datum === datum)
      .sort((a, b) => Number(b.heleDag) - Number(a.heleDag) || a.beginOp.localeCompare(b.beginOp) || a.titel.localeCompare(b.titel, 'nl'))
    return { datum, items: lijst }
  })
}

/** "09:00 – 10:30" of "Hele dag". */
export function tijdLabel(a: Pick<AgendaItem, 'beginOp' | 'eindOp' | 'heleDag'>): string {
  if (a.heleDag) return 'Hele dag'
  const { begin, eind } = formWaarden(a)
  return `${begin} – ${eind}`
}
