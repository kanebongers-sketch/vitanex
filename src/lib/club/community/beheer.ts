// ─── Club, community: beheer door de sportschool (SERVER-ONLY) ──────────────
// Groepen maken, bewerken en archiveren, leden toevoegen en eruit halen, en
// berichten beoordelen (vastgehouden of gemeld). Alles op t.userId; elke
// actie komt in het logboek, zonder de tekst van een bericht.

import { logActie, type ClubSchrijver } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { alleRijen } from '@/lib/club/leden/data'
import { GROEP_KOLOMMEN, groepUitRij, isBerichtStatus, isMeldReden, type BerichtStatus, type Groep, type MeldReden } from './model'
import type { GroepInvoer, ModeratieActie } from './invoer'
import { haalGroep, meld } from './lezen'

type R = Record<string, unknown>
const FOUT = 'Er ging iets mis. Probeer het opnieuw.'

function een(v: unknown): R | null {
  const x = Array.isArray(v) ? v[0] : v
  return typeof x === 'object' && x !== null ? (x as R) : null
}

function naamVanRij(v: unknown): string {
  const l = een(v)
  return l && typeof l.voornaam === 'string' && typeof l.achternaam === 'string' ? `${l.voornaam} ${l.achternaam}` : 'Onbekend lid'
}

// ── Lezen ───────────────────────────────────────────────────────────────────

export interface BeheerGroep extends Groep {
  leden: number
}

export interface TeBeoordelen {
  berichtId: string
  groepNaam: string
  /** Volledige naam: alleen voor de sportschool. */
  auteur: string
  tekst: string
  status: BerichtStatus
  reden: string | null
  op: string
  meldingen: { reden: MeldReden; toelichting: string | null }[]
}

export interface CommunityBeheer {
  groepen: BeheerGroep[]
  beoordelen: TeBeoordelen[]
}

async function haalBeoordelen(t: ClubSchrijver): Promise<TeBeoordelen[] | null> {
  const [open, vast] = await Promise.all([
    t.admin.from('club_community_meldingen').select('bericht_id, reden, toelichting').eq('user_id', t.userId).eq('status', 'open').order('aangemaakt_op').limit(500),
    t.admin.from('club_community_berichten').select('id').eq('user_id', t.userId).eq('status', 'vastgehouden').limit(500),
  ])
  if (open.error || vast.error) {
    meld('te beoordelen lezen', (open.error ?? vast.error)!)
    return null
  }
  const perBericht = new Map<string, TeBeoordelen['meldingen']>()
  for (const m of (open.data ?? []) as R[]) {
    if (typeof m.bericht_id !== 'string' || !isMeldReden(m.reden)) continue
    perBericht.set(m.bericht_id, [...(perBericht.get(m.bericht_id) ?? []), { reden: m.reden, toelichting: typeof m.toelichting === 'string' ? m.toelichting : null }])
  }
  const ids = [...new Set([...perBericht.keys(), ...((vast.data ?? []) as R[]).map((r) => r.id as string)])]
  if (ids.length === 0) return []
  const { data, error } = await t.admin
    .from('club_community_berichten')
    .select('id, tekst, status, reden, aangemaakt_op, club_leden(voornaam, achternaam), club_community_groepen(naam)')
    .eq('user_id', t.userId)
    .in('id', ids)
    .order('aangemaakt_op')
  if (error) {
    meld('berichten lezen', error)
    return null
  }
  return ((data ?? []) as R[]).flatMap((r) =>
    typeof r.id === 'string' && typeof r.tekst === 'string' && isBerichtStatus(r.status) && typeof r.aangemaakt_op === 'string'
      ? [{ berichtId: r.id, groepNaam: (een(r.club_community_groepen)?.naam as string | undefined) ?? 'Groep', auteur: naamVanRij(r.club_leden), tekst: r.tekst, status: r.status, reden: typeof r.reden === 'string' ? r.reden : null, op: r.aangemaakt_op, meldingen: perBericht.get(r.id) ?? [] }]
      : [],
  )
}

export async function haalCommunityBeheer(t: ClubSchrijver): Promise<CommunityBeheer | null> {
  const { data, error } = await t.admin.from('club_community_groepen').select(GROEP_KOLOMMEN).eq('user_id', t.userId).order('naam').limit(500)
  if (error) {
    meld('groepen lezen', error)
    return null
  }
  const groepen = ((data ?? []) as unknown[]).map(groepUitRij).filter((g): g is Groep => g !== null)
  const [leden, beoordelen] = await Promise.all([
    alleRijen('groepsleden (beheer)', (van, tot) => t.admin.from('club_community_groepsleden').select('id, groep_id').eq('user_id', t.userId).eq('status', 'lid').order('id').range(van, tot)),
    haalBeoordelen(t),
  ])
  if (!leden || !beoordelen) return null
  const tel = (leden as R[]).reduce((m, r) => m.set(r.groep_id as string, (m.get(r.groep_id as string) ?? 0) + 1), new Map<string, number>())
  return { groepen: groepen.map((g) => ({ ...g, leden: tel.get(g.id) ?? 0 })), beoordelen }
}

export interface GroepLid {
  lidId: string
  naam: string
  status: 'lid' | 'verwijderd'
  toegevoegdDoor: string
}

export interface GroepBericht {
  id: string
  auteur: string
  tekst: string
  status: BerichtStatus
  op: string
}

export interface GroepDetail {
  groep: Groep
  leden: GroepLid[]
  berichten: GroepBericht[]
}

export async function haalGroepDetail(t: ClubSchrijver, groepId: string): Promise<GroepDetail | null | undefined> {
  const g = await haalGroep(t.admin, t.userId, groepId)
  if (!g) return g
  const [leden, berichten] = await Promise.all([
    alleRijen('groepsleden (detail)', (van, tot) =>
      t.admin.from('club_community_groepsleden').select('id, lid_id, status, toegevoegd_door, club_leden(voornaam, achternaam)').eq('user_id', t.userId).eq('groep_id', groepId).order('id').range(van, tot),
    ),
    t.admin.from('club_community_berichten').select('id, tekst, status, aangemaakt_op, club_leden(voornaam, achternaam)').eq('user_id', t.userId).eq('groep_id', groepId).order('aangemaakt_op', { ascending: false }).limit(50),
  ])
  if (!leden || berichten.error) {
    if (berichten.error) meld('groepsberichten lezen', berichten.error)
    return undefined
  }
  return {
    groep: g,
    leden: (leden as R[])
      .flatMap((r): GroepLid[] => (typeof r.lid_id === 'string' && (r.status === 'lid' || r.status === 'verwijderd') ? [{ lidId: r.lid_id, naam: naamVanRij(r.club_leden), status: r.status, toegevoegdDoor: String(r.toegevoegd_door ?? '') }] : []))
      .sort((a, b) => a.status.localeCompare(b.status) || a.naam.localeCompare(b.naam, 'nl')),
    berichten: ((berichten.data ?? []) as R[]).flatMap((r) =>
      typeof r.id === 'string' && typeof r.tekst === 'string' && isBerichtStatus(r.status) && typeof r.aangemaakt_op === 'string' ? [{ id: r.id, auteur: naamVanRij(r.club_leden), tekst: r.tekst, status: r.status, op: r.aangemaakt_op }] : [],
    ),
  }
}

/** Leden om toe te voegen: zoeken op naam, hoogstens 20. */
export async function zoekLeden(t: ClubSchrijver, zoek: string, vestiging: string | null): Promise<{ id: string; naam: string }[] | null> {
  const schoon = zoek.replace(/[%_,().*\\]/g, ' ').trim().slice(0, 40)
  if (schoon.length < 2) return []
  let q = t.admin.from('club_leden').select('id, voornaam, achternaam').eq('user_id', t.userId).in('status', ['actief', 'proef', 'opgezegd']).or(`voornaam.ilike.%${schoon}%,achternaam.ilike.%${schoon}%`)
  if (vestiging) q = q.eq('vestiging', vestiging)
  const { data, error } = await q.order('voornaam').limit(20)
  if (error) {
    meld('leden zoeken', error)
    return null
  }
  return ((data ?? []) as R[]).flatMap((r) => (typeof r.id === 'string' ? [{ id: r.id, naam: naamVanRij(r) }] : []))
}

// ── Schrijven ───────────────────────────────────────────────────────────────

async function koppelingenKloppen(t: ClubSchrijver, g: GroepInvoer): Promise<string | null> {
  const [c, l] = await Promise.all([
    g.challengeId ? t.admin.from('club_challenges').select('id').eq('user_id', t.userId).eq('id', g.challengeId).maybeSingle() : Promise.resolve({ data: true, error: null }),
    g.lestypeId ? t.admin.from('club_lestypen').select('id').eq('user_id', t.userId).eq('id', g.lestypeId).maybeSingle() : Promise.resolve({ data: true, error: null }),
  ])
  if (c.error || l.error) return FOUT
  if (!c.data) return 'Deze challenge bestaat niet.'
  if (!l.data) return 'Deze les bestaat niet.'
  return null
}

function groepRij(g: GroepInvoer) {
  return { naam: g.naam, uitleg: g.uitleg, toegang: g.toegang, vestiging: g.vestiging, challenge_id: g.challengeId, lestype_id: g.lestypeId, ranglijst: g.ranglijst }
}

export async function maakGroep(t: ClubSchrijver, g: GroepInvoer): Promise<Resultaat<{ id: string }>> {
  const koppeling = await koppelingenKloppen(t, g)
  if (koppeling) return mislukt(koppeling, koppeling === FOUT ? 500 : 400)
  const { data, error } = await t.admin.from('club_community_groepen').insert({ user_id: t.userId, ...groepRij(g), aangemaakt_door: t.naam.slice(0, 80) }).select('id').single()
  if (error || typeof data?.id !== 'string') {
    if (error) meld('groep maken', error)
    return mislukt(FOUT, 500)
  }
  await logActie(t, 'Communitygroep gemaakt', g.naam, g.vestiging)
  return gelukt({ id: data.id })
}

export async function wijzigGroep(t: ClubSchrijver, id: string, g: GroepInvoer): Promise<Resultaat<{ id: string }>> {
  const koppeling = await koppelingenKloppen(t, g)
  if (koppeling) return mislukt(koppeling, koppeling === FOUT ? 500 : 400)
  const { data, error } = await t.admin.from('club_community_groepen').update({ ...groepRij(g), bijgewerkt_op: new Date().toISOString() }).eq('user_id', t.userId).eq('id', id).select('id')
  if (error) {
    meld('groep wijzigen', error)
    return mislukt(FOUT, 500)
  }
  if ((data ?? []).length === 0) return mislukt('Deze groep bestaat niet.', 404)
  await logActie(t, 'Communitygroep gewijzigd', g.naam, g.vestiging)
  return gelukt({ id })
}

export async function archiveerGroep(t: ClubSchrijver, id: string, archiveren: boolean): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin
    .from('club_community_groepen')
    .update({ gearchiveerd_op: archiveren ? new Date().toISOString() : null, bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', t.userId)
    .eq('id', id)
    .select('naam, vestiging')
  if (error) {
    meld('groep archiveren', error)
    return mislukt(FOUT, 500)
  }
  const rij = (data ?? [])[0] as R | undefined
  if (!rij) return mislukt('Deze groep bestaat niet.', 404)
  await logActie(t, archiveren ? 'Communitygroep gearchiveerd' : 'Communitygroep teruggezet', String(rij.naam), (rij.vestiging as string | null) ?? null)
  return gelukt({ id })
}

/** Een lid in de groep zetten (ook terug na eruit halen). */
export async function voegLidToe(t: ClubSchrijver, groepId: string, lidId: string): Promise<Resultaat<{ ok: true }>> {
  const [g, lid] = await Promise.all([haalGroep(t.admin, t.userId, groepId), t.admin.from('club_leden').select('id, voornaam, achternaam, vestiging').eq('user_id', t.userId).eq('id', lidId).maybeSingle()])
  if (g === undefined || lid.error) return mislukt(FOUT, 500)
  if (!g) return mislukt('Deze groep bestaat niet.', 404)
  if (!lid.data) return mislukt('Dit lid bestaat niet.', 404)
  const { error } = await t.admin
    .from('club_community_groepsleden')
    .upsert({ user_id: t.userId, groep_id: groepId, lid_id: lidId, status: 'lid', toegevoegd_door: t.naam.slice(0, 80), gewijzigd_op: new Date().toISOString() }, { onConflict: 'groep_id,lid_id' })
  if (error) {
    meld('lid toevoegen', error)
    return mislukt(FOUT, 500)
  }
  await logActie(t, `Lid toegevoegd aan ${g.naam}`.slice(0, 80), naamVanRij(lid.data), (lid.data.vestiging as string) ?? null)
  return gelukt({ ok: true })
}

/** Een lid uit de groep halen; het lid kan daarna niet zelf terug. */
export async function haalLidUitGroep(t: ClubSchrijver, groepId: string, lidId: string): Promise<Resultaat<{ ok: true }>> {
  const { data, error } = await t.admin
    .from('club_community_groepsleden')
    .update({ status: 'verwijderd', gewijzigd_op: new Date().toISOString() })
    .eq('user_id', t.userId)
    .eq('groep_id', groepId)
    .eq('lid_id', lidId)
    .select('id, club_leden(voornaam, achternaam, vestiging), club_community_groepen(naam)')
  if (error) {
    meld('lid uit groep halen', error)
    return mislukt(FOUT, 500)
  }
  const rij = (data ?? [])[0] as R | undefined
  if (!rij) return mislukt('Dit lid zit niet in de groep.', 404)
  await logActie(t, `Lid uit ${String(een(rij.club_community_groepen)?.naam ?? 'groep')} gehaald`.slice(0, 80), naamVanRij(rij.club_leden), (een(rij.club_leden)?.vestiging as string | undefined) ?? null)
  return gelukt({ ok: true })
}

/**
 * Een bericht beoordelen: verbergen of (alsnog) plaatsen. Alle open meldingen
 * op het bericht worden daarmee afgehandeld.
 */
export async function modereerBericht(t: ClubSchrijver, berichtId: string, actie: ModeratieActie): Promise<Resultaat<{ status: BerichtStatus }>> {
  const nu = new Date().toISOString()
  const status: BerichtStatus = actie === 'verbergen' ? 'verborgen' : 'zichtbaar'
  const { data, error } = await t.admin
    .from('club_community_berichten')
    .update({ status, reden: actie === 'verbergen' ? 'Verborgen door de sportschool' : null, beoordeeld_door: t.naam.slice(0, 80), beoordeeld_op: nu })
    .eq('user_id', t.userId)
    .eq('id', berichtId)
    .select('id, club_community_groepen(naam)')
  if (error) {
    meld('bericht beoordelen', error)
    return mislukt(FOUT, 500)
  }
  const rij = (data ?? [])[0] as R | undefined
  if (!rij) return mislukt('Dit bericht bestaat niet.', 404)
  const { error: meldFout } = await t.admin
    .from('club_community_meldingen')
    .update({ status: 'afgehandeld', uitkomst: actie === 'verbergen' ? 'verborgen' : 'toegestaan', afgehandeld_door: t.naam.slice(0, 80), afgehandeld_op: nu })
    .eq('user_id', t.userId)
    .eq('bericht_id', berichtId)
    .eq('status', 'open')
  if (meldFout) meld('meldingen afhandelen', meldFout)
  await logActie(t, actie === 'verbergen' ? 'Communitybericht verborgen' : 'Communitybericht geplaatst', String(een(rij.club_community_groepen)?.naam ?? 'Groep'), null)
  return gelukt({ status })
}
