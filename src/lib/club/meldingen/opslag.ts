// ─── Club, meldingen: inplannen, instellingen en de lijst in de app (SERVER-ONLY) ──
// Alles hier is best effort voor wie boekt: een fout wordt gelogd en nooit
// doorgegeven, zodat een mislukte melding een boeking nooit breekt. Elke query
// filtert op user_id (de sportschool). Dubbel inplannen kan niet: de sleutel
// is uniek per gebeurtenis en kanaal (migratie 426), dubbele rijen worden
// genegeerd.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Afspraak } from '@/lib/club/afspraken/model'
import type { LesRij } from '@/lib/club/rooster/typen'
import { LEDENAPP_KOLOMMEN, ledenappMeldingUitRij, type LedenappMelding } from './model'
import { bouwMeldingen, metPush, type Gebeurtenis, type LesGebeurtenis } from './plannen'
import type { LesGegevens, Ontvanger } from './sjablonen'
import { instellingenNaarRij, instellingenUitRij, type AfspraakSoort, type MeldingInstellingen } from './soorten'

function log(wat: string, fout: unknown): void {
  const tekst = fout instanceof Error ? fout.message : typeof fout === 'object' && fout && 'message' in fout ? String(fout.message) : String(fout)
  console.error(`[club-meldingen] ${wat} mislukt`, tekst)
}

// ── Instellingen ────────────────────────────────────────────────────────────

export async function haalMeldingInstellingen(admin: SupabaseClient, userId: string): Promise<MeldingInstellingen> {
  const { data, error } = await admin.from('club_meldingen_instellingen').select('uit, les_herinnering_min, afspraak_herinnering_min').eq('user_id', userId).maybeSingle()
  if (error) log('instellingen lezen', error)
  return instellingenUitRij(data)
}

export async function bewaarMeldingInstellingen(admin: SupabaseClient, userId: string, i: MeldingInstellingen): Promise<boolean> {
  const { error } = await admin
    .from('club_meldingen_instellingen')
    .upsert({ user_id: userId, ...instellingenNaarRij(i), gewijzigd_op: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) log('instellingen opslaan', error)
  return !error
}

// ── Gegevens voor de teksten ────────────────────────────────────────────────

async function naamVan(admin: SupabaseClient, tabel: string, userId: string, kolom: string, waarde: string | null): Promise<string | null> {
  if (!waarde) return null
  const { data, error } = await admin.from(tabel).select('naam').eq('user_id', userId).eq(kolom, waarde).maybeSingle()
  if (error) log(`${tabel} lezen`, error)
  const naam = (data as { naam?: unknown } | null)?.naam
  return typeof naam === 'string' && naam.trim() ? naam.trim() : null
}

async function sportschoolNaam(admin: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await admin.from('club_organisaties').select('naam').eq('id', userId).maybeSingle()
  if (error) log('sportschool lezen', error)
  const naam = (data as { naam?: unknown } | null)?.naam
  return typeof naam === 'string' && naam.trim() ? naam.trim() : 'Je sportschool'
}

/** Per lid de voornaam en de naam van de sportschool. Onbekende leden ontbreken. */
async function haalOntvangers(admin: SupabaseClient, userId: string, lidIds: readonly string[]): Promise<Map<string, Ontvanger>> {
  const uniek = [...new Set(lidIds)]
  if (uniek.length === 0) return new Map()
  const [sportschool, { data, error }] = await Promise.all([
    sportschoolNaam(admin, userId),
    admin.from('club_leden').select('id, voornaam').eq('user_id', userId).in('id', uniek),
  ])
  if (error) log('leden lezen', error)
  const lijst = (data ?? []) as Array<{ id?: unknown; voornaam?: unknown }>
  return new Map(lijst.flatMap((r) => (typeof r.id === 'string' && typeof r.voornaam === 'string' ? [[r.id, { voornaam: r.voornaam.trim(), sportschool }] as const] : [])))
}

async function lesGegevens(admin: SupabaseClient, userId: string, les: LesRij): Promise<LesGegevens> {
  const [naam, vestigingNaam, instructeur] = await Promise.all([
    naamVan(admin, 'club_lestypen', userId, 'id', les.lestypeId),
    naamVan(admin, 'club_vestigingen', userId, 'vestiging', les.vestiging),
    naamVan(admin, 'club_medewerkers', userId, 'id', les.instructeurId),
  ])
  return { naam: naam ?? 'Je les', start: les.startOp, vestigingNaam: vestigingNaam ?? les.vestiging, instructeur, reden: les.annuleerReden }
}

// ── Inplannen ───────────────────────────────────────────────────────────────

interface Plan {
  lidId: string
  gebeurtenis: Gebeurtenis
}

async function schrijf(admin: SupabaseClient, userId: string, plannen: readonly Plan[], ontvangers: Map<string, Ontvanger>, nu: Date): Promise<void> {
  const inst = await haalMeldingInstellingen(admin, userId)
  const rijen = plannen.flatMap((p) => {
    const o = ontvangers.get(p.lidId)
    return o ? metPush(bouwMeldingen(p.gebeurtenis, o, inst, nu)).map((m) => ({ ...m, user_id: userId, lid_id: p.lidId })) : []
  })
  if (rijen.length === 0) return
  const { error } = await admin.from('club_meldingen').upsert(rijen, { onConflict: 'user_id,sleutel,kanaal', ignoreDuplicates: true })
  if (error) log('meldingen inplannen', error)
}

export interface LesMeldingVoor {
  lidId: string
  reserveringId: string
  geboektOp: string
  soort: LesGebeurtenis['soort']
  wachtpositie?: number | null
}

/** Meldingen voor een of meer leden bij een les. Best effort: gooit nooit. */
export async function planLesMeldingen(admin: SupabaseClient, userId: string, les: LesRij, voor: readonly LesMeldingVoor[], nu = new Date()): Promise<void> {
  if (voor.length === 0) return
  try {
    const [gegevens, ontvangers] = await Promise.all([lesGegevens(admin, userId, les), haalOntvangers(admin, userId, voor.map((v) => v.lidId))])
    const plannen = voor.map((v) => ({
      lidId: v.lidId,
      gebeurtenis: { soort: v.soort, reserveringId: v.reserveringId, geboektOp: v.geboektOp, les: { ...gegevens, wachtpositie: v.wachtpositie ?? null } },
    }))
    await schrijf(admin, userId, plannen, ontvangers, nu)
  } catch (err) {
    log('lesmelding inplannen', err)
  }
}

/** Een melding bij een afspraak. Best effort: gooit nooit. */
export async function planAfspraakMelding(admin: SupabaseClient, userId: string, a: Afspraak, soort: Exclude<AfspraakSoort, 'afspraak_herinnering'>, nu = new Date()): Promise<void> {
  try {
    const [typeNaam, vestigingNaam, trainer, ontvangers] = await Promise.all([
      naamVan(admin, 'club_afspraak_typen', userId, 'id', a.typeId),
      naamVan(admin, 'club_vestigingen', userId, 'vestiging', a.vestiging),
      naamVan(admin, 'club_medewerkers', userId, 'id', a.medewerkerId),
      haalOntvangers(admin, userId, [a.lidId]),
    ])
    const afspraak = { typeNaam: typeNaam ?? 'Afspraak', start: a.start, vestigingNaam: vestigingNaam ?? a.vestiging, trainer }
    await schrijf(admin, userId, [{ lidId: a.lidId, gebeurtenis: { soort, afspraakId: a.id, afspraak } }], ontvangers, nu)
  } catch (err) {
    log('afspraakmelding inplannen', err)
  }
}

/** Geplande herinneringen bij deze reserveringen of afspraken laten vervallen. Best effort. */
export async function laatHerinneringenVervallen(admin: SupabaseClient, userId: string, bronIds: readonly string[]): Promise<void> {
  if (bronIds.length === 0) return
  try {
    const { error } = await admin
      .from('club_meldingen')
      .update({ status: 'overgeslagen', reden: 'Geannuleerd', gewijzigd_op: new Date().toISOString() })
      .eq('user_id', userId)
      .in('bron_id', [...bronIds])
      .in('soort', ['les_herinnering', 'afspraak_herinnering'])
      .eq('status', 'gepland')
    if (error) log('herinneringen laten vervallen', error)
  } catch (err) {
    log('herinneringen laten vervallen', err)
  }
}

// ── De lijst in de ledenapp ─────────────────────────────────────────────────

/** De laatste meldingen van een lid voor de app; null bij een leesfout. */
export async function haalLedenappMeldingen(admin: SupabaseClient, userId: string, lidId: string, max = 30): Promise<LedenappMelding[] | null> {
  const { data, error } = await admin
    .from('club_meldingen')
    .select(LEDENAPP_KOLOMMEN)
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .eq('kanaal', 'app')
    .eq('status', 'verstuurd')
    .order('verstuurd_op', { ascending: false })
    .limit(Math.min(Math.max(max, 1), 100))
  if (error) {
    log('meldingen van lid lezen', error)
    return null
  }
  return (data ?? []).map(ledenappMeldingUitRij).filter((m): m is LedenappMelding => m !== null)
}

/** Alle meldingen van een lid in de app op gelezen zetten. */
export async function markeerMeldingenGelezen(admin: SupabaseClient, userId: string, lidId: string): Promise<boolean> {
  const { error } = await admin
    .from('club_meldingen')
    .update({ gelezen_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .eq('kanaal', 'app')
    .is('gelezen_op', null)
  if (error) log('meldingen gelezen zetten', error)
  return !error
}

// ── Overzicht voor het instellingencentrum ──────────────────────────────────

export type MailTelling = Record<'verstuurd' | 'overgeslagen' | 'mislukt' | 'gepland', number | null>

/** Hoeveel mails in de laatste 30 dagen verstuurd, overgeslagen, mislukt en nog gepland zijn. */
export async function telMails(admin: SupabaseClient, userId: string, nu = new Date()): Promise<MailTelling> {
  const sinds = new Date(nu.getTime() - 30 * 86_400_000).toISOString()
  const tel = async (status: keyof MailTelling): Promise<number | null> => {
    const { count, error } = await admin
      .from('club_meldingen')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('kanaal', 'email')
      .eq('status', status)
      .gte('aangemaakt_op', sinds)
    if (error) log('mails tellen', error)
    return error ? null : (count ?? 0)
  }
  const [verstuurd, overgeslagen, mislukt, gepland] = await Promise.all([tel('verstuurd'), tel('overgeslagen'), tel('mislukt'), tel('gepland')])
  return { verstuurd, overgeslagen, mislukt, gepland }
}
