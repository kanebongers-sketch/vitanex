// ─── LifeOS — markdown-ontleder voor notities (puur) ────────────────────────
// Puur bestand: geen fetch, geen DB, geen React. Het geeft een STRUCTUUR terug,
// geen HTML-string — en dat is de belangrijkste beslissing in dit bestand.
//
// ─── WAAROM GEEN LIBRARY EN GEEN HTML-STRING ────────────────────────────────
//
//   De standaardoplossing is `marked`/`markdown-it` + `dangerouslySetInnerHTML`.
//   Die combinatie is precies de XSS-bug die je niet wilt in een app waar je je
//   eigen tekst plakt: één `<img onerror=...>` uit een gekopieerd stuk web en je
//   voert vreemde code uit met jouw sessie. Sanitizen (`DOMPurify`) repareert
//   dat, maar dan draai je een parser om HTML te maken en een tweede om diezelfde
//   HTML weer te ontgiften — twee dependencies om een gat te dichten dat we ook
//   gewoon niet kunnen graven.
//
//   Deze ontleder produceert nooit HTML. Hij produceert `Blok[]`, en de
//   component bouwt daar React-elementen van. Onbekende tekst kan daardoor per
//   constructie alleen TEKST worden, nooit markup: `<script>` in je notitie is
//   het woord "<script>". Er is geen `dangerouslySetInnerHTML` in het pad, dus er
//   is geen sanitizer nodig — dat is de veilige versie van "los het op".
//
//   De prijs, eerlijk: dit is een DEELVERZAMELING van markdown. Koppen, vet,
//   cursief, code, lijsten, verwijzingen. Geen tabellen, geen blockquotes, geen
//   afbeeldingen, geen gewone links, geen geneste lijsten. Wat we niet kennen,
//   tonen we as-is als tekst — nooit stil weggelaten, want een notitie die stukjes
//   van zichzelf verliest is erger dan een notitie met een letterlijk sterretje.

import { LINK_PATROON, normaliseerTitel } from './links'

/** Eén stukje tekst binnen een regel. `kinderen` maakt `**vet met `code`**` mogelijk. */
export type Inline =
  | { soort: 'tekst'; waarde: string }
  | { soort: 'code'; waarde: string }
  | { soort: 'link'; titel: string }
  | { soort: 'vet'; kinderen: Inline[] }
  | { soort: 'cursief'; kinderen: Inline[] }

/** Eén blok. Het niveau van een kop is het BRON-niveau (`##` = 2), niet het DOM-niveau. */
export type Blok =
  | { soort: 'kop'; niveau: number; inhoud: Inline[] }
  | { soort: 'alinea'; inhoud: Inline[] }
  | { soort: 'lijst'; geordend: boolean; items: Inline[][] }
  | { soort: 'codeblok'; waarde: string }

/**
 * Hoe diep `**vet**` in `*cursief*` in … genest mag worden voordat we stoppen en
 * de rest als platte tekst teruggeven. Vier niveaus is meer dan iemand ooit
 * schrijft; de grens staat er zodat een pathologische invoer (`***********`) de
 * recursie niet laat ontsporen.
 */
const MAX_DIEPTE = 4

const KOP = /^(#{1,6})\s+(.*)$/
const FENCE = /^\s*```/
/** `- `, `* `, `+ ` = ongeordend; `1. `, `2) ` = geordend. De spatie is verplicht. */
const LIJST_ONGEORDEND = /^\s{0,3}[-*+]\s+(.*)$/
const LIJST_GEORDEND = /^\s{0,3}\d{1,9}[.)]\s+(.*)$/

/**
 * De inline-tokens, op VOLGORDE VAN VOORRANG — en die volgorde is load-bearing:
 *
 *   1. code   — eerst, want in `` `[[x]]` `` is [[x]] geen verwijzing. Dit is
 *               dezelfde regel die `maskeerCode` in links.ts hanteert; als deze
 *               twee uiteenlopen, krijgt de grafiek kanten die je niet ziet.
 *               (links.test.ts bewijst dat ze het eens zijn.)
 *   2. **vet** — vóór *cursief*, anders eet cursief de eerste twee sterren op.
 *   3. *cursief*
 *   4. [[link]]
 *
 * Vet én cursief eisen allebei `[^\s*]` als eerste teken van de inhoud. Dat doet
 * twee dingen:
 *
 *   - `** vet **` is geen opmaak (net als in CommonMark): een sterretje met een
 *     spatie erachter is bijna altijd gewoon een sterretje.
 *   - Sterretjessoep (`****`, `***********`) blijft TEKST in plaats van te
 *     imploderen tot een handvol lege vet-nodes. Zonder die eis matcht
 *     `**([\s\S]+?)**` op `*****` en verdwijnen er tekens uit je notitie — de
 *     ene fout die deze functie niet mag maken.
 *
 * De link-tak komt uit `LINK_PATROON` (links.ts) en staat hier bewust NIET nog
 * eens uitgeschreven: de syntax van een verwijzing hoort op één plek te wonen.
 * Wijkt het scherm af van wat `parseLinks` naar de database schrijft, dan krijgt
 * de grafiek kanten die je in je tekst niet ziet.
 *
 * Elke tak heeft precies één capture-groep, dus de volgorde hieronder bepaalt de
 * groepsnummers in `leesToken`: 1 = code, 2 = vet, 3 = cursief, 4 = link.
 */
const INLINE = new RegExp(
  [
    '`([^`\\n]+)`',
    '\\*\\*([^\\s*][\\s\\S]*?)\\*\\*',
    '\\*([^\\s*][\\s\\S]*?)\\*',
    LINK_PATROON.source,
  ].join('|'),
  'g',
)

/**
 * Ontleedt de tekst van een notitie tot blokken.
 *
 * Nooit `null`, nooit een fout: elke string is geldige invoer. Wat geen markdown
 * is, is een alinea.
 */
export function ontleedMarkdown(tekst: string): Blok[] {
  if (typeof tekst !== 'string' || tekst.trim().length === 0) return []

  const regels = tekst.split(/\r?\n/)
  const blokken: Blok[] = []
  let i = 0

  while (i < regels.length) {
    const regel = regels[i]

    if (regel.trim().length === 0) {
      i++
      continue
    }
    if (FENCE.test(regel)) {
      const gelezen = leesCodeblok(regels, i)
      blokken.push(gelezen.blok)
      i = gelezen.volgende
      continue
    }

    const kop = KOP.exec(regel)
    if (kop) {
      blokken.push({ soort: 'kop', niveau: kop[1].length, inhoud: ontleedInline(kop[2]) })
      i++
      continue
    }

    if (isLijstRegel(regel)) {
      const gelezen = leesLijst(regels, i)
      blokken.push(gelezen.blok)
      i = gelezen.volgende
      continue
    }

    const gelezen = leesAlinea(regels, i)
    blokken.push(gelezen.blok)
    i = gelezen.volgende
  }

  return blokken
}

function isLijstRegel(regel: string): boolean {
  return LIJST_ONGEORDEND.test(regel) || LIJST_GEORDEND.test(regel)
}

/**
 * Een fence tot de sluitende ``` — of tot het einde van de tekst als die
 * ontbreekt. Dat laatste is bewust: je bent aan het typen, de fence is nog niet
 * af, en dan is de rest code. `maskeerCode` in links.ts doet exact hetzelfde.
 */
function leesCodeblok(regels: readonly string[], start: number): { blok: Blok; volgende: number } {
  const inhoud: string[] = []
  let i = start + 1

  while (i < regels.length && !FENCE.test(regels[i])) {
    inhoud.push(regels[i])
    i++
  }

  // i wijst nu op de sluitende fence (die we overslaan) of voorbij het einde.
  return { blok: { soort: 'codeblok', waarde: inhoud.join('\n') }, volgende: i + 1 }
}

/**
 * Opeenvolgende regels van dezelfde soort worden één lijst. Wisselt de soort
 * (`- a` gevolgd door `1. b`), dan begint er een nieuwe lijst — anders zou een
 * genummerde stap stil in een bullet-lijst verdwijnen.
 */
function leesLijst(regels: readonly string[], start: number): { blok: Blok; volgende: number } {
  const geordend = LIJST_GEORDEND.test(regels[start])
  const patroon = geordend ? LIJST_GEORDEND : LIJST_ONGEORDEND
  const items: Inline[][] = []
  let i = start

  while (i < regels.length) {
    const treffer = patroon.exec(regels[i])
    if (!treffer) break
    items.push(ontleedInline(treffer[1]))
    i++
  }

  return { blok: { soort: 'lijst', geordend, items }, volgende: i }
}

/**
 * Een alinea loopt tot een lege regel of tot een blok dat duidelijk iets anders
 * is. De regels blijven met `\n` aan elkaar (niet met een spatie, zoals
 * standaard-markdown): in een notitie is een enter een enter. De component
 * rendert die met `white-space: pre-wrap`.
 */
function leesAlinea(regels: readonly string[], start: number): { blok: Blok; volgende: number } {
  const inhoud: string[] = []
  let i = start

  while (i < regels.length) {
    const regel = regels[i]
    if (regel.trim().length === 0) break
    if (FENCE.test(regel) || KOP.test(regel) || isLijstRegel(regel)) break
    inhoud.push(regel)
    i++
  }

  return { blok: { soort: 'alinea', inhoud: ontleedInline(inhoud.join('\n')) }, volgende: i }
}

/**
 * Ontleedt één stuk tekst tot inline-tokens. Recursief voor vet/cursief; code en
 * verwijzingen zijn bladeren (in `` `code` `` zit per definitie geen opmaak).
 *
 * Een `[[...]]` met een ongeldige titel (leeg, alleen witruimte, te lang) wordt
 * gewoon TEKST — je ziet dan letterlijk `[[   ]]` staan. Niet stil weglaten: dan
 * zou een deel van je notitie verdwijnen omdat de titel twee tekens te lang was.
 */
export function ontleedInline(tekst: string, diepte = 0): Inline[] {
  if (tekst.length === 0) return []
  if (diepte >= MAX_DIEPTE) return [{ soort: 'tekst', waarde: tekst }]

  const uit: Inline[] = []
  let gelezen = 0

  // `matchAll` geeft een verse iterator met eigen lastIndex — veilig voor de
  // recursie hieronder, die hetzelfde patroon opnieuw gebruikt.
  for (const treffer of tekst.matchAll(INLINE)) {
    const index = treffer.index
    const token = leesToken(treffer, diepte)
    if (token === null) continue

    if (index > gelezen) uit.push({ soort: 'tekst', waarde: tekst.slice(gelezen, index) })
    uit.push(token)
    gelezen = index + treffer[0].length
  }

  if (gelezen < tekst.length) uit.push({ soort: 'tekst', waarde: tekst.slice(gelezen) })
  return uit
}

/** Eén regex-treffer → één token, of `null` als het toch gewoon tekst is. */
function leesToken(treffer: RegExpExecArray | RegExpMatchArray, diepte: number): Inline | null {
  // Expliciet `| undefined`: bij een alternatie is precies één tak gevuld en zijn
  // de andere groepen undefined. De ingebouwde typering zegt `string` voor elk
  // element — dat is hier niet waar, en op die leugen leunt de rest van deze
  // functie. Liever het type dat klopt dan een `!` verderop.
  const [, code, vet, cursief, link]: readonly (string | undefined)[] = treffer

  if (code !== undefined) return { soort: 'code', waarde: code }
  if (vet !== undefined) return { soort: 'vet', kinderen: ontleedInline(vet, diepte + 1) }
  if (cursief !== undefined) return { soort: 'cursief', kinderen: ontleedInline(cursief, diepte + 1) }

  if (link !== undefined) {
    const titel = normaliseerTitel(link)
    // Ongeldige titel → geen token; de tekst valt terug in de omliggende
    // 'tekst'-node, inclusief haken. Zie de doc-comment hierboven.
    return titel === null ? null : { soort: 'link', titel }
  }
  return null
}

/**
 * Alle verwijzingen in een ontlede tekst, in leesvolgorde en mét duplicaten.
 *
 * Bestaat om de invariant met `parseLinks` te kunnen bewijzen (links.test.ts) en
 * om de component te laten weten welke titels hij moet opzoeken. Ontdubbelen is
 * de taak van `parseLinks` — dat is de kant die naar de database gaat.
 */
export function linksInBlokken(blokken: readonly Blok[]): string[] {
  const uit: string[] = []

  const loopInline = (nodes: readonly Inline[]): void => {
    for (const node of nodes) {
      if (node.soort === 'link') uit.push(node.titel)
      else if (node.soort === 'vet' || node.soort === 'cursief') loopInline(node.kinderen)
    }
  }

  for (const blok of blokken) {
    if (blok.soort === 'kop' || blok.soort === 'alinea') loopInline(blok.inhoud)
    else if (blok.soort === 'lijst') blok.items.forEach(loopInline)
  }
  return uit
}
