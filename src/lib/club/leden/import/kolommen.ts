// ─── Fit Factory Club: kolommen van een ledenbestand herkennen (PUUR) ───────
// Elk systeem noemt zijn kolommen anders ("Voornaam", "First name", "Roepnaam").
// We herkennen de gangbare namen automatisch; op de pagina kan Kane elke kolom
// daarna nog met de hand aan een veld koppelen.

export const IMPORT_VELDEN = [
  'voornaam',
  'tussenvoegsel',
  'achternaam',
  'email',
  'telefoon',
  'geboortedatum',
  'geslacht',
  'abonnement',
  'status',
  'lidSinds',
  'einddatum',
  'lidnummer',
  'sportivityId',
] as const
export type ImportVeld = (typeof IMPORT_VELDEN)[number]

export const IMPORT_VELD_LABEL: Record<ImportVeld, string> = {
  voornaam: 'Voornaam',
  tussenvoegsel: 'Tussenvoegsel',
  achternaam: 'Achternaam',
  email: 'E-mail',
  telefoon: 'Telefoon',
  geboortedatum: 'Geboortedatum',
  geslacht: 'Geslacht',
  abonnement: 'Abonnement',
  status: 'Status',
  lidSinds: 'Lid sinds',
  einddatum: 'Einddatum',
  lidnummer: 'Lidnummer',
  sportivityId: 'Extern klantnummer',
}

/** Zonder voornaam en achternaam kan een rij geen lid worden. */
export const VERPLICHTE_VELDEN: readonly ImportVeld[] = ['voornaam', 'achternaam']

/** Per veld de kolomnamen die we kennen, al genormaliseerd (kleine letters, alleen a tot z en cijfers). */
const SYNONIEMEN: Record<ImportVeld, string[]> = {
  voornaam: ['voornaam', 'roepnaam', 'firstname', 'givenname', 'voornamen'],
  tussenvoegsel: ['tussenvoegsel', 'tussenvoegsels', 'voorvoegsel', 'prefix', 'infix'],
  achternaam: ['achternaam', 'lastname', 'surname', 'familienaam'],
  email: ['email', 'emailadres', 'mail', 'emailaddress'],
  telefoon: ['telefoon', 'telefoonnummer', 'tel', 'mobiel', 'mobielnummer', 'gsm', 'phone', 'phonenumber', 'mobile'],
  geboortedatum: ['geboortedatum', 'geboortedag', 'gebdatum', 'birthdate', 'dateofbirth', 'dob', 'birthday'],
  geslacht: ['geslacht', 'gender', 'sex', 'mv'],
  abonnement: ['abonnement', 'abonnementsvorm', 'lidmaatschap', 'contract', 'contractnaam', 'membership', 'product', 'subscription'],
  status: ['status', 'lidstatus', 'membershipstatus', 'contractstatus'],
  lidSinds: ['lidsinds', 'startdatum', 'ingangsdatum', 'begindatum', 'inschrijfdatum', 'startdate', 'membersince', 'datuminschrijving'],
  einddatum: ['einddatum', 'enddate', 'opzegdatum', 'stopdatum', 'beeindigd', 'einde'],
  lidnummer: ['lidnummer', 'lidnr', 'membernumber', 'membernr', 'klantnummer', 'relatienummer', 'pasnummer'],
  sportivityId: ['sportivityid', 'sportivity', 'externid', 'externalid', 'sportivitynummer'],
}

export type Koppeling = Record<ImportVeld, number | null>

export function normaliseerKop(kop: string): string {
  return kop
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function legeKoppeling(): Koppeling {
  return Object.fromEntries(IMPORT_VELDEN.map((v) => [v, null])) as Koppeling
}

/** Koppel elk veld aan de eerste kolom met een bekende naam. Een kolom hoort bij hooguit een veld. */
export function raadKoppeling(koppen: readonly string[]): Koppeling {
  const genormaliseerd = koppen.map(normaliseerKop)
  const bezet = new Set<number>()
  const koppeling = legeKoppeling()
  for (const veld of IMPORT_VELDEN) {
    for (const synoniem of SYNONIEMEN[veld]) {
      const index = genormaliseerd.findIndex((k, i) => k === synoniem && !bezet.has(i))
      if (index !== -1) {
        koppeling[veld] = index
        bezet.add(index)
        break
      }
    }
  }
  return koppeling
}

/** Welke verplichte velden hebben nog geen kolom? */
export function ontbrekendeVelden(koppeling: Koppeling): ImportVeld[] {
  return VERPLICHTE_VELDEN.filter((v) => koppeling[v] === null)
}

export type RuweRij = Partial<Record<ImportVeld, string>>

/** Een rij uit het bestand als veld en tekst, volgens de koppeling. Lege cellen vallen weg. */
export function pasKoppelingToe(rij: readonly string[], koppeling: Koppeling): RuweRij {
  const uit: RuweRij = {}
  for (const veld of IMPORT_VELDEN) {
    const index = koppeling[veld]
    const waarde = index === null ? '' : (rij[index] ?? '').trim()
    if (waarde) uit[veld] = waarde
  }
  return uit
}
