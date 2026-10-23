// ─── Club, betalen: kortingen en gezinnen lezen en schrijven (SERVER-ONLY) ──
// Elke query filtert op user_id van de sportschool (t.userId). Een code is uniek
// per sportschool zonder op hoofdletters te letten (unieke index in migratie
// 460); we controleren dat ook vooraf voor een nette melding. Een korting of
// gezin waar een contract naar verwijst, wordt niet verwijderd maar uitgezet.

import type { SupabaseClient } from '@supabase/supabase-js'
import { logActie, type ClubSchrijver } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { GEZIN_KOLOMMEN, KORTING_KOLOMMEN, gezinUitRij, kortingUitRij, rijenNaar, type Gezin, type Korting } from './model'
import { gezinRij, kortingRij, zelfdeCode, type GezinInvoer, type KortingInvoer } from './korting-invoer'

const OPSLAAN_MIS = 'Opslaan is niet gelukt. Probeer het opnieuw.'
const KORTING_WEG = 'Deze korting bestaat niet.'
const GEZIN_WEG = 'Dit gezin bestaat niet.'
const CODE_DUBBEL = 'Deze code bestaat al bij je sportschool. Kies een andere.'

function log(wat: string, code: string | undefined, bericht: string): void {
  console.error(`[club/betalen/kortingen] ${wat} mislukt`, code ?? '', bericht)
}

export async function haalKortingen(admin: SupabaseClient, userId: string): Promise<Korting[] | null> {
  const { data, error } = await admin.from('club_betalen_kortingen').select(KORTING_KOLOMMEN).eq('user_id', userId).order('aangemaakt_op').limit(1000)
  if (error) {
    log('kortingen lezen', error.code, error.message)
    return null
  }
  return rijenNaar(data, kortingUitRij)
}

export async function haalGezinnen(admin: SupabaseClient, userId: string): Promise<Gezin[] | null> {
  const { data, error } = await admin.from('club_betalen_gezinnen').select(GEZIN_KOLOMMEN).eq('user_id', userId).order('aangemaakt_op').limit(2000)
  if (error) {
    log('gezinnen lezen', error.code, error.message)
    return null
  }
  return rijenNaar(data, gezinUitRij)
}

/** De ids van de plannen van deze sportschool (voor de controle van "geldt voor"). */
export async function planIds(admin: SupabaseClient, userId: string): Promise<string[] | null> {
  const { data, error } = await admin.from('club_betalen_plannen').select('id').eq('user_id', userId).limit(1000)
  if (error) {
    log('plannen lezen', error.code, error.message)
    return null
  }
  return (data ?? []).map((r) => String(r.id))
}

/** Bestaat deze code al bij een andere korting van de sportschool? */
async function codeBezet(admin: SupabaseClient, userId: string, code: string, behalve: string | null): Promise<boolean | null> {
  const { data, error } = await admin.from('club_betalen_kortingen').select('id, code').eq('user_id', userId).not('code', 'is', null).limit(1000)
  if (error) {
    log('codes lezen', error.code, error.message)
    return null
  }
  return (data ?? []).some((r) => r.id !== behalve && typeof r.code === 'string' && zelfdeCode(r.code, code))
}

async function eisVrijeCode(t: ClubSchrijver, k: KortingInvoer, behalve: string | null): Promise<Resultaat<true>> {
  if (k.code === null) return gelukt(true)
  const bezet = await codeBezet(t.admin, t.userId, k.code, behalve)
  if (bezet === null) return mislukt(OPSLAAN_MIS, 500)
  return bezet ? mislukt(CODE_DUBBEL, 409) : gelukt(true)
}

export async function maakKorting(t: ClubSchrijver, k: KortingInvoer): Promise<Resultaat<{ id: string }>> {
  const vrij = await eisVrijeCode(t, k, null)
  if (!vrij.ok) return vrij
  const { data, error } = await t.admin.from('club_betalen_kortingen').insert({ user_id: t.userId, ...kortingRij(k) }).select('id').single()
  if (error) {
    if (error.code === '23505') return mislukt(CODE_DUBBEL, 409)
    log('korting toevoegen', error.code, error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  await logActie(t, 'Korting toegevoegd', k.naam, null)
  return gelukt({ id: String(data.id) })
}

export async function wijzigKorting(t: ClubSchrijver, id: string, k: KortingInvoer): Promise<Resultaat<{ id: string }>> {
  const vrij = await eisVrijeCode(t, k, id)
  if (!vrij.ok) return vrij
  const { data, error } = await t.admin.from('club_betalen_kortingen').update(kortingRij(k)).eq('user_id', t.userId).eq('id', id).select('id')
  if (error) {
    if (error.code === '23505') return mislukt(CODE_DUBBEL, 409)
    log('korting wijzigen', error.code, error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  if (!data || data.length === 0) return mislukt(KORTING_WEG, 404)
  await logActie(t, 'Korting aangepast', k.naam, null)
  return gelukt({ id })
}

export type Weg = 'weg' | 'uit'

/** Weg als niets ernaar verwijst (23503 = een contract of gezin gebruikt hem): anders uitgezet. */
export async function verwijderKorting(t: ClubSchrijver, id: string): Promise<Resultaat<{ uitkomst: Weg }>> {
  const { data, error } = await t.admin.from('club_betalen_kortingen').delete().eq('user_id', t.userId).eq('id', id).select('naam')
  if (!error) {
    if (!data || data.length === 0) return mislukt(KORTING_WEG, 404)
    await logActie(t, 'Korting verwijderd', String(data[0].naam), null)
    return gelukt({ uitkomst: 'weg' })
  }
  if (error.code !== '23503') {
    log('korting verwijderen', error.code, error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  const { data: uit, error: fout } = await t.admin.from('club_betalen_kortingen').update({ actief: false }).eq('user_id', t.userId).eq('id', id).select('naam')
  if (fout) {
    log('korting uitzetten', fout.code, fout.message)
    return mislukt('Uitzetten is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!uit || uit.length === 0) return mislukt(KORTING_WEG, 404)
  await logActie(t, 'Korting uitgezet (in gebruik)', String(uit[0].naam), null)
  return gelukt({ uitkomst: 'uit' })
}

// ─── Gezinnen ───────────────────────────────────────────────────────────────

export async function kortingIds(admin: SupabaseClient, userId: string): Promise<string[] | null> {
  const { data, error } = await admin.from('club_betalen_kortingen').select('id').eq('user_id', userId).limit(1000)
  if (error) {
    log('kortingen lezen', error.code, error.message)
    return null
  }
  return (data ?? []).map((r) => String(r.id))
}

export async function maakGezin(t: ClubSchrijver, g: GezinInvoer): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin.from('club_betalen_gezinnen').insert({ user_id: t.userId, ...gezinRij(g) }).select('id').single()
  if (error) {
    log('gezin toevoegen', error.code, error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  await logActie(t, 'Gezin toegevoegd', null, null)
  return gelukt({ id: String(data.id) })
}

export async function wijzigGezin(t: ClubSchrijver, id: string, g: GezinInvoer): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin.from('club_betalen_gezinnen').update(gezinRij(g)).eq('user_id', t.userId).eq('id', id).select('id')
  if (error) {
    log('gezin wijzigen', error.code, error.message)
    return mislukt(OPSLAAN_MIS, 500)
  }
  if (!data || data.length === 0) return mislukt(GEZIN_WEG, 404)
  await logActie(t, 'Gezin aangepast', null, null)
  return gelukt({ id })
}

/** Een gezin met contracten (23503) blijft bestaan. */
export async function verwijderGezin(t: ClubSchrijver, id: string): Promise<Resultaat<{ uitkomst: 'weg' }>> {
  const { data, error } = await t.admin.from('club_betalen_gezinnen').delete().eq('user_id', t.userId).eq('id', id).select('id')
  if (error) {
    if (error.code === '23503') return mislukt('Dit gezin heeft contracten en blijft daarom bestaan.', 409)
    log('gezin verwijderen', error.code, error.message)
    return mislukt('Verwijderen is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data || data.length === 0) return mislukt(GEZIN_WEG, 404)
  await logActie(t, 'Gezin verwijderd', null, null)
  return gelukt({ uitkomst: 'weg' })
}
