import { Hanken_Grotesk } from 'next/font/google'

// Letter van AI Your Gym: een familie, Hanken Grotesk (SIL Open Font License 1.1),
// in twee gewichten die het werk doen (400 tekst, 500 koppen). Richting
// "Kleurhoofdstukken" (28-10-2026): de kleur is luid, dus de letter blijft rustig.
// next/font host hem mee met de build: bezoekers maken geen verbinding met Google.
// De variabele --ayg-f-hanken voedt in aiyourgym.css zowel de kop- als de tekstletter.
// Gebruik AYG_FONT_KLASSEN op hetzelfde element als de klasse .ayg.

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--ayg-f-hanken',
  display: 'swap',
})

export const AYG_FONT_KLASSEN = hanken.variable
