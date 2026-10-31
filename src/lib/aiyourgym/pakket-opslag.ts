// ─── AI Your Gym: afgenomen pakketten opslaan (SERVER-ONLY) ─────────────────
// club_organisaties.pakketten (de licentie) en ayg_pakket_wijzigingen (wat een
// sportschool erbij nam of opzegde, migratie 467). Alleen via de service role,
// altijd op de eigen sportschool (organisatie_id).

import type { SupabaseClient } from '@supabase/supabase-js'
import { isPakketSleutel, metBasis, type PakketSleutel } from './pakketten'
import type { PakketActie } from './pakket-wijziging'

export type WijzigStatus = 'aanvraag' | 'test' | 'stripe' | 'verwerkt'

/** Zet precies deze pakketten op de sportschool, altijd met de basis (idempotent: een vaste lijst). */
export async function zetPakketten(admin: SupabaseClient, organisatieId: string, pakketten: readonly PakketSleutel[]): Promise<boolean> {
  if (pakketten.length === 0) return false
  const { error } = await admin.from('club_organisaties').update({ pakketten: metBasis(pakketten), bijgewerkt_op: new Date().toISOString() }).eq('id', organisatieId)
  if (error) console.error('[aiyourgym] pakketten opslaan mislukt', error.code ?? '')
  return !error
}

/** Een wijziging vastleggen. 'dubbel' = er staat al een open aanvraag voor dit pakket. */
export async function bewaarWijziging(admin: SupabaseClient, organisatieId: string, pakket: PakketSleutel, actie: PakketActie, status: WijzigStatus, wie: string): Promise<'ok' | 'dubbel' | 'fout'> {
  const { error } = await admin.from('ayg_pakket_wijzigingen').insert({ organisatie_id: organisatieId, pakket, actie, status, wie: wie.slice(0, 80) })
  if (!error) return 'ok'
  if (error.code === '23505') return 'dubbel'
  console.error('[aiyourgym] pakketwijziging opslaan mislukt', error.code ?? '')
  return 'fout'
}

export interface OpenAanvraag {
  pakket: PakketSleutel
  actie: PakketActie
  aangemaaktOp: string
}

/** De open aanvragen van deze sportschool (Kane verwerkt ze), of null bij een leesfout. */
export async function openAanvragen(admin: SupabaseClient, organisatieId: string): Promise<OpenAanvraag[] | null> {
  const { data, error } = await admin.from('ayg_pakket_wijzigingen').select('pakket, actie, aangemaakt_op').eq('organisatie_id', organisatieId).eq('status', 'aanvraag').order('aangemaakt_op', { ascending: false })
  if (error) {
    console.error('[aiyourgym] pakketaanvragen lezen mislukt', error.code ?? '')
    return null
  }
  return (data ?? []).flatMap((r) => {
    const rij = r as { pakket?: unknown; actie?: unknown; aangemaakt_op?: unknown }
    if (!isPakketSleutel(rij.pakket) || (rij.actie !== 'erbij' && rij.actie !== 'opzeggen')) return []
    return [{ pakket: rij.pakket, actie: rij.actie, aangemaaktOp: typeof rij.aangemaakt_op === 'string' ? rij.aangemaakt_op : '' }]
  })
}

/** Een open aanvraag is verwerkt (Kane zette het pakket direct): niet meer open. */
export async function sluitAanvraag(admin: SupabaseClient, organisatieId: string, pakket: PakketSleutel): Promise<void> {
  const { error } = await admin.from('ayg_pakket_wijzigingen').update({ status: 'verwerkt', bijgewerkt_op: new Date().toISOString() }).eq('organisatie_id', organisatieId).eq('pakket', pakket).eq('status', 'aanvraag')
  if (error) console.error('[aiyourgym] aanvraag sluiten mislukt', error.code ?? '')
}
