// ─── Fit Factory Club: kolommen van een ledenbestand herkennen (PUUR) ───────
// Elk systeem noemt zijn kolommen anders ("Voornaam", "First name", "Roepnaam").
// We herkennen de gangbare namen automatisch (ook uit Virtuagym, Sportivity en
// Excel); op de pagina koppelt de sportschool elke kolom daarna nog met de hand.
// Heeft een bestand alleen een kolom met de hele naam, dan splitsen we die
// (zie splitsNaam in rij.ts).

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

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
  // Als laatste: Voornaam en Achternaam krijgen hun eigen kolom eerst.
  'volledigeNaam',
] as const
export type ImportVeld = (typeof IMPORT_VELDEN)[number]

/** De Nederlandse namen (bron: het woordenboek LEDEN). In beeld via importVeldLabel(veld, taal). */
export const IMPORT_VELD_LABEL: Record<ImportVeld, string> = LEDEN.nl.import.velden

/** De naam van een veld in de gekozen taal. */
export function importVeldLabel(veld: ImportVeld, taal: Taal = 'nl'): string {
  return LEDEN[taal].import.velden[veld]
}

/** Zonder voornaam en achternaam kan een rij geen lid worden (of een kolom met de volledige naam). */
export const VERPLICHTE_VELDEN: readonly ImportVeld[] = ['voornaam', 'achternaam']

/** Per veld de kolomnamen die we kennen, al genormaliseerd (kleine letters, alleen a tot z en cijfers). */
const SYNONIEMEN: Record<ImportVeld, string[]> = {
  voornaam: ['voornaam', 'roepnaam', 'firstname', 'givenname', 'voornamen'],
  tussenvoegsel: ['tussenvoegsel', 'tussenvoegsels', 'voorvoegsel', 'prefix', 'infix'],
  achternaam: ['achternaam', 'lastname', 'surname', 'familienaam', 'familyname'],
  email: ['email', 'emailadres', 'mail', 'emailaddress'],
  telefoon: ['telefoon', 'telefoonnummer', 'tel', 'mobiel', 'mobielnummer', 'gsm', 'phone', 'phonenumber', 'mobile', 'mobilephone', 'mobilenumber', 'cellphone', 'telephone'],
  geboortedatum: ['geboortedatum', 'geboortedag', 'gebdatum', 'birthdate', 'dateofbirth', 'dob', 'birthday'],
  geslacht: ['geslacht', 'gender', 'sex', 'mv'],
  abonnement: ['abonnement', 'abonnementsvorm', 'lidmaatschap', 'contract', 'contractnaam', 'membership', 'membershipname', 'membershiptype', 'contracttype', 'product', 'subscription'],
  status: ['status', 'lidstatus', 'membershipstatus', 'contractstatus'],
  lidSinds: ['lidsinds', 'startdatum', 'ingangsdatum', 'begindatum', 'inschrijfdatum', 'startdate', 'membersince', 'datuminschrijving', 'membershipstartdate', 'contractstartdate', 'registrationdate'],
  einddatum: ['einddatum', 'enddate', 'opzegdatum', 'stopdatum', 'beeindigd', 'einde', 'membershipenddate', 'contractenddate'],
  lidnummer: ['lidnummer', 'lidnr', 'membernumber', 'membernr', 'memberid', 'klantnummer', 'relatienummer', 'pasnummer'],
  sportivityId: ['sportivityid', 'sportivity', 'externid', 'externalid', 'sportivitynummer'],
  volledigeNaam: ['naam', 'volledigenaam', 'fullname', 'name', 'lidnaam', 'membername', 'klantnaam', 'relatienaam'],
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

/** Is dit veld nu verplicht? Voornaam en achternaam niet meer als er een kolom met de volledige naam is. */
export function isVerplicht(veld: ImportVeld, koppeling: Koppeling): boolean {
  return VERPLICHTE_VELDEN.includes(veld) && koppeling.volledigeNaam === null
}

/** Welke verplichte velden hebben nog geen kolom? */
export function ontbrekendeVelden(koppeling: Koppeling): ImportVeld[] {
  return VERPLICHTE_VELDEN.filter((v) => isVerplicht(v, koppeling) && koppeling[v] === null)
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
