// ─── Fit Factory Club, training: fetch naar de eigen API (client) ───────────

import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

/** De taal van de pagina (het lang van html, gezet door de root layout). */
function foutTeksten() {
  const en = typeof document !== 'undefined' && document.documentElement.lang === 'en'
  return CLUB_TRAINING[en ? 'en' : 'nl'].api
}

export type ApiUitslag = { ok: true; data: Record<string, unknown> } | { ok: false; fout: string }

/** Stuur een verzoek naar /api/club/training/... en geef een fout in de taal van de pagina terug. */
export async function stuur(pad: string, methode: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<ApiUitslag> {
  try {
    const res = await fetch(`/api/club/training${pad}`, {
      method: methode,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    const json: unknown = await res.json().catch(() => null)
    const data = typeof json === 'object' && json !== null && !Array.isArray(json) ? (json as Record<string, unknown>) : {}
    if (!res.ok) return { ok: false, fout: typeof data.fout === 'string' ? data.fout : foutTeksten().misgegaan }
    return { ok: true, data }
  } catch {
    return { ok: false, fout: foutTeksten().geenVerbinding }
  }
}

/** Het id uit een antwoord, of null. */
export function idUit(data: Record<string, unknown>): string | null {
  return typeof data.id === 'string' ? data.id : null
}
