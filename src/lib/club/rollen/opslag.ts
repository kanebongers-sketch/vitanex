// ─── Club, rollen v2: profielen en rollen lezen en schrijven (SERVER) ───────
// Elke query filtert op de sportschool (user_id of organisatie_id).

import type { SupabaseClient } from '@supabase/supabase-js'
import { isUuid } from '@/lib/club/kern/organisatie'
import { schoneRollen } from './model'
import type { Rol } from './typen'

export interface ProfielRij {
  id: string
  rollen: Rol[]
  alleVestigingen: boolean
}

/** De rollen en "alle vestigingen" van een profiel; null bij een leesfout of onbekend profiel. */
export async function haalProfiel(admin: SupabaseClient, userId: string, profielId: string): Promise<ProfielRij | null> {
  const [mw, rollen] = await Promise.all([
    admin.from('club_medewerkers').select('id, alle_vestigingen').eq('user_id', userId).eq('id', profielId).maybeSingle(),
    admin.from('club_profiel_rollen').select('rol').eq('user_id', userId).eq('medewerker_id', profielId),
  ])
  if (mw.error || rollen.error) {
    console.error('[club] profiel lezen mislukt', (mw.error ?? rollen.error)?.message)
    return null
  }
  if (!mw.data) return null
  const rij = mw.data as { id: string; alle_vestigingen?: unknown }
  return { id: rij.id, rollen: schoneRollen((rollen.data ?? []).map((r: { rol: unknown }) => r.rol)), alleVestigingen: rij.alle_vestigingen === true }
}

/** Het profiel achter een beheerderslogin (club_beheerders.profiel_id), of null. */
export async function profielIdVanBeheerder(admin: SupabaseClient, organisatieId: string, beheerderId: string): Promise<string | null> {
  const { data, error } = await admin.from('club_beheerders').select('profiel_id').eq('organisatie_id', organisatieId).eq('id', beheerderId).maybeSingle()
  if (error) {
    console.error('[club] profiel van beheerder lezen mislukt', error.message)
    return null
  }
  const id = (data as { profiel_id?: unknown } | null)?.profiel_id
  return isUuid(id) ? id : null
}

export interface TeamLid {
  id: string
  naam: string
  email: string | null
  rollen: Rol[]
  vestigingen: string[]
  alleVestigingen: boolean
  actief: boolean
  /** Hoort bij een beheerderslogin (eigenaar of clubmanager); telt dan als actief, ook zonder werkrol. */
  beheerder: boolean
  /** Versie van de profielfoto (migratie 473), of null. */
  foto?: string | null
}

/** De profielen achter een actieve beheerderslogin. */
async function beheerderProfielen(admin: SupabaseClient, userId: string): Promise<Set<string> | null> {
  const { data, error } = await admin.from('club_beheerders').select('profiel_id').eq('organisatie_id', userId).eq('actief', true)
  if (error) {
    console.error('[club] beheerders lezen mislukt', error.message)
    return null
  }
  return new Set(((data ?? []) as { profiel_id: unknown }[]).map((r) => r.profiel_id).filter(isUuid))
}

/** Iedereen in het team van deze sportschool met de rollen (actief en niet gewist). */
export async function haalTeamMetRollen(admin: SupabaseClient, userId: string): Promise<TeamLid[] | null> {
  const [mw, rollen, beheer] = await Promise.all([
    admin.from('club_medewerkers').select('id, naam, email, vestigingen, alle_vestigingen, actief, profielfoto').eq('user_id', userId).is('geanonimiseerd_op', null).order('naam'),
    admin.from('club_profiel_rollen').select('medewerker_id, rol').eq('user_id', userId),
    beheerderProfielen(admin, userId),
  ])
  if (mw.error || rollen.error || !beheer) {
    console.error('[club] team lezen mislukt', (mw.error ?? rollen.error)?.message ?? 'beheerders')
    return null
  }
  const perProfiel = new Map<string, unknown[]>()
  for (const r of (rollen.data ?? []) as { medewerker_id: string; rol: unknown }[]) {
    perProfiel.set(r.medewerker_id, [...(perProfiel.get(r.medewerker_id) ?? []), r.rol])
  }
  return ((mw.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    naam: String(r.naam ?? ''),
    email: typeof r.email === 'string' ? r.email : null,
    rollen: schoneRollen(perProfiel.get(String(r.id)) ?? []),
    vestigingen: Array.isArray(r.vestigingen) ? r.vestigingen.filter((v): v is string => typeof v === 'string') : [],
    alleVestigingen: r.alle_vestigingen === true,
    actief: r.actief !== false || beheer.has(String(r.id)),
    beheerder: beheer.has(String(r.id)),
    foto: typeof r.profielfoto === 'string' ? r.profielfoto : null,
  }))
}

/**
 * Het aantal profielen met de rol eigenaar in deze sportschool die echt binnen
 * kunnen: een actieve medewerker, of het profiel van een actieve beheerderslogin
 * (dat staat op actief = false zolang het geen werkrol heeft, migratie 470).
 */
export async function telEigenaren(admin: SupabaseClient, userId: string): Promise<number | null> {
  const { data, error } = await admin.from('club_profiel_rollen').select('medewerker_id').eq('user_id', userId).eq('rol', 'eigenaar')
  if (error) {
    console.error('[club] eigenaren tellen mislukt', error.message)
    return null
  }
  const ids = (data ?? []).map((r: { medewerker_id: string }) => r.medewerker_id)
  if (ids.length === 0) return 0
  const [actief, beheer] = await Promise.all([
    admin.from('club_medewerkers').select('id').eq('user_id', userId).eq('actief', true).in('id', ids),
    beheerderProfielen(admin, userId),
  ])
  if (actief.error || !beheer) {
    console.error('[club] eigenaren tellen mislukt', actief.error?.message ?? 'beheerders')
    return null
  }
  const binnen = new Set([...((actief.data ?? []) as { id: string }[]).map((r) => r.id), ...ids.filter((id) => beheer.has(id))])
  return binnen.size
}

/**
 * Krijgt het profiel van een beheerderslogin een werkrol, dan wordt het
 * personeel: actief, en zonder eigen vestigingen op alle vestigingen (zodat het
 * rooster en de keuzelijsten van de oude code hem zien).
 */
export async function activeerVoorWerk(admin: SupabaseClient, userId: string, profielId: string, alleVestigingen: readonly string[]): Promise<boolean> {
  const { data, error } = await admin.from('club_medewerkers').select('actief, vestigingen').eq('user_id', userId).eq('id', profielId).maybeSingle()
  if (error || !data) {
    if (error) console.error('[club] profiel lezen mislukt', error.message)
    return false
  }
  const rij = data as { actief?: unknown; vestigingen?: unknown }
  const eigen = Array.isArray(rij.vestigingen) ? rij.vestigingen : []
  // Al personeel: niets aanpassen (een actieve medewerker houdt zijn eigen vestigingen).
  if (rij.actief === true) return true
  const velden = { actief: true, ...(eigen.length === 0 ? { vestigingen: [...alleVestigingen] } : {}) }
  const { error: fout } = await admin.from('club_medewerkers').update(velden).eq('user_id', userId).eq('id', profielId)
  if (fout) console.error('[club] profiel activeren mislukt', fout.message)
  return !fout
}

/**
 * De rollen van een profiel vervangen: wat erbij komt invoegen, wat weggaat
 * verwijderen. De trigger van migratie 469 houdt club_medewerkers.rollen bij.
 */
export async function zetRollen(admin: SupabaseClient, userId: string, profielId: string, oud: readonly Rol[], nieuw: readonly Rol[], wie: string): Promise<boolean> {
  const erbij = nieuw.filter((r) => !oud.includes(r))
  const eraf = oud.filter((r) => !nieuw.includes(r))
  if (erbij.length > 0) {
    const { error } = await admin.from('club_profiel_rollen').upsert(
      erbij.map((rol) => ({ user_id: userId, medewerker_id: profielId, rol, toegekend_door: wie.slice(0, 80) })),
      { onConflict: 'medewerker_id,rol', ignoreDuplicates: true },
    )
    if (error) {
      console.error('[club] rollen toevoegen mislukt', error.message)
      return false
    }
  }
  if (eraf.length > 0) {
    const { error } = await admin.from('club_profiel_rollen').delete().eq('user_id', userId).eq('medewerker_id', profielId).in('rol', eraf)
    if (error) {
      console.error('[club] rollen weghalen mislukt', error.message)
      return false
    }
  }
  return true
}

/** "Werkt op alle vestigingen" aan of uit. */
export async function zetAlleVestigingen(admin: SupabaseClient, userId: string, profielId: string, aan: boolean): Promise<boolean> {
  const { error } = await admin.from('club_medewerkers').update({ alle_vestigingen: aan }).eq('user_id', userId).eq('id', profielId)
  if (error) console.error('[club] alle vestigingen opslaan mislukt', error.message)
  return !error
}
