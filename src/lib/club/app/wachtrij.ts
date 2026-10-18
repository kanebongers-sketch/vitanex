// ─── Fit Factory Club, ledenapp: trainingen die wachten op bereik (PUUR) ────
// In de sportschool is het bereik soms slecht. Een afgeronde training gaat dan
// in een wachtrij op het toestel en wordt verstuurd zodra er weer verbinding
// is. Alleen bij geen verbinding of een storing aan onze kant opnieuw proberen;
// zegt de server "nee" (bijvoorbeeld een ongeldige set), dan niet eindeloos.

export interface WachtendVerzoek {
  id: string
  url: string
  body: Record<string, unknown>
  /** Tijdstip (ms) waarop het lid de training afrondde. */
  gemaakt: number
  pogingen: number
  /** Voor de status: "Dag A". */
  omschrijving: string
}

export const WACHTRIJ_SLEUTEL = 'club-training-wachtrij'
export const WACHTRIJ_MAX = 20
/** Langer dan een week wachten: dan klopt de datum niet meer, weggooien. */
export const WACHTRIJ_MAX_MS = 7 * 86_400_000

export type Uitkomst = 'verstuurd' | 'opnieuw' | 'geweigerd'

function leesVerzoek(v: unknown, nu: number): WachtendVerzoek | null {
  if (typeof v !== 'object' || v === null) return null
  const r = v as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.url !== 'string' || !r.url.startsWith('/api/club/')) return null
  if (typeof r.body !== 'object' || r.body === null || Array.isArray(r.body)) return null
  if (typeof r.gemaakt !== 'number' || nu - r.gemaakt > WACHTRIJ_MAX_MS) return null
  return {
    id: r.id.slice(0, 64),
    url: r.url,
    body: r.body as Record<string, unknown>,
    gemaakt: r.gemaakt,
    pogingen: typeof r.pogingen === 'number' && r.pogingen >= 0 ? r.pogingen : 0,
    omschrijving: typeof r.omschrijving === 'string' ? r.omschrijving.slice(0, 60) : 'Training',
  }
}

/** De wachtrij uit de opslag van het toestel, nagekeken. */
export function leesWachtrij(ruw: string | null, nu: number): WachtendVerzoek[] {
  if (!ruw) return []
  try {
    const lijst: unknown = JSON.parse(ruw)
    return Array.isArray(lijst) ? lijst.map((v) => leesVerzoek(v, nu)).filter((v): v is WachtendVerzoek => v !== null).slice(-WACHTRIJ_MAX) : []
  } catch {
    return []
  }
}

/** Achteraan erbij; bij een volle rij valt de oudste eraf. */
export function voegToe(rij: readonly WachtendVerzoek[], v: WachtendVerzoek): WachtendVerzoek[] {
  return [...rij.filter((x) => x.id !== v.id), v].slice(-WACHTRIJ_MAX)
}

export function zonder(rij: readonly WachtendVerzoek[], id: string): WachtendVerzoek[] {
  return rij.filter((x) => x.id !== id)
}

export function naPoging(rij: readonly WachtendVerzoek[], id: string): WachtendVerzoek[] {
  return rij.map((x) => (x.id === id ? { ...x, pogingen: x.pogingen + 1 } : x))
}

/** Wat te doen met het antwoord: status 0 is geen verbinding. */
export function uitkomstVan(ok: boolean, status: number): Uitkomst {
  if (ok) return 'verstuurd'
  if (status === 0 || status === 408 || status === 429 || status >= 500) return 'opnieuw'
  return 'geweigerd'
}

/** Wachttijd voor de volgende poging: 5, 10, 20... seconden, hooguit 2 minuten. */
export function wachttijd(pogingen: number): number {
  return Math.min(120_000, 5_000 * 2 ** Math.min(pogingen, 5))
}
