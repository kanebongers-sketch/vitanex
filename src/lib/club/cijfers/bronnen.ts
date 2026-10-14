// ─── Fit Factory Club: cijfers ophalen (SERVER) ─────────────────────────────
// Eerst de telfuncties uit migratie 386 (de database telt, weinig rijen over
// de lijn). Bestaan die nog niet, dan halen we gerichte kolommen in pagina's en
// tellen we hier met dezelfde pure functies. Elke query filtert op user_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isVestiging } from '@/lib/club/kern/vestiging'
import { telBezoek, type BezoekTelling, type Checkin } from './bezoek'
import type { LidCijferRij } from './leden'
import type { LeadCijferRij } from './leads'
import { telPerLes, type LesTelling, type ReserveringStatus } from './lessen'
import { haalAlles } from './pagina'
import {
  alsRij,
  bezoekTellingUitRij,
  datum,
  leadCijferUitRij,
  lesBasisUitRij,
  lesTellingUitRij,
  lidCijferUitRij,
  reserveringUitRij,
  rijenVan,
} from './rijen'

export interface Bron<T> {
  data: T
  /** Een melding voor de pagina als iets niet (helemaal) gelukt is. */
  fout: string | null
}

function meld(wat: string, fout: string | null, afgekapt: boolean): string | null {
  if (fout) {
    console.error(`[club/cijfers] ${wat} mislukt`, fout)
    return `${wat} kon niet worden geladen.`
  }
  return afgekapt ? `${wat}: niet alle rijen geladen, het cijfer is een ondergrens.` : null
}

export async function haalBezoek(admin: SupabaseClient, userId: string, van: Date): Promise<Bron<BezoekTelling[]>> {
  const rpc = await haalAlles((a, b) => admin.rpc('club_cijfers_bezoek', { p_user: userId, p_van: van.toISOString() }).range(a, b))
  if (!rpc.fout) return { data: rijenVan(rpc.rijen, bezoekTellingUitRij), fout: meld('Bezoek', null, rpc.afgekapt) }
  const los = await haalAlles((a, b) =>
    admin.from('club_checkins').select('vestiging, op').eq('user_id', userId).gte('op', van.toISOString()).order('op').range(a, b),
  )
  const checkins = rijenVan<Checkin>(los.rijen, (v) => {
    const r = alsRij(v)
    const op = r ? datum(r.op) : null
    return r && op && isVestiging(r.vestiging) ? { vestiging: r.vestiging, op } : null
  })
  return { data: telBezoek(checkins), fout: meld('Bezoek', los.fout, los.afgekapt) }
}

export async function haalLessen(admin: SupabaseClient, userId: string, van: Date, tot: Date, vestiging?: Vestiging): Promise<Bron<LesTelling[]>> {
  const rpc = await haalAlles((a, b) =>
    admin.rpc('club_cijfers_lessen', { p_user: userId, p_van: van.toISOString(), p_tot: tot.toISOString() }).range(a, b),
  )
  if (!rpc.fout) {
    const alle = rijenVan(rpc.rijen, lesTellingUitRij)
    return { data: vestiging ? alle.filter((l) => l.vestiging === vestiging) : alle, fout: meld('Lessen', null, rpc.afgekapt) }
  }
  return haalLessenLos(admin, userId, van, tot, vestiging)
}

async function haalLessenLos(admin: SupabaseClient, userId: string, van: Date, tot: Date, vestiging?: Vestiging): Promise<Bron<LesTelling[]>> {
  const lessenRuw = await haalAlles((a, b) => {
    let q = admin
      .from('club_lessen')
      .select('id, vestiging, start_op, capaciteit, status, club_lestypen(naam)')
      .eq('user_id', userId)
      .gte('start_op', van.toISOString())
      .lt('start_op', tot.toISOString())
    if (vestiging) q = q.eq('vestiging', vestiging)
    return q.order('start_op').order('id').range(a, b)
  })
  const lessen = rijenVan(lessenRuw.rijen, lesBasisUitRij)
  const ids = lessen.map((l) => l.id)
  const reserveringen: { lesId: string; status: ReserveringStatus }[] = []
  let fout = lessenRuw.fout
  // In blokken van 200 les-id's, zodat de URL niet te lang wordt.
  for (let i = 0; i < ids.length && !fout; i += 200) {
    const blok = ids.slice(i, i + 200)
    const r = await haalAlles((a, b) => admin.from('club_reserveringen').select('les_id, status').eq('user_id', userId).in('les_id', blok).order('id').range(a, b))
    fout = r.fout
    reserveringen.push(...rijenVan(r.rijen, reserveringUitRij))
  }
  return { data: telPerLes(lessen, reserveringen), fout: meld('Lessen', fout, lessenRuw.afgekapt) }
}

export async function haalLedenCijfers(admin: SupabaseClient, userId: string, vestiging?: Vestiging): Promise<Bron<LidCijferRij[]>> {
  const r = await haalAlles((a, b) => {
    let q = admin.from('club_leden').select('id, vestiging, status, lid_sinds, einddatum, geboortedatum, geslacht').eq('user_id', userId)
    if (vestiging) q = q.eq('vestiging', vestiging)
    return q.order('id').range(a, b)
  })
  return { data: rijenVan(r.rijen, lidCijferUitRij), fout: meld('Leden', r.fout, r.afgekapt) }
}

/** Leads die vanaf `van` binnenkwamen. */
export async function haalLeadsCijfers(admin: SupabaseClient, userId: string, van: Date): Promise<Bron<LeadCijferRij[]>> {
  const r = await haalAlles((a, b) =>
    admin
      .from('club_leads')
      .select('vestiging, bron, status, proefles_op')
      .eq('user_id', userId)
      .gte('aangemaakt_op', van.toISOString())
      .order('aangemaakt_op')
      .range(a, b),
  )
  return { data: rijenVan(r.rijen, leadCijferUitRij), fout: meld('Leads', r.fout, r.afgekapt) }
}
