// ─── Club: vestigingscontrole op een record-id (SERVER-ONLY) ────────────────
// Een medewerker ziet maar een deel van de vestigingen van de sportschool
// (t.vestigingen). De lijst- en aanmaakroutes filteren daarop, maar een route op
// een record-id (PATCH /leads/<id>) las alleen user_id. Deze helper sluit dat gat:
// hoort het record bij een vestiging die niet van deze persoon is, dan hetzelfde
// antwoord als een onbekend record (404), zodat er niets over verraden wordt.
// Voor Kane, eigenaar en clubmanager is t.vestigingen de hele sportschool: geen
// verschil. Een medewerker-record heeft een lijst vestigingen: daar telt een
// gedeelde vestiging (zie medewerker-vestigingen.ts). Een record zonder
// vestiging (bv. een schema zonder lid) is sportschoolbreed.

import type { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubFout } from '@/lib/club/toegang'
import { isUuid } from './organisatie'
import { hoortBij, type VestigingInfo } from './vestigingen'
import { deeltVestiging } from './medewerker-vestigingen'

/** Tabellen met een eigen kolom `vestiging`. */
type DirecteTabel =
  | 'club_lessen'
  | 'club_afspraken'
  | 'club_leden'
  | 'club_diensten'
  | 'club_dienst_sjablonen'
  | 'club_rooster_notities'
  | 'club_takenlijsten'
  | 'club_taak_notities'

/** Tabellen met een lijst `vestigingen` (een medewerker werkt op een of meer plekken). */
type LijstTabel = 'club_medewerkers'

/** Tabellen waarvan de vestiging via een ander record loopt. */
const VIA = {
  club_reserveringen: { kolom: 'les_id', naar: 'club_lessen' },
  club_metingen: { kolom: 'lid_id', naar: 'club_leden' },
  club_schemas: { kolom: 'lid_id', naar: 'club_leden' },
  club_trainingslog: { kolom: 'lid_id', naar: 'club_leden' },
  club_taken: { kolom: 'lijst_id', naar: 'club_takenlijsten' },
  club_beschikbaarheid: { kolom: 'medewerker_id', naar: 'club_medewerkers' },
} as const satisfies Record<string, { kolom: string; naar: DirecteTabel | LijstTabel }>

export type VestigingTabel = DirecteTabel | LijstTabel | keyof typeof VIA

/** Wie er kijkt: de sportschool, de zichtbare vestigingen en (optioneel) de rol. */
interface Kijker {
  admin: SupabaseClient
  userId: string
  vestigingen: readonly VestigingInfo[]
  /** Alleen 'medewerker' ziet een deel van de sportschool (zie medewerker-vestigingen.ts). */
  rol?: string
}

export const NIET_GEVONDEN = 'Niet gevonden.'

type Gelezen = { staat: 'ok'; waarde: string | null } | { staat: 'weg' } | { staat: 'fout' }

async function leesKolom(admin: SupabaseClient, userId: string, tabel: string, kolom: string, id: string): Promise<Gelezen> {
  const { data, error } = await admin.from(tabel).select(kolom).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) {
    console.error(`[club] vestiging van ${tabel} lezen mislukt`, error.message)
    return { staat: 'fout' }
  }
  if (!data) return { staat: 'weg' }
  const waarde = (data as unknown as Record<string, unknown>)[kolom]
  return { staat: 'ok', waarde: typeof waarde === 'string' ? waarde : null }
}

type GelezenLijst = { staat: 'ok'; waarde: string[] } | { staat: 'weg' } | { staat: 'fout' }

async function leesLijst(admin: SupabaseClient, userId: string, tabel: LijstTabel, id: string): Promise<GelezenLijst> {
  const { data, error } = await admin.from(tabel).select('vestigingen').eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) {
    console.error(`[club] vestigingen van ${tabel} lezen mislukt`, error.message)
    return { staat: 'fout' }
  }
  if (!data) return { staat: 'weg' }
  const lijst = (data as unknown as Record<string, unknown>).vestigingen
  return { staat: 'ok', waarde: Array.isArray(lijst) ? lijst.filter((v): v is string => typeof v === 'string') : [] }
}

/**
 * Mag deze persoon het record met dit id zien en wijzigen? true bij een onbekend
 * of ongeldig id (dan geeft de route zelf zijn gewone 404), bij een record zonder
 * vestiging en bij een eigen vestiging. false bij een vestiging die niet van
 * deze persoon is, en bij een leesfout (liever dicht dan open).
 */
export async function recordInEigenVestiging(t: Kijker, tabel: VestigingTabel, id: unknown): Promise<boolean> {
  if (!isUuid(id)) return true
  if (tabel === 'club_medewerkers') {
    // Een collega: minstens een gedeelde vestiging (Kane, eigenaar en clubmanager zien iedereen).
    const r = await leesLijst(t.admin, t.userId, tabel, id)
    return r.staat === 'weg' || (r.staat === 'ok' && deeltVestiging(t, r.waarde))
  }
  const via = (VIA as Record<string, { kolom: string; naar: DirecteTabel | LijstTabel } | undefined>)[tabel]
  if (!via) {
    const r = await leesKolom(t.admin, t.userId, tabel, 'vestiging', id)
    return r.staat === 'weg' || (r.staat === 'ok' && hoortBij(t.vestigingen, r.waarde))
  }
  const schakel = await leesKolom(t.admin, t.userId, tabel, via.kolom, id)
  if (schakel.staat === 'weg') return true
  if (schakel.staat === 'fout') return false
  // Een record zonder koppeling (schema zonder lid) is voor de hele sportschool.
  if (schakel.waarde === null) return true
  return recordInEigenVestiging(t, via.naar, schakel.waarde)
}

/** Voor in een route: null als het mag, anders een 404-antwoord. */
export async function eisVestigingVanRecord(t: Kijker, tabel: VestigingTabel, id: unknown): Promise<NextResponse | null> {
  return (await recordInEigenVestiging(t, tabel, id)) ? null : clubFout(NIET_GEVONDEN, 404)
}
