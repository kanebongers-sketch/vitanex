// ─── Fit Factory Club: leden met risico ophalen (SERVER) ────────────────────
// Leden van de vestiging die horen te komen (actief en proef), hun bezoeken op
// ALLE vestigingen (12 weken) en no-shows (8 weken), daarna exact dezelfde
// rekenregels als de ledenlijst en de ledenkaart (bouwRijen, berekenBehoud).
// Voor wie zichtbaar is en 12 weken niet kwam, zoeken we het laatste bezoek ooit.

import type { SupabaseClient } from '@supabase/supabase-js'
import { LID_KOLOMMEN, lidUitRij, type Lid } from '@/lib/club/kern/lid'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { NO_SHOW_DAGEN, VENSTER_DAGEN } from '@/lib/club/leden/behoud'
import { alleRijen } from '@/lib/club/leden/data'
import { bouwRijen } from '@/lib/club/leden/lijst'
import { checkinUitRij, reserveringUitRij } from '@/lib/club/leden/rijen'
import { risicoLijst, type RisicoLid } from './risico'

const MS_DAG = 86_400_000
/** Zoveel lid-id's per verzoek, zodat de URL kort genoeg blijft. */
const BLOK_IDS = 150

export interface RisicoUitkomst {
  lijst: RisicoLid[]
  /** Laatste bezoek ooit voor de zichtbare leden zonder bezoek in 12 weken (null = nooit). */
  laatsteOoit: Map<string, Date | null>
  fout: string | null
}

function blokken<T>(lijst: readonly T[], grootte: number): T[][] {
  const uit: T[][] = []
  for (let i = 0; i < lijst.length; i += grootte) uit.push(lijst.slice(i, i + grootte))
  return uit
}

async function haalVerwachteLeden(admin: SupabaseClient, userId: string, v: Vestiging): Promise<Lid[] | null> {
  const rijen = await alleRijen('leden (risico)', (van, tot) =>
    admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).eq('vestiging', v).in('status', ['actief', 'proef']).order('id').range(van, tot),
  )
  return rijen ? rijen.map(lidUitRij).filter((l): l is Lid => l !== null) : null
}

/** Bezoeken per lid op alle vestigingen sinds `sinds`. */
async function haalBezoeken(admin: SupabaseClient, userId: string, ids: readonly string[], sinds: Date): Promise<Map<string, Date[]> | null> {
  // De blokken lopen tegelijk; samenvoegen in de oorspronkelijke volgorde.
  const uitkomsten = await Promise.all(
    blokken(ids, BLOK_IDS).map((blok) =>
      alleRijen('bezoeken (risico)', (van, tot) =>
        admin.from('club_checkins').select('id, lid_id, op').eq('user_id', userId).in('lid_id', blok)
          .gte('op', sinds.toISOString()).order('op').order('id').range(van, tot),
      ),
    ),
  )
  const perLid = new Map<string, Date[]>()
  for (const rijen of uitkomsten) {
    if (!rijen) return null
    for (const c of rijen.map(checkinUitRij)) {
      if (!c) continue
      const lijst = perLid.get(c.lidId)
      if (lijst) lijst.push(c.op)
      else perLid.set(c.lidId, [c.op])
    }
  }
  return perLid
}

/** No-shows per lid op alle vestigingen, voor lessen tussen `sinds` en nu. */
async function haalNoShows(admin: SupabaseClient, userId: string, ids: ReadonlySet<string>, sinds: Date, nu: Date): Promise<Map<string, number> | null> {
  const rijen = await alleRijen('no-shows (risico)', (van, tot) =>
    admin.from('club_reserveringen').select('id, lid_id, status, club_lessen!inner(id, start_op, eind_op, status, vestiging)')
      .eq('user_id', userId).eq('status', 'no_show')
      .gte('club_lessen.start_op', sinds.toISOString()).lte('club_lessen.start_op', nu.toISOString())
      .order('id').range(van, tot),
  )
  if (!rijen) return null
  const perLid = new Map<string, number>()
  for (const r of rijen.map(reserveringUitRij)) if (r && ids.has(r.lidId)) perLid.set(r.lidId, (perLid.get(r.lidId) ?? 0) + 1)
  return perLid
}

async function laatsteBezoekOoit(admin: SupabaseClient, userId: string, lidId: string): Promise<Date | null | undefined> {
  const { data, error } = await admin.from('club_checkins').select('id, lid_id, op')
    .eq('user_id', userId).eq('lid_id', lidId).order('op', { ascending: false }).limit(1).maybeSingle()
  if (error) {
    console.error('[club/vandaag] laatste bezoek lezen mislukt', error.message)
    return undefined
  }
  return checkinUitRij(data)?.op ?? null
}

async function zoekLaatsteOoit(admin: SupabaseClient, userId: string, lijst: readonly RisicoLid[]): Promise<Map<string, Date | null>> {
  const zonder = lijst.filter((r) => r.behoud.dagenSinds === null)
  const uitkomsten = await Promise.all(zonder.map((r) => laatsteBezoekOoit(admin, userId, r.lid.id)))
  const uit = new Map<string, Date | null>()
  zonder.forEach((r, i) => {
    const op = uitkomsten[i]
    if (op !== undefined) uit.set(r.lid.id, op)
  })
  return uit
}

const FOUT = 'De leden met risico konden niet worden geladen.'

/** De risicolijst van een vestiging, meest urgent eerst. */
export async function haalRisico(admin: SupabaseClient, userId: string, v: Vestiging, nu: Date, zichtbaar: number): Promise<RisicoUitkomst> {
  const leden = await haalVerwachteLeden(admin, userId, v)
  if (!leden) return { lijst: [], laatsteOoit: new Map(), fout: FOUT }
  const ids = leden.map((l) => l.id)
  const [bezoeken, noShows] = await Promise.all([
    haalBezoeken(admin, userId, ids, new Date(nu.getTime() - (VENSTER_DAGEN + 1) * MS_DAG)),
    haalNoShows(admin, userId, new Set(ids), new Date(nu.getTime() - NO_SHOW_DAGEN * MS_DAG), nu),
  ])
  if (!bezoeken || !noShows) return { lijst: [], laatsteOoit: new Map(), fout: FOUT }
  const lijst = risicoLijst(bouwRijen(leden, bezoeken, noShows, nu))
  const laatsteOoit = await zoekLaatsteOoit(admin, userId, lijst.slice(0, zichtbaar))
  return { lijst, laatsteOoit, fout: null }
}
