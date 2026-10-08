import localFont from 'next/font/local'

// Fit Factory PT-huisstijl: koppen in Barlow Condensed, tekst in Inter (beide OFL,
// zelf gehost — zie src/app/fonts/OFL-*.txt). Alleen geladen in de PT-app.

export const barlow = localFont({
  src: [
    { path: './barlow-condensed-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './barlow-condensed-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './barlow-condensed-latin-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--ff-barlow',
  display: 'swap',
})

export const inter = localFont({
  src: './inter-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--ff-inter',
  display: 'swap',
})
