// ─── LifeOS — notitie-tags (puur) ───────────────────────────────────────────
// Vrije labels op een brain dump. Puur en testbaar: geen fetch, geen DB, geen
// React. De normalisatie hieronder is de systeemgrens voor alles wat een tag
// aanraakt — client, route en DB krijgen zo dezelfde tag te zien.
//
// WAAROM STRENG NORMALISEREN (en lowercase):
//   Tags zijn retrieval-labels, geen prose. Door te trimmen, witruimte in te
//   klappen en te lowercasen krijg je betrouwbare dedup ("Werk" en "werk" zijn
//   één label) en een voorspelbaar filter: dezelfde tekst → altijd dezelfde tag,
//   dus "toon alles met #werk" mist nooit een rij door een hoofdletter.

export const MAX_TAG_LENGTE = 32
export const MAX_TAGS = 24

/**
 * Normaliseert één tag, of `null` als er niets bruikbaars overblijft.
 *
 * Trimt, klapt interne witruimte in tot één spatie, lowercase, en kapt op de
 * limiet. Niet-tekst en leeg worden `null` — dat is de weigering, niet een lege
 * string die verderop alsnog een "tag" wordt.
 */
export function normaliseerTag(ruw: unknown): string | null {
  if (typeof ruw !== 'string') return null
  const schoon = ruw.trim().replace(/\s+/g, ' ').toLowerCase()
  if (schoon.length === 0) return null
  return schoon.slice(0, MAX_TAG_LENGTE)
}

/**
 * Narrowt een tags-array (uit de DB of over de draad) naar schone, ontdubbelde
 * labels. Rommel valt weg i.p.v. door te lekken; het aantal wordt begrensd,
 * gelijk aan de DB-check uit migratie 090.
 */
export function leesTags(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const uit: string[] = []
  for (const item of v) {
    const tag = normaliseerTag(item)
    if (tag !== null && !uit.includes(tag)) uit.push(tag)
    if (uit.length >= MAX_TAGS) break
  }
  return uit
}

/**
 * Is de tag-limiet de reden dat deze toevoeging niet zou landen? Waar als de tag
 * geldig én nieuw is, maar er al `MAX_TAGS` staan.
 *
 * Bestaat zodat de UI een eerlijke melding kan tonen i.p.v. de 25e tag stil te
 * laten verdwijnen: `voegTagToe` geeft bij een volle lijst de tags ongewijzigd
 * terug, en dat is aan de lengte niet te onderscheiden van een dubbele of
 * ongeldige tag. Alleen de limiet-reden verdient een melding — een dubbele tag is
 * geen fout, en een lege invoer heeft de gebruiker zelf in de hand.
 */
export function tagLimietBereikt(tags: readonly string[], ruw: unknown): boolean {
  const tag = normaliseerTag(ruw)
  if (tag === null || tags.includes(tag)) return false
  return tags.length >= MAX_TAGS
}

/**
 * Voegt een tag toe (immutable). Geeft een nieuwe array terug; een ongeldige,
 * dubbele of te-veel-de tag laat de inhoud ongemoeid. De caller ziet aan de
 * lengte of er iets veranderde, en slaat zo een zinloze PATCH over.
 */
export function voegTagToe(tags: readonly string[], ruw: unknown): string[] {
  const tag = normaliseerTag(ruw)
  if (tag === null || tags.includes(tag) || tags.length >= MAX_TAGS) return tags.slice()
  return [...tags, tag]
}

/**
 * Verwijdert een tag (immutable). Normaliseert het argument, zodat "Werk" ook de
 * opgeslagen 'werk' raakt.
 */
export function verwijderTag(tags: readonly string[], ruw: unknown): string[] {
  const tag = normaliseerTag(ruw)
  if (tag === null) return tags.slice()
  return tags.filter((t) => t !== tag)
}
