// ─── Fit Factory Club, taken: lezen uit de database (SERVER) ────────────────
// Elke query filtert op user_id. Een fout geeft null; de pagina toont dan een
// nette melding in plaats van halve gegevens.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import {
  AFSLUIT_KOLOMMEN,
  AFVINK_KOLOMMEN,
  LIJST_KOLOMMEN,
  NOTITIE_KOLOMMEN,
  TAAK_KOLOMMEN,
  afsluitrondeUitRij,
  afvinkingUitRij,
  lijstUitRij,
  notitieUitRij,
  opVolgorde,
  rijenNaar,
  taakUitRij,
  type Afsluitronde,
  type Afvinking,
  type DagNotitie,
  type Taak,
  type Takenlijst,
} from './typen'

/** Een uitkomst voor de API: een waarde of een nette fout met HTTP-status. */
export type Resultaat<T> = { ok: true; waarde: T } | { ok: false; fout: string; status: number }

export function gelukt<T>(waarde: T): Resultaat<T> {
  return { ok: true, waarde }
}

export function mislukt<T>(fout: string, status = 400): Resultaat<T> {
  return { ok: false, fout, status }
}

export interface TakenData {
  /** Op volgorde. */
  lijsten: Takenlijst[]
  /** Op volgorde van de lijst en daarbinnen op volgorde. */
  taken: Taak[]
}

const PAGINA = 1000
const MAX_PAGINAS = 10

function logFout(wat: string, fout: { message: string }): void {
  console.error(`[club-taken] ${wat} mislukt`, fout.message)
}

/** De lijsten en taken van een vestiging (ook uitgezette, voor het beheer). */
export async function haalTaken(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<TakenData | null> {
  const l = await admin.from('club_takenlijsten').select(LIJST_KOLOMMEN).eq('user_id', userId).eq('vestiging', vestiging)
  if (l.error) {
    logFout('lijsten lezen', l.error)
    return null
  }
  const lijsten = opVolgorde(rijenNaar(l.data, lijstUitRij))
  if (lijsten.length === 0) return { lijsten, taken: [] }
  const t = await admin
    .from('club_taken')
    .select(TAAK_KOLOMMEN)
    .eq('user_id', userId)
    .in(
      'lijst_id',
      lijsten.map((x) => x.id),
    )
  if (t.error) {
    logFout('taken lezen', t.error)
    return null
  }
  const alle = rijenNaar(t.data, taakUitRij)
  const taken = lijsten.flatMap((lijst) => opVolgorde(alle.filter((x) => x.lijstId === lijst.id)))
  return { lijsten, taken }
}

/** Alleen wat aanstaat: actieve lijsten met hun actieve taken. */
export function alleenActief(data: TakenData): TakenData {
  const lijsten = data.lijsten.filter((l) => l.actief)
  const ids = new Set(lijsten.map((l) => l.id))
  return { lijsten, taken: data.taken.filter((t) => t.actief && ids.has(t.lijstId)) }
}

/** Alle vinkjes van een vestiging tussen twee datums (beide meegeteld). */
export async function haalAfvinkingen(admin: SupabaseClient, userId: string, vestiging: Vestiging, van: string, tot: string): Promise<Afvinking[] | null> {
  const uit: Afvinking[] = []
  for (let p = 0; p < MAX_PAGINAS; p++) {
    const { data, error } = await admin
      .from('club_taak_afvinken')
      .select(AFVINK_KOLOMMEN)
      .eq('user_id', userId)
      .eq('vestiging', vestiging)
      .gte('datum', van)
      .lte('datum', tot)
      .order('datum')
      .order('id')
      .range(p * PAGINA, (p + 1) * PAGINA - 1)
    if (error) {
      logFout('afvinkingen lezen', error)
      return null
    }
    uit.push(...rijenNaar(data, afvinkingUitRij))
    if (!data || data.length < PAGINA) break
  }
  return uit
}

/** De "iets anders gedaan"-notities van een vestiging tussen twee datums. */
export async function haalNotities(admin: SupabaseClient, userId: string, vestiging: Vestiging, van: string, tot: string): Promise<DagNotitie[] | null> {
  const { data, error } = await admin
    .from('club_taak_notities')
    .select(NOTITIE_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .gte('datum', van)
    .lte('datum', tot)
    .order('aangemaakt_op')
    .limit(500)
  if (error) {
    logFout('notities lezen', error)
    return null
  }
  return rijenNaar(data, notitieUitRij)
}

/** Wanneer en door wie de afsluitronde is afgemeld, tussen twee datums. */
export async function haalAfsluitrondes(admin: SupabaseClient, userId: string, vestiging: Vestiging, van: string, tot: string): Promise<Afsluitronde[] | null> {
  const { data, error } = await admin
    .from('club_taak_afsluitrondes')
    .select(AFSLUIT_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .gte('datum', van)
    .lte('datum', tot)
    .order('datum')
  if (error) {
    logFout('afsluitrondes lezen', error)
    return null
  }
  return rijenNaar(data, afsluitrondeUitRij)
}
