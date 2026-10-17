// ─── Club: huisstijl van een sportschool (PUUR) ─────────────────────────────
// Elke sportschool kiest een accentkleur en een thema (donker of licht). Hieruit
// maken we de CSS-variabelen waar heel Club op draait (--brand, --bg-app, ...).
// Toegankelijkheid is niet onderhandelbaar: een accent dat te weinig contrast
// geeft met de achtergrond schuiven we automatisch bij tot het wel genoeg is
// (minstens 3:1, de WCAG-norm voor knoppen en lijnen), en de tekst op een
// accentknop wordt zwart of wit, wat het best leesbaar is.

export type Thema = 'donker' | 'licht'
export const THEMAS: readonly Thema[] = ['donker', 'licht']

export interface Rgb {
  r: number
  g: number
  b: number
}

export const HEX = /^#[0-9a-f]{6}$/i

export function hexNaarRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbNaarHex({ r, g, b }: Rgb): string {
  const deel = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${deel(r)}${deel(g)}${deel(b)}`.toUpperCase()
}

/** Relatieve luminantie volgens WCAG 2.2. */
export function luminantie(hex: string): number {
  const { r, g, b } = hexNaarRgb(hex)
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminantie(a), luminantie(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Mengt een kleur met wit (t > 0) of zwart (t < 0); t tussen -1 en 1. */
export function meng(hex: string, t: number): string {
  const { r, g, b } = hexNaarRgb(hex)
  const doel = t > 0 ? 255 : 0
  const f = Math.abs(t)
  return rgbNaarHex({ r: r + (doel - r) * f, g: g + (doel - g) * f, b: b + (doel - b) * f })
}

interface Basis {
  bgApp: string
  bgCard: string
  bgRaised: string
  inkt: string
}

export const THEMA_BASIS: Record<Thema, Basis> = {
  donker: { bgApp: '#0A0B09', bgCard: '#141513', bgRaised: '#1E1F1C', inkt: '255, 255, 255' },
  licht: { bgApp: '#F4F3EF', bgCard: '#FFFFFF', bgRaised: '#FFFFFF', inkt: '17, 17, 15' },
}

/**
 * Het accent wordt ook als kleine tekst gebruikt (koppen boven, nummers, de
 * gekozen tab). Daarom de norm voor tekst (4.5:1) met wat marge, tegen zowel
 * de achtergrond van de app als die van de kaarten.
 */
export const MIN_CONTRAST_ACCENT = 4.8

function genoegContrast(kleur: string, thema: Thema): boolean {
  const { bgApp, bgCard } = THEMA_BASIS[thema]
  return Math.min(contrast(kleur, bgApp), contrast(kleur, bgCard)) >= MIN_CONTRAST_ACCENT
}

/**
 * Het accent zoals we het tonen: gelijk aan de keuze als het contrast goed
 * genoeg is, anders stap voor stap lichter (donker thema) of donkerder (licht
 * thema) tot het wel genoeg is. De tint blijft, alleen de helderheid schuift.
 */
export function bruikbaarAccent(accent: string, thema: Thema): { kleur: string; aangepast: boolean } {
  if (genoegContrast(accent, thema)) return { kleur: accent.toUpperCase(), aangepast: false }
  const richting = thema === 'donker' ? 1 : -1
  for (let stap = 1; stap <= 40; stap++) {
    const kleur = meng(accent, (richting * stap) / 40)
    if (genoegContrast(kleur, thema)) return { kleur, aangepast: true }
  }
  return { kleur: thema === 'donker' ? '#FFFFFF' : '#000000', aangepast: true }
}

/** Tekst op een vlak in de accentkleur: zwart of wit, wat het meeste contrast geeft. */
export function inktOp(accent: string): string {
  return contrast(accent, '#0A0B09') >= contrast(accent, '#FFFFFF') ? '#0A0B09' : '#FFFFFF'
}

function alpha(hex: string, a: number): string {
  const { r, g, b } = hexNaarRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Alle CSS-variabelen voor een huisstijl, klaar voor een style-attribuut. */
export function huisstijlVariabelen(accentKeuze: string, thema: Thema): Record<string, string> {
  const basis = THEMA_BASIS[thema]
  const { kleur: accent } = bruikbaarAccent(HEX.test(accentKeuze) ? accentKeuze : '#B58E5C', thema)
  const inkt = (a: number) => `rgba(${basis.inkt}, ${a})`
  const licht = thema === 'licht'
  return {
    '--brand': accent,
    '--brand-strong': meng(accent, licht ? -0.12 : 0.14),
    '--brand-soft': alpha(accent, licht ? 0.12 : 0.14),
    '--brand-glow': alpha(accent, 0.3),
    '--brand-inkt': inktOp(accent),
    '--bg-app': basis.bgApp,
    '--bg-card': basis.bgCard,
    '--bg-raised': basis.bgRaised,
    '--line': inkt(licht ? 0.1 : 0.08),
    '--line-strong': inkt(licht ? 0.18 : 0.16),
    '--text-1': inkt(licht ? 0.92 : 0.96),
    '--text-2': inkt(licht ? 0.74 : 0.78),
    '--text-3': inkt(licht ? 0.68 : 0.62),
    '--text-4': inkt(licht ? 0.6 : 0.5),
    '--club-vlak': inkt(licht ? 0.035 : 0.03),
    '--club-vlak-hover': inkt(licht ? 0.06 : 0.055),
    '--club-kop-bg': licht ? 'rgba(255, 255, 255, 0.88)' : 'rgba(16, 16, 20, 0.9)',
    '--club-invoer-bg': licht ? '#FFFFFF' : 'rgba(0, 0, 0, 0.25)',
    '--club-schaduw': licht ? '0 18px 40px -28px rgba(17, 17, 15, 0.35)' : '0 18px 40px -24px rgba(0, 0, 0, 0.8)',
    // Statuskleuren: op een lichte achtergrond donkerder, anders is de tekst niet leesbaar (4.5:1).
    ...(licht
      ? {
          '--club-ok': '#17663B',
          '--club-ok-zacht': 'rgba(23, 102, 59, 0.12)',
          '--club-let-op': '#B83A24',
          '--club-let-op-zacht': 'rgba(184, 58, 36, 0.1)',
          '--club-info': '#2D56C4',
          '--club-info-zacht': 'rgba(45, 86, 196, 0.1)',
        }
      : {}),
    colorScheme: licht ? 'light' : 'dark',
  }
}
