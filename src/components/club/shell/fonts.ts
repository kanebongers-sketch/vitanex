import localFont from 'next/font/local'

// De letters van Club, de ledenapp, de widget en de inlogpagina's (AI Your Gym).
// Koppen in Oswald (kapitalen), tekst in Roboto: beide OFL en zelf gehost, zodat
// de build geen netwerk nodig heeft en bezoekers geen verbinding met Google maken.
// De bestanden staan in src/app/fonts (alleen de lettertypen, geen code).
//
// De CSS-variabelen heten --ff-barlow (koppen) en --ff-inter (tekst): die namen
// gebruiken alle stijlbestanden van Club al. Ze staan op <html> in
// src/app/(aiyourgym)/(club)/layout.tsx.

export const clubKopLetter = localFont({
  src: '../../../app/fonts/oswald-latin-wght-normal.woff2',
  weight: '200 700',
  variable: '--ff-barlow',
  display: 'swap',
})

export const clubTekstLetter = localFont({
  src: '../../../app/fonts/roboto-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--ff-inter',
  display: 'swap',
})

/** Beide letters als klassen voor <html>. */
export const CLUB_FONT_KLASSEN = `${clubKopLetter.variable} ${clubTekstLetter.variable}`
