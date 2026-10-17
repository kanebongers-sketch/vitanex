// ─── Club, intakevragen: soorten, grenzen en het type van een vraag (PUUR) ───
// Elke sportschool stelt haar eigen intakeformulier samen (tabel
// club_intakevragen, migratie 416). Een vraag met een `sleutel` is een vaste
// (kern)vraag van Club die een veld van de intake vult; zonder sleutel is het
// een eigen vraag van de sportschool.

export const VRAAG_SOORTEN = ['kort', 'lang', 'keuze', 'meerkeuze', 'ja_nee', 'schaal_1_10', 'getal'] as const
export type VraagSoort = (typeof VRAAG_SOORTEN)[number]

export const SOORT_LABEL: Record<VraagSoort, string> = {
  kort: 'Kort antwoord',
  lang: 'Lang antwoord',
  keuze: 'Een keuze',
  meerkeuze: 'Meerdere keuzes',
  ja_nee: 'Ja of nee',
  schaal_1_10: 'Schaal 1 tot 10',
  getal: 'Getal',
}

/** Soorten met een lijst opties. */
export const SOORTEN_MET_OPTIES: readonly VraagSoort[] = ['keuze', 'meerkeuze']

export const MAX_VRAAG = 160
export const MAX_UITLEG = 300
export const MAX_SECTIE = 40
export const MAX_OPTIE = 60
export const MAX_OPTIES = 12
export const MAX_KORT_ANTWOORD = 200
export const MAX_LANG_ANTWOORD = 2000
export const MAX_GETAL = 100000
/** Meer vragen per sportschool maakt een intake onwerkbaar lang. */
export const MAX_VRAGEN = 80

export const SECTIE_VOORSTELLEN = ['Doelen', 'Ervaring', 'Leefstijl', 'Gezondheid'] as const

export interface IntakeVraag {
  id: string
  /** Sleutel van een kernvraag, of null voor een eigen vraag. */
  sleutel: string | null
  vraag: string
  uitleg: string | null
  soort: VraagSoort
  opties: string[]
  verplicht: boolean
  /** Bijzonder persoonsgegeven: alleen tonen en opslaan met toestemming van het lid. */
  gezondheid: boolean
  sectie: string
  volgorde: number
  actief: boolean
}

export function isVraagSoort(v: unknown): v is VraagSoort {
  return typeof v === 'string' && (VRAAG_SOORTEN as readonly string[]).includes(v)
}

export function heeftOpties(soort: VraagSoort): boolean {
  return SOORTEN_MET_OPTIES.includes(soort)
}

/** Een eigen vraag (geen kernvraag). */
export function isEigen(v: Pick<IntakeVraag, 'sleutel'>): boolean {
  return v.sleutel === null
}
