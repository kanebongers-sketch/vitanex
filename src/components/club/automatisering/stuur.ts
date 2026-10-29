// Een verzoek naar de automatisering-API, met een nette fout in de gekozen taal als het misgaat.

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'

export type Antwoord = { ok: true } | { ok: false; fout: string }

export async function stuur(url: string, method: 'PUT' | 'PATCH', body: unknown, taal: Taal = 'nl'): Promise<Antwoord> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' })
    if (res.ok) return { ok: true }
    const data: unknown = await res.json().catch(() => null)
    const fout = typeof data === 'object' && data !== null && typeof (data as { fout?: unknown }).fout === 'string' ? (data as { fout: string }).fout : OPVOLGEN[taal].fout.algemeen
    return { ok: false, fout }
  } catch {
    return { ok: false, fout: OPVOLGEN[taal].fout.verbinding }
  }
}

export function taakUrl(id: string): string {
  return `/api/club/automatisering/taken/${encodeURIComponent(id)}`
}
