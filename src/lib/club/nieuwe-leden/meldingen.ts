// ─── Club, nieuwe leden: meldingen voor het team (SERVER-ONLY) ──────────────
// "Nieuwe aanmelding via link" (een lid meldde zich aan met een link of QR van
// de sportschool) en "Intake ingevuld" (een lid vulde zelf de intake in). Op
// Vandaag tot iemand van het team op Gezien drukt. Elke query filtert op de
// sportschool en de vestiging.

import type { SupabaseClient } from '@supabase/supabase-js'
import { isUuid } from '@/lib/club/kern/organisatie'

export interface NieuweAanmelding {
  lidId: string
  naam: string
  op: string
  abonnement: string | null
}

export interface IngevuldeIntake {
  intakeId: string
  lidId: string
  naam: string
  op: string
}

export interface NieuwVanLeden {
  aanmeldingen: NieuweAanmelding[]
  intakes: IngevuldeIntake[]
}

const MAX = 20

function log(wat: string, fout: { message: string } | null | undefined): void {
  if (fout) console.error(`[club/nieuwe-leden] ${wat} mislukt`, fout.message)
}

function naamVan(r: Record<string, unknown>): string {
  return [r.voornaam, r.achternaam].filter((d) => typeof d === 'string' && d).join(' ')
}

/** Systeemgrens: rijen naar meldingen (PUUR, ook in tests). Onbruikbare rijen vallen weg. */
export function aanmeldingenUitRijen(rijen: unknown): NieuweAanmelding[] {
  if (!Array.isArray(rijen)) return []
  return rijen.flatMap((ruw) => {
    const r = typeof ruw === 'object' && ruw !== null ? (ruw as Record<string, unknown>) : {}
    if (!isUuid(r.id) || typeof r.aanmelding_op !== 'string') return []
    return [{ lidId: r.id, naam: naamVan(r), op: r.aanmelding_op, abonnement: typeof r.abonnement === 'string' && r.abonnement ? r.abonnement : null }]
  })
}

export function intakesUitRijen(rijen: unknown): IngevuldeIntake[] {
  if (!Array.isArray(rijen)) return []
  return rijen.flatMap((ruw) => {
    const r = typeof ruw === 'object' && ruw !== null ? (ruw as Record<string, unknown>) : {}
    const lid = Array.isArray(r.club_leden) ? r.club_leden[0] : r.club_leden
    if (!isUuid(r.id) || !isUuid(r.lid_id) || typeof r.aangemaakt_op !== 'string' || typeof lid !== 'object' || lid === null) return []
    return [{ intakeId: r.id, lidId: r.lid_id, naam: naamVan(lid as Record<string, unknown>), op: r.aangemaakt_op }]
  })
}

/** Wat het team nog niet zag in deze vestiging. null bij een leesfout. */
export async function haalNieuwVanLeden(admin: SupabaseClient, userId: string, vestiging: string): Promise<NieuwVanLeden | null> {
  const [leden, intakes] = await Promise.all([
    admin
      .from('club_leden')
      .select('id, voornaam, achternaam, abonnement, aanmelding_op')
      .eq('user_id', userId)
      .eq('vestiging', vestiging)
      .not('aanmelding_op', 'is', null)
      .is('aanmelding_gezien_op', null)
      .order('aanmelding_op', { ascending: false })
      .limit(MAX),
    admin
      .from('club_intakes')
      .select('id, lid_id, aangemaakt_op, club_leden!inner(voornaam, achternaam, vestiging)')
      .eq('user_id', userId)
      .eq('bron', 'lid')
      .is('gezien_op', null)
      .eq('club_leden.vestiging', vestiging)
      .order('aangemaakt_op', { ascending: false })
      .limit(MAX),
  ])
  log('nieuwe aanmeldingen lezen', leden.error)
  log('ingevulde intakes lezen', intakes.error)
  if (leden.error || intakes.error) return null
  return { aanmeldingen: aanmeldingenUitRijen(leden.data), intakes: intakesUitRijen(intakes.data) }
}

export type GezienWat = 'aanmelding' | 'intake'

/** Gezien: de melding verdwijnt van Vandaag. Alles van dit lid in een keer. */
export async function markeerGezien(admin: SupabaseClient, userId: string, lidId: string, wat: GezienWat, nu: Date): Promise<boolean> {
  const tijd = nu.toISOString()
  const { error } =
    wat === 'aanmelding'
      ? await admin.from('club_leden').update({ aanmelding_gezien_op: tijd }).eq('user_id', userId).eq('id', lidId).is('aanmelding_gezien_op', null)
      : await admin.from('club_intakes').update({ gezien_op: tijd }).eq('user_id', userId).eq('lid_id', lidId).eq('bron', 'lid').is('gezien_op', null)
  log('gezien markeren', error)
  return !error
}

/** Hoe kwam dit lid binnen, voor de ledenkaart. null bij een leesfout of zonder aanmelding. */
export async function haalAanmeldInfo(admin: SupabaseClient, userId: string, lidId: string): Promise<{ op: string; gezien: boolean } | null> {
  const { data, error } = await admin.from('club_leden').select('aanmelding_op, aanmelding_gezien_op').eq('user_id', userId).eq('id', lidId).maybeSingle()
  log('aanmelding van lid lezen', error)
  const r = (data ?? null) as { aanmelding_op?: unknown; aanmelding_gezien_op?: unknown } | null
  return !error && r && typeof r.aanmelding_op === 'string' ? { op: r.aanmelding_op, gezien: typeof r.aanmelding_gezien_op === 'string' } : null
}
