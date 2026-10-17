// ─── Club, afspraken: GET naar de eigen API (CLIENT) ────────────────────────
// Altijd een nette Nederlandse foutmelding, nooit een stack trace.

export type Gehaald = { ok: true; data: Record<string, unknown> } | { ok: false; fout: string }

export async function haal(url: string, signaal?: AbortSignal): Promise<Gehaald> {
  try {
    const res = await fetch(url, { signal: signaal, cache: 'no-store' })
    const data: unknown = await res.json().catch(() => null)
    const rij = typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : {}
    if (res.ok) return { ok: true, data: rij }
    return { ok: false, fout: typeof rij.fout === 'string' ? rij.fout : 'Er ging iets mis. Probeer het opnieuw.' }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return { ok: false, fout: '' }
    return { ok: false, fout: 'Geen verbinding. Controleer het internet en probeer het opnieuw.' }
  }
}

export interface SlotOptie {
  tijd: string
  medewerkerId: string
  medewerkerNaam: string
}

/** De sloten uit een API-antwoord; onbruikbare regels vallen weg. */
export function slotenUit(data: Record<string, unknown>): SlotOptie[] {
  const lijst = Array.isArray(data.sloten) ? data.sloten : []
  return lijst.flatMap((s: unknown) => {
    if (typeof s !== 'object' || s === null) return []
    const r = s as Record<string, unknown>
    return typeof r.tijd === 'string' && typeof r.medewerkerId === 'string'
      ? [{ tijd: r.tijd, medewerkerId: r.medewerkerId, medewerkerNaam: typeof r.medewerkerNaam === 'string' ? r.medewerkerNaam : '' }]
      : []
  })
}
