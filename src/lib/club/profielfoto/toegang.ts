// ─── Club: wie is "ik" voor de eigen profielfoto (SERVER) ───────────────────
// Het eigen profiel is de rij in club_medewerkers: voor een medewerker de
// eigen sessie, voor een eigenaar of clubmanager het profiel achter de login
// (club_beheerders.profiel_id, rollen v2). Het master account van Kane heeft
// geen profiel in een sportschool en dus geen eigen foto.

import type { ClubToegang } from '@/lib/club/toegang'
import { profielIdVanBeheerder } from '@/lib/club/rollen/opslag'
import { isMedewerkerSessie } from '@/lib/club/rollen/wie'
import { isUuid } from './model'

export async function eigenProfielId(t: ClubToegang): Promise<string | null> {
  if (t.profiel?.id && isUuid(t.profiel.id)) return t.profiel.id
  if (!t.persoonId || !isUuid(t.persoonId) || t.isPlatformEigenaar) return null
  if (isMedewerkerSessie(t)) return t.persoonId
  return profielIdVanBeheerder(t.admin, t.organisatie.id, t.persoonId)
}
