// ─── MentaForce landing — design tokens ──────────────────────────────────────
// Huisstijl okt 2026 (op verzoek van Kane): de look van Fit Factory — grafiet +
// amber. De sleutelnamen (navy/cyan) zijn gebleven zodat alle componenten blijven
// werken; lees "navy" als "grafiet" en "cyan" als "amber".
// Het 3D-brein is het ENIGE element dat meerkleurig mag zijn (zie BRAIN_COLORS).

export const COLORS = {
  // Grafiet-familie (achtergronden / oppervlakken)
  navyDeep: '#0B0B0E',
  navy: '#101014',
  navyElev: '#1A1A1F',
  navyLine: '#26262D',
  navyScrim: 'rgba(16,16,20,0.82)', // semi-transparant grafiet — nav-achtergrond bij scroll (met blur)

  // Amber (enige accentkleur)
  cyan: '#E8A33F',
  cyanDim: '#F2B65C',
  cyanSoft: 'rgba(232,163,63,0.12)',
  cyanGlow: 'rgba(232,163,63,0.30)',

  // Neutralen (tekst / lijnen)
  ink: '#F4F4F5',
  inkDim: 'rgba(244,244,245,0.62)',
  inkFaint: 'rgba(244,244,245,0.40)',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.16)',
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
 * Fit Factory Personal Training — de huisstijl van de PT-app (fitfactorypt.nl/<naam>).
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
