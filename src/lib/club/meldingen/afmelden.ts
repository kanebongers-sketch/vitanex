// ─── Club, meldingen: afmelden via de link in een mail (SERVER-ONLY) ────────
// De link bevat alleen een willekeurig token (192 bits); daarmee zet het lid
// herinneringen per mail uit, of alle mails. De meldingen in de app blijven.

import type { SupabaseClient } from '@supabase/supabase-js'

export const TOKEN = /^[A-Za-z0-9_-]{32}$/

export type AfmeldKeuze = 'herinneringen' | 'alles'

export interface AfmeldStand {
  sportschool: string
  herinneringenPerMail: boolean
  mails: boolean
}

/** De stand bij dit token, of null als het token niet bestaat. */
export async function haalAfmeldStand(admin: SupabaseClient, token: string): Promise<AfmeldStand | null> {
  if (!TOKEN.test(token)) return null
  const { data, error } = await admin.from('club_meldingen_voorkeuren').select('user_id, mails, herinneringen_per_mail').eq('afmeld_token', token).maybeSingle()
  if (error) console.error('[club-meldingen] afmeldtoken lezen mislukt', error.message)
  const r = data as { user_id?: unknown; mails?: unknown; herinneringen_per_mail?: unknown } | null
  if (!r || typeof r.user_id !== 'string') return null
  const { data: org } = await admin.from('club_organisaties').select('naam').eq('id', r.user_id).maybeSingle()
  const naam = (org as { naam?: unknown } | null)?.naam
  return { sportschool: typeof naam === 'string' && naam.trim() ? naam.trim() : 'je sportschool', herinneringenPerMail: r.herinneringen_per_mail !== false, mails: r.mails !== false }
}

/** Zet de afmelding door. false als het token niet bestaat of opslaan mislukt. */
export async function meldAf(admin: SupabaseClient, token: string, keuze: AfmeldKeuze): Promise<boolean> {
  if (!TOKEN.test(token)) return false
  const velden = keuze === 'alles' ? { mails: false, herinneringen_per_mail: false } : { herinneringen_per_mail: false }
  const { data, error } = await admin
    .from('club_meldingen_voorkeuren')
    .update({ ...velden, gewijzigd_op: new Date().toISOString() })
    .eq('afmeld_token', token)
    .select('id')
  if (error) console.error('[club-meldingen] afmelden mislukt', error.message)
  return !error && (data?.length ?? 0) === 1
}
