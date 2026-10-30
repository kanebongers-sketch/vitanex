// ─── Club, nieuwe leden: aanmeldlinks opslaan (SERVER-ONLY) ─────────────────
// Maken, tonen en intrekken door de sportschool (altijd gefilterd op de
// sportschool van de sessie), en een link opzoeken op zijn geheime code (de
// openbare aanmeldpagina; daar bestaat nog geen sportschool, die volgt uit de
// gevonden rij).

import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isUuid } from '@/lib/club/kern/organisatie'
import { LINK_CODE, LINK_KOLOMMEN, linkStaat, linkUitRij, linkVelden, type Aanmeldlink, type LinkInvoer, type LinkStaat } from './regels'

const TABEL = 'club_aanmeldlinks'

function log(wat: string, fout: { message: string } | null | undefined): void {
  if (fout) console.error(`[club/nieuwe-leden] ${wat} mislukt`, fout.message)
}

export function nieuweLinkCode(): string {
  return randomBytes(18).toString('base64url')
}

/** De links van een vestiging, nieuwste eerst. null bij een leesfout. */
export async function haalLinks(admin: SupabaseClient, userId: string, vestiging: string): Promise<Aanmeldlink[] | null> {
  const { data, error } = await admin.from(TABEL).select(LINK_KOLOMMEN).eq('user_id', userId).eq('vestiging', vestiging).order('aangemaakt_op', { ascending: false }).limit(100)
  log('links lezen', error)
  if (error) return null
  return (data ?? []).map(linkUitRij).filter((l): l is Aanmeldlink => l !== null)
}

/** Een link van deze sportschool op id; null als hij niet bestaat, undefined bij een leesfout. */
export async function haalLink(admin: SupabaseClient, userId: string, id: string): Promise<Aanmeldlink | null | undefined> {
  if (!isUuid(id)) return null
  const { data, error } = await admin.from(TABEL).select(LINK_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  log('link lezen', error)
  return error ? undefined : linkUitRij(data)
}

export interface LinkOpScherm {
  id: string
  code: string
  naam: string | null
  vestiging: string
  vormId: string | null
  maxGebruik: number | null
  gebruikt: number
  verlooptOp: string | null
  staat: LinkStaat
  aangemaaktOp: string
}

/** Wat de browser van een link ziet. De code hoort erbij: de sportschool deelt de link zelf. */
export function linkVoorScherm(l: Aanmeldlink, nu: Date): LinkOpScherm {
  return { id: l.id, code: l.code, naam: l.naam, vestiging: l.vestiging, vormId: l.vormId, maxGebruik: l.maxGebruik, gebruikt: l.gebruikt, verlooptOp: l.verlooptOp, staat: linkStaat(l, nu), aangemaaktOp: l.aangemaaktOp }
}

export async function maakLink(admin: SupabaseClient, userId: string, invoer: LinkInvoer, door: string, nu: Date): Promise<Aanmeldlink | null> {
  const { data, error } = await admin
    .from(TABEL)
    .insert({ ...linkVelden(invoer, nu), user_id: userId, code: nieuweLinkCode(), gemaakt_door: door.slice(0, 80), aangemaakt_op: nu.toISOString() })
    .select(LINK_KOLOMMEN)
    .single()
  log('link maken', error)
  return error ? null : linkUitRij(data)
}

/** Intrekken: de link en zijn QR werken meteen niet meer. False bij een fout of onbekende link. */
export async function trekLinkIn(admin: SupabaseClient, userId: string, id: string, nu: Date): Promise<boolean> {
  const { data, error } = await admin.from(TABEL).update({ ingetrokken_op: nu.toISOString() }).eq('user_id', userId).eq('id', id).is('ingetrokken_op', null).select('id')
  log('link intrekken', error)
  return !error && Array.isArray(data) && data.length === 1
}

/** De link achter een code (openbaar), of null. Of hij nog werkt, beslist linkStaat. */
export async function vindLink(admin: SupabaseClient, code: string): Promise<Aanmeldlink | null> {
  if (!LINK_CODE.test(code)) return null
  const { data, error } = await admin.from(TABEL).select(LINK_KOLOMMEN).eq('code', code).maybeSingle()
  log('link opzoeken', error)
  return error ? null : linkUitRij(data)
}

/**
 * Een keer gebruiken (compare-and-set op het aantal): lukt alleen zolang de
 * link open is. Twee aanmeldingen tegelijk op een eenmalige link: een wint.
 */
export async function gebruikLink(admin: SupabaseClient, l: Aanmeldlink): Promise<boolean> {
  const { data, error } = await admin.from(TABEL).update({ gebruikt: l.gebruikt + 1 }).eq('id', l.id).eq('user_id', l.userId).eq('gebruikt', l.gebruikt).is('ingetrokken_op', null).select('id')
  log('link gebruiken', error)
  return !error && Array.isArray(data) && data.length === 1
}
