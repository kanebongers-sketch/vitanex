import type { Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { barlow } from "./fonts/fit-factory";

// Huisstijl (okt 2026, de look van Fit Factory): tekst in Inter, koppen in
// Barlow Condensed. Beide zelf gehost (OFL, zie src/app/fonts/OFL-*.txt) — de
// Render-build heeft zo geen netwerk nodig.
//
// Inter krijgt de variabele --font-grotesk: die naam gebruikt de hele app al als
// "de tekstletter" (FONT.grotesk, font-grotesk), dus zo wisselt alles in één keer.
const tekst = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  variable: '--font-grotesk',
  weight: '100 900',
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
      className={`${tekst.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
