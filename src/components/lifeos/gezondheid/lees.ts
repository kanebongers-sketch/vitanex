// ─── Gezondheids-kaarten — gedeelde narrowing ──────────────────────────────
// Kleine, gedeelde bouwstenen om `unknown` server-antwoorden veilig te smallen
// zonder cast. Eén bron van waarheid voor de drie invoerkaarten (voeding, water,
// workout), zodat we `isObject`/`getalOfNull` niet drie keer overschrijven.

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
 * Genereert een tijdelijke client-id voor een optimistisch toegevoegde regel.
 * `crypto.randomUUID` waar beschikbaar; anders een tijd-gebaseerde val-back —
 * uniek genoeg binnen één sessie, en de echte id vervangt 'm zodra de server
 * antwoordt.
 */
export function tijdelijkeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `temp-${crypto.randomUUID()}`
  }
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
