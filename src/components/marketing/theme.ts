// ─── MentaForce landing — design tokens ──────────────────────────────────────
// Strikt 2-kleurig: Deep Navy + Electric Cyan. Wit/inkt is neutraal (geen "kleur").
// Het 3D-brein is het ENIGE element dat meerkleurig mag zijn (zie BRAIN_COLORS).

export const COLORS = {
  // Navy-familie (achtergronden / oppervlakken)
  navyDeep: '#071228',
  navy: '#0B1B3A',
  navyElev: '#0F2347',
  navyLine: '#15315C',
  navyScrim: 'rgba(7,18,40,0.78)', // semi-transparant navyDeep — nav-achtergrond bij scroll (met blur)

  // Electric Cyan (enige accentkleur)
  cyan: '#00E5FF',
  cyanDim: '#3FE9FF',
  cyanSoft: 'rgba(0,229,255,0.12)',
  cyanGlow: 'rgba(0,229,255,0.35)',

  // Neutralen (tekst / lijnen)
  ink: '#EAF2FF',
  inkDim: 'rgba(234,242,255,0.62)',
  inkFaint: 'rgba(234,242,255,0.38)',
  line: 'rgba(234,242,255,0.10)',
  lineStrong: 'rgba(234,242,255,0.18)',
} as const

// 6 breindeel-kleuren — ALLEEN voor het 3D-brein, nergens anders in de UI.
// Volgorde matcht de pijlers: voor-links, voor-rechts, midden-links,
// midden-rechts, achter-links, achter-rechts.
export const BRAIN_COLORS: readonly string[] = [
  '#F97316', // oranje
  '#FBBF24', // amber
  '#34D399', // groen
  '#22D3EE', // cyaan-groen
  '#A78BFA', // paars
  '#FB7185', // roze
]

// Scroll-volgorde → regio-index van het brein.
// Regio = hemisfeer(0=links,1=rechts)*3 + band(0=voor,1=midden,2=achter).
// Gewenste volgorde: voor-links, voor-rechts, midden-links, midden-rechts,
// achter-links, achter-rechts.
export const STEP_REGION: readonly number[] = [0, 3, 1, 4, 2, 5]

export const FONT = {
  // Space Grotesk voor de hele landingspagina (kop + tekst)
  grotesk: 'var(--font-grotesk), system-ui, sans-serif',
} as const

export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

// Gedeelde glas/paneel-stijl in 2-kleuren
export const glassPanel: React.CSSProperties = {
  background: 'rgba(15,35,71,0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: `1px solid ${COLORS.line}`,
  borderRadius: 20,
}

export const MAXW = 1200

/**
 * Fit Factory Personal Training — de huisstijl van de PT-app (mentaforce.nl/<naam>).
 * Afgeleid uit hun eigen documenten (PT Protocol, Fit Guide, intakeformulier 2026):
 * bijna-zwart, wit, één warm amber accent; koppen in Barlow Condensed, tekst in Inter.
 * Alleen voor de PT-app (white-label); de rest van MentaForce blijft navy + cyaan.
 * In CSS staan dezelfde waarden als variabelen onder `.lifeos-root.ff` (globals.css).
 */
export const FIT_FACTORY = {
  zwart: '#101014',
  kaart: '#1A1A1F',
  verhoogd: '#24242A',
  amber: '#E8A33F',
  amberSterk: '#F2B65C',
} as const
