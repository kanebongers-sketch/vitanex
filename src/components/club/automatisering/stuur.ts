// Een verzoek naar de automatisering-API, met een nette Nederlandse fout als het misgaat.

export type Antwoord = { ok: true } | { ok: false; fout: string }

export async function stuur(url: string, method: 'PUT' | 'PATCH', body: unknown): Promise<Antwoord> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' })
    if (res.ok) return { ok: true }
    const data: unknown = await res.json().catch(() => null)
    const fout = typeof data === 'object' && data !== null && typeof (data as { fout?: unknown }).fout === 'string' ? (data as { fout: string }).fout : 'Er ging iets mis. Probeer het opnieuw.'
    return { ok: false, fout }
  } catch {
    return { ok: false, fout: 'Geen verbinding. Controleer het internet en probeer het opnieuw.' }
  }
}

export function taakUrl(id: string): string {
  return `/api/club/automatisering/taken/${encodeURIComponent(id)}`
}
