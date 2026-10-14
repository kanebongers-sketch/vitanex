// ─── Fit Factory Club: illustraties van oefeningen ophalen (RepDB) ───────────
// Haalt voor elke gekoppelde oefening de begin- en piekhouding op uit de gratis
// versie van RepDB (github.com/RepDB/exercise-dataset, map images/flat, 512x512
// WebP) en zet ze in public/club/oefeningen-repdb als <id>-start.webp en
// <id>-eind.webp. Heeft een oefening maar een houding (main, bij houdingen en
// rekoefeningen), dan wordt die voor beide gebruikt.
//
// Licentie (LICENSE-DATA.md in de repo): gratis ook commercieel in een app, met
// zichtbare bronvermelding "Exercise data by RepDB (repdb.co)"; niet
// herpubliceren als dataset of API; niet gebruiken voor generatieve AI. We
// gebruiken NIETS uit premium-samples/ (alleen voor evaluatie). De bestanden
// worden ongewijzigd opgeslagen.
//
// Welke oefeningen: src/lib/club/training/beelden-repdb.ts (handmatig gekozen).
// Het script controleert per id of de Engelse titel in de dataset nog klopt en
// of geen twee oefeningen hetzelfde beeldbestand delen.
//
// Gebruik: node scripts/club/repdb-import.mjs
// Geen pakketten nodig (Node 18 of nieuwer, ingebouwde fetch).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const KOPPELING = join(ROOT, 'src', 'lib', 'club', 'training', 'beelden-repdb.ts')
const DOEL = join(ROOT, 'public', 'club', 'oefeningen-repdb')
const RAW = 'https://raw.githubusercontent.com/RepDB/exercise-dataset/main'
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const BEELD = /^images\/flat\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/
const MAX_BYTES = 400 * 1024

/** Alle koppelingen uit het TypeScript-bestand: { id, titel }. */
async function leesKoppelingen() {
  const tekst = await readFile(KOPPELING, 'utf8')
  const patroon = /id:\s*'([^']+)',\s*titel:\s*(['"])(.*?)\2/g
  const lijst = [...tekst.matchAll(patroon)].map((m) => ({ id: m[1], titel: m[3] }))
  if (lijst.length === 0) throw new Error('Geen koppelingen gevonden in beelden-repdb.ts')
  for (const k of lijst) if (!SLUG.test(k.id)) throw new Error(`Ongeldige id: ${k.id}`)
  if (new Set(lijst.map((k) => k.id)).size !== lijst.length) throw new Error('Dubbele id in beelden-repdb.ts')
  return lijst
}

async function haal(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} gaf status ${res.status}`)
  return res
}

/** Begin- en eindbeeld uit een record: start + peak, of main voor beide. */
function houdingen(oefening) {
  const flat = oefening?.images?.flat
  const start = flat?.start ?? flat?.main
  const eind = flat?.peak ?? flat?.main
  if (typeof start !== 'string' || typeof eind !== 'string') throw new Error(`${oefening.id}: geen flat-beelden`)
  for (const pad of [start, eind]) if (!BEELD.test(pad)) throw new Error(`${oefening.id}: onverwacht pad ${pad}`)
  return { start, eind }
}

/** Alleen echte WebP-bestanden van redelijke grootte. */
function controleerWebp(bytes, pad) {
  const kop = bytes.subarray(0, 12).toString('latin1')
  if (!kop.startsWith('RIFF') || kop.slice(8, 12) !== 'WEBP') throw new Error(`${pad} is geen WebP`)
  if (bytes.length > MAX_BYTES) throw new Error(`${pad} is groter dan ${MAX_BYTES} bytes`)
}

function kiesBeelden(koppelingen, dataset) {
  const gezien = new Map()
  return koppelingen.map((k) => {
    const oefening = dataset.get(k.id)
    if (!oefening) throw new Error(`${k.id} bestaat niet in de dataset`)
    if (oefening.name_en.trim() !== k.titel.trim()) {
      throw new Error(`${k.id}: titel "${oefening.name_en}" verwacht "${k.titel}"`)
    }
    const beelden = houdingen(oefening)
    for (const pad of new Set([beelden.start, beelden.eind])) {
      if (gezien.has(pad)) throw new Error(`${k.id} deelt ${pad} met ${gezien.get(pad)}`)
      gezien.set(pad, k.id)
    }
    return { id: k.id, ...beelden }
  })
}

async function verwerk(keuze) {
  let bytes = 0
  for (const [houding, pad] of [['start', keuze.start], ['eind', keuze.eind]]) {
    const inhoud = Buffer.from(await (await haal(`${RAW}/${pad}`)).arrayBuffer())
    controleerWebp(inhoud, pad)
    await writeFile(join(DOEL, `${keuze.id}-${houding}.webp`), inhoud)
    bytes += inhoud.length
  }
  return bytes
}

async function main() {
  const koppelingen = await leesKoppelingen()
  const json = await (await haal(`${RAW}/exercises.json`)).json()
  if (!Array.isArray(json?.exercises)) throw new Error('exercises.json heeft geen lijst "exercises"')
  const dataset = new Map(json.exercises.map((e) => [e.id, e]))
  const keuzes = kiesBeelden(koppelingen, dataset)
  await mkdir(DOEL, { recursive: true })
  let totaal = 0
  let enkel = 0
  for (const keuze of keuzes) {
    totaal += await verwerk(keuze)
    if (keuze.start === keuze.eind) enkel += 1
    process.stdout.write('.')
  }
  process.stdout.write(
    `\n${keuzes.length} oefeningen (${enkel} met een enkele houding), ${keuzes.length * 2} bestanden, ${(totaal / 1024).toFixed(0)} kB\n`,
  )
}

const direct = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (direct) {
  main().catch((fout) => {
    process.stderr.write(`Import mislukt: ${fout instanceof Error ? fout.message : String(fout)}\n`)
    process.exitCode = 1
  })
}
