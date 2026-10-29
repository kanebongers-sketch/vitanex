// ─── Club, intakevragen: fetch naar de eigen API (client) ───────────────────

import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

/** De foutteksten in de taal van de pagina (het lang van html). */
function foutTeksten() {
  const en = typeof document !== 'undefined' && document.documentElement.lang === 'en'
  return CLUB_TRAINING[en ? 'en' : 'nl'].api
}

export type Antwoord = { ok: true } | { ok: false; fout: string }

/** Stuur een verzoek naar /api/club/intakevragen... en geef een fout in de taal van de pagina terug. */
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
    return { ok: false, fout: fout ?? foutTeksten().misgegaan }
  } catch {
    return { ok: false, fout: foutTeksten().geenVerbinding }
  }
}
