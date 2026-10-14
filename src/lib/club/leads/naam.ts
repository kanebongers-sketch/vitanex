// ─── Fit Factory Club: een naam splitsen (PUUR) ─────────────────────────────
// Een lead heeft een naam in een veld ("Sanne van der Berg"); een lid heeft
// voornaam en achternaam. De achternaam begint bij het eerste tussenvoegsel
// (zoals in de rest van de clubsoftware: achternaam "van der Berg"). Zonder
// tussenvoegsel is het laatste woord de achternaam.

const TUSSENVOEGSELS = new Set([
  'van', 'de', 'der', 'den', 'het', "'t", 't', 'ter', 'ten', 'te', 'op', 'in', 'aan', 'bij', 'uit', 'onder',
  'voor', 'over', 'd\'', 'la', 'le', 'du', 'da', 'di', 'del', 'des', 'von', 'zu', 'vd', 'v.d.',
])

export interface GesplitsteNaam {
  voornaam: string
  /** Leeg als de naam maar uit een woord bestaat. */
  achternaam: string
}

function isTussenvoegsel(woord: string): boolean {
  return TUSSENVOEGSELS.has(woord.toLowerCase())
}

/** "Jan van der Berg" wordt { voornaam: "Jan", achternaam: "van der Berg" }. */
export function splitsNaam(volledig: string): GesplitsteNaam {
  const woorden = volledig.trim().split(/\s+/).filter(Boolean)
  if (woorden.length === 0) return { voornaam: '', achternaam: '' }
  if (woorden.length === 1) return { voornaam: woorden[0], achternaam: '' }
  // Het eerste woord is altijd (een deel van) de voornaam, ook als het "Van" is.
  const start = woorden.findIndex((w, i) => i > 0 && isTussenvoegsel(w))
  // Alleen tussenvoegsels en geen echte achternaam erna ("Jan van"): laatste woord.
  const heeftAchternaamNa = start > 0 && woorden.slice(start).some((w) => !isTussenvoegsel(w))
  const knip = heeftAchternaamNa ? start : woorden.length - 1
  return { voornaam: woorden.slice(0, knip).join(' '), achternaam: woorden.slice(knip).join(' ') }
}
