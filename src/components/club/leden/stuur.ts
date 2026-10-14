// ─── Fit Factory Club: een mutatie naar de eigen API (CLIENT) ───────────────
// Geeft altijd een nette Nederlandse foutmelding terug, nooit een stack trace.

export type Verstuurd = { ok: true; data: unknown } | { ok: false; fout: string }

export async function stuur(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<Verstuurd> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data }
    const fout = typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
    return { ok: false, fout: fout ?? 'Er ging iets mis. Probeer het opnieuw.' }
  } catch {
    return { ok: false, fout: 'Geen verbinding. Controleer het internet en probeer het opnieuw.' }
  }
}
