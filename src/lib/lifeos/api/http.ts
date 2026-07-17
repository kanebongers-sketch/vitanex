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

/**
 * Een gewoon object (geen array, geen null).
 *
 * Geëxporteerd omdat élke `lees`-functie hiermee begint. Stond in drie kopieën
 * (hier, `gezondheid/lees.ts`, `WelzijnScoreKaart`) — één bron is genoeg.
 */
export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Eindig getal of `null` — nooit NaN, nooit een string die op een getal lijkt. */
export function getalOfNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Niet-lege string of `null`. */
export function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}

/**
 * De foutmelding uit een foutbody, of een generieke terugval.
 *
 * Leest ZOWEL `fout` als `error`, omdat de cockpit twee API's bevraagt die het
 * niet eens zijn over de sleutel: `/api/lifeos/*` schrijft `fout` (Nederlands,
 * zoals de rest van deze laag), de MentaForce-kern schrijft `error`
 * (`/api/stress`, `/api/stemming`, `/api/burnout-predictor`, `/api/xp`,
 * `/api/streak`, `/api/vandaag`, `/api/lichaamsmetingen` — geverifieerd).
 *
 * Zolang hier alleen `fout` stond, viel élke melding van de MentaForce-kant
 * terug op "Er ging iets mis.". De server zei bijvoorbeeld netjes "Nog geen
 * doelen ingesteld" en Kane las een nietszeggende zin — precies de eerlijkheid
 * die de rest van dit bestand bewaakt, weggegooid op de laatste meter.
 *
 * Beide lezen i.p.v. één kant hernoemen: `error` is de conventie van ~90 routes
 * met eigen consumenten buiten LifeOS. Die omdopen is een migratie met risico,
 * voor een verschil dat de gebruiker nooit ziet. `fout` wint bij twijfel — dat
 * is de sleutel van deze laag.
 */
export function leesFoutmelding(ruw: unknown): string {
  if (!isObject(ruw)) return 'Er ging iets mis.'
  return tekstOfNull(ruw.fout) ?? tekstOfNull(ruw.error) ?? 'Er ging iets mis.'
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
    return { ok: false, fout: leesFoutmelding(ruw), status: antwoord.status }
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
