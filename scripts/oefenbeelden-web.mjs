#!/usr/bin/env node
// ─── AI Your Gym: Blender-renders van oefeningen klaarzetten voor de website ──
// Leest de renders uit C:\Users\Kaneb\oefenbeelden\uit\<slug>\frames\*.png
// (1440 x 1440, 192 samples, 24 beelden per seconde) en schrijft HD-webversies
// naar public/oefenbeelden/<slug>/:
//   lus-hd.webp      bewegende lus op de volle bronmaat na bijsnijden (tot 1440 px),
//                    kwaliteit 86: retina en grote schermen
//   lus.webp         bewegende lus, 720 px, kwaliteit 85: gewone schermen
//   lus-klein.webp   bewegende lus, 480 px, kwaliteit 80: telefoons en kaartjes
//   begin.webp       stilstaand beginbeeld op HD-maat, kwaliteit 92 (poster)
//   piek.webp        stilstaand beeld op het zwaarste punt, HD-maat, kwaliteit 92
//   begin-klein.webp en piek-klein.webp, 480 px: poster op de telefoon
// Alle lussen houden de volle 24 beelden per seconde van de render: met 12
// haperde de beweging zichtbaar.
//
// Waarom sharp (libvips plus libwebp 1.6) en niet ffmpeg:
// - sharp verkleint met voorvermenigvuldigde alfa, dus geen donkere of lichte
//   rand (halo) langs het figuur op de doorzichtige achtergrond;
// - smartSubsample (sharp YUV) houdt de oranje spierzones en dunne randen
//   scherp, waar gewone 4:2:0 ze blokkerig maakte;
// - de geanimeerde encoder slaat pixels over die niet veranderen en voegt
//   gelijke beelden samen, zodat 24 beelden per seconde betaalbaar blijft.
// Lossless is gemeten en valt af: ruim 7 MB voor een lus van 940 px.
//
// Het beeld wordt vierkant bijgesneden rond het figuur met materiaal, over de
// hele beweging (lege rand eraf), zodat elke oefening even groot in beeld staat.
// De stills komen uit dezelfde lusbeelden (stil_frames in poses/<slug>.json) met
// dezelfde uitsnede, zodat poster en lus precies op elkaar vallen als de lus
// erin vervaagt. Daarna schrijft het script
// src/components/aiyourgym/inhoud/oefenrenders.data.ts opnieuw.
//
// Gebruik:   node scripts/oefenbeelden-web.mjs              (alle oefeningen)
//            node scripts/oefenbeelden-web.mjs back-squat   (een of meer)
//            node scripts/oefenbeelden-web.mjs --bron D:\renders

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOEL = join(REPO, 'public', 'oefenbeelden')
const BIBLIOTHEEK = join(REPO, 'src', 'lib', 'club', 'training', '3d', 'bibliotheek')
const DATA = join(REPO, 'src', 'components', 'aiyourgym', 'inhoud', 'oefenrenders.data.ts')
const STANDAARD_BRON = 'C:\\Users\\Kaneb\\oefenbeelden\\uit'

/** Bovengrens van de HD-maat; kleiner als de uitsnede van de bron kleiner is (nooit opschalen). */
const HD_MAX = 1440
const MIDDEL = 720
const KLEIN = 480
/** Beelden per seconde van de renders en van de webversie. */
const FPS = 24
/** Lege rand rond het figuur, als fractie van de grootste kant. */
const MARGE = 0.06
/** Alfa vanaf deze waarde telt als figuur bij het bijsnijden. */
const ALFA_DREMPEL = 16

/** Instellingen per bestand: kwaliteit en inspanning van libwebp. */
const WEBP = {
  hd: { quality: 86, alphaQuality: 100, smartSubsample: true, effort: 5 },
  middel: { quality: 85, alphaQuality: 100, smartSubsample: true, effort: 5 },
  klein: { quality: 80, alphaQuality: 95, smartSubsample: true, effort: 5 },
  still: { quality: 92, alphaQuality: 100, smartSubsample: true, effort: 6 },
}

// Zuinig met geheugen en processor: de pc van Kane crasht bij zware processen.
sharp.concurrency(2)
sharp.cache(false)

function leesArgs(argv) {
  const uit = { bron: STANDAARD_BRON, slugs: [] }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--bron') uit.bron = argv[++i] ?? uit.bron
    else uit.slugs.push(argv[i])
  }
  return uit
}

function framesVan(map) {
  const framesMap = join(map, 'frames')
  if (!existsSync(framesMap)) throw new Error(`geen frames in ${framesMap}`)
  const lijst = readdirSync(framesMap).filter((f) => /^\d+\.png$/.test(f)).sort()
  if (lijst.length === 0) throw new Error(`geen frames in ${framesMap}`)
  return lijst.map((f) => join(framesMap, f))
}

/** De kleinste rechthoek waarin het figuur over alle frames valt (alfakanaal). */
async function omhullende(frames) {
  const doos = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }
  let maat = null
  for (const f of frames) {
    const { data, info } = await sharp(f).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true })
    maat ??= { w: info.width, h: info.height }
    for (let y = 0; y < info.height; y++) {
      const rij = y * info.width
      let links = -1
      let rechts = -1
      for (let x = 0; x < info.width; x++) {
        if (data[rij + x] >= ALFA_DREMPEL) {
          if (links < 0) links = x
          rechts = x
        }
      }
      if (links < 0) continue
      doos.x1 = Math.min(doos.x1, links)
      doos.x2 = Math.max(doos.x2, rechts)
      doos.y1 = Math.min(doos.y1, y)
      doos.y2 = Math.max(doos.y2, y)
    }
  }
  return { doos: Number.isFinite(doos.x1) ? doos : null, maat }
}

/** Een vierkante uitsnede rond de omhullende, binnen het bronbeeld. */
function vierkant(doos, maat) {
  const bron = Math.min(maat.w, maat.h)
  if (!doos) return { left: 0, top: 0, width: bron, height: bron }
  const zijde = Math.min(bron, Math.round(Math.max(doos.x2 - doos.x1, doos.y2 - doos.y1) * (1 + 2 * MARGE)))
  const klem = (v, max) => Math.max(0, Math.min(max - zijde, v))
  const left = klem(Math.round((doos.x1 + doos.x2) / 2 - zijde / 2), maat.w)
  const top = klem(Math.round((doos.y1 + doos.y2) / 2 - zijde / 2), maat.h)
  return { left, top, width: zijde, height: zijde }
}

/** Een frame bijgesneden en verkleind, als PNG-buffer (verliesvrij tussenstation). */
function beeld(bestand, snij, maat) {
  const stap = sharp(bestand).extract(snij)
  const klaar = maat === snij.width ? stap : stap.resize(maat, maat, { kernel: 'lanczos3' })
  return klaar.png({ compressionLevel: 3 }).toBuffer()
}

/** Wachttijd per beeld in ms, afgerond zodat de lus precies FPS haalt (41, 42, 42, 41...). */
function wachttijden(aantal) {
  return Array.from({ length: aantal }, (_, i) => Math.round(((i + 1) * 1000) / FPS) - Math.round((i * 1000) / FPS))
}

async function maakLus(frames, snij, maat, opties, doel) {
  const bufs = []
  for (const f of frames) bufs.push(await beeld(f, snij, maat))
  await sharp(bufs, { join: { animated: true } })
    .webp({ ...opties, loop: 0, delay: wachttijden(bufs.length) })
    .toFile(doel)
}

async function maakStill(frame, snij, maat, opties, doel) {
  await sharp(await beeld(frame, snij, maat)).webp(opties).toFile(doel)
}

/** Welke lusbeelden de begin- en piekstand zijn (poses/<slug>.json), binnen de lus. */
function stilFrames(bron, slug, aantal) {
  const pose = join(bron, '..', 'poses', `${slug}.json`)
  const stil = existsSync(pose) ? JSON.parse(readFileSync(pose, 'utf8')).stil_frames ?? {} : {}
  const binnen = (v, reserve) => (Number.isInteger(v) && v >= 0 && v < aantal ? v : reserve)
  return { begin: binnen(stil.begin, 0), piek: binnen(stil.piek, Math.floor(aantal / 2)) }
}

async function maakBestanden(bron, slug, uit) {
  const frames = framesVan(join(bron, slug))
  const { doos, maat } = await omhullende(frames)
  const snij = vierkant(doos, maat)
  const hd = Math.min(HD_MAX, snij.width)
  const maten = {
    'lus-hd': hd,
    lus: Math.min(MIDDEL, hd),
    'lus-klein': Math.min(KLEIN, hd),
    begin: hd,
    piek: hd,
    'begin-klein': Math.min(KLEIN, hd),
    'piek-klein': Math.min(KLEIN, hd),
  }
  await maakLus(frames, snij, maten['lus-hd'], WEBP.hd, join(uit, 'lus-hd.webp'))
  await maakLus(frames, snij, maten.lus, WEBP.middel, join(uit, 'lus.webp'))
  await maakLus(frames, snij, maten['lus-klein'], WEBP.klein, join(uit, 'lus-klein.webp'))
  const stil = stilFrames(bron, slug, frames.length)
  for (const stand of ['begin', 'piek']) {
    const frame = frames[stil[stand]]
    await maakStill(frame, snij, maten[stand], WEBP.still, join(uit, `${stand}.webp`))
    await maakStill(frame, snij, maten[`${stand}-klein`], WEBP.klein, join(uit, `${stand}-klein.webp`))
  }
  return { breedte: hd, hoogte: hd, fps: FPS, beelden: frames.length, maten }
}

/** Naam en spieren uit het 3D-bestand: de naam is exact die van de oefenbibliotheek. */
function uitBibliotheek(slug, bron) {
  const bestand = join(BIBLIOTHEEK, `${slug}.ts`)
  if (!existsSync(bestand)) throw new Error(`geen 3D-oefening ${slug}.ts in de bibliotheek: de mapnaam moet het 3D-bestand volgen`)
  const tekst = readFileSync(bestand, 'utf8')
  // naam: 'X' in het object, of als eerste argument van een bouwsteen: plank('Plank')
  const naam = (tekst.match(/naam:\s*'([^']+)'/) ?? tekst.match(/=\s*\w+\(\s*'([^']+)'/))?.[1]
  if (!naam) throw new Error(`geen naam gevonden in ${slug}.ts`)
  const lijst = (sleutel) =>
    [...(tekst.match(new RegExp(`${sleutel}:\\s*\\[([^\\]]*)\\]`))?.[1] ?? '').matchAll(/'([a-z]+)'/g)].map((m) => m[1])
  const spieren = lijst('spieren')
  // Een bouwsteen (heupstrek, plank) rekent de spieren zelf uit; dan de oranje zones uit de pose.
  if (spieren.length === 0) return { naam, spieren: uitPose(slug, bron), spierenSecundair: [] }
  return { naam, spieren, spierenSecundair: lijst('spierenSecundair') }
}

/** Oranje zones van de render (poses/<slug>.json) als lichaamsdelen van de 3D-bibliotheek. */
const ZONE_DEEL = {
  quadriceps: 'dij', hamstrings: 'hamstring', bilspieren: 'bil', kuiten: 'kuit', borst: 'borst',
  voorste_schouder: 'schouder', zijschouder: 'schouder', triceps: 'bovenarm', biceps: 'bovenarm',
  onderarm: 'onderarm', bovenrug: 'rug', onderrug: 'onderrug', buikspieren: 'romp', schuine_buikspieren: 'romp',
}

function uitPose(slug, bron) {
  const pose = join(bron, '..', 'poses', `${slug}.json`)
  if (!existsSync(pose)) return []
  const zones = JSON.parse(readFileSync(pose, 'utf8')).spieren ?? []
  return [...new Set(zones.map((z) => ZONE_DEEL[z]).filter(Boolean))]
}

const BESTANDEN = ['lus-hd', 'lus', 'lus-klein', 'begin', 'piek', 'begin-klein', 'piek-klein']

async function verwerk(bron, slug) {
  const uit = join(DOEL, slug)
  mkdirSync(uit, { recursive: true })
  const bib = uitBibliotheek(slug, bron)
  const maat = await maakBestanden(bron, slug, uit)
  const bytes = Object.fromEntries(BESTANDEN.map((b) => [b, statSync(join(uit, `${b}.webp`)).size]))
  const hash = createHash('sha1')
  for (const b of BESTANDEN) hash.update(readFileSync(join(uit, `${b}.webp`)))
  return { slug, ...bib, ...maat, versie: hash.digest('hex').slice(0, 8), bytes }
}

function bestaandeData() {
  if (!existsSync(DATA)) return []
  const m = readFileSync(DATA, 'utf8').match(/=\s*(\[[\s\S]*\])\s*as const/)
  // Oude regels zonder maten (van voor de HD-versie) tellen niet mee.
  return m ? JSON.parse(m[1]).filter((d) => d.maten) : []
}

function schrijfData(lijst) {
  const gesorteerd = [...lijst].sort((a, b) => a.slug.localeCompare(b.slug))
  const kop = [
    '// GEGENEREERD door scripts/oefenbeelden-web.mjs. Niet met de hand aanpassen:',
    '// draai het script opnieuw. Spieren zijn sleutels van Lichaamsdeel (3D-bibliotheek).',
    '',
  ].join('\n')
  writeFileSync(DATA, `${kop}export const OEFENRENDER_DATA = ${JSON.stringify(gesorteerd, null, 2)} as const\n`)
}

async function hoofd() {
  const { bron, slugs } = leesArgs(process.argv.slice(2))
  if (!existsSync(bron)) throw new Error(`bronmap ${bron} bestaat niet`)
  const kies = slugs.length ? slugs : readdirSync(bron).filter((d) => existsSync(join(bron, d, 'frames', '000.png')))
  const data = new Map(bestaandeData().map((d) => [d.slug, d]))
  for (const slug of kies) {
    const r = await verwerk(bron, slug)
    data.set(slug, r)
    const kb = Object.entries(r.bytes).map(([k, v]) => `${k} ${Math.round(v / 1024)} KB`).join(', ')
    console.log(`${slug} (${r.naam}, ${r.breedte} px, ${r.beelden} beelden): ${kb}`)
  }
  schrijfData([...data.values()])
  console.log(`Klaar: ${kies.length} oefening(en) in public/oefenbeelden, gegevens in ${DATA}`)
}

hoofd().catch((fout) => {
  console.error(`Fout: ${fout instanceof Error ? fout.message : String(fout)}`)
  process.exit(1)
})
