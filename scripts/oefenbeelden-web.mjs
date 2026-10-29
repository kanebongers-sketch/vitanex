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
//   frames/<maat>/f000.webp ...  losse beelden voor de rep-speler (besluit Kane
//                    24-10-2026): 480 (kwaliteit 80), 720 (85) en 1080 (85, alleen
//                    als alle 1080-beelden samen onder FRAMES_1080_MAX_MB blijven).
//                    Een geanimeerde WebP is niet per beeld te sturen; de speler
//                    toont deze beelden een voor een op het tempo van het schema.
// Daarnaast leidt het script uit "tempo" (of "sleutels" bij de hinge) in
// poses/<slug>.json de fasen van de beweging af (rust_begin, heen, houden_ver,
// terug, rust_eind) en schrijft die met heen_is en soort in de data.
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
// De onderkant ligt vast op de vloer (MARGE_ONDER) en de vloerlijn gaat als
// vloer_y in de data, zodat de site de schaduw precies onder het figuur legt.
// De stills komen uit dezelfde lusbeelden (stil_frames in poses/<slug>.json) met
// dezelfde uitsnede, zodat poster en lus precies op elkaar vallen als de lus
// erin vervaagt. Daarna schrijft het script
// src/components/aiyourgym/inhoud/oefenrenders.data.ts opnieuw.
//
// Gebruik:   node scripts/oefenbeelden-web.mjs              (alle oefeningen)
//            node scripts/oefenbeelden-web.mjs back-squat   (een of meer)
//            node scripts/oefenbeelden-web.mjs --bron D:\renders

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
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
/** Rand onder het laagste punt (de vloer), als fractie van de zijde van de uitsnede. */
const MARGE_ONDER = 0.04
/** Alfa vanaf deze waarde telt als figuur bij het bijsnijden. */
const ALFA_DREMPEL = 16

/** Maten van de losse beelden voor de rep-speler (px), klein naar groot. */
const FRAME_MATEN = [480, 720, 1080]
/** 1080 valt weg als alle beelden op die maat samen zwaarder zijn dan dit (MB). */
const FRAMES_1080_MAX_MB = 6

/**
 * Welke kant de heen-beweging (tempo 0 naar 1) op gaat, per oefening.
 * excentrisch: eerst zakken onder belasting (squat, lunge, push-up, bankdrukken).
 * concentrisch: eerst omhoog of trekken (curl, roeien, drukken boven het hoofd,
 * deadlift vanaf de vloer, glute bridge).
 * soort vasthouden: de houding blijft staan en de lus is alleen ademen (plank);
 * heen_is is daar de inademing en telt voor de speler niet als richting.
 */
const BEWEGING = {
  'back-squat': { heen_is: 'excentrisch', soort: 'herhaling' },
  'front-squat': { heen_is: 'excentrisch', soort: 'herhaling' },
  'lunge-met-barbell': { heen_is: 'excentrisch', soort: 'herhaling' },
  'push-up': { heen_is: 'excentrisch', soort: 'herhaling' },
  deadlift: { heen_is: 'concentrisch', soort: 'herhaling' },
  'barbell-row': { heen_is: 'concentrisch', soort: 'herhaling' },
  'barbell-curl': { heen_is: 'concentrisch', soort: 'herhaling' },
  'overhead-press': { heen_is: 'concentrisch', soort: 'herhaling' },
  'glute-bridge': { heen_is: 'concentrisch', soort: 'herhaling' },
  plank: { heen_is: 'concentrisch', soort: 'vasthouden' },
  // Golf 1 (29-10-2026)
  'push-up-op-knieen': { heen_is: 'excentrisch', soort: 'herhaling' },
  'push-up-met-smalle-handen': { heen_is: 'excentrisch', soort: 'herhaling' },
  'glute-bridge-op-een-been': { heen_is: 'concentrisch', soort: 'herhaling' },
  zijplank: { heen_is: 'concentrisch', soort: 'vasthouden' },
  superman: { heen_is: 'concentrisch', soort: 'herhaling' },
  // De RDL en de good morning beginnen rechtop: eerst zakken met de heupen naar achteren.
  'roemeense-deadlift-met-barbell': { heen_is: 'excentrisch', soort: 'herhaling' },
  'sumo-deadlift': { heen_is: 'concentrisch', soort: 'herhaling' },
  'good-morning': { heen_is: 'excentrisch', soort: 'herhaling' },
  'barbell-row-met-onderhandse-greep': { heen_is: 'concentrisch', soort: 'herhaling' },
  'schouders-ophalen-met-barbell': { heen_is: 'concentrisch', soort: 'herhaling' },
  // Thruster: eerst de front squat omlaag, dan in een beweging omhoog en drukken.
  'thruster-met-barbell': { heen_is: 'excentrisch', soort: 'herhaling' },
  'squat-met-lichaamsgewicht': { heen_is: 'excentrisch', soort: 'herhaling' },
  'achterwaartse-lunge': { heen_is: 'excentrisch', soort: 'herhaling' },
  'split-squat': { heen_is: 'excentrisch', soort: 'herhaling' },
  'walking-lunge-met-lichaamsgewicht': { heen_is: 'excentrisch', soort: 'herhaling' },
  'zijwaartse-lunge': { heen_is: 'excentrisch', soort: 'herhaling' },
  'calf-raise-met-lichaamsgewicht': { heen_is: 'concentrisch', soort: 'herhaling' },
  'pike-push-up': { heen_is: 'excentrisch', soort: 'herhaling' },
  'mountain-climber': { heen_is: 'concentrisch', soort: 'herhaling' },
  'bird-dog': { heen_is: 'concentrisch', soort: 'herhaling' },
  // Squat jump en burpee: eerst inzakken, dan explosief omhoog.
  'squat-jump': { heen_is: 'excentrisch', soort: 'herhaling' },
  burpee: { heen_is: 'excentrisch', soort: 'herhaling' },
  // Golf 1A, buik (29-10-2026). Wisselende oefeningen (dead bug, crunch met
  // draai, fietsende crunch, russian twist): een lus is beide kanten.
  crunch: { heen_is: 'concentrisch', soort: 'herhaling' },
  'reverse-crunch': { heen_is: 'concentrisch', soort: 'herhaling' },
  'leg-raise-liggend': { heen_is: 'concentrisch', soort: 'herhaling' },
  'hollow-hold': { heen_is: 'concentrisch', soort: 'vasthouden' },
  // Dead bug: eerst arm en been gecontroleerd van je af laten zakken.
  'dead-bug': { heen_is: 'excentrisch', soort: 'herhaling' },
  'crunch-met-draai': { heen_is: 'concentrisch', soort: 'herhaling' },
  'fietsende-crunch': { heen_is: 'concentrisch', soort: 'herhaling' },
  'russian-twist': { heen_is: 'concentrisch', soort: 'herhaling' },
}

/** Instellingen per bestand: kwaliteit en inspanning van libwebp. */
const WEBP = {
  hd: { quality: 86, alphaQuality: 100, smartSubsample: true, effort: 5 },
  middel: { quality: 85, alphaQuality: 100, smartSubsample: true, effort: 5 },
  klein: { quality: 80, alphaQuality: 95, smartSubsample: true, effort: 5 },
  still: { quality: 92, alphaQuality: 100, smartSubsample: true, effort: 6 },
  frame480: { quality: 80, alphaQuality: 95, smartSubsample: true, effort: 5 },
  frame720: { quality: 85, alphaQuality: 100, smartSubsample: true, effort: 5 },
  frame1080: { quality: 85, alphaQuality: 100, smartSubsample: true, effort: 5 },
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
  // Onderkant vast: het laagste punt (voeten of lichaam op de vloer) komt bij
  // elke oefening op dezelfde hoogte, met een smalle rand eronder voor de
  // schaduw. Vroeger stond het figuur in het midden en hield een breed figuur
  // (push-up, plank) een brede lege band onder zich: het leek te zweven.
  // Een negatieve top mag: dan komt er boven de bron een doorzichtige strook bij
  // (zie uitsnede()), want de camera zet een breed figuur midden in de bron.
  const top = Math.min(maat.h - zijde, doos.y2 + 1 + Math.round(zijde * MARGE_ONDER) - zijde)
  return { left, top, width: zijde, height: zijde }
}

/** De uitsnede van een frame als sharp-stap; boven de bron zo nodig doorzichtig aangevuld. */
async function uitsnede(bestand, snij) {
  if (snij.top >= 0) return sharp(bestand).extract(snij)
  const { data, info } = await sharp(bestand)
    .ensureAlpha()
    .extend({ top: -snij.top, bottom: 0, left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true })
  return sharp(data, { raw: info }).extract({ ...snij, top: 0 })
}

/** Een frame bijgesneden en verkleind, als PNG-buffer (verliesvrij tussenstation). */
async function beeld(bestand, snij, maat) {
  const stap = await uitsnede(bestand, snij)
  const klaar = maat === snij.width ? stap : stap.resize(maat, maat, { kernel: 'lanczos3' })
  return klaar.png({ compressionLevel: 3 }).toBuffer()
}

/** Wachttijd per beeld in ms, afgerond zodat de lus precies FPS haalt (41, 42, 42, 41...). */
function wachttijden(aantal) {
  return Array.from({ length: aantal }, (_, i) => Math.round(((i + 1) * 1000) / FPS) - Math.round((i * 1000) / FPS))
}

/**
 * Bovengrens per lus in bytes, gelijk aan MAX_KB in oefenrenders.test.ts. Een
 * lange lus (96 tot 120 beelden, zoals de walking lunge) kan erboven komen; dan
 * zakt de kwaliteit in stappen van 2 tot hij past, nooit onder LUS_MIN_KWALITEIT.
 */
const LUS_MAX_BYTES = { hd: 3072 * 1024, middel: 2304 * 1024, klein: 1330 * 1024 }
const LUS_MIN_KWALITEIT = 76

async function maakLus(frames, snij, maat, opties, doel, maxBytes = Infinity) {
  const bufs = []
  for (const f of frames) bufs.push(await beeld(f, snij, maat))
  for (let quality = opties.quality; ; quality -= 2) {
    await sharp(bufs, { join: { animated: true } })
      .webp({ ...opties, quality, loop: 0, delay: wachttijden(bufs.length) })
      .toFile(doel)
    const bytes = statSync(doel).size
    if (bytes <= maxBytes) return
    if (quality - 2 < LUS_MIN_KWALITEIT) throw new Error(`${doel} blijft boven ${Math.round(maxBytes / 1024)} KB, ook op kwaliteit ${quality}`)
    console.log(`  ${doel.split(/[\\/]/).pop()}: ${Math.round(bytes / 1024)} KB te zwaar op kwaliteit ${quality}, opnieuw op ${quality - 2}`)
  }
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

const nummer = (i) => String(i).padStart(3, '0')

/**
 * Losse beelden per maat in uit/frames/<maat>/f000.webp, zelfde uitsnede als de
 * lussen. Elke bronframe wordt een keer uitgesneden en dan per maat verkleind.
 * Een maat groter dan de uitsnede valt weg (nooit opschalen); 1080 valt ook weg
 * boven het budget. Geeft per maat pad, breedte, hoogte en totale bytes.
 */
async function maakFrames(frames, snij, uit) {
  const map = join(uit, 'frames')
  rmSync(map, { recursive: true, force: true })
  const maten = FRAME_MATEN.filter((m) => m <= snij.width)
  for (const m of maten) mkdirSync(join(map, String(m)), { recursive: true })
  for (let i = 0; i < frames.length; i++) {
    const vol = await (await uitsnede(frames[i], snij)).png({ compressionLevel: 1 }).toBuffer()
    for (const m of maten) {
      await sharp(vol)
        .resize(m, m, { kernel: 'lanczos3' })
        .webp(WEBP[`frame${m}`])
        .toFile(join(map, String(m), `f${nummer(i)}.webp`))
    }
  }
  const uitkomst = {}
  for (const m of maten) {
    const dir = join(map, String(m))
    const bytes = readdirSync(dir).reduce((som, f) => som + statSync(join(dir, f)).size, 0)
    if (m === 1080 && bytes > FRAMES_1080_MAX_MB * 1024 * 1024) {
      console.log(`  1080 valt weg: ${(bytes / 1048576).toFixed(1)} MB boven ${FRAMES_1080_MAX_MB} MB`)
      rmSync(dir, { recursive: true, force: true })
      continue
    }
    uitkomst[m] = { pad: `frames/${m}/f{nnn}.webp`, breedte: m, hoogte: m, bytes }
  }
  return uitkomst
}

/** De tempo-sleutels [[frame, 0..1], ...] uit de pose: "tempo", of "sleutels" (h) bij de hinge. */
function tempoVan(pose) {
  if (Array.isArray(pose.tempo)) return pose.tempo.map(([f, v]) => [f, v])
  if (Array.isArray(pose.sleutels)) return pose.sleutels.map((s) => [s.frame, s.h])
  throw new Error('geen tempo of sleutels in de pose')
}

/**
 * Fasen als halfopen reeksen [van, tot) van beeldnummers, aaneengesloten van 0
 * tot het aantal beelden: rust_begin (nog op de beginstand), heen (naar de
 * verste stand), houden_ver (op de verste stand), terug en rust_eind.
 */
function fasenUitTempo(tempo, aantal) {
  const sleutels = [...tempo].sort((a, b) => a[0] - b[0])
  const start = sleutels[0][1]
  // De verste stand is de waarde die het verst van de beginstand ligt: meestal 1
  // (vanaf 0), maar bij een hinge die rechtop begint (RDL, h = 1) de laagste waarde.
  const ver = sleutels.reduce((best, [, v]) => (Math.abs(v - start) > Math.abs(best - start) ? v : best), start)
  const gelijk = (a, b) => Math.abs(a - b) < 1e-6
  const iVertrek = sleutels.findIndex(([, v]) => !gelijk(v, start))
  if (iVertrek < 1) throw new Error('tempo vertrekt niet van een beginstand')
  const iVerEerst = sleutels.findIndex(([, v]) => gelijk(v, ver))
  let iVerLaatst = iVerEerst
  while (iVerLaatst + 1 < sleutels.length && gelijk(sleutels[iVerLaatst + 1][1], ver)) iVerLaatst++
  const iTerug = sleutels.findIndex(([, v], i) => i > iVerLaatst && gelijk(v, start))
  if (iTerug < 0) throw new Error('tempo komt niet terug op de beginstand')
  const klem = (f) => Math.max(0, Math.min(aantal, Math.round(f)))
  const grens = [0, sleutels[iVertrek - 1][0], sleutels[iVerEerst][0], sleutels[iVerLaatst][0], sleutels[iTerug][0], aantal].map(klem)
  const namen = ['rust_begin', 'heen', 'houden_ver', 'terug', 'rust_eind']
  return Object.fromEntries(namen.map((n, i) => [n, [grens[i], grens[i + 1]]]))
}

function poseVan(bron, slug) {
  const pose = join(bron, '..', 'poses', `${slug}.json`)
  if (!existsSync(pose)) throw new Error(`geen pose ${pose}: nodig voor de fasen`)
  return JSON.parse(readFileSync(pose, 'utf8'))
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
  await maakLus(frames, snij, maten['lus-hd'], WEBP.hd, join(uit, 'lus-hd.webp'), LUS_MAX_BYTES.hd)
  await maakLus(frames, snij, maten.lus, WEBP.middel, join(uit, 'lus.webp'), LUS_MAX_BYTES.middel)
  await maakLus(frames, snij, maten['lus-klein'], WEBP.klein, join(uit, 'lus-klein.webp'), LUS_MAX_BYTES.klein)
  const stil = stilFrames(bron, slug, frames.length)
  for (const stand of ['begin', 'piek']) {
    const frame = frames[stil[stand]]
    await maakStill(frame, snij, maten[stand], WEBP.still, join(uit, `${stand}.webp`))
    await maakStill(frame, snij, maten[`${stand}-klein`], WEBP.klein, join(uit, `${stand}-klein.webp`))
  }
  const losseMaten = await maakFrames(frames, snij, uit)
  // Vloerlijn: de onderste rij met figuur over alle frames (voeten, of handen en
  // lichaam bij vloeroefeningen), als fractie van de hoogte van de uitsnede.
  const vloer_y = doos ? Math.round(((doos.y2 + 1 - snij.top) / snij.height) * 10000) / 10000 : 1
  return { breedte: hd, hoogte: hd, fps: FPS, beelden: frames.length, maten, vloer_y, losseMaten }
}

/** Naam en spieren uit het 3D-bestand: de naam is exact die van de oefenbibliotheek. */
function uitBibliotheek(slug, bron) {
  const bestand = join(BIBLIOTHEEK, `${slug}.ts`)
  // Een render die direct in Blender is gemaakt (golf 1) heeft geen 3D-bestand in
  // de app: dan komen naam en spieren uit poses/<slug>.json. De naam daar is
  // exact die van de oefenbibliotheek (de tests in blender-bibliotheek.test.ts
  // controleren dat).
  if (!existsSync(bestand)) return uitPoseBestand(slug, bron)
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
  achterste_schouder: 'schouder', adductoren: 'dij', abductoren: 'bil', heupbuigers: 'dij',
}

function uitPoseBestand(slug, bron) {
  const pose = join(bron, '..', 'poses', `${slug}.json`)
  if (!existsSync(pose)) throw new Error(`geen 3D-oefening ${slug}.ts en geen pose ${pose}: naam onbekend`)
  const naam = JSON.parse(readFileSync(pose, 'utf8')).naam
  if (typeof naam !== 'string' || !naam.trim()) throw new Error(`geen naam in ${pose}`)
  return { naam: naam.trim(), spieren: uitPose(slug, bron), spierenSecundair: [] }
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
  const beweging = BEWEGING[slug]
  if (!beweging) throw new Error(`${slug} staat niet in BEWEGING (heen_is en soort): voeg hem toe`)
  const pose = poseVan(bron, slug)
  const { losseMaten, ...maat } = await maakBestanden(bron, slug, uit)
  const fasen = fasenUitTempo(tempoVan(pose), maat.beelden)
  const bytes = Object.fromEntries(BESTANDEN.map((b) => [b, statSync(join(uit, `${b}.webp`)).size]))
  const hash = createHash('sha1')
  for (const b of BESTANDEN) hash.update(readFileSync(join(uit, `${b}.webp`)))
  const frameHash = createHash('sha1')
  for (const m of Object.keys(losseMaten)) {
    const dir = join(uit, 'frames', m)
    for (const f of readdirSync(dir).sort()) frameHash.update(readFileSync(join(dir, f)))
  }
  const frames = {
    aantal: maat.beelden,
    fps: FPS,
    versie: frameHash.digest('hex').slice(0, 8),
    maten: losseMaten,
    fasen,
    heen_is: beweging.heen_is,
    soort: beweging.soort,
  }
  return { slug, ...bib, ...maat, versie: hash.digest('hex').slice(0, 8), bytes, frames }
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
    const fr = Object.entries(r.frames.maten).map(([m, v]) => `frames ${m} ${(v.bytes / 1048576).toFixed(2)} MB`).join(', ')
    console.log(`${slug} (${r.naam}, ${r.breedte} px, ${r.beelden} beelden): ${kb}, ${fr}`)
    console.log(`  fasen ${JSON.stringify(r.frames.fasen)}, vloer_y ${r.vloer_y}`)
  }
  schrijfData([...data.values()])
  console.log(`Klaar: ${kies.length} oefening(en) in public/oefenbeelden, gegevens in ${DATA}`)
}

hoofd().catch((fout) => {
  console.error(`Fout: ${fout instanceof Error ? fout.message : String(fout)}`)
  process.exit(1)
})
