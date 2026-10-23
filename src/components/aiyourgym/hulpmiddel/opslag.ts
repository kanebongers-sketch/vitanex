'use client'

import { CHECKLIST_OPSLAG } from '@/lib/aiyourgym/overstapchecklist'

// De voortgang van de overstapchecklist op dit toestel, als kleine externe
// winkel voor useSyncExternalStore. Opslag is een gemak: lukt lezen of
// schrijven niet (privevenster, opslag uit of vol), dan werkt de lijst gewoon
// in het geheugen tot de pagina sluit.

let huidig: string | null | undefined
const luisteraars = new Set<() => void>()

function meld(): void {
  luisteraars.forEach((l) => l())
}

function bijOpslag(e: StorageEvent): void {
  if (e.key !== CHECKLIST_OPSLAG) return
  huidig = e.newValue
  meld()
}

export function volgVoortgang(luisteraar: () => void): () => void {
  luisteraars.add(luisteraar)
  if (luisteraars.size === 1) window.addEventListener('storage', bijOpslag)
  return () => {
    luisteraars.delete(luisteraar)
    if (luisteraars.size === 0) window.removeEventListener('storage', bijOpslag)
  }
}

export function ruweVoortgang(): string | null {
  if (huidig === undefined) {
    try {
      huidig = window.localStorage.getItem(CHECKLIST_OPSLAG)
    } catch {
      huidig = null
    }
  }
  return huidig
}

/** Op de server (en bij de eerste render) is er nog niets afgevinkt. */
export function ruweVoortgangServer(): string | null {
  return null
}

export function schrijfVoortgang(waarde: string | null): void {
  huidig = waarde
  try {
    if (waarde === null) window.localStorage.removeItem(CHECKLIST_OPSLAG)
    else window.localStorage.setItem(CHECKLIST_OPSLAG, waarde)
  } catch {
    // Niet bewaard op het toestel; de lijst werkt gewoon verder.
  }
  meld()
}
