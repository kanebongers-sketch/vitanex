// ─── Club: huisstijl van een sportschool (PUUR) ─────────────────────────────
// Elke sportschool kiest drie kleuren (besluit Kane 30-10-2026): een hoofdkleur
// (knoppen, actief, focus), een tweede kleur (grafieken, tellers, voortgang) en
// een achtergrondtint die de vlakken licht mee kleurt; plus een thema (donker,
// diepzwart, grafiet, licht, zacht licht of automatisch). Hieruit maken we de
// CSS-variabelen waar heel Club op draait (--brand, --brand-2, --bg-app, ...).
// Toegankelijkheid is niet onderhandelbaar: een accent dat te weinig contrast
// geeft met de achtergrond schuiven we automatisch bij tot het wel genoeg is
// (minstens 3:1, de WCAG-norm voor knoppen en lijnen), en de tekst op een
// accentknop wordt zwart of wit, wat het best leesbaar is.

/** Licht of donker: bepaalt tekstkleur, schaduwen en data-thema. */
export type Thema = 'donker' | 'licht'
export const THEMAS: readonly Thema[] = ['donker', 'licht']

/** Het gekozen thema. Automatisch volgt het apparaat van wie kijkt. */
export type Variant = 'donker' | 'diepzwart' | 'grafiet' | 'licht' | 'zacht' | 'auto'
export const VARIANTEN: readonly Variant[] = ['donker', 'diepzwart', 'grafiet', 'licht', 'zacht', 'auto']

export function isVariant(v: unknown): v is Variant {
  return typeof v === 'string' && (VARIANTEN as readonly string[]).includes(v)
}

/** Licht of donker van een thema; automatisch rekent op de server als donker (de browser schakelt, huisstijlAutoCss). */
export function themaVan(variant: Variant): Thema {
  return variant === 'licht' || variant === 'zacht' ? 'licht' : 'donker'
}

/** Wat een sportschool kiest naast de hoofdkleur. null = niet gekozen (tweede kleur = hoofdkleur, geen tint). */
export interface HuisstijlExtra {
  tweede?: string | null
  tint?: string | null
  variant?: Variant | null
}

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

/** Mengt kleur a met kleur b; t tussen 0 (a) en 1 (b). */
export function mengMet(a: string, b: string, t: number): string {
  const x = hexNaarRgb(a)
  const y = hexNaarRgb(b)
  return rgbNaarHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t })
}

export interface Basis {
  bgApp: string
  bgCard: string
  bgRaised: string
  inkt: string
}

export const THEMA_BASIS: Record<Thema, Basis> = {
  donker: { bgApp: '#0A0B09', bgCard: '#141513', bgRaised: '#1E1F1C', inkt: '255, 255, 255' },
  licht: { bgApp: '#F4F3EF', bgCard: '#FFFFFF', bgRaised: '#FFFFFF', inkt: '17, 17, 15' },
}

/** De vlakken per thema (automatisch gebruikt donker en licht). */
export const VARIANT_BASIS: Record<Exclude<Variant, 'auto'>, Basis> = {
  donker: THEMA_BASIS.donker,
  diepzwart: { bgApp: '#000000', bgCard: '#0C0C0C', bgRaised: '#161616', inkt: '255, 255, 255' },
  grafiet: { bgApp: '#17191D', bgCard: '#202328', bgRaised: '#2A2E34', inkt: '255, 255, 255' },
  licht: THEMA_BASIS.licht,
  zacht: { bgApp: '#E8E5DE', bgCard: '#F4F2ED', bgRaised: '#FAF9F6', inkt: '17, 17, 15' },
}

/** Hoe sterk de tint meekleurt (app, kaart, verhoogd): klein, zodat tekst altijd leesbaar blijft. */
const TINT_STERKTE: Record<Thema, [number, number, number]> = {
  donker: [0.07, 0.09, 0.11],
  licht: [0.07, 0.05, 0.04],
}

/** De vlakken van een thema, met de achtergrondtint erdoor. */
export function basisVoor(variant: Variant, tint: string | null = null): Basis {
  const basis = VARIANT_BASIS[variant === 'auto' ? 'donker' : variant]
  if (!tint || !HEX.test(tint)) return basis
  const [a, k, v] = TINT_STERKTE[themaVan(variant)]
  return { ...basis, bgApp: mengMet(basis.bgApp, tint, a), bgCard: mengMet(basis.bgCard, tint, k), bgRaised: mengMet(basis.bgRaised, tint, v) }
}

/**
 * Twee normen. Vlakken, knoppen, lijnen en focus: 3:1 (WCAG voor UI-onderdelen);
 * de tekst op een accentknop wordt zwart of wit (inktOp). Kleine tekst in de
 * accentkleur: 4.5:1 met wat marge. Zo houdt een sportschool haar eigen kleur
 * op knoppen en vlakken, en blijft tekst altijd leesbaar.
 */
export const MIN_CONTRAST_VLAK = 3
export const MIN_CONTRAST_ACCENT = 4.8

function genoegContrast(kleur: string, basis: Basis, minimaal: number): boolean {
  return Math.min(contrast(kleur, basis.bgApp), contrast(kleur, basis.bgCard)) >= minimaal
}

function richtingVan(basis: Basis): 1 | -1 {
  return luminantie(basis.bgApp) < 0.2 ? 1 : -1
}

/**
 * Het accent zoals we het tonen: gelijk aan de keuze als het contrast goed
 * genoeg is, anders stap voor stap lichter (donker thema) of donkerder (licht
 * thema) tot het wel genoeg is. De tint blijft, alleen de helderheid schuift.
 */
export function bruikbaarAccent(accent: string, thema: Thema | Basis, minimaal = MIN_CONTRAST_ACCENT): { kleur: string; aangepast: boolean } {
  const basis = typeof thema === 'string' ? THEMA_BASIS[thema] : thema
  if (genoegContrast(accent, basis, minimaal)) return { kleur: accent.toUpperCase(), aangepast: false }
  const richting = richtingVan(basis)
  for (let stap = 1; stap <= 40; stap++) {
    const kleur = meng(accent, (richting * stap) / 40)
    if (genoegContrast(kleur, basis, minimaal)) return { kleur, aangepast: true }
  }
  return { kleur: richting === 1 ? '#FFFFFF' : '#000000', aangepast: true }
}

/** Tekst op een vlak in de accentkleur: zwart of wit, wat het meeste contrast geeft. */
export function inktOp(accent: string): string {
  return contrast(accent, '#0A0B09') >= contrast(accent, '#FFFFFF') ? '#0A0B09' : '#FFFFFF'
}

/** Minimaal contrast van zwarte of witte tekst op een knop in de accentkleur. */
export const MIN_CONTRAST_INKT = 4.5

function inktContrast(kleur: string): number {
  return Math.max(contrast(kleur, '#0A0B09'), contrast(kleur, '#FFFFFF'))
}

/**
 * Het accent voor vlakken en knoppen. Een middentoon (bv. #2F6BFF) haalt met
 * zwart en met wit net geen 4.5:1; dan schuift de helderheid tot de tekst op de
 * knop leesbaar is: lichter in het donkere thema (zwarte tekst, meer contrast
 * met de achtergrond), donkerder in het lichte thema (witte tekst).
 */
export function vlakAccent(accent: string, thema: Thema | Basis): string {
  const vlakken = typeof thema === 'string' ? THEMA_BASIS[thema] : thema
  const basis = bruikbaarAccent(accent, vlakken, MIN_CONTRAST_VLAK).kleur
  if (inktContrast(basis) >= MIN_CONTRAST_INKT) return basis
  const richting = richtingVan(vlakken)
  for (let stap = 1; stap <= 40; stap++) {
    const kleur = meng(basis, (richting * stap) / 40)
    if (inktContrast(kleur) >= MIN_CONTRAST_INKT && genoegContrast(kleur, vlakken, MIN_CONTRAST_VLAK)) return kleur
  }
  return basis
}

function alpha(hex: string, a: number): string {
  const { r, g, b } = hexNaarRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Een kleur als vlak, als tekst, zacht en de inkt erop: zelfde regels voor de hoofd- en de tweede kleur. */
function kleurSet(keuze: string, basis: Basis, licht: boolean) {
  const vlak = vlakAccent(keuze, basis)
  return {
    vlak,
    sterk: meng(vlak, licht ? -0.12 : 0.14),
    zacht: alpha(vlak, licht ? 0.12 : 0.14),
    gloed: alpha(vlak, 0.3),
    inkt: inktOp(vlak),
    tekst: bruikbaarAccent(keuze, basis, MIN_CONTRAST_ACCENT).kleur,
  }
}

/**
 * Alle CSS-variabelen voor een huisstijl, klaar voor een style-attribuut.
 * thema is licht of donker; extra.variant kiest de vlakken (diepzwart, grafiet,
 * zacht licht) en heeft voorrang. Automatisch geeft hier donker: de browser
 * zet licht eroverheen met huisstijlAutoCss.
 */
export function huisstijlVariabelen(accentKeuze: string, thema: Thema, extra: HuisstijlExtra = {}): Record<string, string> {
  const variant: Variant = extra.variant && extra.variant !== 'auto' ? extra.variant : thema
  const basis = basisVoor(variant, extra.tint ?? null)
  const licht = themaVan(variant) === 'licht'
  const keuze = HEX.test(accentKeuze) ? accentKeuze : '#B58E5C'
  const tweedeKeuze = extra.tweede && HEX.test(extra.tweede) ? extra.tweede : keuze
  const een = kleurSet(keuze, basis, licht)
  const twee = kleurSet(tweedeKeuze, basis, licht)
  const inkt = (a: number) => `rgba(${basis.inkt}, ${a})`
  return {
    '--brand': een.vlak,
    '--brand-strong': een.sterk,
    '--brand-soft': een.zacht,
    '--brand-glow': een.gloed,
    '--brand-inkt': een.inkt,
    '--brand-tekst': een.tekst,
    '--brand-2': twee.vlak,
    '--brand-2-soft': twee.zacht,
    '--brand-2-inkt': twee.inkt,
    '--brand-2-tekst': twee.tekst,
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
    '--club-kop-bg': licht ? alpha(basis.bgCard, 0.88) : alpha(basis.bgApp, 0.9),
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

/** Het attribuut voor de wortel van een scherm met het thema Automatisch. */
export const AUTO_ATTRIBUUT = 'data-huisstijl-auto'

/**
 * Thema Automatisch: CSS die op een apparaat met lichte modus de lichte
 * variabelen over de donkere (inline) heen zet. !important omdat de donkere in
 * een style-attribuut staan. Alleen hex, rgba en schaduwen uit onze eigen
 * berekening: geen invoer van buiten komt hier letterlijk in.
 */
export function huisstijlAutoCss(accentKeuze: string, extra: HuisstijlExtra = {}): string {
  const licht = huisstijlVariabelen(accentKeuze, 'licht', { ...extra, variant: 'licht' })
  const regels = Object.entries(licht).map(([k, v]) => `${k === 'colorScheme' ? 'color-scheme' : k}:${v} !important`)
  return `@media (prefers-color-scheme: light){[${AUTO_ATTRIBUUT}]{${regels.join(';')}}}`
}

