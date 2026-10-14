'use client'

// Verzoeken naar de eigen taken-API. Fouten komen als nette Nederlandse zin
// terug (de API geeft { fout }); geen verbinding wordt ook een zin.

import type { Afsluitronde, Afvinking, DagNotitie } from '@/lib/club/taken/typen'

export type Antwoord = { ok: true; data: unknown } | { ok: false; fout: string }

export async function vraag(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<Antwoord> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data: unknown = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data }
    const fout = typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : null
    return { ok: false, fout: fout ?? 'Er ging iets mis. Probeer het opnieuw.' }
  } catch {
    return { ok: false, fout: 'Geen verbinding. Controleer het internet en probeer het opnieuw.' }
  }
}

function veld(v: unknown, k: string): unknown {
  return typeof v === 'object' && v !== null && k in v ? (v as Record<string, unknown>)[k] : undefined
}

function tekst(v: unknown, k: string): string | null {
  const w = veld(v, k)
  return typeof w === 'string' ? w : null
}

/** Systeemgrens: het vinkje zoals de API het teruggeeft. */
export function alsAfvinking(v: unknown): Afvinking | null {
  const id = tekst(v, 'id')
  const taakId = tekst(v, 'taakId')
  const datum = tekst(v, 'datum')
  const afgevinktOp = tekst(v, 'afgevinktOp')
  const wie = tekst(v, 'wie')
  if (!id || !taakId || !datum || !afgevinktOp || !wie) return null
  return { id, taakId, datum, afgevinktOp, wie, medewerkerId: tekst(v, 'medewerkerId'), notitie: tekst(v, 'notitie') }
}

export function alsNotitie(v: unknown): DagNotitie | null {
  const id = tekst(v, 'id')
  const datum = tekst(v, 'datum')
  const inhoud = tekst(v, 'tekst')
  const aangemaaktOp = tekst(v, 'aangemaaktOp')
  if (!id || !datum || !inhoud || !aangemaaktOp) return null
  return { id, datum, tekst: inhoud, aangemaaktOp, wie: tekst(v, 'wie') }
}

export function alsAfsluitronde(v: unknown): Afsluitronde | null {
  const datum = tekst(v, 'datum')
  const wie = tekst(v, 'wie')
  const op = tekst(v, 'op')
  const open = veld(v, 'openTaken')
  if (!datum || !wie || !op || typeof open !== 'number') return null
  return { datum, wie, op, openTaken: open }
}

const KLOK = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

/** "09:12" in Nederlandse tijd. */
export function klok(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : KLOK.format(d)
}
