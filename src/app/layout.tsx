import type { Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Eén font-familie: Space Grotesk (merk). Geist, Instrument Serif en
// Plus Jakarta Sans zijn verwijderd, inclusief hun tokens in globals.css.
//
// Zelf gehost (variabel font, latin, gewicht 300–700; OFL-licentie ernaast) i.p.v.
// `next/font/google`: die haalt het font tijdens de build bij Google op, en op
// Render brak de Turbopack-build daarop ("next/font/google queries have exactly
// one entry"). Met het bestand in de repo heeft de build geen netwerk nodig.
const spaceGrotesk = localFont({
  src: './fonts/space-grotesk-latin.woff2',
  variable: '--font-grotesk',
  weight: '300 700',
  display: 'swap',
});

// WCAG 1.4.4: geen maximumScale/userScalable — gebruikers moeten kunnen zoomen.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
