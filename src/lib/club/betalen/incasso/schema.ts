// ─── Club, betalen: herhalen en herinneren bij een mislukte incasso (PUUR) ──
// Instelbaar per sportschool, met veilige standaarden. Bronnen: faalcodes en
// SEPA-regels uit docs/aiyourgym/betalen/ONDERZOEK-STRIPE.md par. 2 en 4.
// - Elke mislukte SEPA-incasso kost de sportschool 3,50 euro bij Stripe, dus
//   hooguit twee herhalingen, alleen waar herhalen kan helpen (onvoldoende
//   saldo of een storing), en binnen 30 dagen na de eerste mislukking.
// - Bij een ingetrokken of ongeldige machtiging of rekening nooit herhalen:
//   het lid moet een nieuwe betaalmethode geven.
// - Een storno (betwist) wordt nooit automatisch opnieuw geind.
// - Herinneringen met een iDEAL-link, nooit automatisch incassokosten of een
//   incassobureau. [CHECK WIK] Wie ooit incassokosten wil rekenen, moet eerst
//   een veertiendagenbrief sturen (art. 6:96 lid 6 BW); dat doet dit schema niet.

import { dagenTussen, plusDagen, type Datum } from '../contract/datum'

export const FOUT_CATEGORIEEN = ['saldo', 'tijdelijk', 'rekening', 'machtiging', 'betwist', 'contact', 'onbekend'] as const
export type FoutCategorie = (typeof FOUT_CATEGORIEEN)[number]

/** Stripe failure_code (op de Charge) naar onze categorie. */
export const FAALCODE_CATEGORIE: Readonly<Record<string, FoutCategorie>> = {
  insufficient_funds: 'saldo',
  generic_could_not_process: 'tijdelijk',
  account_closed: 'rekening',
  bank_account_restricted: 'rekening',
  invalid_account_number: 'rekening',
  branch_does_not_exist: 'rekening',
  incorrect_account_holder_name: 'rekening',
  recipient_deceased: 'rekening',
  authorization_revoked: 'machtiging',
  debit_not_authorized: 'machtiging',
  debit_authorization_not_match: 'machtiging',
  debit_disputed: 'betwist',
  refer_to_customer: 'contact',
}

export function foutCategorie(failureCode: string | null | undefined): FoutCategorie {
  if (!failureCode) return 'onbekend'
  return Object.prototype.hasOwnProperty.call(FAALCODE_CATEGORIE, failureCode) ? FAALCODE_CATEGORIE[failureCode] : 'onbekend'
}

export interface CategorieAanpak {
  /** Dagen na de eerste mislukking waarop opnieuw wordt geind, oplopend. Leeg = niet herhalen. */
  herhaalNaDagen: readonly number[]
  /** Moet het lid een nieuwe betaalmethode of machtiging geven? */
  nieuweMethodeNodig: boolean
}

export interface HerinnerStap {
  stap: number
  /** Dagen na de vervaldatum van de factuur. */
  naDagen: number
  kanaal: 'mail' | 'app'
  /** Met een link om zelf met iDEAL te betalen. */
  betaallink: boolean
}

export interface IncassoSchema {
  perCategorie: Readonly<Record<FoutCategorie, CategorieAanpak>>
  herinneringen: readonly HerinnerStap[]
}

/** Harde grenzen die een sportschool niet kan overschrijven. */
export const GRENZEN = {
  maxHerhalingen: 2,
  maxDagenNaEersteMislukking: 30,
  maxHerinneringen: 5,
  /** Categorieen waarin herhalen nooit mag. */
  nooitHerhalen: ['rekening', 'machtiging', 'betwist'] as readonly FoutCategorie[],
} as const

export const STANDAARD_SCHEMA: IncassoSchema = {
  perCategorie: {
    saldo: { herhaalNaDagen: [5, 14], nieuweMethodeNodig: false },
    tijdelijk: { herhaalNaDagen: [3], nieuweMethodeNodig: false },
    rekening: { herhaalNaDagen: [], nieuweMethodeNodig: true },
    machtiging: { herhaalNaDagen: [], nieuweMethodeNodig: true },
    betwist: { herhaalNaDagen: [], nieuweMethodeNodig: false },
    contact: { herhaalNaDagen: [], nieuweMethodeNodig: false },
    onbekend: { herhaalNaDagen: [], nieuweMethodeNodig: false },
  },
  herinneringen: [
    { stap: 1, naDagen: 3, kanaal: 'mail', betaallink: true },
    { stap: 2, naDagen: 10, kanaal: 'mail', betaallink: true },
    { stap: 3, naDagen: 21, kanaal: 'mail', betaallink: true },
  ],
}

/** Controleer een schema tegen de grenzen. Lege lijst = in orde. */
export function controleerSchema(s: IncassoSchema): string[] {
  const fouten: string[] = []
  for (const c of FOUT_CATEGORIEEN) {
    const dagen = s.perCategorie[c].herhaalNaDagen
    if (dagen.length > GRENZEN.maxHerhalingen) fouten.push(`${c}: hooguit ${GRENZEN.maxHerhalingen} herhalingen`)
    if (dagen.length > 0 && GRENZEN.nooitHerhalen.includes(c)) fouten.push(`${c}: hier mag niet herhaald worden`)
    let vorige = 0
    for (const d of dagen) {
      if (!Number.isSafeInteger(d) || d <= vorige) fouten.push(`${c}: herhaaldagen moeten oplopende gehele getallen boven 0 zijn`)
      if (d > GRENZEN.maxDagenNaEersteMislukking) fouten.push(`${c}: herhalen kan hooguit ${GRENZEN.maxDagenNaEersteMislukking} dagen na de eerste mislukking`)
      vorige = d
    }
  }
  if (s.herinneringen.length > GRENZEN.maxHerinneringen) fouten.push(`Hooguit ${GRENZEN.maxHerinneringen} herinneringen`)
  let vorigeDag = -1
  s.herinneringen.forEach((h, i) => {
    if (h.stap !== i + 1) fouten.push('Herinneringsstappen moeten 1, 2, 3 en zo verder zijn')
    if (!Number.isSafeInteger(h.naDagen) || h.naDagen < 0 || h.naDagen <= vorigeDag) fouten.push('Herinneringsdagen moeten oplopende gehele getallen van 0 of meer zijn')
    vorigeDag = h.naDagen
  })
  return fouten
}

export interface SchemaAanpassing {
  perCategorie?: Partial<Record<FoutCategorie, CategorieAanpak>>
  herinneringen?: readonly HerinnerStap[]
}

/** Het schema van een sportschool: standaard plus eigen aanpassingen. Gooit als het resultaat de grenzen overschrijdt. */
export function schemaMetAanpassing(aanpassing: SchemaAanpassing | null): IncassoSchema {
  const s: IncassoSchema = {
    perCategorie: { ...STANDAARD_SCHEMA.perCategorie, ...(aanpassing?.perCategorie ?? {}) },
    herinneringen: aanpassing?.herinneringen ?? STANDAARD_SCHEMA.herinneringen,
  }
  const fouten = controleerSchema(s)
  if (fouten.length > 0) throw new RangeError(`Incassoschema ongeldig: ${fouten.join('; ')}`)
  return s
}

/**
 * Wanneer de volgende poging is, of null als er niet (meer) herhaald wordt.
 * `eersteMislukking` is de dag waarop de eerste poging voor deze factuur
 * mislukte; `herhalingenGedaan` telt de herhalingen (niet de eerste poging).
 */
export function volgendePoging(s: IncassoSchema, categorie: FoutCategorie, eersteMislukking: Datum, herhalingenGedaan: number): Datum | null {
  const dagen = s.perCategorie[categorie].herhaalNaDagen
  if (herhalingenGedaan < 0 || herhalingenGedaan >= dagen.length) return null
  return plusDagen(eersteMislukking, dagen[herhalingenGedaan])
}

/**
 * De herinnering die op `vandaag` verstuurd moet worden, of null. Na gemiste
 * dagen alleen de laatste stap die aan de beurt is (nooit drie mails tegelijk),
 * en nooit een stap terug na een latere stap.
 */
export function herinneringNu(s: IncassoSchema, vervaldatum: Datum, vandaag: Datum, verstuurdeStappen: readonly number[]): HerinnerStap | null {
  const dagen = dagenTussen(vervaldatum, vandaag)
  const hoogste = verstuurdeStappen.reduce((m, n) => Math.max(m, n), 0)
  const aanDeBeurt = s.herinneringen.filter((h) => h.naDagen <= dagen && h.stap > hoogste)
  return aanDeBeurt.length === 0 ? null : aanDeBeurt[aanDeBeurt.length - 1]
}
