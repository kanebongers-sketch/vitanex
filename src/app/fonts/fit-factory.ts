import localFont from 'next/font/local'

// Fit Factory-huisstijl zoals op fitfactory.nl (besluit Kane, 14-10-2026): koppen in
// Oswald (kapitalen), tekst in Roboto. Beide OFL en zelf gehost (variabele
// woff2-bestanden uit Fontsource, zie src/app/fonts/OFL-oswald.txt en
// OFL-roboto.txt), zodat de Render-build geen netwerk nodig heeft en bezoekers
// geen verbinding met Google maken.
//
// De exportnamen `barlow` en `inter` en de CSS-variabelen --ff-barlow en --ff-inter
// zijn historisch (eerder Barlow Condensed en Inter); ze worden overal gebruikt en
// blijven daarom zo heten. Lees: barlow = koppen, inter = tekst.

export const barlow = localFont({
  src: './oswald-latin-wght-normal.woff2',
  weight: '200 700',
  variable: '--ff-barlow',
  display: 'swap',
})

export const inter = localFont({
  src: './roboto-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--ff-inter',
  display: 'swap',
})
