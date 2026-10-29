// Genereert het merk van AI Your Gym: de paden voor de app, de SVG- en PNG-bestanden
// in docs/aiyourgym/brand/ en de iconen in de (aiyourgym)-groep.
// Draaien vanuit de hoofdmap van de repo: node docs/aiyourgym/brand/bron/genereer.mjs
//
// Logo (besluit Kane 23-10-2026): het embleem. Een vierkante plaat in vier vakken
// met A I boven Y G, zoals een stempel of een lesrooster. Het vak van de Y (Your)
// is gevuld in de tweede kleur. Het embleem is altijd tweekleurig: racegroen met
// creme, of creme met racegroen. Met de hand geconstrueerd in een raster van 100.
// Letters: Big Shoulders Bold (SIL Open Font License 1.1, vrij voor logo's en
// commercieel gebruik), omgezet naar paden. Bron: BigShoulders-Bold-merk.ttf
// (alleen de letters van het merk), licentie ernaast. De Y is een eigen tekening
// (besluit Kane 23-10-2026, variant "A · Strak"), zie EIGEN_Y hieronder.
// Obsidian iron (besluit Kane 29-10-2026): de website gebruikt de iron-variant (iron
// plaat met metalen glans, obsidiaan tekens); zie IRON. Club houdt racegroen.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openSync } from 'fontkit'
import sharp from 'sharp'

const WORTEL = process.cwd()
const BRON = path.dirname(fileURLToPath(import.meta.url))
const UIT_DOCS = path.join(WORTEL, 'docs/aiyourgym/brand')
const WEBSITE = path.join(WORTEL, 'src/app/(aiyourgym)/(website)/aiyourgym')
const CLUB = path.join(WORTEL, 'src/app/(aiyourgym)/(club)/club')

/** Racegroen (besluit Kane 23-10-2026). Geen goud, geen brons, geen smaragd meer. */
const K = {
  racegroen: '#10302A',
  creme: '#F1ECE1',
  flessengroen: '#1E4A40',
  salie: '#A7B5A8',
  inkt: '#111614',
}

/**
 * Obsidian iron (besluit Kane 29-10-2026): de website is helemaal obsidiaan met een
 * koel metaalgrijs accent, geen groen meer. Het embleem op de website is een iron
 * plaat met een rustige metalen glans (licht linksboven, donkerder rechtsonder) en
 * obsidiaan tekens. Racegroen blijft voor de app-iconen van Club en drukwerk.
 */
const IRON = {
  licht: '#C9CDD2', // bovenkant van de glans
  iron: '#A9AFB6', // het accent zelf (zelfde waarde als --iron-accent op de website)
  diep: '#8A9097', // onderkant van de glans, lijnen en details
  obsidiaan: '#0E0F11', // tekens op de plaat, basis van de website
  wit: '#ECEBE7', // gebroken wit: het woordmerk op obsidiaan
}

const r2 = (v) => Math.round(v * 100) / 100
const r4 = (v) => Math.round(v * 10000) / 10000
const rect = (x, y, b, h) => `M${r2(x)} ${r2(y)}H${r2(x + b)}V${r2(y + h)}H${r2(x)}Z`
const kort = (d) => d.replace(/-?\d+\.\d+/g, (v) => String(r2(+v)))

// ── Letters naar paden ──────────────────────────────────────────────────────
const font = openSync(path.join(BRON, 'BigShoulders-Bold-merk.ttf'))

/**
 * Eigen Y ("A · Strak"), in fonteenheden van Big Shoulders (2000 per em, y omhoog,
 * basislijn 0, kapitaalhoogte 1600). Symmetrisch rond x = 433,5, zelfde breedte,
 * zijkanten en voortgang (867) als de Y van de letter, dus de spatiering blijft gelijk.
 * - Stam 257 breed (305 tot 562), net als de I.
 * - Armen recht, kopjes plat en 270 breed: haaks op de haal 255, gelijk aan de
 *   poten van de A (262) en de stam van de I (257).
 * - De buitenkant van de armen raakt de stam precies op halve hoogte (800);
 *   de binnenhoek (1200) is een scherpe V, zonder inkeping of trapje.
 */
const EIGEN_Y = [[305, 0], [305, 800], [22, 1600], [292, 1600], [433.5, 1200], [575, 1600], [845, 1600], [562, 800], [562, 0]]
const EIGEN_GLYF = { Y: { punten: EIGEN_Y, minX: 22, maxX: 845 } }
const glyfPad = (punten, s, tx, ty) => `M${punten.map(([x, y]) => `${r2(x * s + tx)} ${r2(-y * s + ty)}`).join('L')}Z`

/** Tekst als pad: kapitaalhoogte `kap`, bovenkant kapitalen op y = 0, linkerrand van de inkt op x = 0. */
function tekst(inhoud, { kap = 100, tracking = 0, spatie = 1, dx = 0, dy = 0 } = {}) {
  const s = kap / font.capHeight
  const run = font.layout(inhoud)
  let x = 0
  let links = Infinity
  let rechts = 0
  const glyfen = []
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i]
    const isSpatie = inhoud[i] === ' '
    const eigen = EIGEN_GLYF[inhoud[i]]
    if (eigen || g.path.commands.length) {
      glyfen.push([g, x + pos.xOffset, eigen])
      links = Math.min(links, x + pos.xOffset + (eigen ? eigen.minX : g.path.bbox.minX))
      rechts = Math.max(rechts, x + pos.xOffset + (eigen ? eigen.maxX : g.path.bbox.maxX))
    }
    x += (isSpatie ? pos.xAdvance * spatie : pos.xAdvance) + (isSpatie ? 0 : tracking * font.unitsPerEm)
  })
  const d = glyfen
    .map(([g, gx, eigen]) =>
      eigen ? glyfPad(eigen.punten, s, (gx - links) * s + dx, kap + dy) : g.path.scale(s, -s).translate((gx - links) * s + dx, kap + dy).toSVG(),
    )
    .join('')
  return { d: kort(d), breedte: (rechts - links) * s, hoogte: kap }
}

/** Een letter, optisch gecentreerd in een vak (x0, y0, b, h). */
function letterInVak(l, kap, x0, y0, b, h) {
  const { breedte } = tekst(l, { kap })
  return tekst(l, { kap, dx: x0 + (b - breedte) / 2, dy: y0 + (h - kap) / 2 }).d
}

// ── Het embleem ─────────────────────────────────────────────────────────────
// Plaat 100 x 100 met een rand van 4 in de kleur van de plaat en een dun kruis
// van 3 in de tweede kleur. Het vak van de Y is gevuld tot aan de rand, zodat de
// plaat ook op een ondergrond in de tweede kleur een vierkant blijft. Elke letter
// staat in het midden van de binnenruimte van zijn vak.
const KRUIS = 3
const RAND = 4

function embleemDelen({ kap = 32, kruis = KRUIS, rand = RAND } = {}) {
  const h = kruis / 2
  const VAK = { 0: [rand, 50 - h - rand], 1: [50 + h, 50 - h - rand] } // [begin, breedte]
  const vak = (l, kx, ky) => letterInVak(l, kap, VAK[kx][0], VAK[ky][0], VAK[kx][1], VAK[ky][1])
  const lijnen = kruis ? rect(50 - h, rand, kruis, 100 - 2 * rand) + rect(rand, 50 - h, 100 - 2 * rand, kruis) : ''
  const cel = rect(rand, 50 - h, 50 + h - rand, 50 + h - rand)
  const letters = vak('A', 0, 0) + vak('I', 1, 0) + vak('G', 1, 1)
  const y = vak('Y', 0, 1)
  // Hartlijnen van de zichtbare delen van het kruis (boven tussen A en I, rechts
  // tussen I en G). Daarop tekent het embleem een lijn van precies 1 schermpixel
  // (vector-effect: non-scaling-stroke) als ondergrens: klein in de kop wordt het
  // kruis anders dunner dan een pixel en dan grijs of onzichtbaar. Groot valt die
  // lijn binnen het kruis en zie je hem niet.
  const kruisLijn = kruis ? `M50 ${rand}V${50 - h}M${50 + h} 50H${100 - rand}` : ''
  return { lijnen, cel, letters, y, kruisLijn }
}
const E = embleemDelen()
/** Rechte vlakken in de tweede kleur: kruis en vak Y. Met crispEdges, zodat de randen op hele pixels vallen. */
const RASTER_PAD = E.lijnen + E.cel
/** Ondergrens voor het kruis: 1 schermpixel, zie embleemDelen. */
const KRUIS_LIJN = E.kruisLijn
/** De letters A, I en G, in de tweede kleur (met gladde randen). */
const LETTER_PAD = E.letters
/** De Y, in de kleur van de plaat. */
const Y_PAD = E.y

const VARIANT = {
  licht: { plaat: K.racegroen, teken: K.creme }, // op creme, wit en lichte foto's
  donker: { plaat: K.creme, teken: K.racegroen }, // op racegroen, inkt en donkere foto's
}

/** De metalen glans van de iron plaat: een fijn verloop over het hele embleem (userSpaceOnUse). */
const glans = (id) =>
  `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">` +
  `<stop offset="0" stop-color="${IRON.licht}"/><stop offset=".55" stop-color="${IRON.iron}"/><stop offset="1" stop-color="${IRON.diep}"/></linearGradient></defs>`

// Scherp op elk scherm: de rechte vlakken (plaat, kruis, vak Y) zonder anti-aliasing,
// zodat hun randen op hele pixels vallen en er geen grijze haarlijnen of naden ontstaan.
// De letters houden hun gladde randen.
const SCHERP = 'shape-rendering="crispEdges"'
const kruisLijn = (kleur) =>
  KRUIS_LIJN ? `<path d="${KRUIS_LIJN}" fill="none" stroke="${kleur}" stroke-width="1" vector-effect="non-scaling-stroke" ${SCHERP}/>` : ''

const embleem = ({ plaat, teken }) =>
  `<rect width="100" height="100" fill="${plaat}" ${SCHERP}/><path d="${RASTER_PAD}" fill="${teken}" ${SCHERP}/>${kruisLijn(teken)}` +
  `<path d="${LETTER_PAD}" fill="${teken}"/><path d="${Y_PAD}" fill="${plaat}"/>`

/** Iron (website): plaat en Y met de metalen glans, kruis en letters in obsidiaan. */
const embleemIron = (id = 'iron') => glans(id) + embleem({ plaat: `url(#${id})`, teken: IRON.obsidiaan })

/** Eenkleurig: plaat en Y in de kleur, de rest uitgespaard (werkt op elke ondergrond). */
const embleemEenkleurig = (kleur, id) =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">${embleem({ plaat: '#fff', teken: '#000' })}</mask>` +
  `<rect width="100" height="100" fill="${kleur}" mask="url(#${id})" ${SCHERP}/>`

/** Voor 16 tot 32 pixels: geen kruis (dat wordt een waas), grotere en zwaardere letters. */
const KLEIN = { kap: 35, kruis: 0, rand: 6 }
function embleemKlein({ plaat, teken }) {
  const k = embleemDelen(KLEIN)
  const zwaar = (kleur) => `stroke="${kleur}" stroke-width="3.6" stroke-linejoin="round"`
  return (
    `<rect width="100" height="100" fill="${plaat}" ${SCHERP}/><path d="${k.cel}" fill="${teken}" ${SCHERP}/>` +
    `<path d="${k.letters}" fill="${teken}" ${zwaar(teken)}/><path d="${k.y}" fill="${plaat}" ${zwaar(plaat)}/>`
  )
}

// ── Woordmerk en liggend logo ───────────────────────────────────────────────
const WOORD = tekst('AI YOUR GYM', { kap: 100, tracking: 0.05, spatie: 0.8 })
// Liggend logo: embleem 100 hoog, kapitaalhoogte 100 / 1.9, verticaal gecentreerd,
// gat tussen embleem en woord 0.24 embleem.
const LOGO = (() => {
  const kap = 100 / 1.9
  const s = kap / 100
  const x = 100 + 24
  const y = (100 - kap) / 2
  return { breedte: r2(x + WOORD.breedte * s), hoogte: 100, transform: `matrix(${r4(s)} 0 0 ${r4(s)} ${r2(x)} ${r2(y)})` }
})()

// ── App: merk-paden.ts ──────────────────────────────────────────────────────
const ts = `// Gegenereerd door docs/aiyourgym/brand/bron/genereer.mjs; niet met de hand aanpassen.
// Embleem in een raster van 100 x 100. Woordmerk met kapitaalhoogte 100 (Big Shoulders
// Bold, SIL OFL 1.1, als paden), bovenkant op y = 0.

/** Vaste merkkleuren, Racegroen (besluit Kane 23-10-2026). Terugval als de css er niet is. */
export const MERK_KLEUR = {
  racegroen: '${K.racegroen}',
  creme: '${K.creme}',
  flessengroen: '${K.flessengroen}',
  salie: '${K.salie}',
  inkt: '${K.inkt}',
} as const

/**
 * Obsidian iron (besluit Kane 29-10-2026): het embleem op de website. Iron plaat met
 * een metalen glans van licht naar diep, tekens in obsidiaan. Racegroen blijft alleen
 * voor de app-iconen van Club en drukwerk.
 */
export const IRON_KLEUR = {
  licht: '${IRON.licht}',
  iron: '${IRON.iron}',
  diep: '${IRON.diep}',
  obsidiaan: '${IRON.obsidiaan}',
  wit: '${IRON.wit}',
} as const

// Scherp tekenen (zie AygLogo): de plaat en EMBLEEM_RASTER_PAD met shape-rendering
// crispEdges, daarover EMBLEEM_KRUIS_LIJN als lijn van 1 schermpixel
// (vector-effect non-scaling-stroke), dan de letters en de Y met gladde randen.

/** Kruis en vak Y: rechte vlakken in de tweede kleur, over de plaat. */
export const EMBLEEM_RASTER_PAD = '${RASTER_PAD}'
/** Hartlijnen van het kruis: ondergrens van 1 schermpixel, zodat het klein niet wegvalt. */
export const EMBLEEM_KRUIS_LIJN = '${KRUIS_LIJN}'
/** De letters A, I en G, in de tweede kleur. */
export const EMBLEEM_LETTER_PAD = '${LETTER_PAD}'
/** De Y, in de kleur van de plaat, over het gevulde vak. */
export const EMBLEEM_Y_PAD = '${Y_PAD}'

export const WOORD_PAD = '${WOORD.d}'
export const WOORD_BREEDTE = ${r2(WOORD.breedte)}
export const WOORD_HOOGTE = ${WOORD.hoogte}

/** Liggend logo: viewBox 0 0 LOGO_BREEDTE LOGO_HOOGTE (embleem 100 links). */
export const LOGO_BREEDTE = ${LOGO.breedte}
export const LOGO_HOOGTE = ${LOGO.hoogte}
export const WOORD_TRANSFORM = '${LOGO.transform}'
`
fs.writeFileSync(path.join(WORTEL, 'src/components/aiyourgym/merk/merk-paden.ts'), ts)

// ── SVG-bestanden ───────────────────────────────────────────────────────────
const svg = (vb, inhoud, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${w ? ` width="${w}" height="${h}"` : ''}><title>AI Your Gym</title>${inhoud}</svg>\n`
const woordG = (kleur, transform) => `<path${transform ? ` transform="${transform}"` : ''} d="${WOORD.d}" fill="${kleur}"/>`
const logoVb = `0 0 ${LOGO.breedte} ${LOGO.hoogte}`
const woordVb = `0 0 ${r2(WOORD.breedte)} ${WOORD.hoogte}`
const px = (b, h, schaal) => [Math.round(b * schaal), Math.round(h * schaal)]
const [LW, LH] = px(LOGO.breedte, LOGO.hoogte, 3.2)
const [WW, WH] = px(WOORD.breedte, WOORD.hoogte, 1.2)

const bestanden = {
  // Liggend logo
  'ayg-logo-licht.svg': svg(logoVb, embleem(VARIANT.licht) + woordG(K.racegroen, LOGO.transform), LW, LH),
  'ayg-logo-donker.svg': svg(logoVb, embleem(VARIANT.donker) + woordG(K.creme, LOGO.transform), LW, LH),
  'ayg-logo-zwart.svg': svg(logoVb, embleemEenkleurig('#000', 'z') + woordG('#000', LOGO.transform), LW, LH),
  'ayg-logo-wit.svg': svg(logoVb, embleemEenkleurig('#fff', 'w') + woordG('#fff', LOGO.transform), LW, LH),
  // Embleem
  'ayg-embleem-licht.svg': svg('0 0 100 100', embleem(VARIANT.licht), 512, 512),
  'ayg-embleem-donker.svg': svg('0 0 100 100', embleem(VARIANT.donker), 512, 512),
  'ayg-embleem-zwart.svg': svg('0 0 100 100', embleemEenkleurig('#000', 'z'), 512, 512),
  'ayg-embleem-wit.svg': svg('0 0 100 100', embleemEenkleurig('#fff', 'w'), 512, 512),
  'ayg-embleem-klein.svg': svg('0 0 100 100', embleemKlein(VARIANT.licht), 32, 32),
  // Woordmerk
  'ayg-woordmerk-licht.svg': svg(woordVb, woordG(K.racegroen), WW, WH),
  'ayg-woordmerk-donker.svg': svg(woordVb, woordG(K.creme), WW, WH),
  'ayg-woordmerk-zwart.svg': svg(woordVb, woordG('#000'), WW, WH),
  'ayg-woordmerk-wit.svg': svg(woordVb, woordG('#fff'), WW, WH),
  // Obsidian iron (website, besluit Kane 29-10-2026): voor obsidiaan en andere donkere ondergronden
  'ayg-logo-iron.svg': svg(logoVb, embleemIron() + woordG(IRON.wit, LOGO.transform), LW, LH),
  'ayg-embleem-iron.svg': svg('0 0 100 100', embleemIron(), 512, 512),
  'ayg-woordmerk-iron.svg': svg(woordVb, woordG(IRON.iron), WW, WH),
}

// App-icoon: tegel in racegroen met het creme embleem erop, zoals een stempel.
const appIcoon = (rx = 0) =>
  `<rect width="100" height="100" rx="${rx}" fill="${K.racegroen}"/><g transform="translate(19 19) scale(.62)">${embleem(VARIANT.donker)}</g>`
bestanden['ayg-app-icoon.svg'] = svg('0 0 100 100', appIcoon(), 512, 512)
// Website (obsidian iron, besluit Kane 29-10-2026): een obsidiaan tegel met het iron
// embleem erop. Club houdt de racegroene tegel.
const appIcoonWebsite = () =>
  `<rect width="100" height="100" fill="${IRON.obsidiaan}"/><g transform="translate(19 19) scale(.62)">${embleemIron('iron-icoon')}</g>`
bestanden['ayg-app-icoon-iron.svg'] = svg('0 0 100 100', appIcoonWebsite(), 512, 512)

// Oude bestanden van het vorige logo (figuur in een tegel) weg, zodat niemand ze nog pakt.
for (const oud of ['ayg-beeldmerk.svg', 'ayg-beeldmerk-donker.svg', 'ayg-beeldmerk-512.png', 'ayg-figuur.svg', 'ayg-woordmerk.svg']) {
  fs.rmSync(path.join(UIT_DOCS, oud), { force: true })
}
for (const [naam, inhoud] of Object.entries(bestanden)) fs.writeFileSync(path.join(UIT_DOCS, naam), inhoud)

// ── Iconen in de app ────────────────────────────────────────────────────────
// Favicon: de kleine versie. In een donkere browser draait het om (creme plaat),
// anders valt de racegroene plaat weg in een donkere tabbalk.
const klein = embleemDelen(KLEIN)
const icoon = svg(
  '0 0 100 100',
  `<style>.p{fill:${K.racegroen}}.t{fill:${K.creme}}.ps{stroke:${K.racegroen}}.ts{stroke:${K.creme}}` +
    `@media (prefers-color-scheme:dark){.p{fill:${K.creme}}.t{fill:${K.racegroen}}.ps{stroke:${K.creme}}.ts{stroke:${K.racegroen}}}</style>` +
    `<rect class="p" width="100" height="100" ${SCHERP}/><path class="t" ${SCHERP} d="${klein.cel}"/>` +
    `<path class="t ts" stroke-width="3.6" stroke-linejoin="round" d="${klein.letters}"/>` +
    `<path class="p ps" stroke-width="3.6" stroke-linejoin="round" d="${klein.y}"/>`,
)
fs.writeFileSync(path.join(CLUB, 'icon.svg'), icoon)
// Favicon van de website: de kleine versie in iron, vlak (een glans is op 16 pixels een waas).
// Iron met obsidiaan leest op een lichte en een donkere tabbalk, dus zonder omdraaien.
const icoonIron = svg(
  '0 0 100 100',
  `<rect fill="${IRON.iron}" width="100" height="100" ${SCHERP}/><path fill="${IRON.obsidiaan}" ${SCHERP} d="${klein.cel}"/>` +
    `<path fill="${IRON.obsidiaan}" stroke="${IRON.obsidiaan}" stroke-width="3.6" stroke-linejoin="round" d="${klein.letters}"/>` +
    `<path fill="${IRON.iron}" stroke="${IRON.iron}" stroke-width="3.6" stroke-linejoin="round" d="${klein.y}"/>`,
)
fs.writeFileSync(path.join(WEBSITE, 'icon.svg'), icoonIron)

// PNG: vanuit de vector direct op de doelmaat getekend, niet groot getekend en daarna
// verkleind (dat maakt de rechte randen zacht). Zo vallen plaat, kruis en vak Y op hele
// pixels en houden de letters gladde randen.
async function png(vb, inhoud, b, h, uit, achtergrond) {
  let beeld = sharp(Buffer.from(svg(vb, inhoud, b, h)), { density: 72 })
  const { width, height } = await beeld.metadata()
  if (width !== b || height !== h) throw new Error(`${path.basename(uit)}: ${width} x ${height} in plaats van ${b} x ${h}`)
  if (achtergrond) beeld = beeld.flatten({ background: achtergrond })
  await beeld.png({ compressionLevel: 9 }).toFile(uit)
}
const VIERKANT = '0 0 100 100'
const logoLicht = embleem(VARIANT.licht) + woordG(K.racegroen, LOGO.transform)
const logoDonker = embleem(VARIANT.donker) + woordG(K.creme, LOGO.transform)
const logoIron = embleemIron() + woordG(IRON.wit, LOGO.transform)
// Liggend logo per pixeldichtheid: 40 px hoog (1x), plus 2x en 3x voor retina.
const LOGO_PX = 40
const logoMaat = (dichtheid) => px(LOGO.breedte, LOGO.hoogte, (LOGO_PX * dichtheid) / LOGO.hoogte)

// Oude PNG-namen weg (vervangen door de namen met maat).
for (const oud of ['ayg-embleem-512.png']) fs.rmSync(path.join(UIT_DOCS, oud), { force: true })

// Apple-icoon: vol vlak zonder ronde hoeken (iOS rondt zelf af). 180 x 180 is de maat die iOS vraagt.
await png(VIERKANT, appIcoonWebsite(), 180, 180, path.join(WEBSITE, 'apple-icon.png'))
await png(VIERKANT, appIcoon(), 180, 180, path.join(CLUB, 'apple-icon.png'))
for (const maat of [512, 1024]) {
  await png(VIERKANT, appIcoon(), maat, maat, path.join(UIT_DOCS, `ayg-app-icoon-${maat}.png`))
  await png(VIERKANT, embleem(VARIANT.licht), maat, maat, path.join(UIT_DOCS, `ayg-embleem-licht-${maat}.png`))
  await png(VIERKANT, embleem(VARIANT.donker), maat, maat, path.join(UIT_DOCS, `ayg-embleem-donker-${maat}.png`))
  await png(VIERKANT, embleemIron(), maat, maat, path.join(UIT_DOCS, `ayg-embleem-iron-${maat}.png`))
  await png(VIERKANT, appIcoonWebsite(), maat, maat, path.join(UIT_DOCS, `ayg-app-icoon-iron-${maat}.png`))
}
// Groot (drukwerk, presentaties): 640 px hoog.
await png(logoVb, logoLicht, LW * 2, LH * 2, path.join(UIT_DOCS, 'ayg-logo-licht.png'))
await png(logoVb, logoDonker, LW * 2, LH * 2, path.join(UIT_DOCS, 'ayg-logo-donker.png'))
await png(logoVb, logoIron, LW * 2, LH * 2, path.join(UIT_DOCS, 'ayg-logo-iron.png'))
for (const d of [1, 2, 3]) {
  const [b, h] = logoMaat(d)
  const achter = d === 1 ? '' : `@${d}x`
  await png(logoVb, logoLicht, b, h, path.join(UIT_DOCS, `ayg-logo-licht-40${achter}.png`))
  await png(logoVb, logoDonker, b, h, path.join(UIT_DOCS, `ayg-logo-donker-40${achter}.png`))
  await png(logoVb, logoIron, b, h, path.join(UIT_DOCS, `ayg-logo-iron-40${achter}.png`))
}
// Voor e-mail: 2x van 180 x 40, op een vaste witte ondergrond (een mailprogramma met
// donkere modus maakt een doorzichtige achtergrond soms zwart, dan valt het woord weg).
// In de mail: <img src="..." width="180" height="40" alt="AI Your Gym">.
{
  const [b, h] = logoMaat(2)
  await png(logoVb, logoLicht, b, h, path.join(UIT_DOCS, 'ayg-logo-mail@2x.png'), '#ffffff')
}

// ── Contrast (WCAG 2.2) voor de merkgids ────────────────────────────────────
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100
}
const paren = [
  ['creme', 'racegroen'], ['creme', 'flessengroen'], ['salie', 'racegroen'], ['salie', 'flessengroen'],
  ['racegroen', 'creme'], ['inkt', 'creme'], ['flessengroen', 'creme'], ['racegroen', 'salie'], ['inkt', 'salie'],
  ['salie', 'creme'], ['flessengroen', 'racegroen'],
]
console.log('klaar', { LOGO, woord: r2(WOORD.breedte) })
for (const [voor, achter] of paren) console.log(`${voor} op ${achter}: ${contrast(K[voor], K[achter])}:1`)
const ironParen = [['obsidiaan', 'licht'], ['obsidiaan', 'iron'], ['obsidiaan', 'diep'], ['iron', 'obsidiaan'], ['wit', 'obsidiaan']]
for (const [voor, achter] of ironParen) console.log(`iron: ${voor} op ${achter}: ${contrast(IRON[voor], IRON[achter])}:1`)
