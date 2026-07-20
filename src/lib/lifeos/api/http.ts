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
 * Het ruwe resultaat van een fetch, vóór het narrowen. Splitst de drie uitkomsten
 * die de narrow-stap verschillend behandelt: netwerkfout, HTTP-fout, en gelukt.
 */
type RuweUitkomst =
  | { soort: 'netwerkfout' }
  | { soort: 'httpfout'; ruw: unknown; status: number }
  | { soort: 'ok'; ruw: unknown; status: number }

/** De fetch + het parsen. Puur de netwerkkant, geen narrowing — die komt erna. */
async function haalRuw(pad: string, init: RequestInit): Promise<RuweUitkomst> {
  let antwoord: Response
  try {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    antwoord = await authFetch(pad, { ...init, headers })
  } catch {
    // Offline, DNS, afgebroken — een echte fout, geen lege staat.
    return { soort: 'netwerkfout' }
  }

  const ruw: unknown = antwoord.status === 204 ? null : await antwoord.json().catch(() => null)
  return antwoord.ok
    ? { soort: 'ok', ruw, status: antwoord.status }
    : { soort: 'httpfout', ruw, status: antwoord.status }
}

/** Narrowt een ruwe uitkomst met `lees`. De systeemgrens: fout ≠ leeg. */
function narrowRuw<T>(uitkomst: RuweUitkomst, lees: (ruw: unknown) => T | null): HaalUitkomst<T> {
  if (uitkomst.soort === 'netwerkfout') return { ok: false, fout: 'Geen verbinding.', status: 0 }
  if (uitkomst.soort === 'httpfout') {
    return { ok: false, fout: leesFoutmelding(uitkomst.ruw), status: uitkomst.status }
  }
  const waarde = lees(uitkomst.ruw)
  if (waarde === null) {
    return { ok: false, fout: 'Onverwacht antwoord van de server.', status: uitkomst.status }
  }
  return { ok: true, waarde }
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
  return narrowRuw(await haalRuw(pad, init), lees)
}

// ─── Gedeelde vluchten ───────────────────────────────────────────────────────
// Twee kaarten kunnen bij dezelfde paginaload dezelfde GET doen: WelzijnScoreKaart
// én GezondheidDomein halen `/api/pijlers` (met verschillende narrowers), VangOp
// én ProductiviteitDomein halen `/api/lifeos/taken?alle=1`. Zonder dit rekent de
// server dezelfde (niet-goedkope) pijler-score twee keer uit per load.
//
// Dit is PURE in-flight coalescing, geen cache: alleen requests die op hetzelfde
// moment nog onderweg zijn, delen één vlucht. Zodra de vlucht klaar is, is de
// entry weg — dus een latere mount doet een verse fetch en er kan geen stale data
// blijven hangen. Daarom raakt het ook geen schrijfacties: die veranderen niets
// aan een vlucht die al binnen is.
const vluchten = new Map<string, Promise<RuweUitkomst>>()

/**
 * Als `haalJson`, maar deelt een GELIJKTIJDIGE identieke GET met andere kaarten.
 * Alleen voor read-only endpoints zonder eigen `init` (de coalescing key is puur
 * het pad — een afwijkende body/headers zou stil de verkeerde vlucht delen).
 * De narrower blijft per aanroeper: de ruwe respons wordt gedeeld, het narrowen
 * niet.
 */
export async function haalJsonGedeeld<T>(
  pad: string,
  lees: (ruw: unknown) => T | null,
): Promise<HaalUitkomst<T>> {
  let vlucht = vluchten.get(pad)
  if (vlucht === undefined) {
    vlucht = haalRuw(pad, {})
    vluchten.set(pad, vlucht)
    // Opruimen ná settle, zodat de volgende load vers begint. `void` want de
    // wachtenden hangen aan `vlucht` zelf, niet aan deze opruim-belofte.
    void vlucht.finally(() => {
      if (vluchten.get(pad) === vlucht) vluchten.delete(pad)
    })
  }
  return narrowRuw(await vlucht, lees)
}

/** Voor endpoints waarvan alleen "het lukte" telt. */
export function leesNiets(): true {
  return true
}
