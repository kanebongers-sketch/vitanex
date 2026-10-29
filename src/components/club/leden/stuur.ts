// ─── Fit Factory Club: een mutatie naar de eigen API (CLIENT) ───────────────
// Geeft altijd een nette foutmelding terug, nooit een stack trace. Een eigen
// melding van de server gaat zoals hij is; de standaardmeldingen volgen de taal
// van de pagina (<html lang>, gezet door de root layout uit de cookie ayg-taal).

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

export type Verstuurd = { ok: true; data: unknown } | { ok: false; fout: string }

/** De taal van de pagina in de browser; buiten de browser Nederlands. */
function paginaTaal(): Taal {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'nl'
}

export async function stuur(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<Verstuurd> {
  const t = LEDEN[paginaTaal()].fouten
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data }
    const fout = typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
    return { ok: false, fout: fout ?? t.algemeen }
  } catch {
    return { ok: false, fout: t.verbinding }
  }
}
