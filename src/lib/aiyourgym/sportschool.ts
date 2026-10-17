// ─── AI Your Gym: een betaalde aanmelding wordt een sportschool (SERVER-ONLY) ─
// Dezelfde aanmaak als in het portaal van Kane (maakOrganisatie: eigen lege
// omgeving plus de basisbibliotheek, met rollback), daarna het adres, een
// eerste vestiging en de eigenaar als beheerder met een persoonlijke inloglink.
// De sportschool valt onder Kane (beheerder_id), dus Kane ziet hem meteen in de
// sportschool-wissel van Club. Lukt een stap niet, dan gaat alles weer weg:
// liever een herhaling van Stripe dan een halve omgeving.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClubToegang } from '@/lib/club/toegang'
import { lifeosUserId } from '@/lib/lifeos/admin'
import { ORGANISATIE_KOLOMMEN, organisatieUitRij, type Organisatie } from '@/lib/club/kern/organisatie'
import { maakOrganisatie } from '@/lib/club/kern/organisatie-opslag'
import { maakVestiging } from '@/lib/club/instellingen/vestigingen-opslag'
import { maakBeheerder } from '@/lib/club/beheerders/beheerder-opslag'
import { naamMetAdres } from './sportschool-naam'
import type { AanmeldingRij } from './opslag'

/**
 * Een toegang namens het systeem (geen ingelogde persoon): alleen voor deze
 * aanmaak, met Kane als beheerder van de nieuwe sportschool.
 */
function systeemToegang(admin: SupabaseClient, beheerderId: string, organisaties: Organisatie[], userId: string): ClubToegang {
  return {
    admin, userId, organisatie: organisaties[0], organisaties, beheerderId, rol: 'beheerder', isKane: true,
    persoonId: null, onderdelen: null, vestigingen: [], naam: 'AI Your Gym', code: null,
  }
}

async function organisatiesVan(admin: SupabaseClient, beheerderId: string): Promise<Organisatie[] | null> {
  const { data, error } = await admin.from('club_organisaties').select(ORGANISATIE_KOLOMMEN).eq('beheerder_id', beheerderId)
  if (error) {
    console.error('[aiyourgym] sportscholen lezen mislukt', error.code ?? '')
    return null
  }
  return (data ?? []).map(organisatieUitRij).filter((o): o is Organisatie => o !== null)
}

/** Alles van een (half) aangemaakte sportschool weer weg. Nooit de eigen omgeving van Kane. */
export async function ruimSportschoolOp(admin: SupabaseClient, organisatieId: string, beheerderId: string): Promise<void> {
  if (organisatieId === beheerderId) return
  await admin.from('club_beheerders').delete().eq('organisatie_id', organisatieId)
  await admin.from('club_vestigingen').delete().eq('user_id', organisatieId)
  await admin.from('club_oefeningen').delete().eq('user_id', organisatieId)
  const { error } = await admin.from('club_organisaties').delete().eq('id', organisatieId).eq('beheerder_id', beheerderId)
  if (error) console.error('[aiyourgym] opruimen mislukt', error.code ?? '')
}

export type SportschoolUitslag = { ok: true; organisatieId: string } | { ok: false }

export async function maakSportschool(admin: SupabaseClient, a: AanmeldingRij, onthoud: (organisatieId: string) => Promise<boolean>): Promise<SportschoolUitslag> {
  const beheerderId = lifeosUserId()
  const organisaties = await organisatiesVan(admin, beheerderId)
  if (!organisaties || organisaties.length === 0) return { ok: false }
  const t = systeemToegang(admin, beheerderId, organisaties, beheerderId)

  let uit = await maakOrganisatie(t, a.sportschoolNaam)
  if (!uit.ok && uit.status === 409) uit = await maakOrganisatie(t, naamMetAdres(a.sportschoolNaam, a.slug))
  if (!uit.ok) return { ok: false }
  const id = uit.id
  // Meteen vastleggen: loopt dit proces hierna vast, dan ruimt de volgende poging het op.
  if (!(await onthoud(id))) {
    await ruimSportschoolOp(admin, id, beheerderId)
    return { ok: false }
  }

  const { error: slugFout } = await admin.from('club_organisaties').update({ slug: a.slug, demo: false, bijgewerkt_op: new Date().toISOString() }).eq('id', id).eq('beheerder_id', beheerderId)
  // Een bezet adres (door Kane intussen met de hand gekozen) houdt de rest niet tegen; Kane kiest dan een ander.
  if (slugFout && slugFout.code !== '23505') {
    await ruimSportschoolOp(admin, id, beheerderId)
    return { ok: false }
  }

  const vestiging = await maakVestiging(systeemToegang(admin, beheerderId, organisaties, id), { naam: a.sportschoolNaam, adres: null })
  const eigenaar = vestiging.ok ? await maakBeheerder(admin, id, { naam: a.eigenaarNaam, email: a.eigenaarEmail, rol: 'eigenaar' }) : null
  if (!eigenaar) {
    await ruimSportschoolOp(admin, id, beheerderId)
    return { ok: false }
  }
  return { ok: true, organisatieId: id }
}

/** De persoonlijke code van de eigenaar die bij deze aanmelding hoort. */
export async function eigenaarCode(admin: SupabaseClient, organisatieId: string, email: string): Promise<string | null> {
  const { data, error } = await admin
    .from('club_beheerders')
    .select('code')
    .eq('organisatie_id', organisatieId)
    .eq('rol', 'eigenaar')
    .eq('email', email)
    .eq('actief', true)
    .order('aangemaakt_op')
    .limit(1)
    .maybeSingle()
  if (error) return null
  const code = (data as { code?: unknown } | null)?.code
  return typeof code === 'string' ? code : null
}
