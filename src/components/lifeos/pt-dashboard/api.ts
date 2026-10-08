// Client-kant van /api/pt/[code]/…: één plek voor fetch + foutmelding. De
// sessie zit in een httpOnly-cookie, dus er gaat geen token mee in de code.

export type ApiUitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string; uitgelogd?: boolean }

export async function ptApi<T>(
  code: string,
  pad: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  lees: (ruw: unknown) => T | null,
): Promise<ApiUitkomst<T>> {
  const res = await fetch(`/api/pt/${encodeURIComponent(code)}/${pad}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null)
  if (!res) return { ok: false, fout: 'Geen verbinding. Controleer je internet en probeer het opnieuw.' }
  if (res.status === 204) {
    const leeg = lees(null)
    return leeg === null ? { ok: false, fout: 'Onverwacht antwoord.' } : { ok: true, waarde: leeg }
  }
  const json: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const f = typeof json === 'object' && json !== null ? (json as Record<string, unknown>).fout : null
    return { ok: false, fout: typeof f === 'string' ? f : 'Er ging iets mis. Probeer het opnieuw.', uitgelogd: res.status === 401 }
  }
  const waarde = lees(json)
  return waarde === null ? { ok: false, fout: 'Onverwacht antwoord van de server.' } : { ok: true, waarde }
}

/** Voor een 204: elke "leeg"-respons is goed. */
export const leesLeeg = (): true => true
