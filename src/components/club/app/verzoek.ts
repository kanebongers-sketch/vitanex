// Kleine fetch-helper voor de ledenapp-voorvertoning: JSON heen en terug,
// fouten als nette Nederlandse tekst.

export type Antwoord = { ok: true; data: Record<string, unknown> } | { ok: false; fout: string; status: number }

export async function stuur(url: string, methode: 'POST' | 'DELETE', body?: unknown): Promise<Antwoord> {
  let res: Response
  try {
    res = await fetch(url, {
      method: methode,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    return { ok: false, fout: 'Geen verbinding. Probeer het opnieuw.', status: 0 }
  }
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  const rij = typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : {}
  if (res.ok) return { ok: true, data: rij }
  // Een 404 zonder JSON: de route bestaat (nog) niet.
  if (res.status === 404 && data === null) return { ok: false, fout: 'Deze functie is nog niet beschikbaar.', status: 404 }
  const fout = typeof rij.fout === 'string' ? rij.fout : 'Er ging iets mis. Probeer het opnieuw.'
  return { ok: false, fout, status: res.status }
}
