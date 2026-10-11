// Client-side ophalen van /api/gezondheid. Raakt geen React-state aan: de
// caller beslist wat er met de uitkomst gebeurt (actief-vlag in het effect).

import { authFetch } from '@/lib/auth/auth-fetch'
import type { GezondheidAntwoord } from '@/lib/gezondheid/types'
import { NL_LICHAAM } from '@/lib/gezondheid/taal'
import type { Taalset } from '@/lib/i18n/taalset'

export type Geladen =
  | { soort: 'uitgelogd' }
  | { soort: 'fout'; tekst: string }
  | { soort: 'klaar'; data: GezondheidAntwoord }

function isAntwoord(waarde: unknown): waarde is GezondheidAntwoord {
  if (typeof waarde !== 'object' || waarde === null) return false
  const w = waarde as Record<string, unknown>
  return typeof w.vandaag === 'string' && Array.isArray(w.dagen) && Array.isArray(w.workouts) && Array.isArray(w.bronnen)
}

async function leesFout(res: Response, ts: Taalset): Promise<string> {
  const body: unknown = await res.json().catch(() => null)
  if (body && typeof body === 'object' && 'fout' in body && typeof body.fout === 'string' && ts.taal === 'nl') return body.fout
  return ts.t('lichaam.laden.fout')
}

export async function haalGezondheid(dagen: number, ts: Taalset = NL_LICHAAM): Promise<Geladen> {
  try {
    const res = await authFetch(`/api/gezondheid?dagen=${dagen}`)
    if (res.status === 401) return { soort: 'uitgelogd' }
    if (!res.ok) return { soort: 'fout', tekst: await leesFout(res, ts) }
    const data: unknown = await res.json()
    if (!isAntwoord(data)) return { soort: 'fout', tekst: ts.t('lichaam.laden.onverwacht') }
    return { soort: 'klaar', data }
  } catch {
    return { soort: 'fout', tekst: ts.t('lichaam.laden.geenVerbinding') }
  }
}
