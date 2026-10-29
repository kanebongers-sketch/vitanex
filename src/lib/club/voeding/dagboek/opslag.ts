// ─── Club, voedingsdagboek: lezen en schrijven (SERVER-ONLY) ────────────────
// Elke query filtert op de sportschool (user_id) EN het lid (lid_id). Een
// leesfout wordt gelogd (zonder inhoud) en geeft null, zodat het scherm een
// nette melding toont in plaats van te doen alsof er niets is.

import type { SupabaseClient } from '@supabase/supabase-js'
import { plusDag } from './berekeningen'
import type { InstellingInvoer, LogInvoer, ProductInvoer, FavorietInvoer } from './invoer'
import {
  FAVORIET_KOLOMMEN,
  INSTELLING_KOLOMMEN,
  LOG_KOLOMMEN,
  PRODUCT_KOLOMMEN,
  eigenProductUitRij,
  favorietUitRij,
  instellingenUitRij,
  per100NaarJson,
  regelUitRij,
  type DagboekInstellingen,
  type DagboekRegel,
  type EigenProduct,
  type Favoriet,
  type Macros,
} from './model'

/** Versie van de uitleg die het lid ziet bij het starten (woorden/club/voeding-dagboek.ts, start). */
export const TEKST_VERSIE = 'dagboek-2026-10-29'

/** Versie van de uitleg bij de toestemming voor de AI-schatting (woorden/club/voeding-dagboek.ts, ai.toestemming). */
export const AI_TEKST_VERSIE = 'ai-foto-2026-10-29'

function meld(wat: string, fout: { message: string }): void {
  console.error(`[club/voeding/dagboek] ${wat} mislukt`, fout.message)
}

export async function haalInstellingen(admin: SupabaseClient, userId: string, lidId: string): Promise<DagboekInstellingen | null> {
  const { data, error } = await admin.from('club_voeding_instellingen').select(INSTELLING_KOLOMMEN).eq('user_id', userId).eq('lid_id', lidId).maybeSingle()
  if (error) {
    meld('instellingen lezen', error)
    return null
  }
  return instellingenUitRij(data)
}

/** Start, trainer meekijken of eigen doelen. Geeft de nieuwe instellingen, of null bij een fout. */
export async function bewaarInstelling(admin: SupabaseClient, userId: string, lidId: string, invoer: InstellingInvoer, nu: Date): Promise<DagboekInstellingen | null> {
  const huidig = await haalInstellingen(admin, userId, lidId)
  if (!huidig) return null
  const iso = nu.toISOString()
  const basis = { bijgewerkt_op: iso }
  let rij: Record<string, unknown>
  if (invoer.soort === 'doelen') {
    const d = invoer.doelen
    rij = { ...basis, kcal: d?.kcal ?? null, eiwit_g: d?.eiwitG ?? null, koolhydraten_g: d?.koolhydratenG ?? null, vet_g: d?.vetG ?? null }
  } else if (invoer.soort === 'ai') {
    // Toestemming met tijdstip en tekstversie; intrekken wist beide.
    rij = invoer.aan ? { ...basis, ai_toestemming_op: iso, ai_tekst_versie: AI_TEKST_VERSIE } : { ...basis, ai_toestemming_op: null, ai_tekst_versie: null }
  } else {
    const trainer = huidig.trainerZien === invoer.trainerZien ? {} : { trainer_zien: invoer.trainerZien, trainer_zien_op: iso }
    rij = invoer.soort === 'start' ? { ...basis, gestart_op: huidig.gestartOp ?? iso, tekst_versie: TEKST_VERSIE, ...trainer } : { ...basis, ...trainer }
  }
  const { error } = await admin.from('club_voeding_instellingen').upsert({ user_id: userId, lid_id: lidId, ...rij }, { onConflict: 'lid_id' })
  if (error) {
    meld('instellingen opslaan', error)
    return null
  }
  return haalInstellingen(admin, userId, lidId)
}

/** Alle regels van `van` tot en met `tot`, oudste eerst. */
export async function haalRegels(admin: SupabaseClient, userId: string, lidId: string, van: string, tot: string): Promise<DagboekRegel[] | null> {
  const { data, error } = await admin
    .from('club_voeding_logs')
    .select(LOG_KOLOMMEN)
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .gte('datum', van)
    .lte('datum', tot)
    .order('datum')
    .order('aangemaakt_op')
    .limit(2000)
  if (error) {
    meld('dagboek lezen', error)
    return null
  }
  return (data ?? []).map(regelUitRij).filter((r): r is DagboekRegel => r !== null)
}

/** De laatste producten (60 dagen) om snel opnieuw te loggen. */
export async function haalRecenteRegels(admin: SupabaseClient, userId: string, lidId: string, vandaag: string): Promise<DagboekRegel[] | null> {
  const { data, error } = await admin
    .from('club_voeding_logs')
    .select(LOG_KOLOMMEN)
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .gte('datum', plusDag(vandaag, -60))
    .not('product_sleutel', 'is', null)
    .order('aangemaakt_op', { ascending: false })
    .limit(200)
  if (error) {
    meld('recent lezen', error)
    return null
  }
  return (data ?? []).map(regelUitRij).filter((r): r is DagboekRegel => r !== null)
}

export async function voegRegelToe(admin: SupabaseClient, userId: string, lidId: string, r: LogInvoer): Promise<DagboekRegel | null> {
  const { data, error } = await admin
    .from('club_voeding_logs')
    .insert({
      user_id: userId,
      lid_id: lidId,
      datum: r.datum,
      maaltijd: r.maaltijd,
      naam: r.naam,
      merk: r.merk,
      gram: r.gram,
      maat: r.maat,
      aantal: r.aantal,
      kcal: r.kcal,
      eiwit_g: r.eiwitG,
      koolhydraten_g: r.koolhydratenG,
      vet_g: r.vetG,
      vezels_g: r.vezelsG,
      bron: r.bron,
      product_sleutel: r.productSleutel,
      per_100g: r.per100 ? per100NaarJson(r.per100) : null,
    })
    .select(LOG_KOLOMMEN)
    .single()
  if (error) {
    meld('regel opslaan', error)
    return null
  }
  return regelUitRij(data)
}

/** true = weg (of er was niets), false = fout. */
export async function verwijderRegel(admin: SupabaseClient, userId: string, lidId: string, id: string): Promise<boolean> {
  const { error } = await admin.from('club_voeding_logs').delete().eq('user_id', userId).eq('lid_id', lidId).eq('id', id)
  if (error) meld('regel verwijderen', error)
  return !error
}

export async function haalEigenProducten(admin: SupabaseClient, userId: string, lidId: string): Promise<EigenProduct[] | null> {
  const { data, error } = await admin.from('club_voeding_producten').select(PRODUCT_KOLOMMEN).eq('user_id', userId).eq('lid_id', lidId).order('naam').limit(300)
  if (error) {
    meld('eigen producten lezen', error)
    return null
  }
  return (data ?? []).map(eigenProductUitRij).filter((p): p is EigenProduct => p !== null)
}

/** Een eigen product van het lid met deze barcode (gaat voor Open Food Facts). */
export async function eigenProductMetBarcode(admin: SupabaseClient, userId: string, lidId: string, barcode: string): Promise<EigenProduct | null | undefined> {
  const { data, error } = await admin.from('club_voeding_producten').select(PRODUCT_KOLOMMEN).eq('user_id', userId).eq('lid_id', lidId).eq('barcode', barcode).limit(1).maybeSingle()
  if (error) {
    meld('eigen product op barcode lezen', error)
    return null
  }
  return eigenProductUitRij(data) ?? undefined
}

export async function bewaarEigenProduct(admin: SupabaseClient, userId: string, lidId: string, p: ProductInvoer): Promise<EigenProduct | null> {
  const { data, error } = await admin
    .from('club_voeding_producten')
    .insert({
      user_id: userId,
      lid_id: lidId,
      naam: p.naam,
      merk: p.merk,
      barcode: p.barcode,
      kcal_100g: p.per100.kcal,
      eiwit_100g: p.per100.eiwitG,
      koolhydraten_100g: p.per100.koolhydratenG,
      vet_100g: p.per100.vetG,
      vezels_100g: p.per100.vezelsG,
      portie_gram: p.portieGram,
    })
    .select(PRODUCT_KOLOMMEN)
    .single()
  if (error) {
    meld('eigen product opslaan', error)
    return null
  }
  return eigenProductUitRij(data)
}

export async function verwijderEigenProduct(admin: SupabaseClient, userId: string, lidId: string, id: string): Promise<boolean> {
  const { error } = await admin.from('club_voeding_producten').delete().eq('user_id', userId).eq('lid_id', lidId).eq('id', id)
  if (error) {
    meld('eigen product verwijderen', error)
    return false
  }
  // De favoriet van dit product gaat mee; lukt dat niet, dan blijft hij staan (geen dataverlies, wel melden).
  const fav = await admin.from('club_voeding_favorieten').delete().eq('user_id', userId).eq('lid_id', lidId).eq('product_sleutel', `eigen:${id}`)
  if (fav.error) meld('favoriet van eigen product verwijderen', fav.error)
  return true
}

export async function haalFavorieten(admin: SupabaseClient, userId: string, lidId: string): Promise<Favoriet[] | null> {
  const { data, error } = await admin.from('club_voeding_favorieten').select(FAVORIET_KOLOMMEN).eq('user_id', userId).eq('lid_id', lidId).order('aangemaakt_op', { ascending: false }).limit(100)
  if (error) {
    meld('favorieten lezen', error)
    return null
  }
  return (data ?? []).map(favorietUitRij).filter((f): f is Favoriet => f !== null)
}

export async function zetFavoriet(admin: SupabaseClient, userId: string, lidId: string, f: FavorietInvoer): Promise<boolean> {
  const { error } = await admin
    .from('club_voeding_favorieten')
    .upsert(
      { user_id: userId, lid_id: lidId, product_sleutel: f.productSleutel, naam: f.naam, merk: f.merk, per_100g: per100NaarJson(f.per100), portie_gram: f.portieGram },
      { onConflict: 'lid_id,product_sleutel' },
    )
  if (error) meld('favoriet opslaan', error)
  return !error
}

export async function haalFavorietWeg(admin: SupabaseClient, userId: string, lidId: string, sleutel: string): Promise<boolean> {
  const { error } = await admin.from('club_voeding_favorieten').delete().eq('user_id', userId).eq('lid_id', lidId).eq('product_sleutel', sleutel)
  if (error) meld('favoriet verwijderen', error)
  return !error
}

/** Het lid wist het hele dagboek: regels, eigen producten, favorieten en keuzes. */
export async function wisDagboek(admin: SupabaseClient, userId: string, lidId: string): Promise<boolean> {
  for (const tabel of ['club_voeding_logs', 'club_voeding_favorieten', 'club_voeding_producten', 'club_voeding_instellingen'] as const) {
    const { error } = await admin.from(tabel).delete().eq('user_id', userId).eq('lid_id', lidId)
    if (error) {
      meld(`${tabel} wissen`, error)
      return false
    }
  }
  return true
}

/**
 * Voor de trainer op de ledenkaart: het dagboek van de laatste 7 dagen, ALLEEN
 * als het lid dat deelt. 'niet-gedeeld' en 'niet-gestart' zijn geen fout.
 */
export type DagboekVoorTrainer = { staat: 'gedeeld'; regels: DagboekRegel[]; sinds: string | null; eigenDoelen: Macros | null } | { staat: 'niet-gedeeld' } | { staat: 'niet-gestart' } | { staat: 'fout' }

export async function haalDagboekVoorTrainer(admin: SupabaseClient, userId: string, lidId: string, vandaag: string): Promise<DagboekVoorTrainer> {
  const inst = await haalInstellingen(admin, userId, lidId)
  if (!inst) return { staat: 'fout' }
  if (!inst.gestartOp) return { staat: 'niet-gestart' }
  if (!inst.trainerZien) return { staat: 'niet-gedeeld' }
  const regels = await haalRegels(admin, userId, lidId, plusDag(vandaag, -6), vandaag)
  return regels ? { staat: 'gedeeld', regels, sinds: inst.trainerZienOp, eigenDoelen: inst.eigenDoelen } : { staat: 'fout' }
}
