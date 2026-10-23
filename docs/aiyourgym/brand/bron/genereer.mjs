// Genereert het merk van AI Your Gym: de paden voor de app, de SVG-bestanden in
// docs/aiyourgym/brand/ en de iconen in de (aiyourgym)-groep.
// Draaien vanuit de hoofdmap van de repo: node docs/aiyourgym/brand/bron/genereer.mjs
//
// Beeldmerk: met de hand geconstrueerd in een raster van 32 x 32 (figuur met de
// armen omhoog die ook een Y vormt). Woordmerk: de letters van Bricolage Grotesque
// (SIL Open Font License 1.1, vrij te gebruiken in een logo, ook commercieel), vast
// gezet op gewicht 640, breedte 96 en optische maat 24, en omgezet naar paden.
// Bron: bricolage-merk.ttf (alleen de letters van "AI Your Gym"), licentie ernaast.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openSync } from 'fontkit'
import sharp from 'sharp'

const WORTEL = process.cwd()
const BRON = path.dirname(fileURLToPath(import.meta.url))
const UIT_DOCS = path.join(WORTEL, 'docs/aiyourgym/brand')

const KLEUR = { smaragd: '#1fa77a', inkt: '#0f1412', kalk: '#f2f0e9' }

// ── Beeldmerk ────────────────────────────────────────────────────────────────
const r3 = (v) => Math.round(v * 1000) / 1000

/** Superellips (n = 5): de zachte "squircle" van het app-icoon. */
function squircle(s = 32, n = 5, stappen = 128) {
  const r = s / 2
  const pts = []
  for (let i = 0; i < stappen; i++) {
    const t = (i / stappen) * Math.PI * 2
    const c = Math.cos(t), si = Math.sin(t)
    pts.push(`${r3(r + r * Math.sign(c) * Math.abs(c) ** (2 / n))} ${r3(r + r * Math.sign(si) * Math.abs(si) ** (2 / n))}`)
  }
  return `M${pts.join('L')}Z`
}

// Maten van de figuur (raster 32). Armen haaks afgesneden, romp recht.
const FIG = { punt: [9.6, 9.75], kruis: 17.55, voet: 25.15, dik: 3.85, kop: [16, 9.05], kopR: 2.3 }

function figuurPad() {
  const [tx, ty] = FIG.punt
  const w = FIG.dik / 2
  const L = Math.hypot(16 - tx, FIG.kruis - ty)
  const d = [(16 - tx) / L, (FIG.kruis - ty) / L]
  const n = [-d[1], d[0]] // wijst naar buiten-onder voor de linkerarm
  const buiten = [tx + n[0] * w, ty + n[1] * w]
  const binnen = [tx - n[0] * w, ty - n[1] * w]
  const kruisY = binnen[1] + ((16 - binnen[0]) / d[0]) * d[1]
  const rompY = buiten[1] + ((16 - w - buiten[0]) / d[0]) * d[1]
  const p = (x, y) => `${r3(x)} ${r3(y)}`
  return (
    `M${p(...buiten)}L${p(...binnen)}L${p(16, kruisY)}L${p(32 - binnen[0], binnen[1])}L${p(32 - buiten[0], buiten[1])}` +
    `L${p(16 + w, rompY)}L${p(16 + w, FIG.voet)}L${p(16 - w, FIG.voet)}L${p(16 - w, rompY)}Z`
  )
}
const [KX, KY] = FIG.kop
const R = FIG.kopR
const kopPad = `M${KX - R} ${KY}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`
const FIGUUR = figuurPad() + kopPad
const TEGEL = squircle()

// ── Woordmerk ────────────────────────────────────────────────────────────────
const TEKST = 'AI Your Gym'
const TRACKING = -0.012 // em
const font = openSync(path.join(BRON, 'bricolage-merk.ttf'))
const KAP = font.capHeight
const run = font.layout(TEKST)
let x = 0
const delen = []
let minY = 0
run.glyphs.forEach((g, i) => {
  const pos = run.positions[i]
  if (g.path.commands.length) {
    delen.push(g.path.scale(1, -1).translate(x + pos.xOffset, KAP).toSVG())
    minY = Math.min(minY, g.bbox.minY)
  }
  x += pos.xAdvance + (TEKST[i] === ' ' ? 0 : TRACKING * font.unitsPerEm)
})
const laatste = run.glyphs[run.glyphs.length - 1]
const WOORD_BREEDTE = x - TRACKING * font.unitsPerEm - (laatste.advanceWidth - laatste.bbox.maxX)
// Afronden scheelt veel tekens en is onzichtbaar (eenheden van 1/1000 em)
const WOORD = delen.join('').replace(/-?\d+\.\d+/g, (v) => String(Math.round(+v)))

// Liggend logo: tegel 32 hoog, kapitaalhoogte 32/1.4, kap gecentreerd op de tegel.
const KAP_IN_LOGO = 32 / 1.4
const S = KAP_IN_LOGO / KAP
const WOORD_X = 32 + KAP_IN_LOGO * 0.46
const WOORD_Y = (32 - KAP_IN_LOGO) / 2
const LOGO_B = Math.ceil((WOORD_X + WOORD_BREEDTE * S) * 10) / 10
// De staarten van y en g mogen iets onder de tegel uitsteken; de viewBox neemt ze mee.
const LOGO_H = Math.max(32, Math.ceil((WOORD_Y + KAP_IN_LOGO * ((KAP - minY) / KAP)) * 10) / 10)
const woordTransform = `matrix(${r3(S)} 0 0 ${r3(S)} ${r3(WOORD_X)} ${r3(WOORD_Y)})`
const ONDER = r3((KAP - minY) / KAP) // onderkant van de y en g, in kapitaalhoogtes

// ── App: merk-paden.ts ───────────────────────────────────────────────────────
const ts = `// Gegenereerd door docs/aiyourgym/brand/bron/genereer.mjs; niet met de hand aanpassen.
// Beeldmerk in een raster van 32 x 32; woordmerk in fonteenheden (1000 per em),
// basislijn op y = WOORD_KAP.

/** Vaste merkkleuren: terugval als de css van de site er niet is (zie AygLogo). */
export const MERK_KLEUR = { smaragd: '${KLEUR.smaragd}', inkt: '${KLEUR.inkt}', kalk: '${KLEUR.kalk}' } as const

export const TEGEL_PAD = '${TEGEL}'
export const FIGUUR_PAD = '${FIGUUR}'

export const WOORD_PAD = '${WOORD}'
export const WOORD_BREEDTE = ${Math.round(WOORD_BREEDTE)}
export const WOORD_KAP = ${KAP}
/** Onderkant van de staarten (y, g), gemeten vanaf de kapitaalhoogte (1 = kap). */
export const WOORD_ONDER = ${ONDER}

/** Liggend logo: viewBox 0 0 LOGO_BREEDTE LOGO_HOOGTE (tegel 32 hoog bovenin). */
export const LOGO_BREEDTE = ${LOGO_B}
export const LOGO_HOOGTE = ${LOGO_H}
export const WOORD_TRANSFORM = '${woordTransform}'
`
fs.writeFileSync(path.join(WORTEL, 'src/components/aiyourgym/merk/merk-paden.ts'), ts)

// ── SVG-bestanden ────────────────────────────────────────────────────────────
const svg = (vb, inhoud, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${w ? ` width="${w}" height="${h}"` : ''}>${inhoud}</svg>\n`
const tegel = (vlak, fig) => `<path d="${TEGEL}" fill="${vlak}"/><path d="${FIGUUR}" fill="${fig}"/>`
const woordG = (kleur) => `<path transform="${woordTransform}" d="${WOORD}" fill="${kleur}"/>`
const titel = (t) => `<title>${t}</title>`

const bestanden = {
  'ayg-logo-licht.svg': svg(`0 0 ${LOGO_B} ${LOGO_H}`, titel('AI Your Gym') + tegel(KLEUR.inkt, KLEUR.smaragd) + woordG(KLEUR.inkt), Math.round(LOGO_B * 10), Math.round(LOGO_H * 10)),
  'ayg-logo-donker.svg': svg(`0 0 ${LOGO_B} ${LOGO_H}`, titel('AI Your Gym') + tegel(KLEUR.smaragd, KLEUR.inkt) + woordG(KLEUR.kalk), Math.round(LOGO_B * 10), Math.round(LOGO_H * 10)),
  'ayg-logo-zwart.svg': svg(`0 0 ${LOGO_B} ${LOGO_H}`, titel('AI Your Gym') + `<path d="${TEGEL}${FIGUUR}" fill="#000" fill-rule="evenodd"/>` + woordG('#000'), Math.round(LOGO_B * 10), Math.round(LOGO_H * 10)),
  'ayg-logo-wit.svg': svg(`0 0 ${LOGO_B} ${LOGO_H}`, titel('AI Your Gym') + `<path d="${TEGEL}${FIGUUR}" fill="#fff" fill-rule="evenodd"/>` + woordG('#fff'), Math.round(LOGO_B * 10), Math.round(LOGO_H * 10)),
  'ayg-beeldmerk.svg': svg('0 0 32 32', titel('AI Your Gym') + tegel(KLEUR.inkt, KLEUR.smaragd), 512, 512),
  'ayg-beeldmerk-donker.svg': svg('0 0 32 32', titel('AI Your Gym') + tegel(KLEUR.smaragd, KLEUR.inkt), 512, 512),
  'ayg-figuur.svg': svg('0 0 32 32', titel('AI Your Gym') + `<path d="${FIGUUR}" fill="${KLEUR.smaragd}"/>`, 512, 512),
  'ayg-woordmerk.svg': svg(`0 ${-0} ${r3(WOORD_BREEDTE)} ${r3(KAP - minY)}`, titel('AI Your Gym') + `<path d="${WOORD}" fill="${KLEUR.inkt}"/>`),
}
for (const [naam, inhoud] of Object.entries(bestanden)) fs.writeFileSync(path.join(UIT_DOCS, naam), inhoud)

// Favicon (zelfde tegel als het beeldmerk) voor de website en Club.
// In een donkere browser draait de tegel om (smaragd vlak, inkten figuur), anders
// valt de inkten tegel weg in een donkere tabbalk.
const icoon = svg(
  '0 0 32 32',
  `<style>.v{fill:${KLEUR.inkt}}.f{fill:${KLEUR.smaragd}}@media (prefers-color-scheme:dark){.v{fill:${KLEUR.smaragd}}.f{fill:${KLEUR.inkt}}}</style>` +
    `<path class="v" d="${TEGEL}"/><path class="f" d="${FIGUUR}"/>`,
)
const WEBSITE = path.join(WORTEL, 'src/app/(aiyourgym)/(website)/aiyourgym')
const CLUB = path.join(WORTEL, 'src/app/(aiyourgym)/(club)/club')
fs.writeFileSync(path.join(WEBSITE, 'icon.svg'), icoon)
fs.writeFileSync(path.join(CLUB, 'icon.svg'), icoon)

// Apple-icoon: vol vlak zonder ronde hoeken (iOS rondt zelf af), figuur iets kleiner.
const apple = svg('0 0 32 32', `<rect width="32" height="32" fill="${KLEUR.inkt}"/><g transform="translate(16 16.2) scale(.86) translate(-16 -16)"><path d="${FIGUUR}" fill="${KLEUR.smaragd}"/></g>`, 180, 180)

async function png(svgTekst, px, uit) {
  await sharp(Buffer.from(svgTekst), { density: 72 * (px / 32) * 4 })
    .resize(px, px)
    .png({ compressionLevel: 9 })
    .toFile(uit)
}

await png(apple, 180, path.join(WEBSITE, 'apple-icon.png'))
await png(apple, 180, path.join(CLUB, 'apple-icon.png'))
await png(svg('0 0 32 32', tegel(KLEUR.inkt, KLEUR.smaragd)), 512, path.join(UIT_DOCS, 'ayg-beeldmerk-512.png'))
console.log('klaar', { LOGO_B, LOGO_H, WOORD_BREEDTE: Math.round(WOORD_BREEDTE), ONDER })
