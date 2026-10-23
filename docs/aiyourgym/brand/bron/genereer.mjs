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
// (alleen de letters van het merk), licentie ernaast.

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

const r2 = (v) => Math.round(v * 100) / 100
const r4 = (v) => Math.round(v * 10000) / 10000
const rect = (x, y, b, h) => `M${r2(x)} ${r2(y)}H${r2(x + b)}V${r2(y + h)}H${r2(x)}Z`
const kort = (d) => d.replace(/-?\d+\.\d+/g, (v) => String(r2(+v)))

// ── Letters naar paden ──────────────────────────────────────────────────────
const font = openSync(path.join(BRON, 'BigShoulders-Bold-merk.ttf'))

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
    if (g.path.commands.length) {
      glyfen.push([g, x + pos.xOffset])
      links = Math.min(links, x + pos.xOffset + g.path.bbox.minX)
      rechts = Math.max(rechts, x + pos.xOffset + g.path.bbox.maxX)
    }
    x += (isSpatie ? pos.xAdvance * spatie : pos.xAdvance) + (isSpatie ? 0 : tracking * font.unitsPerEm)
  })
  const d = glyfen.map(([g, gx]) => g.path.scale(s, -s).translate((gx - links) * s + dx, kap + dy).toSVG()).join('')
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
  return { lijnen, cel, letters, y }
}
const E = embleemDelen()
/** Alles in de tweede kleur: kruis, vak Y en de letters A, I en G. */
const TEKEN_PAD = E.lijnen + E.cel + E.letters
/** De Y, in de kleur van de plaat. */
const Y_PAD = E.y

const VARIANT = {
  licht: { plaat: K.racegroen, teken: K.creme }, // op creme, wit en lichte foto's
  donker: { plaat: K.creme, teken: K.racegroen }, // op racegroen, inkt en donkere foto's
}

const embleem = ({ plaat, teken }) =>
  `<rect width="100" height="100" fill="${plaat}"/><path d="${TEKEN_PAD}" fill="${teken}"/><path d="${Y_PAD}" fill="${plaat}"/>`

/** Eenkleurig: plaat en Y in de kleur, de rest uitgespaard (werkt op elke ondergrond). */
const embleemEenkleurig = (kleur, id) =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/>` +
  `<path d="${TEKEN_PAD}" fill="#000"/><path d="${Y_PAD}" fill="#fff"/></mask><rect width="100" height="100" fill="${kleur}" mask="url(#${id})"/>`

/** Voor 16 tot 32 pixels: geen kruis (dat wordt een waas), grotere en zwaardere letters. */
const KLEIN = { kap: 35, kruis: 0, rand: 6 }
function embleemKlein({ plaat, teken }) {
  const k = embleemDelen(KLEIN)
  const zwaar = (kleur) => `stroke="${kleur}" stroke-width="3.6" stroke-linejoin="round"`
  return (
    `<rect width="100" height="100" fill="${plaat}"/><path d="${k.cel}" fill="${teken}"/>` +
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

/** Kruis, vak Y en de letters A, I en G: in de tweede kleur, over de plaat. */
export const EMBLEEM_TEKEN_PAD = '${TEKEN_PAD}'
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
}

// App-icoon: tegel in racegroen met het creme embleem erop, zoals een stempel.
const appIcoon = (rx = 0) =>
  `<rect width="100" height="100" rx="${rx}" fill="${K.racegroen}"/><g transform="translate(19 19) scale(.62)">${embleem(VARIANT.donker)}</g>`
bestanden['ayg-app-icoon.svg'] = svg('0 0 100 100', appIcoon(), 512, 512)

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
    `<rect class="p" width="100" height="100"/><path class="t" d="${klein.cel}"/>` +
    `<path class="t ts" stroke-width="3.6" stroke-linejoin="round" d="${klein.letters}"/>` +
    `<path class="p ps" stroke-width="3.6" stroke-linejoin="round" d="${klein.y}"/>`,
)
fs.writeFileSync(path.join(WEBSITE, 'icon.svg'), icoon)
fs.writeFileSync(path.join(CLUB, 'icon.svg'), icoon)

async function png(svgTekst, b, h, uit) {
  await sharp(Buffer.from(svgTekst), { density: 600 }).resize(b, h).png({ compressionLevel: 9 }).toFile(uit)
}
// Apple-icoon: vol vlak zonder ronde hoeken (iOS rondt zelf af).
const apple = svg('0 0 100 100', appIcoon(), 180, 180)
await png(apple, 180, 180, path.join(WEBSITE, 'apple-icon.png'))
await png(apple, 180, 180, path.join(CLUB, 'apple-icon.png'))
await png(svg('0 0 100 100', appIcoon()), 512, 512, path.join(UIT_DOCS, 'ayg-app-icoon-512.png'))
await png(svg('0 0 100 100', embleem(VARIANT.licht)), 512, 512, path.join(UIT_DOCS, 'ayg-embleem-512.png'))
await png(svg(logoVb, embleem(VARIANT.licht) + woordG(K.racegroen, LOGO.transform)), LW * 2, LH * 2, path.join(UIT_DOCS, 'ayg-logo-licht.png'))
await png(svg(logoVb, embleem(VARIANT.donker) + woordG(K.creme, LOGO.transform)), LW * 2, LH * 2, path.join(UIT_DOCS, 'ayg-logo-donker.png'))

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
