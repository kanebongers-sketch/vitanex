// Lezen uit de leden-API voor eigen schema's (CLIENT). Schrijven gaat via stuur()
// uit ../verzoek. Fouten komen als nette tekst in de taal van de pagina terug.

import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
import { paginaTaal } from '../verzoek'

export type Gehaald<T> = { ok: true; data: T } | { ok: false; fout: string }

export async function haal<T>(url: string, lees: (data: Record<string, unknown>) => T | null, signal?: AbortSignal): Promise<Gehaald<T>> {
  const t = LEDENAPP[paginaTaal()].algemeen
  try {
    const res = await fetch(url, { signal, cache: 'no-store' })
    const data: unknown = await res.json().catch(() => null)
    const rij = typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : {}
    if (!res.ok) return { ok: false, fout: typeof rij.fout === 'string' ? rij.fout : t.misgegaan }
    const gelezen = lees(rij)
    return gelezen === null ? { ok: false, fout: t.misgegaan } : { ok: true, data: gelezen }
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') return { ok: false, fout: '' }
    return { ok: false, fout: t.geenVerbinding }
  }
}

/** Een lijst uit het antwoord (de server is onze eigen API; de vorm controleert hij zelf). */
export function lijstUit<T>(sleutel: string) {
  return (data: Record<string, unknown>): T[] | null => (Array.isArray(data[sleutel]) ? (data[sleutel] as T[]) : null)
}

export function objectUit<T>(sleutel: string) {
  return (data: Record<string, unknown>): T | null => {
    const v = data[sleutel]
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as T) : null
  }
}
