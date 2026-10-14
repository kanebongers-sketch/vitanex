// ─── Fit Factory Club, personeel: hulp voor de API-routes (SERVER) ──────────

import type { NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, type ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'

/** Een uitkomst voor de API: een waarde of een nette fout met HTTP-status. */
export type Resultaat<T> = { ok: true; waarde: T } | { ok: false; fout: string; status: number }

export function gelukt<T>(waarde: T): Resultaat<T> {
  return { ok: true, waarde }
}

export function mislukt<T>(fout: string, status = 400): Resultaat<T> {
  return { ok: false, fout, status }
}

/** Een databasefout loggen en een nette zin teruggeven. */
export function dbFout<T>(wat: string, fout: { message: string }): Resultaat<T> {
  console.error(`[club-personeel] ${wat} mislukt`, fout.message)
  return mislukt(`${wat} is niet gelukt. Probeer het opnieuw.`, 500)
}

/** De JSON-body van een verzoek, of undefined als die geen geldige JSON is. */
export async function leesJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

export function alsAntwoord<T>(r: Resultaat<T>): NextResponse {
  return r.ok ? clubJson(r.waarde) : clubFout(r.fout, r.status)
}

/** Hoort deze medewerker bij Kane en bij deze vestiging? */
export async function isEigenMedewerker(t: ClubToegang, id: string, vestiging?: Vestiging): Promise<boolean> {
  let q = t.admin.from('club_medewerkers').select('id').eq('user_id', t.userId).eq('id', id)
  if (vestiging) q = q.contains('vestigingen', [vestiging])
  const { data, error } = await q.maybeSingle()
  return !error && data !== null
}

/** Hoort deze dienstsoort bij deze vestiging? */
export async function isEigenSoort(t: ClubToegang, id: string, vestiging: Vestiging): Promise<boolean> {
  const { data, error } = await t.admin.from('club_dienst_soorten').select('id').eq('user_id', t.userId).eq('vestiging', vestiging).eq('id', id).maybeSingle()
  return !error && data !== null
}

/** Controle van medewerker en soort voor een dienst; null = in orde, anders de foutzin. */
export async function controleerKoppeling(t: ClubToegang, vestiging: Vestiging, medewerkerId: string | null, soortId: string | null): Promise<string | null> {
  if (medewerkerId && !(await isEigenMedewerker(t, medewerkerId, vestiging))) return 'Deze medewerker werkt niet in deze vestiging.'
  if (soortId && !(await isEigenSoort(t, soortId, vestiging))) return 'Deze soort dienst bestaat niet in deze vestiging.'
  return null
}
