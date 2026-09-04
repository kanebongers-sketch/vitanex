// ─── LifeOS — het 2-wekelijkse PT-coachgesprek ──────────────────────────────
// PUUR. Geen fetch, geen DB. De naamconventie van de afspraak + de detectie of
// er voor een PT-klant al een gesprek gepland staat. Eigen bestand zodat het
// zonder Google-account testbaar is — de regel die bepaalt wat "afgevinkt" is,
// mag je kunnen narekenen.
//
// De afspraak heet vast "Coachgesprek PT - Kane (Naam)". Zie je 'm in je agenda,
// dan is deze cyclus geregeld; zie je 'm niet binnen het venster, dan moet het
// nog. Meer logica zit er niet achter — bewust, want een simpele regel op de
// titel is te controleren en te corrigeren.

/** Het vaste voorvoegsel; de klantnaam komt er tussen haakjes achter. */
export const COACHGESPREK_PREFIX = 'Coachgesprek PT - Kane'

/** De vaste afspraaknaam voor een PT-klant, bv. "Coachgesprek PT - Kane (Iris)". */
export function coachgesprekTitel(naam: string): string {
  return `${COACHGESPREK_PREFIX} (${naam.trim()})`
}

function normaliseer(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Herkent een coachgesprek-afspraak voor déze klant aan de titel: bevat hij het
 * "coachgesprek pt"-signaal én de naam van de klant?
 *
 * Losjes (substring, hoofdletterongevoelig): je typt de naam in je agenda
 * misschien niet exact zoals in het CRM, en een gemiste match zou onterecht "nog
 * inplannen" tonen. Een lege naam matcht nooit — dan zou élk coachgesprek meetellen.
 */
export function matchtCoachgesprek(titel: string | null, naam: string): boolean {
  if (!titel) return false
  const n = normaliseer(naam)
  if (n.length === 0) return false
  const t = normaliseer(titel)
  return t.includes('coachgesprek pt') && t.includes(n)
}

/** Eén PT-klant zoals de detectie 'm nodig heeft. */
export interface PtPersoon {
  id: string
  naam: string
  email: string | null
}

/** Eén afspraak (uit de agenda) zoals de detectie 'm nodig heeft. */
export interface PtEvent {
  titel: string | null
  /** ISO-start. */
  startOp: string
}

/** De status per PT-klant: geregeld of nog te doen, en zo ja, wanneer. */
export interface PtStatus {
  id: string
  naam: string
  email: string | null
  ingepland: boolean
  /** ISO-start van de gevonden afspraak, of null als er niets staat. */
  wanneer: string | null
}

/**
 * Per PT-klant: staat er binnen de meegegeven events een coachgesprek gepland?
 *
 * `events` zijn al op het venster (de komende 14 dagen) gefilterd door de
 * aanroeper. De vroegste match telt als "wanneer": events komen op starttijd
 * binnen, dus `find` pakt de eerstvolgende.
 */
export function bepaalStatus(
  personen: readonly PtPersoon[],
  events: readonly PtEvent[],
): PtStatus[] {
  return personen.map((p) => {
    const match = events.find((e) => matchtCoachgesprek(e.titel, p.naam))
    return {
      id: p.id,
      naam: p.naam,
      email: p.email,
      ingepland: match !== undefined,
      wanneer: match?.startOp ?? null,
    }
  })
}

// ─── De vorm over de draad (systeemgrens) ───────────────────────────────────
// "Niet gekoppeld" is een eigen tak, geen lege lijst — anders zegt de kaart
// "alles ingepland" terwijl we niet in de agenda kónden kijken. Zelfde patroon
// als InboxVandaag / AgendaVandaag.

export type PtGesprekkenAntwoord =
  | { gekoppeld: false }
  | { gekoppeld: true; pts: PtStatus[] }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}

function leesPtStatus(ruw: unknown): PtStatus | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const naam = tekstOfNull(ruw.naam)
  if (id === null || naam === null) return null
  return {
    id,
    naam,
    email: tekstOfNull(ruw.email),
    ingepland: ruw.ingepland === true,
    wanneer: tekstOfNull(ruw.wanneer),
  }
}

/** Het antwoord van `GET /api/lifeos/pt-gesprekken`, of null als het niet klopt. */
export function leesPtGesprekken(ruw: unknown): PtGesprekkenAntwoord | null {
  if (!isObject(ruw)) return null
  if (ruw.gekoppeld === false) return { gekoppeld: false }
  if (ruw.gekoppeld !== true) return null
  if (!Array.isArray(ruw.pts)) return null

  const pts = ruw.pts.map(leesPtStatus)
  // Eén kapot item = een kapot antwoord: stil overslaan zou een klant laten
  // verdwijnen zonder dat je het merkt.
  if (pts.some((p) => p === null)) return null

  return { gekoppeld: true, pts: pts.filter((p): p is PtStatus => p !== null) }
}
