// Een verzoek naar de leads-API, met een nette Nederlandse fout als het misgaat.

export type Antwoord = { ok: true; data: Record<string, unknown> } | { ok: false; fout: string; data: Record<string, unknown> }

function alsObject(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

export async function stuur(url: string, method: 'GET' | 'POST' | 'PATCH', body?: unknown): Promise<Antwoord> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    const data = alsObject(await res.json().catch(() => null))
    if (res.ok) return { ok: true, data }
    const fout = typeof data.fout === 'string' ? data.fout : 'Er ging iets mis. Probeer het opnieuw.'
    return { ok: false, fout, data }
  } catch {
    return { ok: false, fout: 'Geen verbinding. Controleer het internet en probeer het opnieuw.', data: {} }
  }
}
