// ─── Club startwizard: voortgang en feiten lezen en opslaan (SERVER-ONLY) ───
// De voortgang staat in club_organisaties.instellingen.start. We lezen de
// kolom rauw (Organisatie.instellingen kent alleen ledenapp, rechten en
// check-in) en schrijven hem terug met alle andere sleutels erin.
// Altijd voor de sportschool die open staat: het id komt nooit van de pagina.

import type { ClubToegang } from '@/lib/club/toegang'
import { instellingenMetStart, leesStart, vestigingIngericht, type StartFeiten, type StartVoortgang } from './stappen'

type Lezer = Pick<ClubToegang, 'admin' | 'organisatie'>
type Schrijver = Pick<ClubToegang, 'admin' | 'organisatie' | 'beheerderId'>

/** De ruwe kolom instellingen; null bij een leesfout (gelogd). */
async function leesRuw(t: Lezer): Promise<{ ruw: unknown } | null> {
  const { data, error } = await t.admin.from('club_organisaties').select('instellingen').eq('id', t.organisatie.id).maybeSingle()
  if (error) {
    console.error('[club-start] voortgang lezen mislukt', error.message)
    return null
  }
  return { ruw: (data as { instellingen?: unknown } | null)?.instellingen ?? null }
}

export type GelezenStart = { ok: true; voortgang: StartVoortgang | null } | { ok: false }

/** De voortgang van de sportschool die open staat (null = nog niet begonnen). */
export async function haalStart(t: Lezer): Promise<GelezenStart> {
  const r = await leesRuw(t)
  return r ? { ok: true, voortgang: leesStart(r.ruw) } : { ok: false }
}

/** Voortgang opslaan; de andere instellingen blijven precies staan. */
export async function bewaarStart(t: Schrijver, v: StartVoortgang): Promise<boolean> {
  const r = await leesRuw(t)
  if (!r) return false
  const { error } = await t.admin
    .from('club_organisaties')
    .update({ instellingen: instellingenMetStart(r.ruw, v), bijgewerkt_op: new Date().toISOString() })
    .eq('id', t.organisatie.id)
    .eq('beheerder_id', t.beheerderId)
  if (error) console.error('[club-start] voortgang opslaan mislukt', error.message)
  return !error
}

/** Het aantal rijen van deze sportschool; 0 bij een fout (gelogd), dan telt de stap gewoon als open. */
async function tel(t: Pick<ClubToegang, 'admin' | 'userId'>, tabel: string, alleenActief: boolean): Promise<number> {
  let q = t.admin.from(tabel).select('id', { count: 'exact', head: true }).eq('user_id', t.userId)
  if (alleenActief) q = q.eq('actief', true)
  const { count, error } = await q
  if (error) console.error(`[club-start] tellen ${tabel} mislukt`, error.message)
  return error ? 0 : (count ?? 0)
}

async function telIngerichteVestigingen(t: Pick<ClubToegang, 'admin' | 'userId'>): Promise<number> {
  const { data, error } = await t.admin.from('club_vestigingen').select('adres, openingstijden').eq('user_id', t.userId)
  if (error) console.error('[club-start] vestigingen lezen mislukt', error.message)
  return (data ?? []).filter((r) => vestigingIngericht(r as { adres?: unknown; openingstijden?: unknown })).length
}

/** Wat de echte data zegt: logo, vestigingen, lestypen, vaste lessen, medewerkers en leden. */
export async function haalStartFeiten(t: Pick<ClubToegang, 'admin' | 'userId' | 'organisatie'>): Promise<StartFeiten> {
  const [vestigingenIngericht, lestypen, vasteLessen, medewerkers, leden] = await Promise.all([
    telIngerichteVestigingen(t),
    tel(t, 'club_lestypen', true),
    tel(t, 'club_lesseries', true),
    tel(t, 'club_medewerkers', true),
    tel(t, 'club_leden', false),
  ])
  return { heeftLogo: t.organisatie.logo !== null, vestigingenIngericht, lestypen, vasteLessen, medewerkers, leden, uit: t.organisatie.uit }
}
