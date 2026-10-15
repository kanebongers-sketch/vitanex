// ─── Fit Factory Club: maandcijfers ophalen (SERVER) ────────────────────────
// Lessen per dag en de dag waarop de data begint, voor de maandrapportage.
// Eerst de functies uit migratie 396; bestaan die nog niet, dan rekenen we met
// de functies en tabellen die er al zijn. Elke query filtert op user_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import { VESTIGINGEN, type Vestiging } from '@/lib/club/kern/vestiging'
import { haalLessen, meld, type Bron } from './bronnen'
import { lesDagen, type LesDag } from './lesdagen'
import type { LesTelling } from './lessen'
import { haalAlles } from './pagina'
import { alsRij, beginUitRij, datum, lesDagUitRij, rijenVan, type BeginBron, type BeginRij } from './rijen'
import { dagSleutel } from './tijd'

export interface LesDagenBron extends Bron<LesDag[]> {
  /** Tellingen per les, als die onderweg al zijn opgehaald (terugval zonder 396). */
  perLes: LesTelling[] | null
}

/** Lessen per dag van van tot tot (tot = hoogstens nu, zodat alleen gehouden lessen tellen). */
export async function haalLesDagen(admin: SupabaseClient, userId: string, van: Date, tot: Date): Promise<LesDagenBron> {
  const rpc = await haalAlles((a, b) =>
    admin.rpc('club_cijfers_lessen_dag', { p_user: userId, p_van: van.toISOString(), p_tot: tot.toISOString() }).range(a, b),
  )
  if (!rpc.fout) return { data: rijenVan(rpc.rijen, lesDagUitRij), fout: meld('Lessen', null, rpc.afgekapt), perLes: null }
  const los = await haalLessen(admin, userId, van, tot)
  return { data: lesDagen(los.data, tot), fout: los.fout, perLes: los.data }
}

const BEGIN_TABEL: Record<BeginBron, { tabel: string; kolom: string }> = {
  bezoek: { tabel: 'club_checkins', kolom: 'op' },
  lessen: { tabel: 'club_lessen', kolom: 'start_op' },
  leads: { tabel: 'club_leads', kolom: 'aangemaakt_op' },
}

async function eersteVan(admin: SupabaseClient, userId: string, v: Vestiging, bron: BeginBron): Promise<BeginRij | null | 'fout'> {
  const { tabel, kolom } = BEGIN_TABEL[bron]
  const { data, error } = await admin.from(tabel).select(kolom).eq('user_id', userId).eq('vestiging', v).order(kolom).limit(1)
  if (error) return 'fout'
  const r = alsRij(Array.isArray(data) ? data[0] : null)
  const eerste = r ? datum(r[kolom]) : null
  return eerste ? { vestiging: v, bron, dag: dagSleutel(eerste) } : null
}

/** Vanaf welke dag er per vestiging bezoek, lessen en leads zijn. */
export async function haalBegin(admin: SupabaseClient, userId: string): Promise<Bron<BeginRij[]>> {
  const { data, error } = await admin.rpc('club_cijfers_begin', { p_user: userId })
  if (!error) return { data: rijenVan(Array.isArray(data) ? data : [], beginUitRij), fout: null }
  const bronnen: BeginBron[] = ['bezoek', 'lessen', 'leads']
  const los = await Promise.all(VESTIGINGEN.flatMap((v) => bronnen.map((b) => eersteVan(admin, userId, v, b))))
  const rijen = los.filter((r): r is BeginRij => r !== null && r !== 'fout')
  return { data: rijen, fout: meld('Begin van de data', los.includes('fout') ? 'een of meer tellingen mislukt' : null, false) }
}
