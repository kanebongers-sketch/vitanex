"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * true zodra de component op de client draait. Gebruik dit voor waarden
 * uit localStorage (winkelwagen, cookie-keuze) om hydration-fouten te voorkomen.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
