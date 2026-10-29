// ─── Club: de naam van de sportschool (PUUR) ────────────────────────────────
// Besluit Kane (29-10-2026): de naam moet makkelijk aan te passen zijn. De naam
// staat in club_organisaties.naam en is los van het adres (slug): een nieuwe
// naam verandert aiyourgym.com/<slug> nooit mee. De juridische naam staat apart
// in Bedrijfsgegevens (club_bedrijfsgegevens.bedrijfsnaam).
// Fouten zijn codes; de tekst in NL en EN staat in het woordenboek HUISSTIJL.

export const MIN_NAAM = 2
export const MAX_NAAM = 60

export type NaamFout = 'naamLeeg' | 'naamTeKort' | 'naamTeLang' | 'naamTekens' | 'naamBezet'

export type NaamUitslag = { ok: true; naam: string } | { ok: false; code: NaamFout }

/** Spaties aan de randen weg en dubbele spaties enkel. */
export function netteNaam(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

// Stuurtekens en < > horen niet in een naam die in mails, manifest en koppen staat.
// eslint-disable-next-line no-control-regex
const VERBODEN = /[\u0000-\u001f\u007f<>]/

/** Controle van een nieuwe naam: verplicht, 2 tot 60 tekens, geen stuurtekens. */
export function leesSportschoolNaam(v: unknown): NaamUitslag {
  if (typeof v === 'string' && VERBODEN.test(v.replace(/[\t\n\r]/g, ' '))) return { ok: false, code: 'naamTekens' }
  const naam = netteNaam(v)
  if (!naam) return { ok: false, code: 'naamLeeg' }
  if (naam.length < MIN_NAAM) return { ok: false, code: 'naamTeKort' }
  if (naam.length > MAX_NAAM) return { ok: false, code: 'naamTeLang' }
  return { ok: true, naam }
}

/** Is deze naam al van een andere sportschool van dezelfde beheerder? Hoofdletters tellen niet (zoals de unieke index). */
export function isNaamBezet(bestaande: readonly { id: string; naam: string }[], naam: string, eigenId: string): boolean {
  const zoek = netteNaam(naam).toLowerCase()
  return bestaande.some((o) => o.id !== eigenId && netteNaam(o.naam).toLowerCase() === zoek)
}

/** Het voorstel voor de officiele bedrijfsnaam als die nog leeg is: de naam van de sportschool. */
export function bedrijfsnaamVoorstel(bedrijfsnaam: string | null | undefined, sportschool: string): string {
  return bedrijfsnaam && bedrijfsnaam.trim() ? bedrijfsnaam.trim() : sportschool
}
