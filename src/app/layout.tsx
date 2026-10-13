import type { Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { barlow } from "./fonts/fit-factory";
import { headers } from "next/headers";
import { isPtHost } from "@/lib/fit-factory/domein";
import { isReleaseVHost } from "@/releasev/lib/host-routing";
import { MF_BASIS, MF_BASIS_HEADER } from "@/lib/mentaforce/basis";
import { STANDAARD_TAAL, richtingVan, type Taal } from "@/lib/i18n/talen";
import { huidigeTaal, laadBron, laadWoordenboek } from "@/lib/i18n/server";
import { TaalProvider } from "@/lib/i18n/TaalProvider";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fit Factory PT (zelfde app, ander domein) is altijd Nederlands; MentaForce
  // volgt de taalkeuze van de gebruiker (cookie) of anders de browser.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const pt = isPtHost(host);
  // RELEASE V (releasev.nl) is altijd Nederlands, net als Fit Factory PT. Behalve
  // MentaForce onder releasev.nl/mentaforce (src/lib/mentaforce/basis.ts): dat
  // volgt gewoon de taalkeuze, zoals MentaForce altijd deed.
  const mentaforce = h.get(MF_BASIS_HEADER) === MF_BASIS;
  const vasteTaal = pt || (isReleaseVHost(host) && !mentaforce);
  const taal: Taal = vasteTaal ? STANDAARD_TAAL : await huidigeTaal();
  const [woordenboek, bron] = await Promise.all([laadWoordenboek(taal), laadBron()]);

  return (
    // suppressHydrationWarning: public/theme-init.js (MentaForce) zet vóór React
    // het thema als class op <html>; dat verschil is bedoeld. Geldt alleen voor
    // de attributen van <html> zelf, niet voor de pagina's eronder.
    <html
      suppressHydrationWarning
      lang={taal}
      dir={richtingVan(taal)}
      className={`${tekst.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TaalProvider taal={taal} richting={richtingVan(taal)} woordenboek={woordenboek} bron={bron}>
          {children}
        </TaalProvider>
      </body>
    </html>
  );
}
