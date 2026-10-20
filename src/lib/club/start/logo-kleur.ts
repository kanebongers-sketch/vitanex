// ─── Club startwizard: de accentkleur uit het logo halen (PUUR) ─────────────
// De browser tekent het logo klein op een canvas en geeft ons de pixels
// (RGBA, vier getallen per pixel). Hier zoeken we de kleur die het merk
// draagt: doorzichtig, bijna wit, bijna zwart en grijs tellen niet mee, en
// sterk verzadigde pixels tellen zwaarder. Is het logo zwart-wit, dan is er
// geen merkkleur en houden we de huidige. Daarna corrigeert huisstijl.ts de
// helderheid voor genoeg contrast, net als bij een zelf gekozen kleur.

import { bruikbaarAccent, rgbNaarHex, vlakAccent, type Thema } from '@/lib/club/kern/huisstijl'

/** Kleiner dan dit deel van de zichtbare pixels in kleur: dan is het logo zwart-wit. */
const MIN_KLEURDEEL = 0.02
const MIN_ALPHA = 160
const MIN_VERZADIGING = 0.25
const MIN_LICHT = 0.1
const MAX_LICHT = 0.93

interface Emmer {
  gewicht: number
  r: number
  g: number
  b: number
}

/** Verzadiging en lichtheid volgens HSL, beide 0 tot 1. */
export function hsl(r: number, g: number, b: number): { s: number; l: number } {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  if (max === min) return { s: 0, l }
  return { s: (max - min) / (1 - Math.abs(2 * l - 1)), l }
}

/** Telt deze pixel mee als merkkleur? */
function isKleur(r: number, g: number, b: number, a: number): boolean {
  if (a < MIN_ALPHA) return false
  const { s, l } = hsl(r, g, b)
  return s >= MIN_VERZADIGING && l >= MIN_LICHT && l <= MAX_LICHT
}

/**
 * De dominante merkkleur als #RRGGBB, of null als het logo (bijna) geen kleur
 * heeft. Pixels gaan in 512 emmers (8 stappen per kanaal); de zwaarste emmer
 * wint en we nemen het gewogen gemiddelde van de pixels erin.
 */
export function dominanteKleur(rgba: ArrayLike<number>): string | null {
  const emmers = new Map<number, Emmer>()
  let zichtbaar = 0
  let gekleurd = 0
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const [r, g, b, a] = [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]]
    if (a >= MIN_ALPHA) zichtbaar++
    if (!isKleur(r, g, b, a)) continue
    gekleurd++
    const w = 0.5 + hsl(r, g, b).s
    const sleutel = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
    const e = emmers.get(sleutel) ?? { gewicht: 0, r: 0, g: 0, b: 0 }
    emmers.set(sleutel, { gewicht: e.gewicht + w, r: e.r + r * w, g: e.g + g * w, b: e.b + b * w })
  }
  if (zichtbaar === 0 || gekleurd / zichtbaar < MIN_KLEURDEEL) return null
  let beste: Emmer | null = null
  for (const e of emmers.values()) if (!beste || e.gewicht > beste.gewicht) beste = e
  if (!beste) return null
  return rgbNaarHex({ r: beste.r / beste.gewicht, g: beste.g / beste.gewicht, b: beste.b / beste.gewicht })
}

export interface KleurVoorstel {
  /** De kleur uit het logo, zoals we hem opslaan. */
  kleur: string
  /** Zo staat hij op knoppen en vlakken. */
  knop: string
  /** Zo staat hij als tekst. */
  tekst: string
  /** Moesten we de helderheid bijschuiven voor genoeg contrast? */
  aangepast: boolean
}

/** Het voorstel bij een kleur uit het logo, met de contrastcorrectie van de huisstijl. */
export function kleurVoorstel(kleur: string, thema: Thema): KleurVoorstel {
  const knop = vlakAccent(kleur, thema)
  const tekst = bruikbaarAccent(kleur, thema).kleur
  const hoofd = kleur.toUpperCase()
  return { kleur: hoofd, knop, tekst, aangepast: knop !== hoofd || tekst !== hoofd }
}
