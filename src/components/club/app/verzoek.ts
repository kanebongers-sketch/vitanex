// Kleine fetch-helper voor de ledenapp-voorvertoning: JSON heen en terug,
// eigen fouten als nette tekst in de taal van de pagina (<html lang>, gezet door
// de root layout uit de cookie ayg-taal). Fouten van de server komen zoals ze zijn.

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

/** De taal van de pagina in de browser; op de server (of onbekend) Nederlands. */
export function paginaTaal(): Taal {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'nl'
}

export type Antwoord = { ok: true; data: Record<string, unknown> } | { ok: false; fout: string; status: number }

export async function stuur(url: string, methode: 'POST' | 'DELETE', body?: unknown): Promise<Antwoord> {
  const t = LEDENAPP[paginaTaal()].algemeen
  let res: Response
  try {
    res = await fetch(url, {
      method: methode,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    return { ok: false, fout: t.geenVerbinding, status: 0 }
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
  if (res.status === 404 && data === null) return { ok: false, fout: t.nietBeschikbaar, status: 404 }
  const fout = typeof rij.fout === 'string' ? rij.fout : t.misgegaan
  return { ok: false, fout, status: res.status }
}
