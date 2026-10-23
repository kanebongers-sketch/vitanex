// Vier logorichtingen voor AI Your Gym (keuzeblad; raakt het huidige logo niet).
// Draaien vanuit de hoofdmap van de repo:
//   node docs/aiyourgym/brand/richtingen/bron/genereer.mjs
//
// Alle beeldmerken zijn met de hand geconstrueerd in een raster van 100 x 100
// (geometrie hieronder, geen beeldgenerator). Woordmerken komen uit OFL-letters
// (subsets in deze map, licenties ernaast, zie subset.py) en zijn omgezet naar paden.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openSync } from 'fontkit'

const BRON = path.dirname(fileURLToPath(import.meta.url))
const UIT = path.dirname(BRON)

/** Merkkleuren. Smaragd en inkt zijn de basis; de rest zijn verfijningen per richting. */
const K = {
  smaragd: '#1fa77a',
  inkt: '#0f1412',
  kalk: '#f2f0e9',
  // Iets dieper smaragd voor een accent op licht papier (meer gewicht dan #1fa77a)
  smaragdDiep: '#14875f',
  // Richting 4, gedurfde variant (alternatief, niet de basis)
  clubgroen: '#0d3a2b',
  mint: '#46d9a0',
}

const r2 = (v) => Math.round(v * 100) / 100
const p = (x, y) => `${r2(x)} ${r2(y)}`
const poly = (pts) => `M${pts.map(([x, y]) => p(x, y)).join('L')}Z`
const cirkel = (cx, cy, r) => `M${p(cx - r, cy)}a${r2(r)} ${r2(r)} 0 1 0 ${r2(2 * r)} 0a${r2(r)} ${r2(r)} 0 1 0 ${r2(-2 * r)} 0Z`
/** Ring (gebruik met fill-rule="evenodd"). */
const ring = (cx, cy, R, r) => cirkel(cx, cy, R) + cirkel(cx, cy, r)

// ── Letters naar paden ──────────────────────────────────────────────────────
const fonts = {}
const font = (naam) => (fonts[naam] ??= openSync(path.join(BRON, `${naam}-Bold-merk.ttf`)))

/**
 * Zet tekst om naar een pad: kapitaalhoogte `kap`, bovenkant kapitalen op y = 0.
 * Tracking in em. `vervang[i]` tekent zelf iets in plaats van letter i.
 */
function tekst(naam, inhoud, { kap = 100, tracking = 0, spatie = 1, vervang = {} } = {}) {
  const f = font(naam)
  const s = kap / f.capHeight
  const run = f.layout(inhoud)
  let x = 0
  let onder = 0
  let rechts = 0
  let links = Infinity
  const delen = []
  const extra = []
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i]
    const isSpatie = inhoud[i] === ' '
    if (vervang[i]) {
      extra.push(vervang[i]({ x: x * s, breedte: g.advanceWidth * s, kap }))
      rechts = Math.max(rechts, x + g.advanceWidth)
    } else if (g.path.commands.length) {
      delen.push(g.path.scale(s, -s).translate((x + pos.xOffset) * s, kap).toSVG())
      onder = Math.min(onder, g.path.bbox.minY)
      rechts = Math.max(rechts, x + pos.xOffset + g.path.bbox.maxX)
      links = Math.min(links, x + pos.xOffset + g.path.bbox.minX)
    }
    x += (isSpatie ? pos.xAdvance * spatie : pos.xAdvance) + (isSpatie ? 0 : tracking * f.unitsPerEm)
  })
  const breedte = rechts * s
  const d = delen.join('').replace(/-?\d+\.\d+/g, (v) => String(r2(+v)))
  return { d, breedte, links: links * s, hoogte: kap - onder * s, extra: extra.join('') }
}

// ── Bestanden ───────────────────────────────────────────────────────────────
const svg = (vb, inhoud, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${w ? ` width="${w}" height="${h}"` : ''}><title>AI Your Gym</title>${inhoud}</svg>\n`
function schrijf(map, naam, inhoud) {
  fs.mkdirSync(path.join(UIT, map), { recursive: true })
  fs.writeFileSync(path.join(UIT, map, naam), inhoud)
}
const r4 = (v) => Math.round(v * 10000) / 10000
const plaats = (inhoud, sch, x, y) => `<g transform="matrix(${r4(sch)} 0 0 ${r4(sch)} ${r2(x)} ${r2(y)})">${inhoud}</g>`

/**
 * Liggend logo: merk (vak mb x mh) links, woord rechts. Kapitaalhoogte = mh / verhouding,
 * kap verticaal gecentreerd op het merk; gat in fracties van mh.
 */
function lockup(merk, mb, mh, woord, woordKleur, { verhouding = 1.4, gat = 0.36 } = {}) {
  const kap = mh / verhouding
  const sw = kap / 100
  const wx = mb + mh * gat
  const wy = (mh - kap) / 2
  const b = wx + woord.breedte * sw
  const h = Math.max(mh, wy + woord.hoogte * sw)
  return svg(`0 0 ${r2(b)} ${r2(h)}`, merk + plaats(`<path d="${woord.d}" fill="${woordKleur}"/>${woord.extra}`, sw, wx, wy))
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. MONOGRAM: de AY-ligatuur
// De rechterpoot van de A is tegelijk de linkerarm van de Y en loopt over in de
// stam: twee letters, één teken. Vlakke koppen, één helling, één dikte.
// ═════════════════════════════════════════════════════════════════════════════
function monogram() {
  const H = 100
  const s = 0.45 // helling (dx per dy)
  const t = 17.5 // horizontale dikte van een schuine haal
  const ts = 16.2 // dikte van de stam (optisch gelijk aan de schuine halen)
  const yf = 50 // hoogte van de vork
  const ax = t / 2 + s * H
  const fx = ax + s * yf
  const rx = fx + s * yf
  const snij = ([x1, y1], [dx1, dy1], [x2, y2], [dx2, dy2]) => {
    const n = dx1 * dy2 - dy1 * dx2
    const u = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / n
    return [x1 + u * dx1, y1 + u * dy1]
  }
  const R = [s, 1]
  const L = [-s, 1]
  const poot = poly([[ax - t / 2, 0], [ax + t / 2, 0], [ax + t / 2 - s * H, H], [ax - t / 2 - s * H, H]])
  const y = poly([
    [ax - t / 2, 0], [ax + t / 2, 0], snij([ax + t / 2, 0], R, [rx - t / 2, 0], L), [rx - t / 2, 0], [rx + t / 2, 0],
    snij([rx + t / 2, 0], L, [fx + ts / 2, 0], [0, 1]), [fx + ts / 2, H], [fx - ts / 2, H],
    snij([ax - t / 2, 0], R, [fx - ts / 2, 0], [0, 1]),
  ])
  // Dwarsbalk van de A: van de linkerpoot tot in de stam
  const yc = 66
  const cb = 11
  const binnen = (yy) => ax + t / 2 - s * yy
  const balk = poly([[binnen(yc) - 2, yc], [fx, yc], [fx, yc + cb], [binnen(yc + cb) - 2, yc + cb]])
  return { d: poot + y + balk, b: rx + t / 2, h: H }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. RITME: het turfje
// Vier staven en een vijfde streep die ze doorkruist: zo tel je herhalingen.
// De streep stijgt (progressie) en is uitgespaard, zodat staven en streep los
// blijven, ook op 16 pixels.
// ═════════════════════════════════════════════════════════════════════════════
function turf() {
  const staaf = 12.5
  const gat = 10.5
  const n = 4
  const totaal = n * staaf + (n - 1) * gat
  const x0 = (100 - totaal) / 2
  const staven = Array.from({ length: n }, (_, i) => {
    const x = x0 + i * (staaf + gat)
    return poly([[x, 6], [x + staaf, 6], [x + staaf, 94], [x, 94]])
  }).join('')
  // Streep: parallellogram met verticale uiteinden, van linksonder naar rechtsboven
  const dik = 14
  const marge = 4.5
  const streep = (extra) => poly([[1, 77 - extra], [99, 31 - extra], [99, 31 + dik + extra], [1, 77 + dik + extra]])
  return { staven, streep: streep(0), uitsparing: streep(marge) }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. WOORDMERK: de schijf
// AI YOUR GYM in ruim gespatieerde geometrische kapitalen; de O van YOUR is een
// halterschijf (dikke ring) in smaragd. Die schijf is ook het kleine icoon.
// ═════════════════════════════════════════════════════════════════════════════
const SCHIJF = { buiten: 0.535, binnen: 0.25 } // in kapitaalhoogtes (overshoot inbegrepen)
const schijfLetter = (kleur) => ({ x, breedte, kap }) =>
  `<path d="${ring(x + breedte / 2, kap / 2, kap * SCHIJF.buiten, kap * SCHIJF.binnen)}" fill="${kleur}" fill-rule="evenodd"/>`

// ═════════════════════════════════════════════════════════════════════════════
// 4. EMBLEEM: het rooster
// Een vierkante plaat in vier vakken met A I / Y G, zoals een lesrooster of een
// stempel. Het vak van de Y (Your) is smaragd.
// ═════════════════════════════════════════════════════════════════════════════
const VAKKEN = [['A', 0, 0], ['I', 1, 0], ['Y', 0, 1], ['G', 1, 1]]
function roosterLetters(kap) {
  return VAKKEN.map(([l, kx, ky]) => {
    const t = tekst('BigShoulders', l, { kap })
    const x = kx * 50 + (50 - (t.breedte - t.links)) / 2 - t.links
    const y = ky * 50 + (50 - kap) / 2
    return { l, d: `<path transform="translate(${r2(x)} ${r2(y)})" d="${t.d}"`, kx, ky }
  })
}
const kruis = (w) => poly([[50 - w / 2, 0], [50 + w / 2, 0], [50 + w / 2, 100], [50 - w / 2, 100]]) + poly([[0, 50 - w / 2], [100, 50 - w / 2], [100, 50 + w / 2], [0, 50 + w / 2]])

/** Kleuren: plaat, letter, accent (vak Y), lijn (kruis). Klein = dikkere letters voor 16 en 32 px. */
function rooster({ plaat, letter, accent, lijn }, { kap = 38, w = 3.2, vet = 0 } = {}) {
  let inhoud = `<rect width="100" height="100" fill="${plaat}"/><rect x="0" y="50" width="50" height="50" fill="${accent}"/>`
  for (const v of roosterLetters(kap)) {
    const kleur = v.l === 'Y' ? plaat : letter
    inhoud += `${v.d} fill="${kleur}"${vet ? ` stroke="${kleur}" stroke-width="${vet}" stroke-linejoin="round"` : ''}/>`
  }
  return inhoud + `<path d="${kruis(w)}" fill="${lijn}"/>`
}

/**
 * Favicon op 16 pixels, met de hand op het pixelraster getekend (crispEdges):
 * letters van 6 pixels hoog, zodat A I Y G ook in een tabblad leesbaar blijven.
 */
const PIXELS = {
  A: ['.##.', '#..#', '#..#', '####', '#..#', '#..#'],
  I: ['##', '##', '##', '##', '##', '##'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..'],
  G: ['.###', '#...', '#.##', '#..#', '#..#', '.##.'],
}
function roosterPixels({ plaat, letter, accent }) {
  const plek = { A: [2, 1], I: [11, 1], Y: [1, 9], G: [10, 9] }
  let rects = ''
  for (const [l, [x0, y0]] of Object.entries(plek)) {
    const kleur = l === 'Y' ? plaat : letter
    PIXELS[l].forEach((regel, y) => {
      ;[...regel].forEach((c, x) => {
        if (c === '#') rects += `<rect x="${x0 + x}" y="${y0 + y}" width="1" height="1" fill="${kleur}"/>`
      })
    })
  }
  return svg('0 0 16 16', `<g shape-rendering="crispEdges"><rect width="16" height="16" fill="${plaat}"/><rect y="8" width="8" height="8" fill="${accent}"/>${rects}</g>`, 16, 16)
}

/** Eenkleurig stempel: plaat met uitgespaarde letters, vak Y omgekeerd, met omlijsting en tekst. */
function stempel(kleur) {
  const letters = roosterLetters(38)
  const masker =
    `<mask id="s" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/>` +
    `<path d="${kruis(3.2)}" fill="#000"/><rect x="3" y="53" width="44" height="44" fill="#000"/>` +
    letters.map((v) => `${v.d} fill="${v.l === 'Y' ? '#fff' : '#000'}"/>`).join('') + '</mask>'
  const naam = tekst('BigShoulders', 'AI YOUR GYM', { kap: 100, tracking: 0.1, spatie: 0.8 })
  const regel = tekst('Outfit', 'CLUBSOFTWARE', { kap: 100, tracking: 0.42 })
  const sn = 9.5 / 100
  const sr = 4.4 / 100
  const binnen = `<g transform="translate(10 10) scale(.8)">${masker}<rect width="100" height="100" fill="${kleur}" mask="url(#s)"/></g>`
  const tekstNaam = plaats(`<path d="${naam.d}" fill="${kleur}"/>`, sn, 50 - (naam.breedte * sn) / 2, 99)
  const tekstRegel = plaats(`<path d="${regel.d}" fill="${kleur}"/>`, sr, 50 - (regel.breedte * sr) / 2, 114)
  return svg('0 0 100 126', `<rect x="1.6" y="1.6" width="96.8" height="122.8" fill="none" stroke="${kleur}" stroke-width="3.2"/>` + binnen + tekstNaam + tekstRegel)
}

// ═════════════════════════════════════════════════════════════════════════════
// Uitvoer
// ═════════════════════════════════════════════════════════════════════════════
const tegel = (vlak, inhoud, rx = 0) => `<rect width="100" height="100" rx="${rx}" fill="${vlak}"/>` + inhoud
const midden = (inhoud, b, h, sch) => plaats(inhoud, sch, (100 - b * sch) / 2, (100 - h * sch) / 2)

// ── 1. Monogram ─────────────────────────────────────────────────────────────
{
  const M = '1-monogram'
  const m = monogram()
  const vb = `0 0 ${r2(m.b)} ${m.h}`
  const merk = (kleur) => `<path d="${m.d}" fill="${kleur}"/>`
  schrijf(M, 'beeldmerk-licht.svg', svg(vb, merk(K.inkt)))
  schrijf(M, 'beeldmerk-donker.svg', svg(vb, merk(K.kalk)))
  schrijf(M, 'beeldmerk-smaragd.svg', svg(vb, merk(K.smaragd)))
  schrijf(M, 'icoon.svg', svg('0 0 100 100', tegel(K.inkt, midden(merk(K.smaragd), m.b, m.h, 0.54)), 512, 512))
  schrijf(M, 'icoon-smaragd.svg', svg('0 0 100 100', tegel(K.smaragd, midden(merk(K.inkt), m.b, m.h, 0.54)), 512, 512))
  schrijf(M, 'favicon.svg', svg('0 0 100 100', tegel(K.inkt, midden(merk(K.smaragd), m.b, m.h, 0.78), 14)))
  const w = tekst('InstrumentSans', 'AI Your Gym', { tracking: -0.028, spatie: 0.92 })
  const wvb = `0 0 ${r2(w.breedte)} ${r2(w.hoogte)}`
  schrijf(M, 'woordmerk-licht.svg', svg(wvb, `<path d="${w.d}" fill="${K.inkt}"/>`))
  schrijf(M, 'woordmerk-donker.svg', svg(wvb, `<path d="${w.d}" fill="${K.kalk}"/>`))
  const opt = { verhouding: 1.36, gat: 0.32 }
  schrijf(M, 'lockup-licht.svg', lockup(merk(K.smaragdDiep), m.b, m.h, w, K.inkt, opt))
  schrijf(M, 'lockup-donker.svg', lockup(merk(K.smaragd), m.b, m.h, w, K.kalk, opt))
  schrijf(M, 'lockup-zwart.svg', lockup(merk('#000'), m.b, m.h, w, '#000', opt))
}

// ── 2. Ritme ────────────────────────────────────────────────────────────────
{
  const M = '2-ritme'
  const t = turf()
  const merk = (staaf, streep) =>
    `<mask id="u" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${t.uitsparing}" fill="#000"/></mask>` +
    `<path d="${t.staven}" fill="${staaf}" mask="url(#u)"/><path d="${t.streep}" fill="${streep}"/>`
  schrijf(M, 'beeldmerk-licht.svg', svg('0 0 100 100', merk(K.inkt, K.smaragdDiep)))
  schrijf(M, 'beeldmerk-donker.svg', svg('0 0 100 100', merk(K.kalk, K.smaragd)))
  schrijf(M, 'beeldmerk-zwart.svg', svg('0 0 100 100', merk('#000', '#000')))
  schrijf(M, 'icoon.svg', svg('0 0 100 100', tegel(K.inkt, midden(merk(K.kalk, K.smaragd), 100, 100, 0.58)), 512, 512))
  schrijf(M, 'icoon-smaragd.svg', svg('0 0 100 100', tegel(K.smaragd, midden(merk(K.inkt, K.kalk), 100, 100, 0.58)), 512, 512))
  schrijf(M, 'favicon.svg', svg('0 0 100 100', tegel(K.inkt, midden(merk(K.kalk, K.smaragd), 100, 100, 0.8), 14)))
  const w = tekst('BricolageGrotesque', 'AI Your Gym', { tracking: -0.02, spatie: 0.9 })
  const wvb = `0 0 ${r2(w.breedte)} ${r2(w.hoogte)}`
  schrijf(M, 'woordmerk-licht.svg', svg(wvb, `<path d="${w.d}" fill="${K.inkt}"/>`))
  schrijf(M, 'woordmerk-donker.svg', svg(wvb, `<path d="${w.d}" fill="${K.kalk}"/>`))
  const opt = { verhouding: 1.32, gat: 0.3 }
  schrijf(M, 'lockup-licht.svg', lockup(merk(K.inkt, K.smaragdDiep), 100, 100, w, K.inkt, opt))
  schrijf(M, 'lockup-donker.svg', lockup(merk(K.kalk, K.smaragd), 100, 100, w, K.kalk, opt))
}

// ── 3. Woordmerk ────────────────────────────────────────────────────────────
{
  const M = '3-woordmerk'
  const maak = (ringKleur) => tekst('Outfit', 'AI YOUR GYM', { tracking: 0.12, spatie: 1.25, vervang: { 4: schijfLetter(ringKleur) } })
  const wl = maak(K.smaragdDiep)
  const wd = maak(K.smaragd)
  const wz = maak('#000')
  const vb = `-6 -6 ${r2(wl.breedte + 12)} 112`
  schrijf(M, 'woordmerk-licht.svg', svg(vb, `<path d="${wl.d}" fill="${K.inkt}"/>${wl.extra}`))
  schrijf(M, 'woordmerk-donker.svg', svg(vb, `<path d="${wd.d}" fill="${K.kalk}"/>${wd.extra}`))
  schrijf(M, 'woordmerk-zwart.svg', svg(vb, `<path d="${wz.d}" fill="#000"/>${wz.extra}`))
  const schijf = (kleur) => `<path d="${ring(50, 50, 50, 50 * (SCHIJF.binnen / SCHIJF.buiten))}" fill="${kleur}" fill-rule="evenodd"/>`
  schrijf(M, 'beeldmerk-licht.svg', svg('0 0 100 100', schijf(K.smaragdDiep)))
  schrijf(M, 'beeldmerk-donker.svg', svg('0 0 100 100', schijf(K.smaragd)))
  schrijf(M, 'icoon.svg', svg('0 0 100 100', tegel(K.inkt, midden(schijf(K.smaragd), 100, 100, 0.56)), 512, 512))
  schrijf(M, 'icoon-smaragd.svg', svg('0 0 100 100', tegel(K.smaragd, midden(schijf(K.inkt), 100, 100, 0.56)), 512, 512))
  schrijf(M, 'favicon.svg', svg('0 0 100 100', tegel(K.inkt, midden(schijf(K.smaragd), 100, 100, 0.76), 14)))
  // Lockup: woordmerk met een lijn en een regel eronder (gestapeld, zoals op een gevel)
  const onder = tekst('Outfit', 'CLUBSOFTWARE VOOR SPORTSCHOLEN', { tracking: 0.3, spatie: 2.4 })
  const so = wl.breedte / onder.breedte
  const yo = 162
  const lvb = `-6 -6 ${r2(wl.breedte + 12)} ${r2(yo + 100 * so + 12)}`
  const rest = (kleur) => `<rect x="0" y="130" width="${r2(wl.breedte)}" height="2.4" fill="${kleur}"/>` + plaats(`<path d="${onder.d}" fill="${kleur}"/>`, so, 0, yo)
  schrijf(M, 'lockup-licht.svg', svg(lvb, `<path d="${wl.d}" fill="${K.inkt}"/>${wl.extra}${rest(K.inkt)}`))
  schrijf(M, 'lockup-donker.svg', svg(lvb, `<path d="${wd.d}" fill="${K.kalk}"/>${wd.extra}${rest(K.kalk)}`))
}

// ── 4. Embleem ──────────────────────────────────────────────────────────────
{
  const M = '4-embleem'
  const licht = { plaat: K.inkt, letter: K.kalk, accent: K.smaragd, lijn: K.kalk }
  const donker = { plaat: K.kalk, letter: K.inkt, accent: K.smaragd, lijn: K.inkt }
  const club = { plaat: K.clubgroen, letter: K.kalk, accent: K.mint, lijn: K.kalk }
  schrijf(M, 'beeldmerk-licht.svg', svg('0 0 100 100', rooster(licht)))
  schrijf(M, 'beeldmerk-donker.svg', svg('0 0 100 100', rooster(donker)))
  schrijf(M, 'beeldmerk-clubgroen.svg', svg('0 0 100 100', rooster(club)))
  // App-icoon: de plaat vult de tegel; het kruis in de kleur van de plaat zelf
  // App-icoon: het embleem op een tegel in de kleur van de plaat
  schrijf(M, 'icoon.svg', svg('0 0 100 100', tegel(K.inkt, midden(rooster(licht), 100, 100, 0.66)), 512, 512))
  schrijf(M, 'icoon-clubgroen.svg', svg('0 0 100 100', tegel(K.clubgroen, midden(rooster(club), 100, 100, 0.66)), 512, 512))
  schrijf(M, 'favicon-16.svg', roosterPixels(licht))
  // Favicon: zelfde rooster, letters groter en kruis dikker zodat het op 16 px blijft staan
  schrijf(M, 'favicon.svg', svg('0 0 100 100', rooster({ ...licht, lijn: K.inkt }, { kap: 40, w: 0, vet: 3.4 })))
  schrijf(M, 'stempel.svg', stempel(K.inkt))
  schrijf(M, 'stempel-smaragd.svg', stempel(K.smaragdDiep))
  const w = tekst('BigShoulders', 'AI YOUR GYM', { tracking: 0.05, spatie: 0.8 })
  const wvb = `0 0 ${r2(w.breedte)} ${r2(w.hoogte)}`
  schrijf(M, 'woordmerk-licht.svg', svg(wvb, `<path d="${w.d}" fill="${K.inkt}"/>`))
  schrijf(M, 'woordmerk-donker.svg', svg(wvb, `<path d="${w.d}" fill="${K.kalk}"/>`))
  const opt = { verhouding: 1.9, gat: 0.22 }
  schrijf(M, 'lockup-licht.svg', lockup(rooster(licht), 100, 100, w, K.inkt, opt))
  schrijf(M, 'lockup-donker.svg', lockup(rooster(donker), 100, 100, w, K.kalk, opt))
  schrijf(M, 'lockup-clubgroen.svg', lockup(rooster(club), 100, 100, w, K.clubgroen, opt))
}

console.log('klaar')
