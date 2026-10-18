// ─── Club: een vraag of probleem melden (PUUR) ──────────────────────────────
// Invoer controleren en rijen uit club_support (migratie 427) lezen. Er gaat
// geen mail naar buiten: Kane leest de meldingen op /clubkane/hulp/meldingen en
// zijn antwoord staat bij de melder in het helpcentrum.

export const SOORTEN = ['vraag', 'probleem', 'wens'] as const
export type MeldingSoort = (typeof SOORTEN)[number]
export const SOORT_LABEL: Record<MeldingSoort, string> = { vraag: 'Vraag', probleem: 'Probleem', wens: 'Wens' }

export const STATUSSEN = ['open', 'bezig', 'klaar'] as const
export type MeldingStatus = (typeof STATUSSEN)[number]
export const STATUS_LABEL: Record<MeldingStatus, string> = { open: 'Open', bezig: 'Bezig', klaar: 'Klaar' }

export const MELDER_ROLLEN = ['beheerder', 'eigenaar', 'clubmanager', 'medewerker'] as const
export type MelderRol = (typeof MELDER_ROLLEN)[number]

export const GRENZEN = {
  onderwerp: { min: 3, max: 120 },
  beschrijving: { min: 10, max: 4000 },
  pagina: 200,
  antwoord: 4000,
} as const

/** Een body groter dan dit weigert de API meteen (413). */
export const MAX_BODY_BYTES = 12_000

export const MELDING_KOLOMMEN = 'id, user_id, soort, onderwerp, beschrijving, pagina, melder_id, melder_naam, melder_rol, status, antwoord, beantwoord_op, aangemaakt_op, bijgewerkt_op'

export interface MeldingInvoer {
  soort: MeldingSoort
  onderwerp: string
  beschrijving: string
  pagina: string | null
}

export interface Melding extends MeldingInvoer {
  id: string
  userId: string
  melderId: string | null
  melderNaam: string
  melderRol: MelderRol
  status: MeldingStatus
  antwoord: string | null
  beantwoordOp: string | null
  aangemaaktOp: string
  bijgewerktOp: string
}

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fouten: Record<string, string> }

function veld(body: unknown, naam: string): unknown {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[naam] : undefined
}

/** Tekst zonder stuurtekens (wel regeleinden en tabs), ingekort aan de randen. */
export function schoneTekst(v: unknown): string {
  if (typeof v !== 'string') return ''
  return v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
}

export function isSoort(v: unknown): v is MeldingSoort {
  return (SOORTEN as readonly unknown[]).includes(v)
}

export function isStatus(v: unknown): v is MeldingStatus {
  return (STATUSSEN as readonly unknown[]).includes(v)
}

/**
 * De pagina waar het gebeurde: alleen een pad binnen Club (/clubkane/...),
 * zonder query of hash. Een volledige url van de eigen app mag ook; die wordt
 * een pad. Leeg of iets anders: null.
 */
export function leesPagina(v: unknown): string | null {
  let tekst = schoneTekst(v)
  if (!tekst) return null
  const url = /^https?:\/\/[^/]+(\/.*)?$/i.exec(tekst)
  if (url) tekst = url[1] ?? '/'
  const pad = tekst.split(/[?#]/)[0]
  if (!/^\/clubkane(\/[A-Za-z0-9._~%-]*)*$/.test(pad) || pad.includes('..')) return null
  return pad.slice(0, GRENZEN.pagina)
}

function lengteFout(tekst: string, g: { min: number; max: number }, wat: string): string | null {
  if (tekst.length < g.min) return `${wat} is te kort (minstens ${g.min} tekens).`
  if (tekst.length > g.max) return `${wat} is te lang (hooguit ${g.max} tekens).`
  return null
}

/** Een nieuwe melding uit het formulier. */
export function leesMelding(body: unknown): Uitslag<MeldingInvoer> {
  const fouten: Record<string, string> = {}
  const soort = veld(body, 'soort')
  if (!isSoort(soort)) fouten.soort = 'Kies vraag, probleem of wens.'
  const onderwerp = schoneTekst(veld(body, 'onderwerp')).replace(/\s+/g, ' ')
  const beschrijving = schoneTekst(veld(body, 'beschrijving'))
  const fOnderwerp = lengteFout(onderwerp, GRENZEN.onderwerp, 'Het onderwerp')
  const fBeschrijving = lengteFout(beschrijving, GRENZEN.beschrijving, 'De beschrijving')
  if (fOnderwerp) fouten.onderwerp = fOnderwerp
  if (fBeschrijving) fouten.beschrijving = fBeschrijving
  const ruwePagina = schoneTekst(veld(body, 'pagina'))
  const pagina = leesPagina(ruwePagina)
  if (ruwePagina && !pagina) fouten.pagina = 'Geef een pagina binnen Club, bijvoorbeeld /clubkane/rooster.'
  if (Object.keys(fouten).length > 0 || !isSoort(soort)) return { ok: false, fouten }
  return { ok: true, waarde: { soort, onderwerp, beschrijving, pagina } }
}

export interface Afhandeling {
  status: MeldingStatus
  /** undefined = antwoord niet wijzigen; null = antwoord weghalen. */
  antwoord: string | null | undefined
}

/** Kane wijzigt de status en (optioneel) het antwoord. */
export function leesAfhandeling(body: unknown): Uitslag<Afhandeling> {
  const status = veld(body, 'status')
  if (!isStatus(status)) return { ok: false, fouten: { status: 'Kies open, bezig of klaar.' } }
  const ruw = veld(body, 'antwoord')
  if (ruw === undefined) return { ok: true, waarde: { status, antwoord: undefined } }
  const antwoord = schoneTekst(ruw)
  if (antwoord.length > GRENZEN.antwoord) return { ok: false, fouten: { antwoord: `Het antwoord is te lang (hooguit ${GRENZEN.antwoord} tekens).` } }
  return { ok: true, waarde: { status, antwoord: antwoord || null } }
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

export function meldingUitRij(rij: unknown): Melding | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.user_id !== 'string' || !isSoort(r.soort) || !isStatus(r.status)) return null
  const rol = (MELDER_ROLLEN as readonly unknown[]).includes(r.melder_rol) ? (r.melder_rol as MelderRol) : 'beheerder'
  return {
    id: r.id,
    userId: r.user_id,
    soort: r.soort,
    onderwerp: typeof r.onderwerp === 'string' ? r.onderwerp : '',
    beschrijving: typeof r.beschrijving === 'string' ? r.beschrijving : '',
    pagina: tekstOfNull(r.pagina),
    melderId: tekstOfNull(r.melder_id),
    melderNaam: typeof r.melder_naam === 'string' ? r.melder_naam : '',
    melderRol: rol,
    status: r.status,
    antwoord: tekstOfNull(r.antwoord),
    beantwoordOp: tekstOfNull(r.beantwoord_op),
    aangemaaktOp: typeof r.aangemaakt_op === 'string' ? r.aangemaakt_op : '',
    bijgewerktOp: typeof r.bijgewerkt_op === 'string' ? r.bijgewerkt_op : '',
  }
}

/** Open eerst, dan bezig, dan klaar; binnen een status de nieuwste eerst. */
export function sorteerMeldingen(lijst: readonly Melding[]): Melding[] {
  const volgorde: Record<MeldingStatus, number> = { open: 0, bezig: 1, klaar: 2 }
  return [...lijst].sort((a, b) => volgorde[a.status] - volgorde[b.status] || b.aangemaaktOp.localeCompare(a.aangemaaktOp))
}

/** Aantal meldingen per status, voor de tellers bovenaan het overzicht. */
export function telPerStatus(lijst: readonly Melding[]): Record<MeldingStatus, number> {
  return lijst.reduce<Record<MeldingStatus, number>>((acc, m) => ({ ...acc, [m.status]: acc[m.status] + 1 }), { open: 0, bezig: 0, klaar: 0 })
}
