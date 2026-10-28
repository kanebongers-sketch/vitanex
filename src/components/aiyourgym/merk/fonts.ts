import { Hanken_Grotesk, Instrument_Serif } from 'next/font/google'

// Letters van AI Your Gym, richting "Obsidian Luxury" (besluit Kane 28-10-2026).
// Twee families, beide SIL Open Font License 1.1:
// - Instrument Serif (400 en cursief): de editoriale stem voor de grote koppen,
//   cijfers en citaten. Smal en scherp, zoals een modetitel; cursief alleen voor
//   het ene woord dat in champagne staat.
// - Hanken Grotesk: zeer leesbare moderne sans voor tekst, knoppen en kleine koppen.
// next/font host ze mee met de build: bezoekers maken geen verbinding met Google.
// De variabelen --ayg-f-serif en --ayg-f-hanken voeden --ayg-font-kop en
// --ayg-font-tekst in aiyourgym.css. Gebruik AYG_FONT_KLASSEN op hetzelfde
// element als de klasse .ayg.

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--ayg-f-hanken',
  display: 'swap',
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--ayg-f-serif',
  display: 'swap',
})

export const AYG_FONT_KLASSEN = `${hanken.variable} ${serif.variable}`
