// ─── Fit Factory Club: tekeningen van oefeningen ophalen (Everkinetic) ──────
// Haalt voor elke gekoppelde oefening de begin- en eindhouding op uit de open
// dataset van Everkinetic (github.com/everkinetic/data, CC BY-SA 4.0) en maakt
// ze geschikt voor de club:
//   1. de witte achtergrond (en witte vlakken) eruit, zodat de tekening
//      transparant is op elke ondergrond;
//   2. de lijnkleur wordt currentColor, zodat CSS de kleur bepaalt (als losse
//      afbeelding valt currentColor terug op zwart, goed voor de print);
//   3. overbodige attributen (width, height, xml-kop) eruit.
// Resultaat: public/club/oefeningen/<id>-start.svg en <id>-eind.svg.
//
// Welke oefeningen: src/lib/club/training/beelden-koppeling.ts (handmatig gekozen).
// Het script controleert per nummer of de Engelse titel in de dataset nog klopt.
//
// Gebruik: node scripts/club/everkinetic-import.mjs
// Geen pakketten nodig (Node 18 of nieuwer, ingebouwde fetch).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const KOPPELING = join(ROOT, 'src', 'lib', 'club', 'training', 'beelden-koppeling.ts')
const DOEL = join(ROOT, 'public', 'club', 'oefeningen')
const RAW = 'https://raw.githubusercontent.com/everkinetic/data/master/dist'
const HOUDINGEN = [
  { bron: 'relaxation', doel: 'start' },
  { bron: 'tension', doel: 'eind' },
]

/** Alle koppelingen uit het TypeScript-bestand: { id, titel }. */
async function leesKoppelingen() {
  const tekst = await readFile(KOPPELING, 'utf8')
  const patroon = /id:\s*'(\d{4})',\s*titel:\s*(['"])(.*?)\2/g
  const lijst = [...tekst.matchAll(patroon)].map((m) => ({ id: m[1], titel: m[3] }))
  if (lijst.length === 0) throw new Error('Geen koppelingen gevonden in beelden-koppeling.ts')
  return lijst
}

async function haal(url, soort) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} gaf status ${res.status}`)
  return soort === 'json' ? res.json() : res.text()
}

const WIT = /^#(?:fff|ffffff)$/i

/** Maakt van een Everkinetic-tekening een kleine, kleurloze lijntekening. */
export function bewerkSvg(svg) {
  let uit = svg
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  // Witte groepen en losse witte vlakken weg (de achtergrond).
  uit = uit.replace(/<g\b[^>]*\bfill="([^"]+)"[^>]*>[\s\S]*?<\/g>/g, (heel, kleur) => (WIT.test(kleur) ? '' : heel))
  uit = uit.replace(/<path\b[^>]*\bfill="([^"]+)"[^>]*\/>/g, (heel, kleur) => (WIT.test(kleur) ? '' : heel))
  // Elke overgebleven vulkleur wordt currentColor.
  uit = uit.replace(/\bfill="(?!none")[^"]+"/g, 'fill="currentColor"')
  // Wortel: alleen viewBox en xmlns.
  uit = uit.replace(/<svg\b([^>]*)>/, (_, attrs) => {
    const viewBox = /viewBox="([^"]+)"/.exec(attrs)?.[1] ?? afgeleideViewBox(attrs)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`
  })
  uit = uit.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim()
  controleer(uit)
  return `${uit}\n`
}

function afgeleideViewBox(attrs) {
  const maat = (naam) => Number.parseFloat(new RegExp(`${naam}="([\\d.]+)`).exec(attrs)?.[1] ?? '')
  const b = maat('width')
  const h = maat('height')
  if (!Number.isFinite(b) || !Number.isFinite(h)) throw new Error('SVG zonder viewBox en zonder maten')
  return `0 0 ${b} ${h}`
}

/** Alleen tekenen, niets wat iets doet of iets ophaalt. */
function controleer(svg) {
  if (/<script|<foreignObject|\bon[a-z]+=|\bhref=|url\(/i.test(svg)) throw new Error('Onverwachte inhoud in de SVG')
  if (!/<path\b/.test(svg)) throw new Error('Geen lijnen over na het bewerken')
  if (/#fff\b|#ffffff\b/i.test(svg)) throw new Error('Er is nog wit over')
}

async function verwerk(koppeling, dataset) {
  const oefening = dataset.get(koppeling.id)
  if (!oefening) throw new Error(`${koppeling.id} bestaat niet in de dataset`)
  if (oefening.title.trim() !== koppeling.titel.trim()) {
    throw new Error(`${koppeling.id}: titel "${oefening.title}" verwacht "${koppeling.titel}"`)
  }
  let bytes = 0
  for (const h of HOUDINGEN) {
    const bron = await haal(`${RAW}/svg/${koppeling.id}-${h.bron}.svg`, 'text')
    const schoon = bewerkSvg(bron)
    await writeFile(join(DOEL, `${koppeling.id}-${h.doel}.svg`), schoon, 'utf8')
    bytes += Buffer.byteLength(schoon)
  }
  return bytes
}

async function main() {
  const koppelingen = await leesKoppelingen()
  const lijst = await haal(`${RAW}/exercises.json`, 'json')
  if (!Array.isArray(lijst)) throw new Error('exercises.json is geen lijst')
  const dataset = new Map(lijst.map((e) => [e.id, e]))
  await mkdir(DOEL, { recursive: true })
  let totaal = 0
  for (const k of koppelingen) {
    totaal += await verwerk(k, dataset)
    process.stdout.write('.')
  }
  process.stdout.write(`\n${koppelingen.length} oefeningen, ${koppelingen.length * 2} tekeningen, ${(totaal / 1024).toFixed(0)} kB\n`)
}

const direct = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (direct) {
  main().catch((fout) => {
    process.stderr.write(`Import mislukt: ${fout instanceof Error ? fout.message : String(fout)}\n`)
    process.exitCode = 1
  })
}
