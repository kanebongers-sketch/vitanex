// ─── Club: meldingen opslaan en lezen (SERVER-ONLY) ─────────────────────────
// Tabel club_support (migratie 427), alleen via de service role. Elke query
// filtert op de sportschool; Kane leest alle sportscholen die van hem zijn.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubToegang, type ClubToegang } from '@/lib/club/toegang'
import { isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { MELDING_KOLOMMEN, meldingUitRij, sorteerMeldingen, type Afhandeling, type Melding, type MeldingInvoer } from './melding'

/** Hoeveel meldingen een sportschool per uur mag doen (harde rem in de database). */
const MAX_PER_UUR = 20
/** Hoeveel meldingen een lijst hooguit toont. */
const MAX_LIJST = 200

/**
 * De poort voor /api/club/hulp: iedereen die in Club binnen is mag hulp vragen
 * (net als de pagina /club/hulp), ook een clubmanager zonder rechten op
 * andere onderdelen. Muterende verzoeken alleen vanaf de app zelf.
 */
export async function vereisHulpToegang(req: NextRequest): Promise<ClubToegang | NextResponse> {
  const t = await clubToegang()
  if (!t) return clubFout('Niet gevonden.', 404)
  const leest = req.method === 'GET' || req.method === 'HEAD'
  if (!leest && !isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  return t
}

/** Te veel meldingen van deze sportschool in het laatste uur? Null bij een databasefout. */
export async function teVeelMeldingen(t: ClubToegang, nu: Date): Promise<boolean | null> {
  const sinds = new Date(nu.getTime() - 60 * 60_000).toISOString()
  const { count, error } = await t.admin.from('club_support').select('id', { count: 'exact', head: true }).eq('user_id', t.userId).gte('aangemaakt_op', sinds)
  if (error) {
    console.error('[club] meldingen tellen mislukt', error.message)
    return null
  }
  return (count ?? 0) >= MAX_PER_UUR
}

export async function bewaarMelding(t: ClubToegang, m: MeldingInvoer): Promise<Melding | null> {
  const { data, error } = await t.admin
    .from('club_support')
    .insert({
      user_id: t.userId,
      soort: m.soort,
      onderwerp: m.onderwerp,
      beschrijving: m.beschrijving,
      pagina: m.pagina,
      melder_id: t.persoonId,
      melder_naam: (t.naam || 'Onbekend').slice(0, 80),
      melder_rol: t.rol,
    })
    .select(MELDING_KOLOMMEN)
    .single()
  if (error) console.error('[club] melding opslaan mislukt', error.message)
  return meldingUitRij(data)
}

/**
 * De eigen meldingen van wie er binnen is, in deze sportschool: een eigenaar
 * of clubmanager ziet die van zichzelf, Kane die hij zelf deed. Null bij een fout.
 */
export async function eigenMeldingen(t: ClubToegang): Promise<Melding[] | null> {
  let q = t.admin.from('club_support').select(MELDING_KOLOMMEN).eq('user_id', t.userId)
  q = t.persoonId ? q.eq('melder_id', t.persoonId) : q.is('melder_id', null)
  const { data, error } = await q.order('aangemaakt_op', { ascending: false }).limit(50)
  if (error) {
    console.error('[club] meldingen lezen mislukt', error.message)
    return null
  }
  return (data ?? []).map(meldingUitRij).filter((m): m is Melding => m !== null)
}

/** Voor Kane: de meldingen van al zijn sportscholen. Null bij een fout. */
export async function alleMeldingen(t: ClubToegang): Promise<Melding[] | null> {
  if (!t.isPlatformEigenaar) return null
  const ids = t.organisaties.map((o) => o.id)
  const { data, error } = await t.admin.from('club_support').select(MELDING_KOLOMMEN).in('user_id', ids).order('aangemaakt_op', { ascending: false }).limit(MAX_LIJST)
  if (error) {
    console.error('[club] meldingen lezen mislukt', error.message)
    return null
  }
  return sorteerMeldingen((data ?? []).map(meldingUitRij).filter((m): m is Melding => m !== null))
}

/** Kane handelt een melding af; alleen in een van zijn eigen sportscholen. */
export async function handelAf(t: ClubToegang, id: string, a: Afhandeling, nu: Date): Promise<Melding | null | 'niet-gevonden'> {
  if (!t.isPlatformEigenaar) return 'niet-gevonden'
  const ids = t.organisaties.map((o) => o.id)
  const wijziging: Record<string, string | null> = { status: a.status, bijgewerkt_op: nu.toISOString() }
  if (a.antwoord !== undefined) {
    wijziging.antwoord = a.antwoord
    wijziging.beantwoord_op = a.antwoord ? nu.toISOString() : null
  }
  const { data, error } = await t.admin.from('club_support').update(wijziging).eq('id', id).in('user_id', ids).select(MELDING_KOLOMMEN)
  if (error) {
    console.error('[club] melding bijwerken mislukt', error.message)
    return null
  }
  const rij = Array.isArray(data) ? data[0] : null
  return rij ? meldingUitRij(rij) : 'niet-gevonden'
}
