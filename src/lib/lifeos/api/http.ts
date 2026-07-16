// ─── LifeOS — JSON ophalen met narrowing ────────────────────────────────────
// Bouwt op `authFetch` (src/lib/auth/auth-fetch.ts) — die hangt het Bearer-token
// eraan. Hier komt er twee dingen bij: het antwoord narrowen, en fout en leeg
// uit elkaar houden.
//
// De uitkomst is bewust een unie en geen `T | null`. Null zou "geen afspraken"
// en "de server deed het niet" op één hoop gooien, en dat is precies de fout die
// de README verbiedt: fout ≠ leeg.
//
// Neutraal gedeeld: agenda, taken, notities, journal, voeding, training en
// inbox gebruiken dit alle zeven. Stond ooit onder `agenda/` omdat die het
// eerst nodig had — met 25 importeurs was dat een landmijn geworden.

import { authFetch } from '@/lib/auth/auth-fetch'

export type HaalUitkomst<T> =
  | { ok: true; waarde: T }
  | { ok: false; fout: string; status: number }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Haalt JSON op en narrowt het antwoord met `lees`.
 *
 * Geen cast: een server die iets anders teruggeeft dan afgesproken levert een
 * nette fout op, geen half object dat drie componenten verderop crasht.
 */
export async function haalJson<T>(
  pad: string,
  lees: (ruw: unknown) => T | null,
  init: RequestInit = {},
): Promise<HaalUitkomst<T>> {
  let antwoord: Response
  try {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    antwoord = await authFetch(pad, { ...init, headers })
  } catch {
    // Offline, DNS, afgebroken — een echte fout, geen lege staat.
    return { ok: false, fout: 'Geen verbinding.', status: 0 }
  }

  const ruw: unknown = antwoord.status === 204 ? null : await antwoord.json().catch(() => null)

  if (!antwoord.ok) {
    const fout = isObject(ruw) && typeof ruw.fout === 'string' ? ruw.fout : 'Er ging iets mis.'
    return { ok: false, fout, status: antwoord.status }
  }

  const waarde = lees(ruw)
  if (waarde === null) {
    return { ok: false, fout: 'Onverwacht antwoord van de server.', status: antwoord.status }
  }

  return { ok: true, waarde }
}

/** Voor endpoints waarvan alleen "het lukte" telt. */
export function leesNiets(): true {
  return true
}
