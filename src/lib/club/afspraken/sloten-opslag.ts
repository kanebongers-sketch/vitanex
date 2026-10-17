// ─── Club, afspraken: vrije tijden uit de database (SERVER-ONLY) ────────────
// Haalt alles op wat een tijdslot kan blokkeren en laat de pure logica
// (sloten.ts) rekenen: openingstijden, beschikbaarheid, afspraken van de
// trainer (in elke vestiging), lessen die hij geeft en "geen afspraken".

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Openingstijd } from '@/lib/club/rooster/openingstijden'
import { isoWeekdag, nlNaarUtc, normaliseerTijd, plusDagen } from '@/lib/club/rooster/tijd'
import { haalBeschikbaarheid } from '@/lib/club/personeel/opslag'
import { haalAfspraken, haalOpeningstijden } from './opslag'
import type { AfspraakType } from './model'
import { blokOpDag, blokUitTijden, combineer, isVrij, vrijeTijden, werkvensters, type Kandidaat, type Slot, type SlotInvoer, type Venster } from './sloten'

export interface SlotVerzoek {
  vestiging: string
  type: Pick<AfspraakType, 'duurMin' | 'bufferMin'>
  datum: string
  /** De trainers die dit type mogen geven (al gefilterd). */
  medewerkerIds: readonly string[]
  vanaf: Date | null
  tot: Date | null
  /** Bij verplaatsen: de afspraak zelf telt niet als bezet. */
  negeerAfspraakId?: string
}

interface Blok extends Venster {
  medewerkerId: string | null
}

/** De openingstijd op die dag (null = dicht); undefined = niet te lezen. */
async function haalOpening(admin: SupabaseClient, userId: string, vestiging: string, datum: string): Promise<Openingstijd | null | undefined> {
  const week = await haalOpeningstijden(admin, userId, vestiging)
  return week ? week[isoWeekdag(datum) - 1] : undefined
}

/** Lessen die deze trainers geven en "geen afspraken"-blokken in het rooster. */
async function haalBlokken(admin: SupabaseClient, userId: string, v: SlotVerzoek): Promise<Blok[] | null> {
  const van = nlNaarUtc(v.datum, '00:00').toISOString()
  const tot = nlNaarUtc(plusDagen(v.datum, 1), '00:00').toISOString()
  const [lessen, notities] = await Promise.all([
    admin.from('club_lessen').select('instructeur_id, start_op, eind_op').eq('user_id', userId).eq('status', 'gepland').in('instructeur_id', [...v.medewerkerIds]).lt('start_op', tot).gt('eind_op', van).limit(500),
    admin.from('club_rooster_notities').select('medewerker_id, van, tot').eq('user_id', userId).eq('vestiging', v.vestiging).eq('datum', v.datum).eq('soort', 'geen_afspraken').limit(200),
  ])
  if (lessen.error || notities.error) {
    console.error('[club] afspraken: lessen of rooster lezen mislukt', (lessen.error ?? notities.error)?.message)
    return null
  }
  const uitLessen = ((lessen.data ?? []) as Array<Record<string, unknown>>).flatMap((r) => {
    const blok = typeof r.start_op === 'string' && typeof r.eind_op === 'string' ? blokOpDag(v.datum, r.start_op, r.eind_op) : null
    return blok && typeof r.instructeur_id === 'string' ? [{ ...blok, medewerkerId: r.instructeur_id }] : []
  })
  const uitNotities = ((notities.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    ...blokUitTijden(normaliseerTijd(r.van), normaliseerTijd(r.tot)),
    medewerkerId: typeof r.medewerker_id === 'string' ? r.medewerker_id : null,
  }))
  return [...uitLessen, ...uitNotities]
}

interface DagInvoer {
  medewerkerId: string
  invoer: SlotInvoer
  aantalOpDag: number
}

/** Per trainer alles wat de pure logica nodig heeft; null = er kon iets niet gelezen worden. */
async function laadDag(admin: SupabaseClient, userId: string, v: SlotVerzoek): Promise<DagInvoer[] | null> {
  if (v.medewerkerIds.length === 0) return []
  const dagVan = nlNaarUtc(v.datum, '00:00')
  const dagTot = nlNaarUtc(plusDagen(v.datum, 1), '00:00')
  const [opening, beschikbaarheid, afspraken, blokken] = await Promise.all([
    haalOpening(admin, userId, v.vestiging, v.datum),
    haalBeschikbaarheid(admin, userId, v.medewerkerIds),
    haalAfspraken(admin, userId, { van: dagVan, tot: dagTot, medewerkerIds: v.medewerkerIds }),
    haalBlokken(admin, userId, v),
  ])
  if (opening === undefined || !beschikbaarheid || !afspraken || !blokken) return null
  const tellen = afspraken.filter((a) => a.id !== v.negeerAfspraakId)
  return v.medewerkerIds.map((id) => {
    const eigen = tellen.filter((a) => a.medewerkerId === id)
    const bezet = [
      ...eigen.flatMap((a) => blokOpDag(v.datum, a.start, a.bezetTot) ?? []),
      ...blokken.filter((b) => b.medewerkerId === id || b.medewerkerId === null),
    ]
    const vensters = werkvensters(id, v.datum, opening, beschikbaarheid)
    const invoer: SlotInvoer = { datum: v.datum, duurMin: v.type.duurMin, bufferMin: v.type.bufferMin, vensters, bezet, vanaf: v.vanaf, tot: v.tot }
    return { medewerkerId: id, invoer, aantalOpDag: eigen.length }
  })
}

/**
 * De vrije tijden op een dag. Een trainer: zijn tijden. Meer trainers ("maakt
 * niet uit"): alle tijden samen, elk met de trainer die hem krijgt.
 * null = er kon iets niet gelezen worden.
 */
export async function zoekSloten(admin: SupabaseClient, userId: string, v: SlotVerzoek): Promise<Slot[] | null> {
  const dag = await laadDag(admin, userId, v)
  if (!dag) return null
  const kandidaten: Kandidaat[] = dag.map((d) => ({ medewerkerId: d.medewerkerId, tijden: vrijeTijden(d.invoer), aantalOpDag: d.aantalOpDag }))
  return combineer(kandidaten)
}

/**
 * Welke trainer kan precies om `tijd` (ook buiten het kwartierraster)? De
 * rustigste eerst; null = niemand. undefined = er kon iets niet gelezen worden.
 */
export async function trainerVoorTijd(admin: SupabaseClient, userId: string, v: SlotVerzoek, tijd: string): Promise<string | null | undefined> {
  const dag = await laadDag(admin, userId, v)
  if (!dag) return undefined
  const kan = dag.filter((d) => isVrij(tijd, d.invoer)).sort((a, b) => a.aantalOpDag - b.aantalOpDag)
  return kan[0]?.medewerkerId ?? null
}
