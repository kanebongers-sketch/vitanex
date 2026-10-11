"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useConsentStore } from "@rv/stores/consent-store";
import { useHydrated } from "@rv/lib/use-hydrated";

/**
 * TRACKING-LOADER — laadt GA4 en de Meta Pixel uitsluitend als:
 *   1. NEXT_PUBLIC_RELEASEV_TRACKING_ENABLED === "true", en
 *   2. er een echt ID is ingesteld (niet de placeholder uit .env.example), en
 *   3. de bezoeker toestemming gaf (analytisch voor GA4, marketing voor Meta).
 * GA4 draait met Google Consent Mode v2: alles staat standaard op "denied"
 * en wordt pas bijgewerkt naar "granted" op basis van de cookie-keuze.
 * Events stuur je via src/lib/tracking.ts.
 */
const IS_TRACKING_ENABLED = process.env.NEXT_PUBLIC_RELEASEV_TRACKING_ENABLED === "true";
const GA_ID = process.env.NEXT_PUBLIC_RELEASEV_GA_MEASUREMENT_ID ?? "";
const PIXEL_ID = process.env.NEXT_PUBLIC_RELEASEV_META_PIXEL_ID ?? "";

// Strikte formaatcontrole: de ID's komen in inline scripts terecht.
const HAS_VALID_GA_ID = /^G-[A-Z0-9]{4,20}$/.test(GA_ID) && GA_ID !== "G-XXXXXXXXXX";
const HAS_VALID_PIXEL_ID = /^\d{5,20}$/.test(PIXEL_ID) && PIXEL_ID !== "000000000000000";

type ConsentValue = "granted" | "denied";

const toConsent = (isGranted: boolean): ConsentValue => (isGranted ? "granted" : "denied");

function consentSnapshot(analytics: boolean, marketing: boolean) {
  return {
    analytics_storage: toConsent(analytics),
    ad_storage: toConsent(marketing),
    ad_user_data: toConsent(marketing),
    ad_personalization: toConsent(marketing),
  };
}

function GoogleAnalytics({ analytics, marketing }: { analytics: boolean; marketing: boolean }) {
  const initial = JSON.stringify(consentSnapshot(analytics, marketing));
  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
gtag('consent','update',${initial});
gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
      <Script id="ga4-src" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
    </>
  );
}

function MetaPixel() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // De snippet registreert de eerste PageView; daarna bij elke routewissel.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('consent','grant');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}

/**
 * Houdt al geladen scripts in lijn met een gewijzigde keuze. Een eenmaal
 * geladen script blijft tot de volgende paginalading bestaan, maar mag
 * na intrekking niets meer opslaan of versturen.
 */
function useSyncLoadedConsent(analytics: boolean, marketing: boolean) {
  useEffect(() => {
    window.gtag?.("consent", "update", consentSnapshot(analytics, marketing));
  }, [analytics, marketing]);

  useEffect(() => {
    window.fbq?.("consent", marketing ? "grant" : "revoke");
  }, [marketing]);
}

export function Analytics() {
  const isHydrated = useHydrated();
  const analytics = useConsentStore((state) => state.analytics);
  const marketing = useConsentStore((state) => state.marketing);
  const hasDecided = useConsentStore((state) => state.hasDecided);
  useSyncLoadedConsent(analytics, marketing);

  if (!IS_TRACKING_ENABLED || !isHydrated || !hasDecided) return null;

  return (
    <>
      {HAS_VALID_GA_ID && analytics && <GoogleAnalytics analytics={analytics} marketing={marketing} />}
      {HAS_VALID_PIXEL_ID && marketing && <MetaPixel />}
    </>
  );
}
