import type { Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

// Eén font-familie: Space Grotesk (merk). Geist, Instrument Serif en
// Plus Jakarta Sans zijn verwijderd, inclusief hun tokens in globals.css.
const spaceGrotesk = Space_Grotesk({
  variable: '--font-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
