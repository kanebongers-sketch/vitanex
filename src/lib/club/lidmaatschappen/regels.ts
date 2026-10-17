// ─── Club, lidmaatschappen: de toegangsregels van een vorm (PUUR) ───────────
// Mag dit lid nu in deze vestiging naar binnen, en mag het deze les boeken?
// Een lid zonder (bekende) vorm wordt hier niet tegengehouden: dan beslist
// Sportivity, waar het abonnement staat. Een vorm die niet meer te koop is
// (actief = false) geldt gewoon voor wie hem al heeft.
//
// Koppelen (doet de hoofdsessie): check-in roept magBinnen aan, reserveren
// (balie en ledenapp) roept magLesBoeken aan, met vormVoorLid(vormen, lid.abonnement).

import { nlDelen, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import { vormSleutel, type Lidmaatschapsvorm } from './model'

export type ToegangRegel = Pick<Lidmaatschapsvorm, 'naam' | 'vestigingen' | 'groepslessen' | 'maxLessenPerWeek' | 'dalVan' | 'dalTot' | 'dalWeekendVrij'>

/** Een moment op de Nederlandse klok: ISO-weekdag (1 = maandag) en minuten na middernacht. */
export interface Moment {
  weekdag: number
  minuten: number
}

export type Weigering = 'vestiging' | 'daluren' | 'groepslessen' | 'maximum'

export type ToegangUitslag = { mag: true } | { mag: false; waarom: Weigering; reden: string }

const MAG: ToegangUitslag = { mag: true }

function nee(waarom: Weigering, reden: string): ToegangUitslag {
  return { mag: false, waarom, reden }
}

export function momentVan(datum: Date): Moment {
  const d = nlDelen(datum)
  return { weekdag: d.weekdag, minuten: d.minuten }
}

/** De vorm die bij de abonnementsnaam van een lid hoort, of null. */
export function vormVoorLid<T extends Pick<Lidmaatschapsvorm, 'naam'>>(vormen: readonly T[], abonnement: string | null | undefined): T | null {
  if (!abonnement?.trim()) return null
  const sleutel = vormSleutel(abonnement)
  return vormen.find((v) => vormSleutel(v.naam) === sleutel) ?? null
}

export function geldtInVestiging(vorm: Pick<ToegangRegel, 'vestigingen'>, vestiging: string): boolean {
  return vorm.vestigingen === null || vorm.vestigingen.includes(vestiging)
}

function isWeekend(weekdag: number): boolean {
  return weekdag === 6 || weekdag === 7
}

/** Valt het tijdvak van..tot (minuten) binnen de daluren van deze dag? Zonder daluren altijd. */
export function binnenDaluren(vorm: Pick<ToegangRegel, 'dalVan' | 'dalTot' | 'dalWeekendVrij'>, weekdag: number, van: number, tot = van): boolean {
  if (!vorm.dalVan || !vorm.dalTot) return true
  if (vorm.dalWeekendVrij && isWeekend(weekdag)) return true
  return van >= tijdNaarMinuten(vorm.dalVan) && tot <= tijdNaarMinuten(vorm.dalTot)
}

function dalTekst(vorm: ToegangRegel): string {
  return `${vorm.naam} geldt van ${vorm.dalVan} tot ${vorm.dalTot}${vorm.dalWeekendVrij ? ' (in het weekend de hele dag)' : ''}.`
}

/** Mag een lid met deze vorm op dit moment binnen in deze vestiging? */
export function magBinnen(vorm: ToegangRegel | null, vestiging: string, moment: Moment): ToegangUitslag {
  if (!vorm) return MAG
  if (!geldtInVestiging(vorm, vestiging)) return nee('vestiging', `${vorm.naam} geeft geen toegang tot deze vestiging.`)
  if (!binnenDaluren(vorm, moment.weekdag, moment.minuten)) return nee('daluren', `Buiten de daluren: ${dalTekst(vorm)}`)
  return MAG
}

export interface LesAanvraag {
  vestiging: string
  /** Begin van de les. */
  start: Moment
  /** Einde van de les in minuten na middernacht (zelfde dag). */
  eindMinuten: number
  /** Lessen die het lid in dezelfde week (ma tot en met zo) al heeft geboekt, deze niet meegeteld. */
  lessenDezeWeek: number
}

/** Mag een lid met deze vorm deze groepsles boeken? */
export function magLesBoeken(vorm: ToegangRegel | null, les: LesAanvraag): ToegangUitslag {
  if (!vorm) return MAG
  if (!vorm.groepslessen) return nee('groepslessen', `${vorm.naam} is zonder groepslessen.`)
  if (!geldtInVestiging(vorm, les.vestiging)) return nee('vestiging', `${vorm.naam} geeft geen toegang tot deze vestiging.`)
  if (!binnenDaluren(vorm, les.start.weekdag, les.start.minuten, les.eindMinuten)) return nee('daluren', `Deze les valt buiten de daluren: ${dalTekst(vorm)}`)
  if (vorm.maxLessenPerWeek !== null && les.lessenDezeWeek >= vorm.maxLessenPerWeek) {
    const n = vorm.maxLessenPerWeek
    return nee('maximum', `Met ${vorm.naam} boek je maximaal ${n} ${n === 1 ? 'les' : 'lessen'} per week, en die zijn al geboekt.`)
  }
  return MAG
}

/** Korte samenvatting van de regels, voor de lijst en de ledenkaart. */
export function regelsTekst(vorm: ToegangRegel, vestigingNaam: (slug: string) => string): string[] {
  const uit: string[] = []
  uit.push(vorm.vestigingen === null ? 'Alle vestigingen' : vorm.vestigingen.map(vestigingNaam).join(', '))
  if (!vorm.groepslessen) uit.push('Geen groepslessen')
  else if (vorm.maxLessenPerWeek !== null) uit.push(`Max ${vorm.maxLessenPerWeek} ${vorm.maxLessenPerWeek === 1 ? 'les' : 'lessen'} per week`)
  else uit.push('Groepslessen onbeperkt')
  if (vorm.dalVan && vorm.dalTot) uit.push(`Daluren ${vorm.dalVan} tot ${vorm.dalTot}${vorm.dalWeekendVrij ? ', weekend vrij' : ''}`)
  return uit
}
