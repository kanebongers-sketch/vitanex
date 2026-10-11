"use client";

import Link from "next/link";
import { useId } from "react";
import { AnimatePresence, m } from "framer-motion";
import { buttonClasses } from "@rv/components/ui/Button";
import { useConsentStore } from "@rv/stores/consent-store";
import { useHydrated } from "@rv/lib/use-hydrated";
import { CookieSettingsDialog } from "./CookieSettingsDialog";

/**
 * Cookiebanner. Verschijnt pas na hydratatie en alleen zolang de bezoeker
 * nog geen keuze heeft gemaakt. "Alleen noodzakelijk" en "Alles accepteren"
 * hebben bewust exact hetzelfde visuele gewicht (geen dark pattern).
 * De instellingen-dialoog kan ook vanuit de footer worden geopend.
 */
const choiceButton = buttonClasses({ variant: "secondary", className: "h-10 flex-1 whitespace-nowrap border-ink/40 px-3 text-[0.8125rem] sm:h-11 sm:px-6 sm:text-sm" });

function Banner() {
  const titleId = useId();
  const descriptionId = useId();
  const acceptAll = useConsentStore((state) => state.acceptAll);
  const acceptNecessaryOnly = useConsentStore((state) => state.acceptNecessaryOnly);
  const openSettings = useConsentStore((state) => state.openSettings);

  return (
    <m.div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-3 bottom-3 z-[80] rounded-card border border-ink/10 bg-surface/95 p-4 shadow-lift backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md sm:p-6"
    >
      <p aria-hidden className="hidden items-center gap-3 text-eyebrow font-semibold uppercase text-ink-muted sm:flex">
        <span className="size-1.5 rounded-full bg-accent" />
        Privacy
      </p>
      <h2 id={titleId} className="font-display text-lg font-bold sm:mt-3 sm:text-xl">Cookies, kort en eerlijk</h2>
      <p id={descriptionId} className="mt-1.5 text-[0.8125rem] leading-snug text-ink-soft sm:mt-2 sm:text-sm sm:leading-relaxed">
        Noodzakelijke opslag voor je winkelwagen. Met jouw toestemming meten we ook bezoek en advertenties.{" "}
        <Link href="/cookiebeleid" className="text-ink underline underline-offset-2 transition-colors hover:text-accent">Cookiebeleid</Link>
      </p>
      <div className="mt-3 flex gap-2 sm:mt-5">
        <button type="button" className={choiceButton} onClick={acceptNecessaryOnly}>
          Alleen noodzakelijk
        </button>
        <button type="button" className={choiceButton} onClick={acceptAll}>
          Alles accepteren
        </button>
      </div>
      <button type="button" onClick={openSettings} className="link-underline mt-3 text-xs text-ink-soft hover:text-ink sm:mt-4 sm:text-sm">
        Instellingen
      </button>
    </m.div>
  );
}

export function CookieBanner() {
  const isHydrated = useHydrated();
  const hasDecided = useConsentStore((state) => state.hasDecided);
  const isSettingsOpen = useConsentStore((state) => state.isSettingsOpen);

  if (!isHydrated) return null;

  return (
    <>
      <AnimatePresence>{!hasDecided && <Banner key="cookie-banner" />}</AnimatePresence>
      <AnimatePresence>{isSettingsOpen && <CookieSettingsDialog key="cookie-settings" />}</AnimatePresence>
    </>
  );
}
