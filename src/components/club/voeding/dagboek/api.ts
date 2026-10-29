// Kleine helpers voor de API van het voedingsdagboek (/api/club/lid/voeding).
// Het lid komt uit de sessie; alleen Kane in de voorvertoning stuurt ?voor= mee.
// Foutteksten komen uit het woordenboek (in de taal van de app), niet van de server.

import { stuur } from '@/components/club/app/verzoek'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'

export type Uitslag<T> = { ok: true; data: T } | { ok: false; fout: string }

export function voedingUrl(pad: string, voor: string | null): string {
  const url = `/api/club/lid/voeding${pad}`
  return voor ? `${url}${url.includes('?') ? '&' : '?'}voor=${encodeURIComponent(voor)}` : url
}

function foutTekst(status: number, t: VoedingDagboekTekst['fout'], standaard: string): string {
  if (status === 429) return t.teVaak
  if (status === 400) return t.invoer
  return standaard
}

export async function haal<T>(url: string, t: VoedingDagboekTekst['fout'], standaard: string): Promise<Uitslag<T>> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { ok: false, fout: foutTekst(res.status, t, standaard) }
    return { ok: true, data: (await res.json()) as T }
  } catch {
    return { ok: false, fout: standaard }
  }
}

export async function schrijf<T>(url: string, methode: 'POST' | 'DELETE', body: unknown, t: VoedingDagboekTekst['fout'], standaard: string): Promise<Uitslag<T>> {
  const a = await stuur(url, methode, body)
  return a.ok ? { ok: true, data: a.data as T } : { ok: false, fout: foutTekst(a.status, t, standaard) }
}

/** De codes die de AI-routes meegeven (lib/club/voeding/dagboek/ai/route-hulp.ts, AI_CODE). */
export type AiFoutSoort = 'toestemming' | 'daglimiet' | 'teVaak' | 'teGroot' | 'nietHerkend' | 'nietBeschikbaar' | 'invoer' | 'algemeen'

export type AiUitslag = { ok: true; data: unknown } | { ok: false; soort: AiFoutSoort }

/** Status en code van een AI-route naar een soort fout (PUUR); de tekst kiest de ledenapp in de eigen taal. */
export function aiFoutSoort(status: number, code: unknown): AiFoutSoort {
  if (status === 403 && code === 'toestemming') return 'toestemming'
  if (status === 429) return code === 'daglimiet' ? 'daglimiet' : 'teVaak'
  if (status === 413) return 'teGroot'
  if (status === 422) return 'nietHerkend'
  if (status === 404 || status === 503) return 'nietBeschikbaar'
  if (status === 400) return 'invoer'
  return 'algemeen'
}

/** Een verzoek aan een AI-route (foto als FormData of een omschrijving als JSON). */
export async function vraagAi(url: string, body: FormData | { omschrijving: string }): Promise<AiUitslag> {
  const isForm = body instanceof FormData
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: isForm ? undefined : { 'Content-Type': 'application/json' },
      body: isForm ? body : JSON.stringify(body),
    })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data }
    const code = typeof data === 'object' && data !== null ? (data as { code?: unknown }).code : undefined
    return { ok: false, soort: aiFoutSoort(res.status, code) }
  } catch {
    return { ok: false, soort: 'algemeen' }
  }
}
