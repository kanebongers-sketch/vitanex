// Een verzoek naar de leads-API, met een nette fout als het misgaat. Een eigen
// melding van de server gaat zoals hij is; de standaardmeldingen volgen de taal
// van de pagina (<html lang>, gezet door de root layout uit de cookie ayg-taal).

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'

/** De taal van de pagina in de browser; buiten de browser Nederlands. */
function paginaTaal(): Taal {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'nl'
}

export type Antwoord = { ok: true; data: Record<string, unknown> } | { ok: false; fout: string; data: Record<string, unknown> }

function alsObject(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

export async function stuur(url: string, method: 'GET' | 'POST' | 'PATCH', body?: unknown): Promise<Antwoord> {
  const t = LEADS[paginaTaal()].fouten
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    const data = alsObject(await res.json().catch(() => null))
    if (res.ok) return { ok: true, data }
    const fout = typeof data.fout === 'string' ? data.fout : t.algemeen
    return { ok: false, fout, data }
  } catch {
    return { ok: false, fout: t.verbinding, data: {} }
  }
}
