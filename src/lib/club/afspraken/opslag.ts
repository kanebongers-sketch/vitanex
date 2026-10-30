// ─── Club, afspraken: lezen en schrijven (SERVER-ONLY) ──────────────────────
// Elke query filtert op user_id (de sportschool). Een leesfout geeft null; de
// pagina toont dan een nette melding. Dubbel boeken weigert de database zelf
// (exclusion constraints, migratie 413): dat wordt hier een 409 met uitleg.

import type { SupabaseClient } from '@supabase/supabase-js'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { medewerkerUitRij, type Medewerker } from '@/lib/club/kern/medewerker'
import { openingstijdenUitJson, type Openingstijden } from '@/lib/club/rooster/openingstijden'
import { AFSPRAAK_KOLOMMEN, TYPE_KOLOMMEN, afspraakUitRij, rijen, typeUitRij, type Afspraak, type AfspraakType, type AfspraakWeergave } from './model'
import type { TypeInvoer } from './invoer'
import { laatHerinneringenVervallen, planAfspraakMelding } from '@/lib/club/meldingen/opslag'

const MAX_RIJEN = 3000

function meld(wat: string, fout: { message: string }): null {
  console.error(`[club] afspraken: ${wat} mislukt`, fout.message)
  return null
}

export type Opgeslagen<T> = { ok: true; waarde: T } | { ok: false; fout: string; status: number }

/** Een databasefout naar een nette melding; overlap (23P01) wordt een 409. */
function schrijfFout<T>(error: { code?: string; message: string }): Opgeslagen<T> {
  if (error.code === '23P01') {
    const lid = error.message.includes('lid_vrij')
    return {
      ok: false,
      status: 409,
      fout: lid ? 'Dit lid heeft op dat moment al een afspraak.' : 'De trainer is op dat moment net bezet. Kies een ander tijdstip.',
    }
  }
  console.error('[club] afspraak opslaan mislukt', error.message)
  return { ok: false, status: 500, fout: 'De afspraak kon niet worden opgeslagen. Probeer het opnieuw.' }
}

// ── Typen ───────────────────────────────────────────────────────────────────

export async function haalTypen(admin: SupabaseClient, userId: string): Promise<AfspraakType[] | null> {
  const { data, error } = await admin.from('club_afspraak_typen').select(TYPE_KOLOMMEN).eq('user_id', userId).order('volgorde').order('naam').limit(200)
  return error ? meld('typen lezen', error) : rijen(data, typeUitRij)
}

export async function haalType(admin: SupabaseClient, userId: string, id: string): Promise<AfspraakType | null> {
  const { data, error } = await admin.from('club_afspraak_typen').select(TYPE_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  return error ? meld('type lezen', error) : typeUitRij(data)
}

function typeNaarRij(t: TypeInvoer): Record<string, unknown> {
  return {
    naam: t.naam,
    duur_min: t.duurMin,
    buffer_min: t.bufferMin,
    kleur: t.kleur,
    medewerker_ids: t.medewerkerIds,
    app_boekbaar: t.appBoekbaar,
    boeken_uren_vooraf: t.boekenUrenVooraf,
    annuleren_uren_vooraf: t.annulerenUrenVooraf,
    actief: t.actief,
  }
}

export async function maakType(admin: SupabaseClient, userId: string, t: TypeInvoer, volgorde: number): Promise<AfspraakType | null> {
  const { data, error } = await admin.from('club_afspraak_typen').insert({ user_id: userId, ...typeNaarRij(t), volgorde }).select(TYPE_KOLOMMEN).single()
  return error ? meld('type aanmaken', error) : typeUitRij(data)
}

export async function werkTypeBij(admin: SupabaseClient, userId: string, id: string, t: TypeInvoer): Promise<AfspraakType | null> {
  const { data, error } = await admin.from('club_afspraak_typen').update(typeNaarRij(t)).eq('user_id', userId).eq('id', id).select(TYPE_KOLOMMEN).maybeSingle()
  return error ? meld('type bijwerken', error) : typeUitRij(data)
}

// ── Afspraken ───────────────────────────────────────────────────────────────

export interface Bereik {
  van: Date
  tot: Date
  vestiging?: string
  medewerkerIds?: readonly string[]
  lidId?: string
  /** Ook geannuleerde afspraken (voor het overzicht); standaard niet. */
  metGeannuleerd?: boolean
}

/** Afspraken die (met buffer) in dit tijdvak vallen. */
export async function haalAfspraken(admin: SupabaseClient, userId: string, b: Bereik): Promise<Afspraak[] | null> {
  if (b.medewerkerIds && b.medewerkerIds.length === 0) return []
  let q = admin
    .from('club_afspraken')
    .select(AFSPRAAK_KOLOMMEN)
    .eq('user_id', userId)
    .lt('start_op', b.tot.toISOString())
    .gt('bezet_tot', b.van.toISOString())
  if (b.vestiging) q = q.eq('vestiging', b.vestiging)
  if (b.medewerkerIds) q = q.in('medewerker_id', [...b.medewerkerIds])
  if (b.lidId) q = q.eq('lid_id', b.lidId)
  if (!b.metGeannuleerd) q = q.neq('status', 'geannuleerd')
  const { data, error } = await q.order('start_op').limit(MAX_RIJEN)
  return error ? meld('afspraken lezen', error) : rijen(data, afspraakUitRij)
}

export async function haalAfspraak(admin: SupabaseClient, userId: string, id: string): Promise<Afspraak | null> {
  const { data, error } = await admin.from('club_afspraken').select(AFSPRAAK_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  return error ? meld('afspraak lezen', error) : afspraakUitRij(data)
}

export interface NieuweRij {
  vestiging: string
  typeId: string
  medewerkerId: string
  lidId: string
  leadId: string | null
  start: Date
  eind: Date
  bezetTot: Date
  notitie: string | null
  geboektDoor: 'balie' | 'trainer' | 'app'
}

export async function maakAfspraak(admin: SupabaseClient, userId: string, n: NieuweRij): Promise<Opgeslagen<Afspraak>> {
  const { data, error } = await admin
    .from('club_afspraken')
    .insert({
      user_id: userId,
      vestiging: n.vestiging,
      type_id: n.typeId,
      medewerker_id: n.medewerkerId,
      lid_id: n.lidId,
      lead_id: n.leadId,
      start_op: n.start.toISOString(),
      eind_op: n.eind.toISOString(),
      bezet_tot: n.bezetTot.toISOString(),
      notitie: n.notitie,
      geboekt_door: n.geboektDoor,
    })
    .select(AFSPRAAK_KOLOMMEN)
    .single()
  if (error) return schrijfFout(error)
  const afspraak = afspraakUitRij(data)
  if (!afspraak) return { ok: false, status: 500, fout: 'De afspraak kon niet worden gelezen.' }
  // Melding (best effort, breekt de boeking nooit): bevestiging en herinnering.
  await planAfspraakMelding(admin, userId, afspraak, 'afspraak_geboekt')
  return { ok: true, waarde: afspraak }
}

/**
 * Een afspraak bijwerken. Met `alleenAlsStatus` alleen als de status nog die is
 * (geen stille overschrijving). `door` zegt wie annuleert: het lid zelf in de
 * app of de club; dat bepaalt welke melding het lid krijgt. Zonder `door`:
 * annuleren met `alleenAlsStatus` 'gepland' is het lid in de app (zo doen de
 * app-routes het), anders de club.
 */
export async function werkAfspraakBij(
  admin: SupabaseClient,
  userId: string,
  id: string,
  patch: Record<string, unknown>,
  alleenAlsStatus?: string,
  door?: 'lid' | 'club',
): Promise<Opgeslagen<Afspraak>> {
  let q = admin
    .from('club_afspraken')
    .update({ ...patch, gewijzigd_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
  if (alleenAlsStatus) q = q.eq('status', alleenAlsStatus)
  const { data, error } = await q
    .select(AFSPRAAK_KOLOMMEN)
    .maybeSingle()
  if (error) return schrijfFout(error)
  const afspraak = afspraakUitRij(data)
  if (!afspraak) return { ok: false, status: 404, fout: 'Afspraak niet gevonden.' }
  await meldWijziging(admin, userId, afspraak, patch, door ?? (alleenAlsStatus === 'gepland' ? 'lid' : 'club'))
  return { ok: true, waarde: afspraak }
}

/** Meldingen na een wijziging (best effort): annulering of verplaatsing. */
async function meldWijziging(admin: SupabaseClient, userId: string, a: Afspraak, patch: Record<string, unknown>, door: 'lid' | 'club'): Promise<void> {
  if (patch.status === 'geannuleerd') {
    await laatHerinneringenVervallen(admin, userId, [a.id])
    await planAfspraakMelding(admin, userId, a, door === 'lid' ? 'afspraak_afgemeld' : 'afspraak_geannuleerd')
  } else if ('start_op' in patch && a.status === 'gepland') {
    await planAfspraakMelding(admin, userId, a, 'afspraak_verplaatst')
  }
}

/** Hoeveel geplande afspraken in de toekomst heeft dit lid? null bij een fout. */
export async function telOpenAfsprakenVanLid(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<number | null> {
  const { count, error } = await admin
    .from('club_afspraken')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .eq('status', 'gepland')
    .gt('start_op', nu.toISOString())
  if (error) console.error('[club] open afspraken tellen mislukt', error.message)
  return error ? null : count
}

/** Afspraken met de naam van het lid en het type erbij. */
export async function metNamen(admin: SupabaseClient, userId: string, lijst: readonly Afspraak[], typen: readonly AfspraakType[]): Promise<AfspraakWeergave[] | null> {
  const lidIds = [...new Set(lijst.map((a) => a.lidId))]
  const namen = new Map<string, string>()
  for (let i = 0; i < lidIds.length; i += 200) {
    const { data, error } = await admin.from('club_leden').select('id, voornaam, achternaam').eq('user_id', userId).in('id', lidIds.slice(i, i + 200))
    if (error) return meld('namen van leden lezen', error)
    for (const r of (data ?? []) as Array<Record<string, unknown>>) {
      if (typeof r.id === 'string' && typeof r.voornaam === 'string' && typeof r.achternaam === 'string') namen.set(r.id, volledigeNaam({ voornaam: r.voornaam, achternaam: r.achternaam }))
    }
  }
  const typeVan = new Map(typen.map((t) => [t.id, t]))
  return lijst.map((a) => {
    const type = typeVan.get(a.typeId)
    return { ...a, lidNaam: namen.get(a.lidId) ?? 'Onbekend lid', typeNaam: type?.naam ?? 'Afspraak', kleur: type?.kleur ?? 'zand' }
  })
}

// ── Overig voor de pagina's ─────────────────────────────────────────────────

/** De openingstijden van een vestiging; null bij een leesfout. */
export async function haalOpeningstijden(admin: SupabaseClient, userId: string, vestiging: string): Promise<Openingstijden | null> {
  const { data, error } = await admin.from('club_vestigingen').select('openingstijden').eq('user_id', userId).eq('vestiging', vestiging).maybeSingle()
  if (error) return meld('openingstijden lezen', error)
  return data ? openingstijdenUitJson((data as { openingstijden: unknown }).openingstijden) : null
}

/** Open leads van een vestiging om aan een afspraak te koppelen (bijv. een intake). */
export async function haalOpenLeads(admin: SupabaseClient, userId: string, vestiging: string): Promise<{ id: string; naam: string }[] | null> {
  const { data, error } = await admin
    .from('club_leads')
    .select('id, naam')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .not('status', 'in', '(lid,verloren)')
    // Gewiste leads (AVG) zijn geen persoon meer om een afspraak mee te maken.
    .is('geanonimiseerd_op', null)
    .order('aangemaakt_op', { ascending: false })
    .limit(200)
  if (error) return meld('leads lezen', error)
  return ((data ?? []) as Array<Record<string, unknown>>).flatMap((r) => (typeof r.id === 'string' && typeof r.naam === 'string' ? [{ id: r.id, naam: r.naam }] : []))
}

/** Afspraken van een lid voor de ledenkaart: alles van 90 dagen terug tot 90 dagen vooruit. */
export async function haalAfsprakenVanLid(admin: SupabaseClient, userId: string, lidId: string, nu: Date): Promise<AfspraakWeergave[] | null> {
  const dag = 86_400_000
  const [lijst, typen] = await Promise.all([
    haalAfspraken(admin, userId, { van: new Date(nu.getTime() - 90 * dag), tot: new Date(nu.getTime() + 90 * dag), lidId, metGeannuleerd: true }),
    haalTypen(admin, userId),
  ])
  if (!lijst || !typen) return null
  return metNamen(admin, userId, lijst, typen)
}

/** Alle actieve medewerkers van de sportschool (voor "wie geeft dit"). */
export async function haalAlleMedewerkers(admin: SupabaseClient, userId: string): Promise<Medewerker[] | null> {
  const { data, error } = await admin.from('club_medewerkers').select('id, naam, email, rollen, vestigingen, actief, profielfoto').eq('user_id', userId).eq('actief', true).order('naam').limit(500)
  if (error) return meld('medewerkers lezen', error)
  return (data ?? []).map(medewerkerUitRij).filter((m): m is Medewerker => m !== null)
}
