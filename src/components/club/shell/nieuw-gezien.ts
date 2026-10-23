'use client'

import { useSyncExternalStore } from 'react'
import { allesGezien } from '@/lib/aiyourgym/nieuw'

// Wat is nieuw: welke punten deze persoon al zag, per persoon in deze browser
// (localStorage). Lukt opslaan niet (privevenster, geblokkeerd), dan blijft
// alles gewoon werken; de teller staat dan alleen niet op nul na openen.
// Bij openen van /club/nieuw onthouden we ook wat er voor dat moment gezien
// was, zodat de pagina de nieuwe punten kan markeren terwijl de teller al op
// nul springt.

const VOORVOEGSEL = 'club-nieuw-gezien:'
const GEBEURTENIS = 'club-nieuw-gezien'

/** Wat er voor het openen van de pagina gezien was, per persoon (alleen in dit tabblad). */
const voorOpenen = new Map<string, string | null>()

function sleutel(persoon: string): string {
  return `${VOORVOEGSEL}${persoon}`
}

function lees(persoon: string): string | null {
  try {
    return window.localStorage.getItem(sleutel(persoon))
  } catch {
    return null
  }
}

function abonneer(opWijziging: () => void): () => void {
  window.addEventListener('storage', opWijziging)
  window.addEventListener(GEBEURTENIS, opWijziging)
  return () => {
    window.removeEventListener('storage', opWijziging)
    window.removeEventListener(GEBEURTENIS, opWijziging)
  }
}

/**
 * De bewaarde lijst van deze persoon. undefined zolang het nog niet bekend is
 * (op de server en bij de eerste weergave), zodat er nooit een verkeerde teller knippert.
 */
export function useGezien(persoon: string): string | null | undefined {
  return useSyncExternalStore(abonneer, () => lees(persoon), () => undefined)
}

/** Wat er gezien was voor deze pagina openging; undefined als hij nog niet is gemarkeerd. */
export function useGezienVoorOpenen(persoon: string): string | null | undefined {
  return useSyncExternalStore(abonneer, () => (voorOpenen.has(persoon) ? (voorOpenen.get(persoon) ?? null) : undefined), () => undefined)
}

/** Alles gelezen: bewaar alle punten en laat de teller meteen bijwerken. */
export function markeerAllesGelezen(persoon: string): void {
  if (!voorOpenen.has(persoon)) voorOpenen.set(persoon, lees(persoon))
  try {
    window.localStorage.setItem(sleutel(persoon), allesGezien())
  } catch {
    // Opslaan kan niet (privevenster of geblokkeerd): de pagina werkt gewoon, de teller blijft staan.
  }
  window.dispatchEvent(new Event(GEBEURTENIS))
}

/** De pagina gaat dicht: bij de volgende keer openen telt opnieuw wat er dan gezien is. */
export function vergeetVoorOpenen(persoon: string): void {
  voorOpenen.delete(persoon)
}
