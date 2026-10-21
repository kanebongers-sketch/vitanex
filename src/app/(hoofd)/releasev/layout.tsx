import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@rv/styles/releasev.css";
import { SITE } from "@rv/config/site";
import { bodyFont, headingFont } from "@rv/styles/fonts";
import { MotionProvider } from "@rv/components/ui/MotionProvider";
import { AnnouncementBar } from "@rv/components/layout/AnnouncementBar";
import { Header } from "@rv/components/layout/Header";
import { Footer } from "@rv/components/layout/Footer";
import { CartDrawer } from "@rv/components/cart/CartDrawer";
import { CookieBanner } from "@rv/components/consent/CookieBanner";
import { Analytics } from "@rv/components/consent/Analytics";
import { SiteJsonLd } from "@rv/components/seo/SiteJsonLd";
import { isSiteHidden } from "@rv/lib/site-mode";

/**
 * RELEASE V webshop (releasev.nl). Draait in dezelfde app als Fit Factory PT:
 * src/proxy.ts herschrijft verzoeken op releasev.nl naar /releasev/…
 * <html> en <body> komen uit de gedeelde root-layout; alles van de webshop
 * (fonts, stijlen, header, footer) zit in deze layout.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.brandName} | Recovery & Mobility Kit`,
    template: `%s · ${SITE.brandName}`,
  },
  description: SITE.description,
  applicationName: SITE.brandName,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.brandName,
    title: `${SITE.brandName} | Recovery & Mobility Kit`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  // Verborgen stand: niet indexeren tot RELEASEV_SITE_MODE=live
  ...(isSiteHidden() ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function ReleaseVLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`rv-root ${headingFont.variable} ${bodyFont.variable} flex min-h-dvh w-full flex-col bg-canvas text-ink`}>
      <SiteJsonLd />
      <a
        href="#main"
        className="sr-only z-[100] rounded-full bg-ink px-5 py-3 text-on-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Naar de inhoud
      </a>
      <MotionProvider>
        <AnnouncementBar />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <CookieBanner />
      </MotionProvider>
      <Analytics />
    </div>
  );
}
