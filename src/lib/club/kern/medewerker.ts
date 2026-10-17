// ─── Fit Factory clubsoftware: medewerkers (gedeeld) ────────────────────────
// De functies van Fit Factory (besluit Kane 14-10-2026): trainer (doet ook de
// balie), groepslesinstructeur en clubmanager, plus de centrale administratie
// voor de uren. In de testfase werkt alleen Kane erin; de rollen bepalen straks
// wat iemand ziet (zie RECHTEN).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from './vestiging'
import { isVestigingSlug } from './vestigingen'

export const MEDEWERKER_ROLLEN = ['trainer', 'instructeur', 'manager', 'administratie'] as const
export type MedewerkerRol = (typeof MEDEWERKER_ROLLEN)[number]

export const ROL_LABEL: Record<MedewerkerRol, string> = {
  trainer: 'Trainer',
  instructeur: 'Groepslesinstructeur',
  manager: 'Clubmanager',
  administratie: 'Administratie',
}

/** Welke onderdelen een rol straks ziet. De testfase is alleen Kane (alles). */
export const RECHTEN: Record<MedewerkerRol, readonly string[]> = {
  trainer: ['vandaag', 'checkin', 'leden', 'schemas', 'rooster', 'leads', 'personeel', 'taken'],
  instructeur: ['vandaag', 'rooster', 'personeel'],
  manager: ['vandaag', 'checkin', 'leden', 'berichten', 'rooster', 'personeel', 'taken', 'leads', 'schemas', 'cijfers', 'instellingen'],
  administratie: ['personeel'],
}

export interface Medewerker {
  id: string
  naam: string
  email: string | null
  rollen: MedewerkerRol[]
  vestigingen: Vestiging[]
  actief: boolean
}

function isRol(v: unknown): v is MedewerkerRol {
  return typeof v === 'string' && (MEDEWERKER_ROLLEN as readonly string[]).includes(v)
}

export function medewerkerUitRij(rij: unknown): Medewerker | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.naam !== 'string') return null
  return {
    id: r.id,
    naam: r.naam,
    email: typeof r.email === 'string' ? r.email : null,
    rollen: Array.isArray(r.rollen) ? r.rollen.filter(isRol) : [],
    vestigingen: Array.isArray(r.vestigingen) ? r.vestigingen.filter(isVestigingSlug) : [],
    actief: r.actief !== false,
  }
}

/** De actieve medewerkers van een vestiging, eventueel met een bepaalde rol. */
export async function haalMedewerkers(
  admin: SupabaseClient,
  userId: string,
  vestiging: Vestiging,
  rol?: MedewerkerRol,
): Promise<Medewerker[] | null> {
  let q = admin
    .from('club_medewerkers')
    .select('id, naam, email, rollen, vestigingen, actief')
    .eq('user_id', userId)
    .eq('actief', true)
    .contains('vestigingen', [vestiging])
  if (rol) q = q.contains('rollen', [rol])
  const { data, error } = await q.order('naam')
  if (error) {
    console.error('[club] medewerkers lezen mislukt', error.message)
    return null
  }
  return (data ?? []).map(medewerkerUitRij).filter((m): m is Medewerker => m !== null)
}

/** Hoort deze medewerker bij de sportschool (user_id)? Geen medewerker (null) is altijd goed. */
export async function medewerkerBestaat(admin: SupabaseClient, userId: string, id: string | null): Promise<boolean> {
  if (!id) return true
  const { data, error } = await admin.from('club_medewerkers').select('id').eq('user_id', userId).eq('id', id).maybeSingle()
  return !error && data !== null
}
