#!/usr/bin/env node
// ─── AI Your Gym: Blender-renders van oefeningen klaarzetten voor de website ──
// Leest de renders uit C:\Users\Kaneb\oefenbeelden\uit\<slug>\ (frames/*.png,
// <slug>-begin.png en <slug>-piek.png, of de kant-en-klare .webp-bestanden) en
// schrijft lichte webversies naar public/oefenbeelden/<slug>/:
//   lus.webp        bewegende lus, 560 px, 12 beelden per seconde (grote beelden)
//   lus-klein.webp  bewegende lus, 360 px (kaartjes en de telefoon)
//   begin.webp      stilstaand beginbeeld, 560 px (poster en reduced motion)
//   piek.webp       stilstaand beeld op het zwaarste punt, 560 px
// Een lus van 72 renderbeelden op 24 per seconde wordt 36 beelden op 12 per
// seconde: dezelfde duur, ruim de helft lichter (doel: lus onder 600 KB).
// Het beeld wordt vierkant bijgesneden rond het figuur met materiaal, over de
// hele beweging (lege rand eraf), zodat elke oefening even groot in beeld staat.
// Daarna schrijft het src/components/aiyourgym/inhoud/oefenrenders.data.ts
// opnieuw (naam en spieren uit de 3D-bibliotheek, maten, bytes en een versie).
//
// Gebruik:   node scripts/oefenbeelden-web.mjs              (alle oefeningen)
//            node scripts/oefenbeelden-web.mjs back-squat   (een of meer)
//            node scripts/oefenbeelden-web.mjs --bron D:\renders
// Zonder ffmpeg worden de .webp-bestanden ongewijzigd gekopieerd (groter).

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOEL = join(REPO, 'public', 'oefenbeelden')
const BIBLIOTHEEK = join(REPO, 'src', 'lib', 'club', 'training', '3d', 'bibliotheek')
const DATA = join(REPO, 'src', 'components', 'aiyourgym', 'inhoud', 'oefenrenders.data.ts')
const STANDAARD_BRON = 'C:\\Users\\Kaneb\\oefenbeelden\\uit'
const FFMPEG_RESERVE =
  'C:\\Users\\Kaneb\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.1-essentials_build\\bin\\ffmpeg.exe'

const GROOT = 560
const KLEIN = 360
/** Beelden per seconde van de renders en van de webversie. */
const FPS_BRON = 24
const FPS_WEB = 12
/** Lege rand rond het figuur, als fractie van de grootste kant. */
const MARGE = 0.06

function leesArgs(argv) {
  const uit = { bron: STANDAARD_BRON, slugs: [] }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--bron') uit.bron = argv[++i] ?? uit.bron
    else uit.slugs.push(argv[i])
  }
  return uit
}

function vindFfmpeg() {
  for (const kandidaat of ['ffmpeg', FFMPEG_RESERVE]) {
    const r = spawnSync(kandidaat, ['-version'], { encoding: 'utf8' })
    if (r.status === 0) return kandidaat
  }
  return null
}

function ffmpeg(bin, args) {
  const r = spawnSync(bin, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`ffmpeg faalde: ${r.stderr || r.error?.message || 'onbekende fout'}`)
}

/** De kleinste rechthoek waarin het figuur over alle frames valt (alfakanaal). */
function omhullende(bin, frames) {
  const r = spawnSync(bin, ['-hide_banner', '-i', frames, '-vf', 'alphaextract,bbox=min_val=16', '-f', 'null', '-'], { encoding: 'utf8' })
  const doos = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }
  for (const m of r.stderr.matchAll(/x1:(\d+) x2:(\d+) y1:(\d+) y2:(\d+)/g)) {
    doos.x1 = Math.min(doos.x1, Number(m[1]))
    doos.x2 = Math.max(doos.x2, Number(m[2]))
    doos.y1 = Math.min(doos.y1, Number(m[3]))
    doos.y2 = Math.max(doos.y2, Number(m[4]))
  }
  return Number.isFinite(doos.x1) ? doos : null
}

/** Een vierkante uitsnede rond de omhullende, binnen het beeld van bron x bron. */
function vierkant(doos, bron) {
  const zijde = Math.min(bron, Math.round(Math.max(doos.x2 - doos.x1, doos.y2 - doos.y1) * (1 + 2 * MARGE)))
  const klem = (v) => Math.max(0, Math.min(bron - zijde, v))
  const x = klem(Math.round((doos.x1 + doos.x2) / 2 - zijde / 2))
  const y = klem(Math.round((doos.y1 + doos.y2) / 2 - zijde / 2))
  return { x, y, zijde }
}

function maten(bin, bestand) {
  const probe = bin.replace(/ffmpeg(\.exe)?$/i, (m) => m.replace('ffmpeg', 'ffprobe'))
  const r = spawnSync(probe, ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', bestand], { encoding: 'utf8' })
  const [w, h] = (r.stdout || '').trim().split(',').map(Number)
  return w && h ? { w, h } : null
}

function maakMetFfmpeg(bin, map, slug, uit) {
  const framesMap = join(map, 'frames')
  const frames = join(framesMap, '%03d.png')
  const eersteFrame = join(framesMap, '000.png')
  if (!existsSync(eersteFrame)) throw new Error(`geen frames in ${framesMap}`)
  const bronMaat = maten(bin, eersteFrame)?.w ?? 1024
  const doos = omhullende(bin, frames)
  const s = doos ? vierkant(doos, bronMaat) : { x: 0, y: 0, zijde: bronMaat }
  const snij = `crop=${s.zijde}:${s.zijde}:${s.x}:${s.y}`
  const lus = (maat, q) => [
    '-framerate', String(FPS_BRON), '-i', frames, '-vf', `fps=${FPS_WEB},${snij},scale=${maat}:${maat}:flags=lanczos`,
    '-c:v', 'libwebp_anim', '-lossless', '0', '-q:v', String(q), '-compression_level', '5',
    '-pix_fmt', 'yuva420p', '-loop', '0',
  ]
  ffmpeg(bin, [...lus(GROOT, 58), join(uit, 'lus.webp')])
  ffmpeg(bin, [...lus(KLEIN, 56), join(uit, 'lus-klein.webp')])
  for (const stand of ['begin', 'piek']) {
    const png = join(map, `${slug}-${stand}.png`)
    const bron = existsSync(png) ? png : join(map, `${slug}-${stand}.webp`)
    if (!existsSync(bron)) throw new Error(`mist ${slug}-${stand}.png`)
    ffmpeg(bin, [
      '-i', bron, '-vf', `${snij},scale=${GROOT}:${GROOT}:flags=lanczos`,
      '-c:v', 'libwebp', '-lossless', '0', '-q:v', '82', '-pix_fmt', 'yuva420p', join(uit, `${stand}.webp`),
    ])
  }
  return { breedte: GROOT, hoogte: GROOT }
}

function kopieerZonderFfmpeg(map, slug, uit) {
  const paren = [
    [`${slug}-lus.webp`, 'lus.webp'],
    [`${slug}-lus.webp`, 'lus-klein.webp'],
    [`${slug}-begin.webp`, 'begin.webp'],
    [`${slug}-piek.webp`, 'piek.webp'],
  ]
  for (const [van, naar] of paren) {
    const bron = join(map, van)
    if (!existsSync(bron)) throw new Error(`mist ${van}`)
    copyFileSync(bron, join(uit, naar))
  }
  return { breedte: 1024, hoogte: 1024 }
}

/** Naam en spieren uit het 3D-bestand: de naam is exact die van de oefenbibliotheek. */
function uitBibliotheek(slug) {
  const bestand = join(BIBLIOTHEEK, `${slug}.ts`)
  if (!existsSync(bestand)) throw new Error(`geen 3D-oefening ${slug}.ts in de bibliotheek: de mapnaam moet het 3D-bestand volgen`)
  const tekst = readFileSync(bestand, 'utf8')
  const naam = tekst.match(/naam:\s*'([^']+)'/)?.[1]
  if (!naam) throw new Error(`geen naam gevonden in ${slug}.ts`)
  const lijst = (sleutel) =>
    [...(tekst.match(new RegExp(`${sleutel}:\\s*\\[([^\\]]*)\\]`))?.[1] ?? '').matchAll(/'([a-z]+)'/g)].map((m) => m[1])
  return { naam, spieren: lijst('spieren'), spierenSecundair: lijst('spierenSecundair') }
}

function verwerk(bin, bron, slug) {
  const map = join(bron, slug)
  const uit = join(DOEL, slug)
  mkdirSync(uit, { recursive: true })
  const bib = uitBibliotheek(slug)
  const maat = bin ? maakMetFfmpeg(bin, map, slug, uit) : kopieerZonderFfmpeg(map, slug, uit)
  const bestanden = ['lus', 'lus-klein', 'begin', 'piek']
  const bytes = Object.fromEntries(bestanden.map((b) => [b, statSync(join(uit, `${b}.webp`)).size]))
  const hash = createHash('sha1')
  for (const b of bestanden) hash.update(readFileSync(join(uit, `${b}.webp`)))
  return { slug, ...bib, ...maat, versie: hash.digest('hex').slice(0, 8), bytes }
}

function bestaandeData() {
  if (!existsSync(DATA)) return []
  const m = readFileSync(DATA, 'utf8').match(/=\s*(\[[\s\S]*\])\s*as const/)
  return m ? JSON.parse(m[1]) : []
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

function hoofd() {
  const { bron, slugs } = leesArgs(process.argv.slice(2))
  if (!existsSync(bron)) throw new Error(`bronmap ${bron} bestaat niet`)
  const kies = slugs.length
    ? slugs
    : readdirSync(bron).filter((d) => existsSync(join(bron, d, 'frames', '000.png')) || existsSync(join(bron, d, `${d}-lus.webp`)))
  const bin = vindFfmpeg()
  console.log(bin ? `ffmpeg: ${bin}` : 'Geen ffmpeg gevonden: bestanden worden ongewijzigd gekopieerd.')
  const data = new Map(bestaandeData().map((d) => [d.slug, d]))
  for (const slug of kies) {
    const r = verwerk(bin, bron, slug)
    data.set(slug, r)
    const kb = Object.entries(r.bytes).map(([k, v]) => `${k} ${Math.round(v / 1024)} KB`).join(', ')
    console.log(`${slug} (${r.naam}): ${kb}`)
  }
  schrijfData([...data.values()])
  console.log(`Klaar: ${kies.length} oefening(en) in public/oefenbeelden, gegevens in ${DATA}`)
}

try {
  hoofd()
} catch (fout) {
  console.error(`Fout: ${fout instanceof Error ? fout.message : String(fout)}`)
  process.exit(1)
}
