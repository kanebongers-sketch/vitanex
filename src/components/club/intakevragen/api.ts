// ─── Club, intakevragen: fetch naar de eigen API (client) ───────────────────

export type Antwoord = { ok: true } | { ok: false; fout: string }

/** Stuur een verzoek naar /api/club/intakevragen... en geef een Nederlandse fout terug. */
export async function stuurVraag(pad: string, methode: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<Antwoord> {
  try {
    const res = await fetch(`/api/club/intakevragen${pad}`, {
      method: methode,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    if (res.ok) return { ok: true }
    const json: unknown = await res.json().catch(() => null)
    const fout = typeof json === 'object' && json !== null && 'fout' in json && typeof json.fout === 'string' ? json.fout : null
    return { ok: false, fout: fout ?? 'Er ging iets mis. Probeer het opnieuw.' }
  } catch {
    return { ok: false, fout: 'Geen verbinding. Controleer het internet en probeer opnieuw.' }
  }
}
