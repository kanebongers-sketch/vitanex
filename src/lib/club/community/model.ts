// ─── Club, community: het model (PUUR) ──────────────────────────────────────
// Groepen per sportschool met een tijdlijn van korte berichten, reacties (duim
// of high five) en een ranglijst uit bestaande data. Leden zien van elkaar
// alleen de privacynaam (voornaam plus de eerste letter van de achternaam).
// Tabellen: club_community_* (migratie 440).

export const MAX_TEKST = 500
export const MAX_NAAM = 60
export const MAX_UITLEG = 300
export const MAX_TOELICHTING = 300
/** Zoveel berichten toont de tijdlijn (nieuwste eerst). */
export const TIJDLIJN_MAX = 60

export const TOEGANG_SOORTEN = ['open', 'besloten'] as const
export type Toegang = (typeof TOEGANG_SOORTEN)[number]

export const TOEGANG_LABEL: Record<Toegang, { label: string; uitleg: string }> = {
  open: { label: 'Open', uitleg: 'Leden zien de groep in de app en worden zelf lid.' },
  besloten: { label: 'Besloten', uitleg: 'Alleen leden die de sportschool toevoegt zien de groep.' },
}

export const REACTIE_SOORTEN = ['duim', 'highfive'] as const
export type ReactieSoort = (typeof REACTIE_SOORTEN)[number]

export const REACTIE_LABEL: Record<ReactieSoort, { label: string; werkwoord: string }> = {
  duim: { label: 'Duim', werkwoord: 'gaf een duim' },
  highfive: { label: 'High five', werkwoord: 'gaf een high five' },
}

export const MELD_REDENEN = ['ongepast', 'pesten', 'spam', 'anders'] as const
export type MeldReden = (typeof MELD_REDENEN)[number]

export const MELD_REDEN_LABEL: Record<MeldReden, string> = {
  ongepast: 'Ongepast of grof',
  pesten: 'Pesten of kwetsend',
  spam: 'Reclame of spam',
  anders: 'Iets anders',
}

export const BERICHT_STATUSSEN = ['zichtbaar', 'vastgehouden', 'verborgen'] as const
export type BerichtStatus = (typeof BERICHT_STATUSSEN)[number]

export const RANGLIJST_BRONNEN = ['bezoeken', 'challenge'] as const
export type RanglijstBron = (typeof RANGLIJST_BRONNEN)[number]

function inLijst<T extends string>(lijst: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (lijst as readonly string[]).includes(v)
}

export const isToegang = (v: unknown): v is Toegang => inLijst(TOEGANG_SOORTEN, v)
export const isReactieSoort = (v: unknown): v is ReactieSoort => inLijst(REACTIE_SOORTEN, v)
export const isMeldReden = (v: unknown): v is MeldReden => inLijst(MELD_REDENEN, v)
export const isBerichtStatus = (v: unknown): v is BerichtStatus => inLijst(BERICHT_STATUSSEN, v)

export interface Groep {
  id: string
  naam: string
  uitleg: string | null
  toegang: Toegang
  /** null = alle vestigingen. */
  vestiging: string | null
  challengeId: string | null
  lestypeId: string | null
  ranglijst: boolean
  gearchiveerdOp: string | null
  demo: boolean
}

export const GROEP_KOLOMMEN = 'id, naam, uitleg, toegang, vestiging, challenge_id, lestype_id, ranglijst, gearchiveerd_op, demo'

type R = Record<string, unknown>

function obj(rij: unknown): R | null {
  return typeof rij === 'object' && rij !== null && !Array.isArray(rij) ? (rij as R) : null
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null
}

/** Systeemgrens: een databaserij naar een Groep, of null. */
export function groepUitRij(rij: unknown): Groep | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string') return null
  return {
    id: r.id,
    naam: r.naam,
    uitleg: tekstOfNull(r.uitleg),
    toegang: isToegang(r.toegang) ? r.toegang : 'besloten',
    vestiging: tekstOfNull(r.vestiging),
    challengeId: tekstOfNull(r.challenge_id),
    lestypeId: tekstOfNull(r.lestype_id),
    ranglijst: r.ranglijst !== false,
    gearchiveerdOp: tekstOfNull(r.gearchiveerd_op),
    demo: r.demo === true,
  }
}

/** De bron van de ranglijst: de gekoppelde challenge, anders bezoekdagen deze maand. */
export function ranglijstBron(g: Pick<Groep, 'challengeId'>): RanglijstBron {
  return g.challengeId ? 'challenge' : 'bezoeken'
}

/** Ziet een lid van deze vestiging de groep in de lijst? Besloten groepen alleen als lid. */
export function groepZichtbaarVoor(g: Pick<Groep, 'toegang' | 'vestiging' | 'gearchiveerdOp'>, lidVestiging: string, isLid: boolean): boolean {
  if (g.gearchiveerdOp) return false
  if (isLid) return true
  return g.toegang === 'open' && (g.vestiging === null || g.vestiging === lidVestiging)
}

export interface Reacties {
  duim: number
  highfive: number
  /** Wat het lid zelf gaf. */
  eigen: ReactieSoort[]
}

export interface TijdlijnBericht {
  id: string
  /** Privacynaam van de schrijver, of "Jij". */
  auteur: string
  eigen: boolean
  tekst: string
  status: BerichtStatus
  op: string
  reacties: Reacties
  /** Heeft het lid dit bericht al gemeld? */
  gemeld: boolean
}

/** Telt reacties per bericht, met wat het lid zelf gaf. */
export function telReacties(rijen: readonly { berichtId: string; lidId: string; soort: ReactieSoort }[], lidId: string): Map<string, Reacties> {
  const uit = new Map<string, Reacties>()
  for (const r of rijen) {
    const oud = uit.get(r.berichtId) ?? { duim: 0, highfive: 0, eigen: [] }
    uit.set(r.berichtId, {
      ...oud,
      [r.soort]: oud[r.soort] + 1,
      eigen: r.lidId === lidId && !oud.eigen.includes(r.soort) ? [...oud.eigen, r.soort] : oud.eigen,
    })
  }
  return uit
}

/**
 * Welke berichten een lid ziet: alles wat zichtbaar is, plus zijn eigen
 * berichten die wachten op beoordeling of verborgen zijn (met een label).
 */
export function zietBericht(b: { status: BerichtStatus; lidId: string }, lidId: string): boolean {
  return b.status === 'zichtbaar' || b.lidId === lidId
}

export interface Activiteit {
  id: string
  soort: ReactieSoort
  /** "Sanne V. gaf een high five" */
  tekst: string
  /** Begin van het bericht waarop gereageerd werd. */
  bericht: string
  groepId: string
  op: string
  nieuw: boolean
}

/** Een kort fragment van een bericht voor de activiteitenlijst. */
export function fragment(tekst: string, max = 60): string {
  const schoon = tekst.replace(/\s+/g, ' ').trim()
  return schoon.length <= max ? schoon : `${schoon.slice(0, max - 3).trimEnd()}...`
}
