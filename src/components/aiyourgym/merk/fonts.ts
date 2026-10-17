import { Bricolage_Grotesque, Geist } from 'next/font/google'

// Letters van AI Your Gym (max twee families). next/font host ze zelf mee met de
// build: bezoekers maken geen verbinding met Google.
// - Bricolage Grotesque (variabel, met breedte- en optische as): koppen met
//   karakter, smal gezet op grote maten.
// - Geist: rustige, technische tekstletter met goede cijfers.
// Gebruik AYG_FONT_KLASSEN op hetzelfde element als de klasse .ayg.

const kop = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--ayg-f-kop',
  display: 'swap',
  axes: ['opsz', 'wdth'],
})

const tekst = Geist({
  subsets: ['latin'],
  variable: '--ayg-f-tekst',
  display: 'swap',
})

export const AYG_FONT_KLASSEN = `${kop.variable} ${tekst.variable}`
