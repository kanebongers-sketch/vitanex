// ─── Club: bedrijfsgegevens en teksten van een sportschool (PUUR) ───────────
// Een rij per sportschool in club_bedrijfsgegevens. Contact per vestiging staat
// in club_vestigingen en wordt hier niet herhaald.

export const SOCIALS = ['instagram', 'facebook', 'tiktok', 'linkedin'] as const
export type Social = (typeof SOCIALS)[number]

export const SOCIAL_LABEL: Record<Social, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
}

/** De domeinen die per social link zijn toegestaan (ook met een subdomein, zoals www.). */
export const SOCIAL_DOMEIN: Record<Social, string> = {
  instagram: 'instagram.com',
  facebook: 'facebook.com',
  tiktok: 'tiktok.com',
  linkedin: 'linkedin.com',
}

export const TEKSTEN = ['huisregels', 'voorwaarden', 'privacy'] as const
export type TekstSoort = (typeof TEKSTEN)[number]

export const TEKST_LABEL: Record<TekstSoort, string> = {
  huisregels: 'Huisregels',
  voorwaarden: 'Algemene voorwaarden',
  privacy: 'Privacyverklaring',
}

export const TEKST_UITLEG: Record<TekstSoort, string> = {
  huisregels: 'Hoe je leden zich gedragen in de sportschool: toegang, de zaal, groepslessen.',
  voorwaarden: 'De voorwaarden van het lidmaatschap. Laat deze tekst bij twijfel juridisch nakijken.',
  privacy: 'Welke gegevens je bewaart, waarom, en welke rechten je leden hebben (AVG).',
}

export const MAX_TEKST = 20000

export interface Gegevens {
  bedrijfsnaam: string | null
  kvk: string | null
  btw: string | null
  adres: string | null
  postcode: string | null
  plaats: string | null
  telefoon: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  linkedin: string | null
}

export type Teksten = Record<TekstSoort, string | null>

export interface Bedrijf {
  gegevens: Gegevens
  /** Kleineondernemersregeling: dan is een btw-nummer niet verplicht (migratie 478). */
  kor: boolean
  teksten: Teksten
}

export const GEGEVENS_VELDEN = [
  'bedrijfsnaam', 'kvk', 'btw', 'adres', 'postcode', 'plaats', 'telefoon', 'email', 'website', ...SOCIALS,
] as const satisfies readonly (keyof Gegevens)[]

export const BEDRIJF_KOLOMMEN = [...GEGEVENS_VELDEN, 'kor', ...TEKSTEN].join(', ')

export const LEEG_BEDRIJF: Bedrijf = {
  gegevens: Object.fromEntries(GEGEVENS_VELDEN.map((v) => [v, null])) as unknown as Gegevens,
  kor: false,
  teksten: { huisregels: null, voorwaarden: null, privacy: null },
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

/** Systeemgrens: een rij uit club_bedrijfsgegevens (of null: nog niets ingevuld). */
export function bedrijfUitRij(rij: unknown): Bedrijf {
  if (typeof rij !== 'object' || rij === null) return LEEG_BEDRIJF
  const r = rij as Record<string, unknown>
  const gegevens = Object.fromEntries(GEGEVENS_VELDEN.map((v) => [v, tekstOfNull(r[v])])) as unknown as Gegevens
  const teksten = Object.fromEntries(TEKSTEN.map((v) => [v, tekstOfNull(r[v])])) as Teksten
  return { gegevens, kor: r.kor === true, teksten }
}

/**
 * Zijn de verplichte gegevens er (besluit Kane 30-10-2026)? Altijd een
 * KvK-nummer, en een btw-nummer tenzij de sportschool de KOR gebruikt.
 */
export function bedrijfCompleet(gegevens: Pick<Gegevens, 'kvk' | 'btw'>, kor: boolean): boolean {
  return Boolean(gegevens.kvk) && (kor || Boolean(gegevens.btw))
}

/** De teksten die ingevuld zijn, in vaste volgorde (voor de ledenapp). */
export function ingevuldeTeksten(teksten: Teksten): { soort: TekstSoort; tekst: string }[] {
  return TEKSTEN.flatMap((soort) => {
    const tekst = teksten[soort]
    return tekst ? [{ soort, tekst }] : []
  })
}
