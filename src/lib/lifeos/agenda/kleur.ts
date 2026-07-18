// ─── LifeOS — agenda-kleur & tekstcontrast ──────────────────────────────────
// Puur, client-veilig: geen fetch, geen DB, geen secrets. Zowel het rooster als
// de agenda-zijbalk importeren dit, en de tests draaien 'm zonder browser.
//
// WAAROM DIT BESTAAT. De multi-agenda-weergave kleurt elk blok met de eigen
// kleur van zijn Google-agenda (uit `backgroundColor`). Dat is een BEWUSTE
// uitzondering op de strikt twee-tonige huisstijl: hier betekent kleur "welke
// agenda", informatief, op het privé-dashboard van de founder. De regel die
// blijft: tekst moet leesbaar zijn op de blok-achtergrond. Daarom kiezen we per
// kleur witte óf donkere tekst — op basis van het WCAG-contrast, niet op gevoel.

/** Een RGB-kleur, elk kanaal 0–255. */
export interface Rgb {
  r: number
  g: number
  b: number
}

/**
 * '#RRGGBB' of '#RGB' (met of zonder '#') → RGB, of null bij onzin.
 *
 * Systeemgrens: Google's `backgroundColor` is doorgaans '#rrggbb', maar we
 * vertrouwen het niet blind — een onbekende vorm valt terug op null, en de
 * aanroeper kiest dan de neutrale cyaan-stijl in plaats van een kapotte kleur.
 */
export function leesHex(hex: string): Rgb | null {
  if (typeof hex !== 'string') return null
  const schoon = hex.trim().replace(/^#/, '')

  if (/^[0-9a-fA-F]{3}$/.test(schoon)) {
    const r = Number.parseInt(schoon[0]! + schoon[0]!, 16)
    const g = Number.parseInt(schoon[1]! + schoon[1]!, 16)
    const b = Number.parseInt(schoon[2]! + schoon[2]!, 16)
    return { r, g, b }
  }
  if (/^[0-9a-fA-F]{6}$/.test(schoon)) {
    const r = Number.parseInt(schoon.slice(0, 2), 16)
    const g = Number.parseInt(schoon.slice(2, 4), 16)
    const b = Number.parseInt(schoon.slice(4, 6), 16)
    return { r, g, b }
  }
  return null
}

/** RGB → '#rrggbb' (kleine letters, altijd 6 tekens). */
export function naarHex({ r, g, b }: Rgb): string {
  return `#${kanaalHex(r)}${kanaalHex(g)}${kanaalHex(b)}`
}

function kanaalHex(waarde: number): string {
  const geklemd = Math.max(0, Math.min(255, Math.round(waarde)))
  return geklemd.toString(16).padStart(2, '0')
}

/**
 * Meng twee kleuren. `fractie` 0 = puur `a`, 1 = puur `b`. Buiten [0,1] klemmen
 * we, zodat een verkeerde fractie geen kleur buiten het bereik oplevert.
 */
export function meng(a: Rgb, b: Rgb, fractie: number): Rgb {
  const f = Math.max(0, Math.min(1, fractie))
  return {
    r: a.r + (b.r - a.r) * f,
    g: a.g + (b.g - a.g) * f,
    b: a.b + (b.b - a.b) * f,
  }
}

/** Eén kanaal (0–1) gelineariseerd volgens WCAG 2.x. */
function lineariseer(kanaal: number): number {
  const c = kanaal / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** WCAG relatieve luminantie (0 = zwart, 1 = wit). */
export function luminantie({ r, g, b }: Rgb): number {
  return 0.2126 * lineariseer(r) + 0.7152 * lineariseer(g) + 0.0722 * lineariseer(b)
}

/** WCAG-contrastratio tussen twee kleuren: 1 (gelijk) t/m 21 (zwart↔wit). */
export function contrast(a: Rgb, b: Rgb): number {
  const la = luminantie(a)
  const lb = luminantie(b)
  const hoog = Math.max(la, lb)
  const laag = Math.min(la, lb)
  return (hoog + 0.05) / (laag + 0.05)
}

// De twee tekstkleuren zijn géén derde kleur: wit is `--text-1` (neutrale inkt)
// en donker is de merk-navy `#0B1B3A`. We kiezen er telkens één van — nooit een
// nieuwe kleur verzinnen.
const TEKST_LICHT = '#EAF2FF'
const TEKST_DONKER = '#0B1B3A'
const LICHT: Rgb = { r: 234, g: 242, b: 255 }
const DONKER: Rgb = { r: 11, g: 27, b: 58 }

// De donkere app-achtergrond waarover een blok ligt (`--bg-app` #060E1C). We
// mengen de agenda-kleur er licht mee, zodat felle kleuren op het donkere
// dashboard rustiger ogen — en zodat het contrast wordt berekend tegen precies
// de kleur die op het scherm verschijnt, niet tegen de pure (transparante) kleur.
const APP_BASIS: Rgb = { r: 6, g: 14, b: 28 }
const NAVY_FRACTIE = 0.15

/** De concrete stijl voor één gekleurd blok. */
export interface BlokStijl {
  /** De blok-achtergrond als concrete hex (agenda-kleur, licht met navy gemengd). */
  achtergrond: string
  /** De volle agenda-kleur, voor de stevige linkerrand en het kleur-stipje. */
  rand: string
  /** Witte of donkere tekst — dat wat het beste contrasteert met `achtergrond`. */
  tekst: string
}

/**
 * De blok-stijl voor een agenda-kleur, of null als de kleur onbruikbaar is (dan
 * valt de UI terug op de neutrale cyaan-stijl).
 *
 * De tekstkleur is die met het HOOGSTE contrast tegen de werkelijke
 * blok-achtergrond — licht op donkere kleuren, donker op lichte. Zo blijft de
 * titel leesbaar, ongeacht welke kleur een agenda heeft.
 */
export function blokStijlVoorKleur(kleur: string | null): BlokStijl | null {
  if (kleur === null) return null
  const rgb = leesHex(kleur)
  if (rgb === null) return null

  const achtergrond = meng(rgb, APP_BASIS, NAVY_FRACTIE)
  const tekst = contrast(achtergrond, LICHT) >= contrast(achtergrond, DONKER) ? TEKST_LICHT : TEKST_DONKER

  return {
    achtergrond: naarHex(achtergrond),
    rand: naarHex(rgb),
    tekst,
  }
}
