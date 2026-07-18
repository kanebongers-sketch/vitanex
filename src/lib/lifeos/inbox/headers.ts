// ─── LifeOS — inbox: headers lezen ──────────────────────────────────────────
// PUUR. Gmail's header-array in, `MailMeta` uit. Geen fetch, geen DB.
//
// Eigen bestand naast `classificeer.ts` omdat het een andere vraag beantwoordt:
// dit weet hoe Gmail zijn headers vormgeeft, de classificatie weet wat een mail
// betekent. Zo blijft de classificatie leesbaar zonder RFC-5322-kennis, en is
// dit los te testen tegen rare afzenders.

import type { MailMeta } from './classificeer'

/** Eén header zoals Gmail 'm geeft. */
export interface Header {
  name: string
  value: string
}

/**
 * Headernamen zijn hoofdletterongevoelig (RFC 5322 §1.2.2) en Gmail is daar
 * niet consequent in. `===` op 'From' mist dus een deel van je post.
 */
export function leesHeader(headers: readonly Header[], naam: string): string | null {
  const gezocht = naam.toLowerCase()
  for (const h of headers) {
    if (h.name.toLowerCase() === gezocht) {
      const v = h.value.trim()
      return v.length > 0 ? v : null
    }
  }
  return null
}

/**
 * Alle e-mailadressen in een adres-header.
 *
 * Bewust géén RFC-5322-parser. `To` mag `"Jansen, Jan" <jan@x.nl>, piet@y.nl`
 * zijn — splitsen op komma breekt dan op de naam. We hoeven de lijst niet te
 * begrijpen, alleen te weten wélke adressen erin staan, en daar is een scan naar
 * adres-vormige tokens genoeg voor. Minder code, minder manieren om ernaast te
 * zitten.
 */
export function adressenIn(waarde: string): string[] {
  const treffers = waarde.match(/[^\s<>,;:"]+@[^\s<>,;:"]+/g)
  return treffers ? treffers.map((a) => a.replace(/[.,;]+$/, '')) : []
}

/**
 * Eén adres in de vorm waarin twee schrijfwijzen van hetzelfde postvak gelijk
 * worden.
 *
 * Dit is geen kosmetiek. Zonder normalisatie is `kane+lifeos@gmail.com` in `To`
 * niet gelijk aan `kane@gmail.com` uit je profiel, valt `aanMij` op false, en
 * verdwijnt de mail als "je staat in de cc". Dat is precies het stille
 * fout-negatief waar `classificeer.ts` voor waarschuwt — en je zou het nooit
 * merken.
 *
 * - `+tag` eraf: vrijwel elke provider ondersteunt het, en het adres blijft
 *   hetzelfde postvak.
 * - Punten eraf: ALLEEN bij gmail.com/googlemail.com. Daar negeert Google ze;
 *   op een eigen domein kan `jan.jansen@` een ander mens zijn dan `janjansen@`,
 *   en die twee samenvoegen zou post aan de verkeerde persoon aan jou toewijzen.
 */
export function normaliseerAdres(adres: string): string {
  const kleine = adres.trim().toLowerCase()
  const at = kleine.lastIndexOf('@')
  if (at === -1) return kleine

  const domein = kleine.slice(at + 1)
  let lokaal = kleine.slice(0, at)

  const plus = lokaal.indexOf('+')
  if (plus !== -1) lokaal = lokaal.slice(0, plus)

  if (domein === 'gmail.com' || domein === 'googlemail.com') {
    lokaal = lokaal.replaceAll('.', '')
  }

  return `${lokaal}@${domein}`
}

/** Staat `adres` in deze adres-header? Vergelijkt genormaliseerd. */
export function bevatAdres(waarde: string | null, adres: string): boolean {
  if (waarde === null) return false
  const gezocht = normaliseerAdres(adres)
  return adressenIn(waarde).some((a) => normaliseerAdres(a) === gezocht)
}

export interface Afzender {
  naam: string | null
  adres: string | null
}

/**
 * `From` uit elkaar: `Jan Jansen <jan@x.nl>` → naam + adres.
 *
 * Zonder punthaken is de hele waarde het adres (`jan@x.nl`). Aanhalingstekens
 * rond de naam gaan eraf; die zijn RFC-syntax, geen onderdeel van de naam.
 */
export function leesAfzender(waarde: string | null): Afzender {
  if (waarde === null) return { naam: null, adres: null }

  const punthaak = waarde.match(/^(.*)<([^<>]+)>\s*$/)
  if (punthaak) {
    const [, ruweNaam = '', adres = ''] = punthaak
    const naam = ruweNaam.trim().replace(/^"(.*)"$/, '$1').trim()
    return {
      naam: naam.length > 0 ? naam : null,
      adres: adres.trim().length > 0 ? adres.trim() : null,
    }
  }

  const kaal = waarde.trim()
  return { naam: null, adres: kaal.includes('@') ? kaal : null }
}

/**
 * Headers + Gmail-velden → `MailMeta`.
 *
 * `ontvangenOp` komt uit Gmail's `internalDate` en niet uit de `Date`-header:
 * die laatste zet de afzender zelf, en een verkeerd ingestelde klok (of een
 * spammer die 'm op volgend jaar zet) zou je triage-venster verzieken.
 * `internalDate` is wanneer Gmail 'm ontving — dat is het feit dat we bedoelen.
 *
 * `mijnAdres` komt uit `users.getProfile`. Het `To`-veld wordt hier gelezen,
 * gebruikt voor één ja/nee-vraag, en daarna losgelaten: de adressen van anderen
 * gaan niet mee in `MailMeta` en dus nergens heen.
 *
 * `threadId` komt uit Gmail's bericht-antwoord (zie `gmail.ts`) en reist enkel mee
 * zodat een concept-antwoord ónder het juiste gesprek kan hangen.
 */
export function leesMailMeta(
  id: string,
  threadId: string,
  headers: readonly Header[],
  labels: readonly string[],
  ontvangenOp: Date,
  mijnAdres: string,
): MailMeta {
  const afzender = leesAfzender(leesHeader(headers, 'From'))

  return {
    id,
    threadId,
    afzenderNaam: afzender.naam,
    afzenderAdres: afzender.adres,
    onderwerp: leesHeader(headers, 'Subject'),
    ontvangenOp,
    aanMij: bevatAdres(leesHeader(headers, 'To'), mijnAdres),
    heeftAfmeldlink: leesHeader(headers, 'List-Unsubscribe') !== null,
    precedence: leesHeader(headers, 'Precedence'),
    labels,
  }
}
