import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AndroidBackHandler from "@/components/layout/AndroidBackHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "MentaForce – Burn-out preventie voor Nederlandse teams",
  description: "MentaForce geeft HR-teams realtime inzicht in het welzijn van medewerkers. Herken burn-out risico's vroeg – anoniem, AVG-conform en actiegericht.",
  keywords: ["burn-out preventie", "vitaliteit werkplek", "HR dashboard", "welzijn medewerkers", "Nederland"],
  openGraph: {
    title: "MentaForce – Burn-out preventie voor Nederlandse teams",
    description: "Realtime inzicht in het welzijn van je team. Herken risico's vroeg – anoniem, AVG-conform en actiegericht.",
    locale: "nl_NL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AndroidBackHandler />
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
