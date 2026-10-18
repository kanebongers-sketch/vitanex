// ─── Club, challenges: het model (PUUR) ─────────────────────────────────────
// Een challenge is een doel over een periode, per sportschool. Voortgang komt
// uit bestaande data (check-ins, trainingslog, groepslessen); er wordt niets
// extra bijgehouden. Geen beloningen of prijzen: puur voortgang en erkenning.

export const CHALLENGE_SOORTEN = ['bezoeken', 'trainingen', 'lessen', 'weken_op_rij'] as const
export type ChallengeSoort = (typeof CHALLENGE_SOORTEN)[number]

export const DEELNAME_SOORTEN = ['automatisch', 'inschrijven'] as const
export type Deelname = (typeof DEELNAME_SOORTEN)[number]

export interface SoortInfo {
  label: string
  /** "bezoek" en "bezoeken": enkelvoud en meervoud van de eenheid. */
  enkel: string
  meer: string
  uitleg: string
}

export const SOORT_INFO: Record<ChallengeSoort, SoortInfo> = {
  bezoeken: { label: 'Bezoeken', enkel: 'bezoek', meer: 'bezoeken', uitleg: 'Elke dag met een check-in telt als een bezoek, in elke vestiging.' },
  trainingen: { label: 'Trainingen', enkel: 'training', meer: 'trainingen', uitleg: 'Afgevinkte trainingen uit het schema in de ledenapp.' },
  lessen: { label: 'Groepslessen', enkel: 'groepsles', meer: 'groepslessen', uitleg: 'Groepslessen waarbij het lid aanwezig was.' },
  weken_op_rij: { label: 'Weken op rij', enkel: 'week op rij', meer: 'weken op rij', uitleg: 'Weken achter elkaar met minstens een bezoek.' },
}

export const DEELNAME_LABEL: Record<Deelname, string> = {
  automatisch: 'Iedereen doet mee',
  inschrijven: 'Leden schrijven zich in',
}

export const MAX_TITEL = 80
export const MAX_UITLEG = 600
export const MAX_DOEL = 500
/** Een challenge duurt hoogstens een jaar. */
export const MAX_DAGEN = 366

export interface Challenge {
  id: string
  titel: string
  uitleg: string | null
  soort: ChallengeSoort
  doel: number
  /** yyyy-mm-dd, beide dagen tellen mee. */
  start: string
  eind: string
  /** Leeg = alle vestigingen. Bepaalt wie meedoet (de thuisvestiging van het lid). */
  vestigingen: string[]
  deelname: Deelname
  zichtbaarApp: boolean
  ranglijst: boolean
  /** Vroegtijdig gestopt (ISO), of null. */
  gestoptOp: string | null
  demo: boolean
}

export const CHALLENGE_KOLOMMEN = 'id, titel, uitleg, soort, doel, start_op, eind_op, vestigingen, deelname, zichtbaar_app, ranglijst, gestopt_op, demo'

const DATUM = /^\d{4}-\d{2}-\d{2}$/

export function isChallengeSoort(v: unknown): v is ChallengeSoort {
  return typeof v === 'string' && (CHALLENGE_SOORTEN as readonly string[]).includes(v)
}

export function isDeelname(v: unknown): v is Deelname {
  return typeof v === 'string' && (DEELNAME_SOORTEN as readonly string[]).includes(v)
}

function datum(v: unknown): string | null {
  return typeof v === 'string' && DATUM.test(v.slice(0, 10)) ? v.slice(0, 10) : null
}

/** Systeemgrens: een databaserij naar een Challenge, of null als de rij onbruikbaar is. */
export function challengeUitRij(rij: unknown): Challenge | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  const start = datum(r.start_op)
  const eind = datum(r.eind_op)
  if (typeof r.id !== 'string' || typeof r.titel !== 'string' || !isChallengeSoort(r.soort) || !start || !eind) return null
  const doel = Number(r.doel)
  if (!Number.isInteger(doel) || doel < 1) return null
  return {
    id: r.id,
    titel: r.titel,
    uitleg: typeof r.uitleg === 'string' && r.uitleg.trim() ? r.uitleg : null,
    soort: r.soort,
    doel,
    start,
    eind,
    vestigingen: Array.isArray(r.vestigingen) ? r.vestigingen.filter((v): v is string => typeof v === 'string') : [],
    deelname: isDeelname(r.deelname) ? r.deelname : 'automatisch',
    zichtbaarApp: r.zichtbaar_app !== false,
    ranglijst: r.ranglijst === true,
    gestoptOp: typeof r.gestopt_op === 'string' ? r.gestopt_op : null,
    demo: r.demo === true,
  }
}

/** "12 bezoeken", "1 week op rij". */
export function eenheidTekst(soort: ChallengeSoort, n: number): string {
  const info = SOORT_INFO[soort]
  return `${n} ${n === 1 ? info.enkel : info.meer}`
}
