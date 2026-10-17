// ─── Club, sluitingsdagen: lezen (SERVER-ONLY) ──────────────────────────────
// Alle queries filteren op user_id (de sportschool). Bij een leesfout: loggen
// en null of leeg teruggeven; de aanroeper toont een nette melding. Los van
// opslag.ts zodat het rooster dit kan gebruiken zonder kringverwijzing.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Openingstijd } from '@/lib/club/rooster/openingstijden'
import { nlDelen, nlNaarUtc, plusDagen } from '@/lib/club/rooster/tijd'
import { SLUITING_KOLOMMEN, sluitingenUitRijen, sorteerSluitingen, type Sluiting } from './model'
import { komendeAfwijkingen, uitzonderingenVoor, type KomendeAfwijking, type LesMoment } from './regels'

/** Hoe ver vooruit Vandaag en de ledenapp kijken. */
export const DAGEN_VOORUIT = 7

/** Alle sluitingen van de sportschool tussen twee datums (beide inbegrepen), of null bij een fout. */
export async function haalSluitingen(admin: SupabaseClient, userId: string, van: string, tot: string): Promise<Sluiting[] | null> {
  const { data, error } = await admin
    .from('club_sluitingen')
    .select(SLUITING_KOLOMMEN)
    .eq('user_id', userId)
    .gte('datum', van)
    .lte('datum', tot)
    .order('datum')
    .limit(2000)
  if (error) {
    console.error('[club] sluitingen lezen mislukt', error.message)
    return null
  }
  return sorteerSluitingen(sluitingenUitRijen(data))
}

/** Een sluiting op id, alleen van deze sportschool. */
export async function haalSluiting(admin: SupabaseClient, userId: string, id: string): Promise<Sluiting | null> {
  const { data, error } = await admin.from('club_sluitingen').select(SLUITING_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) console.error('[club] sluiting lezen mislukt', error.message)
  return sluitingenUitRijen(data ? [data] : [])[0] ?? null
}

/**
 * Voor de lesgenerator: per datum null (dicht) of de afwijkende openingstijd.
 * Een leesfout geeft een lege lijst (lessen worden dan gewoon gemaakt) en een log.
 */
export async function haalUitzonderingen(admin: SupabaseClient, userId: string, vestiging: string, van: string, tot: string): Promise<Map<string, Openingstijd | null>> {
  const sluitingen = await haalSluitingen(admin, userId, van, tot)
  return uitzonderingenVoor(vestiging, sluitingen ?? [])
}

/** Sluitingen en afwijkende dagen van deze vestiging, vandaag en de komende dagen. Fout = leeg. */
export async function haalKomendeAfwijkingen(admin: SupabaseClient, userId: string, vestiging: string, nu = new Date()): Promise<{ vandaag: string; lijst: KomendeAfwijking[] }> {
  const vandaag = nlDelen(nu).datum
  const tot = plusDagen(vandaag, DAGEN_VOORUIT)
  const sluitingen = await haalSluitingen(admin, userId, vandaag, tot)
  return { vandaag, lijst: komendeAfwijkingen(vestiging, vandaag, DAGEN_VOORUIT, sluitingen ?? []) }
}

/** Geplande (niet geannuleerde) lessen die nog moeten beginnen, tussen twee datums. Null bij een fout. */
export async function haalToekomstigeLessen(admin: SupabaseClient, userId: string, van: string, tot: string, nu: Date, vestiging?: string | null): Promise<LesMoment[] | null> {
  const begin = new Date(Math.max(nlNaarUtc(van, '00:00').getTime(), nu.getTime()))
  const eind = nlNaarUtc(plusDagen(tot, 1), '00:00')
  if (begin >= eind) return []
  let vraag = admin
    .from('club_lessen')
    .select('id, vestiging, start_op, eind_op')
    .eq('user_id', userId)
    .neq('status', 'geannuleerd')
    .gt('start_op', begin.toISOString())
    .lt('start_op', eind.toISOString())
  if (vestiging) vraag = vraag.eq('vestiging', vestiging)
  const { data, error } = await vraag.order('start_op').limit(5000)
  if (error) {
    console.error('[club] lessen voor sluitingen lezen mislukt', error.message)
    return null
  }
  return (data ?? []).flatMap((r: Record<string, unknown>) =>
    typeof r.id === 'string' && typeof r.vestiging === 'string' && typeof r.start_op === 'string' && typeof r.eind_op === 'string'
      ? [{ id: r.id, vestiging: r.vestiging, startOp: r.start_op, eindOp: r.eind_op }]
      : [],
  )
}
