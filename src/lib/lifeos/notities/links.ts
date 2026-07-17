// ─── LifeOS — verwijzingen tussen notities: `[[Titel]]` (puur) ──────────────
// Puur bestand: geen fetch, geen DB, geen React. De syntax van een verwijzing
// woont hier, en nergens anders — `markdown.ts` (het renderen) en `kennis.ts`
// (het opslaan) lezen allebei vanaf hier, zodat de grafiek nooit een kant kan
// bevatten die je in je tekst niet ziet staan.
//
// ─── WAAROM `[[Titel]]` EN NIET EEN ID ──────────────────────────────────────
//   Een verwijzing op id (`[[note:8f3a…]]`) is technisch netter: hij breekt niet
//   als je hernoemt. Maar dan moet je de notitie eerst opzoeken vóór je 'm kunt
//   noemen, en dat is precies de wrijving die de brain dump niet mag hebben.
//   Op titel schrijven kan blind, midden in een zin, terwijl je denkt.
//
//   De prijs, eerlijk: hernoem je een notitie, dan wijzen bestaande `[[oude
//   titel]]` er niet meer naartoe — ze vallen terug naar "wanted link" (zie
//   `hersyncTitel` in kennis.ts). Dat is zichtbaar, niet stil: de link krijgt in
//   de UI de "bestaat nog niet"-stijl. Beter een zichtbare losse eindjes dan een
//   verwijzing die stil naar iets anders gaat wijzen.

/**
 * Zelfde grens als de DB (`notities_titel_lengte`, migratie 110) en als
 * `projecten.naam`. Een titel is een naam, geen alinea.
 */
export const MAX_TITEL_LENGTE = 120

/**
 * Hoeveel verwijzingen we uit één notitie halen. Een notitie met 200
 * `[[...]]` is geen notitie maar een index; de grafiek wordt er onleesbaar van
 * en de sync doet 200 inserts. De parser kapt af — en `parseLinks` is puur, dus
 * de caller ziet aan de lengte dát er afgekapt is.
 */
export const MAX_LINKS_PER_NOTITIE = 50

/**
 * De syntax van een verwijzing: `[[` … `]]`, zonder haken in het midden.
 *
 * `[^[\]]+` (geen haken binnenin) doet twee dingen tegelijk:
 *   - `[[Ongesloten` matcht niet — er komt nooit een halve link uit.
 *   - `[[a[[b]]]]` matcht alleen de binnenste `[[b]]`. Geneste verwijzingen
 *     bestaan niet; de buitenste is dan gewoon tekst met haken eromheen.
 *
 * Global + sticky-vrij: hergebruik via `matchAll` (die reset `lastIndex` niet
 * tussen aanroepen door — daarom is dit een const die je alleen aan `matchAll`
 * geeft, nooit aan `.test()`).
 */
export const LINK_PATROON = /\[\[([^[\]]+)\]\]/g

/**
 * Normaliseert een titel, of `null` als er geen bruikbare titel overblijft.
 *
 * Trimt en klapt witruimte in — `[[ Marge  model ]]` en `[[Marge model]]` zijn
 * dezelfde verwijzing, want dat is wat een mens bedoelt.
 *
 * ANDERS DAN `normaliseerTag` op twee punten, allebei met opzet:
 *
 *   1. GEEN lowercase. Een tag is een retrieval-label, een titel is prose die je
 *      leest ("Marge-model", niet "marge-model"). De hoofdletters blijven staan
 *      voor het oog; het MATCHEN gebeurt hoofdletterloos via `titelSleutel`.
 *   2. Te lang → `null` (weigeren), niet `.slice()` (afkappen). Een afgekapte
 *      tag is nog steeds een bruikbaar label; een afgekapte titel wijst stil
 *      naar een ándere notitie dan je typte. Dat mag nooit stil gebeuren.
 */
export function normaliseerTitel(ruw: unknown): string | null {
  if (typeof ruw !== 'string') return null
  const schoon = ruw.trim().replace(/\s+/g, ' ')
  if (schoon.length === 0) return null
  if (schoon.length > MAX_TITEL_LENGTE) return null
  return schoon
}

/**
 * De vergelijkingssleutel van een titel: genormaliseerd én hoofdletterloos.
 *
 * Spiegelt exact de gegenereerde kolom uit migratie 110
 * (`nullif(lower(btrim(titel)), '')`). Zo matcht de app op precies dezelfde
 * manier als de unieke index in de database — anders zou de app twee notities
 * "hetzelfde" noemen die de DB als verschillend toeliet, of andersom.
 */
export function titelSleutel(ruw: unknown): string | null {
  const titel = normaliseerTitel(ruw)
  return titel === null ? null : titel.toLowerCase()
}

/**
 * Blindeert code, zodat `[[...]]` erin géén verwijzing wordt.
 *
 * ─── WAAROM DIT BESTAAT ────────────────────────────────────────────────────
 *   Zonder deze stap zou een notitie met `` `[[Titel]]` `` (code-span) een kant
 *   in de grafiek krijgen die je in de gerenderde tekst nergens ziet staan —
 *   daar is het immers code, geen link. Een grafiek met onzichtbare kanten is
 *   erger dan een grafiek zonder die kant.
 *
 *   Dit is dezelfde voorrangsregel die `markdown.ts` hanteert (de inline-parser
 *   consumeert code-spans vóór links). Dat is bewust twee implementaties van
 *   dezelfde regel: `parseLinks` moet ruwe tekst aankunnen zonder de hele
 *   markdown-AST te bouwen. De invariant wordt getest — zie links.test.ts,
 *   "parseLinks en de markdown-parser zijn het altijd eens".
 *
 * Een ONGESLOTEN fence loopt tot het einde (`` ``` `` zonder wederhelft): dat is
 * wat elke markdown-renderer doet, en `markdown.ts` doet het ook. Zou dat hier
 * niet zo zijn, dan week de grafiek weer af van wat je ziet.
 *
 * ─── DE FENCE MOET AAN HET REGELBEGIN STAAN ────────────────────────────────
 *   `markdown.ts` opent een codeblok ALLEEN bij een regel die (na eventuele
 *   witruimte) met `` ``` `` begint — `FENCE = /^\s*``` /`, per regel getest. Een
 *   losse `` ``` `` MIDDEN in een zin ("zie ``` voor de config") is daar gewoon
 *   tekst, en de `[[link]]` erachter rendert dus als link.
 *
 *   Deze functie deed dat eerst NIET: ze matchte `` ``` `` overal, en de
 *   ongesloten-fence-regel maskeerde vanaf zo'n losse `` ``` `` alles tot het
 *   einde van de tekst. Elke verwijzing daarna verdween stil uit `parseLinks` —
 *   terwijl `markdown.ts` ze toonde. De grafiek miste dan kanten die op het
 *   scherm stonden: precies de divergentie die de kop hierboven belooft te
 *   voorkomen, maar omgekeerd.
 *
 *   Daarom ankeren beide fence-regels nu op regelbegin (`^[ \t]*```` met de
 *   `m`-vlag), exact zoals `markdown.ts`. Een `` ``` `` midden in een regel valt
 *   erbuiten en blijft staan; de code-span-stap raakt 'm ook niet (die eist een
 *   sluitende backtick op dezelfde regel). Zo zijn de twee parsers het weer eens.
 */
export function maskeerCode(tekst: string): string {
  return tekst
    // Gesloten fence: een regel die met ``` begint, tot en met de eerstvolgende
    // regel die met ``` begint.
    .replace(/^[ \t]*```[\s\S]*?\n[ \t]*```[^\n]*$/gm, ' ')
    // Ongesloten fence: een resterende ```-openingsregel loopt tot het einde.
    .replace(/^[ \t]*```[\s\S]*$/m, ' ')
    // Code-span: `...` op één regel. Een losse ``` midden in een zin heeft geen
    // sluitende backtick en valt hier dus buiten — net als in markdown.ts.
    .replace(/`[^`\n]+`/g, ' ')
}

/**
 * Alle verwijzingen uit een stuk tekst, in leesvolgorde.
 *
 * Genormaliseerd, ontdubbeld (hoofdletterloos: `[[Marge]]` en `[[marge]]` zijn
 * één verwijzing) en afgekapt op `MAX_LINKS_PER_NOTITIE`. De teruggegeven titels
 * behouden hun hoofdletters — de eerste schrijfwijze in de tekst wint, want die
 * is wat je typte.
 *
 * Lege (`[[]]`), witruimte-only (`[[   ]]`) en te lange verwijzingen vallen weg:
 * dat zijn geen verwijzingen maar haken.
 */
export function parseLinks(tekst: string): string[] {
  if (typeof tekst !== 'string' || tekst.length === 0) return []

  const bron = maskeerCode(tekst)
  const uit: string[] = []
  const gezien = new Set<string>()

  for (const treffer of bron.matchAll(LINK_PATROON)) {
    const titel = normaliseerTitel(treffer[1])
    if (titel === null) continue

    const sleutel = titel.toLowerCase()
    if (gezien.has(sleutel)) continue

    gezien.add(sleutel)
    uit.push(titel)
    if (uit.length >= MAX_LINKS_PER_NOTITIE) break
  }

  return uit
}

/**
 * Het antwoord van `GET /api/lifeos/notities/titels` → een set titelsleutels.
 *
 * Geeft `null` bij een kapot antwoord, én bij `afgekapt: true`. Dat tweede is
 * het punt: hebben we niet álle titels, dan mag de UI van geen enkele verwijzing
 * beweren dat hij niet bestaat — misschien zit hij in het deel dat we misten.
 * `null` betekent hier "ik weet het niet", en dat is een geldig antwoord dat de
 * UI naar de neutrale stijl vertaalt.
 */
export function leesTitelsAntwoord(ruw: unknown): Set<string> | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  if (!Array.isArray(o.titels) || o.afgekapt === true) return null

  const set = new Set<string>()
  for (const titel of o.titels) {
    const sleutel = titelSleutel(titel)
    if (sleutel !== null) set.add(sleutel)
  }
  return set
}

// ─── WAT HIER BEWUST NIET STAAT: `hernoemLinks` ─────────────────────────────
// De verleiding is een functie die bij het hernoemen van een notitie alle
// `[[oude titel]]` in álle andere notities herschrijft. Dat is niet gebouwd, en
// dat is een keuze:
//
//   Het herschrijft de tekst die JIJ typte, in notities die je niet aan het
//   bewerken bent, op basis van een actie elders. Gaat de match ergens mis (in
//   code, in een citaat, in een halve zin), dan is dat stille dataschade in een
//   brain dump — precies de enige onvergeeflijke bug in deze functie.
//
// In plaats daarvan vallen verwijzingen na een hernoeming terug naar "wanted
// link" (zie `hersyncTitel` in kennis.ts). Zichtbaar, omkeerbaar, en jouw tekst
// blijft van jou. De prijs: je repareert ze zelf.
