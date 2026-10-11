"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ConsentChoices {
  analytics: boolean;
  marketing: boolean;
}

interface ConsentState extends ConsentChoices {
  /** Heeft de bezoeker een keuze gemaakt? Zo niet: toon de banner. */
  hasDecided: boolean;
  isSettingsOpen: boolean;
  decidedAt: string | null;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  save: (choices: ConsentChoices) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const stamp = () => new Date().toISOString();

/**
 * Cookie-toestemming. Standaard staat alles behalve noodzakelijk UIT.
 * Tracking (GA / Meta Pixel) laadt pas als hier toestemming voor is.
 */
export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      analytics: false,
      marketing: false,
      hasDecided: false,
      isSettingsOpen: false,
      decidedAt: null,
      acceptAll: () =>
        set({ analytics: true, marketing: true, hasDecided: true, isSettingsOpen: false, decidedAt: stamp() }),
      acceptNecessaryOnly: () =>
        set({ analytics: false, marketing: false, hasDecided: true, isSettingsOpen: false, decidedAt: stamp() }),
      save: (choices) =>
        set({ ...choices, hasDecided: true, isSettingsOpen: false, decidedAt: stamp() }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
    }),
    {
      name: "cookie-consent",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ analytics, marketing, hasDecided, decidedAt }) => ({
        analytics,
        marketing,
        hasDecided,
        decidedAt,
      }),
    },
  ),
);
