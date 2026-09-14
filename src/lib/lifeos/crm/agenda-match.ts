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
