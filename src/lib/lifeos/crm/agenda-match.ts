// ─── LifeOS — agenda ↔ persoon koppelen (puur) ──────────────────────────────
// Zet je een afspraak in Google ("Training Sanne"), dan hoort LifeOS te weten dat
// dat over je PT-klant Sanne gaat. De Google-fetch haalt geen deelnemers op, dus
// het enige signaal is de TITEL. Dit bestand matcht die titel tegen je CRM-namen —
// puur, geen fetch, geen DB — zodat de mail én Vita dezelfde koppeling tonen.
//
// TWEE REGELS, IN VOLGORDE:
//   1. Volledige naam die aaneengesloten in de titel staat (sterkste signaal).
//   2. Anders: een voornaam (eerste naamdeel) die als los woord in de titel staat.
// Matcht er in een stap méér dan één persoon (twee mensen met dezelfde voornaam),
// dan koppelen we NIET — we melden 'ambigu'. Liever geen koppeling dan de verkeerde
// persoon aan je afspraak hangen.

import type { Persoon, Groep } from './crm'

export type PersoonMatch =
  | { soort: 'geen' }
  | { soort: 'match'; persoon: Persoon }
  | { soort: 'ambigu'; kandidaten: Persoon[] }

/** Woord-tokens, lowercase, inclusief accenten (é, ï). Leestekens vallen weg. */
function tokens(tekst: string): string[] {
  return tekst.toLowerCase().match(/\p{L}+/gu) ?? []
}

/** Komt `naald` (een reeks tokens) aaneengesloten voor in `hooiberg`? */
function bevatReeks(hooiberg: readonly string[], naald: readonly string[]): boolean {
  if (naald.length === 0) return false
  for (let i = 0; i + naald.length <= hooiberg.length; i++) {
    let gelijk = true
    for (let j = 0; j < naald.length; j++) {
      if (hooiberg[i + j] !== naald[j]) {
        gelijk = false
        break
      }
    }
    if (gelijk) return true
  }
  return false
}

/**
 * Welke CRM-persoon hoort bij deze afspraak-titel? Zie de kop voor de regels.
 * Whole-word (op tokens), hoofdletter-ongevoelig; een deel van een langer woord
 * telt niet ("Tom" matcht niet in "Tomaten").
 */
export function matchPersoonInTitel(titel: string | null, personen: readonly Persoon[]): PersoonMatch {
  const titelTokens = tokens(titel ?? '')
  if (titelTokens.length === 0) return { soort: 'geen' }

  // 1) Volledige naam, aaneengesloten. Wint van een losse voornaam.
  const volledig = personen.filter((p) => {
    const naamTokens = tokens(p.naam)
    return naamTokens.length > 0 && bevatReeks(titelTokens, naamTokens)
  })
  if (volledig.length === 1) return { soort: 'match', persoon: volledig[0] }
  if (volledig.length > 1) return { soort: 'ambigu', kandidaten: volledig }

  // 2) Unieke voornaam (eerste naamdeel) als los woord in de titel.
  const voornaam = personen.filter((p) => {
    const naamTokens = tokens(p.naam)
    return naamTokens.length > 0 && titelTokens.includes(naamTokens[0])
  })
  if (voornaam.length === 1) return { soort: 'match', persoon: voornaam[0] }
  if (voornaam.length > 1) return { soort: 'ambigu', kandidaten: voornaam }

  return { soort: 'geen' }
}

const GROEP_KORT: Record<Groep, string> = {
  pt_klant: 'PT-klant',
  budel_team: 'Team Budel',
  pt_team: 'PT-team',
  management: 'Management',
  marketing: 'Marketing',
}

/** Korte, enkelvoudige groepnaam voor een inline-tag ("PT-klant"). */
export function groepKort(groep: Groep): string {
  return GROEP_KORT[groep]
}

/**
 * De koppel-tekst voor achter een afspraak, of `null` als er niets te tonen is.
 * Een match wordt "Naam · PT-klant"; ambiguïteit wordt eerlijk gemeld i.p.v.
 * gegokt; geen match levert niets op (geen ruis achter elke afspraak).
 */
export function koppelTekst(match: PersoonMatch): string | null {
  if (match.soort === 'match') return `${match.persoon.naam} · ${groepKort(match.persoon.groep)}`
  if (match.soort === 'ambigu') return 'meerdere mogelijke personen'
  return null
}

// ─── Automatisch hernoemen (schrijft naar de agenda) ────────────────────────
// De tag die achter de naam komt bij een hernoem. Bewust kort: PT-klant → "PT",
// teamlid → "Team". Zo staat er "Kevin Cranenbroeck PT" in je agenda.
export function groepTag(groep: Groep): string {
  switch (groep) {
    case 'pt_klant':
      return 'PT'
    case 'management':
      return 'MT'
    default:
      return 'Team'
  }
}

/** De canonieke titel voor een persoon: volledige naam + rol-tag. */
export function canoniekeTitel(persoon: Persoon): string {
  return `${persoon.naam.trim()} ${groepTag(persoon.groep)}`
}

/**
 * Moet deze afspraak-titel herschreven worden, en zo ja waarnaar? `null` = met rust
 * laten. Dit is de POORT vóór een schrijf naar je agenda, dus streng:
 *
 *   1. De titel moet eenduidig naar één persoon wijzen (nooit bij twijfel).
 *   2. De titel moet een "kale naam" zijn — alleen naam-woorden, geen extra context.
 *      Zo wordt "Kevin" wél "Kevin Cranenbroeck PT", maar "Training Kevin met intake"
 *      met rust gelaten: we mangelen nooit een rijkere titel.
 *   3. De titel mag nog niet de canonieke vorm zijn (idempotent — geen dubbele "PT").
 */
export function bepaalHernoem(
  titel: string | null,
  personen: readonly Persoon[],
): { nieuweTitel: string } | null {
  const match = matchPersoonInTitel(titel, personen)
  if (match.soort !== 'match') return null

  const canoniek = canoniekeTitel(match.persoon)
  const huidige = (titel ?? '').trim()
  if (huidige === canoniek) return null // al goed — nooit opnieuw schrijven

  // Alleen een kale naam: elk woord in de titel is een naam-woord van deze persoon.
  const titelTokens = tokens(huidige)
  const naamTokens = tokens(match.persoon.naam)
  const kaleNaam = titelTokens.length > 0 && titelTokens.every((t) => naamTokens.includes(t))
  if (!kaleNaam) return null

  return { nieuweTitel: canoniek }
}

/**
 * De canonieke titel als de titel AL de canonieke vorm van precies één persoon is,
 * anders `null`. Gebruikt om een al-goede afspraak alsnog als "van LifeOS" vast te
 * leggen (backfill), zodat een latere correctie erop óók herkend wordt — ook voor
 * afspraken die een eerdere versie zonder geheugen al had hernoemd.
 */
export function alCanoniekVoorPersoon(titel: string | null, personen: readonly Persoon[]): string | null {
  const match = matchPersoonInTitel(titel, personen)
  if (match.soort !== 'match') return null
  const canoniek = canoniekeTitel(match.persoon)
  return (titel ?? '').trim() === canoniek ? canoniek : null
}
