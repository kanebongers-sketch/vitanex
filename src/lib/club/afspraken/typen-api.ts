// ─── Club, afspraken: controle bij het opslaan van een type (SERVER-ONLY) ───

import type { ClubToegang } from '@/lib/club/toegang'

/** Horen alle medewerkers in de lijst bij deze sportschool? Leeg = ja. */
export async function medewerkersHoren(t: ClubToegang, ids: readonly string[]): Promise<boolean> {
  if (ids.length === 0) return true
  const { data, error } = await t.admin.from('club_medewerkers').select('id').eq('user_id', t.userId).in('id', [...ids])
  if (error) {
    console.error('[club] afspraken: medewerkers controleren mislukt', error.message)
    return false
  }
  return (data ?? []).length === ids.length
}
