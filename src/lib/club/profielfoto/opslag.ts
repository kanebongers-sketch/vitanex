// ─── Club: profielfoto's opslaan, tonen en weghalen (SERVER-ONLY) ───────────
// Elke query filtert op de sportschool (user_id). De versie op club_leden en
// club_medewerkers houdt een trigger bij (migratie 473); oude bestanden komen
// via een trigger in de wachtrij club_profielfoto_opruimen en worden hier via
// de Storage API weggehaald (Supabase verbiedt dat vanuit SQL).

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  FOTO_MATEN,
  GETEKEND_SECONDEN,
  PROFIELFOTO_BUCKET,
  TOESTEMMING_VERSIE,
  fotoBestand,
  fotoPad,
  isFotoPad,
  nieuweVersie,
  padHoortBij,
  type FotoMaat,
  type FotoSoort,
} from './model'

export interface FotoEigenaar {
  userId: string
  soort: FotoSoort
  id: string
}

export interface FotoBron {
  bron: 'zelf' | 'sportschool'
  /** Alleen bij bron sportschool: de naam van de medewerker die hem zette. */
  door?: string
  demo?: boolean
}

export type FotoBestanden = Readonly<Record<FotoMaat, Uint8Array>>

function kolom(soort: FotoSoort): 'lid_id' | 'medewerker_id' {
  return soort === 'lid' ? 'lid_id' : 'medewerker_id'
}

function log(wat: string, bericht: string): void {
  console.error(`[club/profielfoto] ${wat} mislukt`, bericht)
}

/** Het huidige pad van de foto, of null (geen foto of een leesfout). */
export async function haalFotoPad(admin: SupabaseClient, e: FotoEigenaar): Promise<string | null> {
  const { data, error } = await admin.from('club_profielfotos').select('pad').eq('user_id', e.userId).eq(kolom(e.soort), e.id).maybeSingle()
  if (error) {
    log('pad lezen', error.message)
    return null
  }
  const pad = (data as { pad?: unknown } | null)?.pad
  return isFotoPad(pad) && padHoortBij(pad, e.userId, e.soort, e.id) ? pad : null
}

/** Een kort geldige getekende URL voor een maat, of null. */
export async function getekendeFotoUrl(admin: SupabaseClient, pad: string, maat: FotoMaat): Promise<string | null> {
  const { data, error } = await admin.storage.from(PROFIELFOTO_BUCKET).createSignedUrl(fotoBestand(pad, maat), GETEKEND_SECONDEN)
  if (error || !data?.signedUrl) {
    if (error) log('getekende URL', error.message)
    return null
  }
  return data.signedUrl
}

async function wisBestanden(admin: SupabaseClient, paden: readonly string[]): Promise<boolean> {
  const bestanden = paden.filter(isFotoPad).flatMap((p) => FOTO_MATEN.map((m) => fotoBestand(p, m)))
  if (bestanden.length === 0) return true
  const { error } = await admin.storage.from(PROFIELFOTO_BUCKET).remove(bestanden)
  if (error) log('bestanden wissen', error.message)
  return !error
}

/**
 * Zet een nieuwe foto (of vervangt de oude). Eerst de bestanden, dan de rij; lukt
 * de rij niet, dan gaan de nieuwe bestanden weer weg. De oude bestanden gaan via
 * de wachtrij (trigger) en worden meteen opgeruimd.
 */
export async function bewaarProfielfoto(admin: SupabaseClient, e: FotoEigenaar, bestanden: FotoBestanden, bron: FotoBron): Promise<string | null> {
  const versie = nieuweVersie(Date.now(), Math.random())
  const pad = fotoPad(e.userId, e.soort, e.id, versie)
  if (!pad) return null
  for (const maat of FOTO_MATEN) {
    const { error } = await admin.storage
      .from(PROFIELFOTO_BUCKET)
      .upload(fotoBestand(pad, maat), bestanden[maat], { contentType: 'image/webp', upsert: false, cacheControl: '31536000' })
    if (error) {
      log('uploaden', error.message)
      await wisBestanden(admin, [pad])
      return null
    }
  }
  const balie = bron.bron === 'sportschool'
  const rij = {
    user_id: e.userId,
    lid_id: e.soort === 'lid' ? e.id : null,
    medewerker_id: e.soort === 'mw' ? e.id : null,
    pad,
    bron: bron.bron,
    toestemming_op: balie ? new Date().toISOString() : null,
    toestemming_tekst_versie: balie ? TOESTEMMING_VERSIE : null,
    toegevoegd_door: balie ? (bron.door ?? 'Sportschool').slice(0, 80) : null,
    demo: bron.demo === true,
    aangemaakt_op: new Date().toISOString(),
  }
  const bestaand = await admin.from('club_profielfotos').select('id').eq('user_id', e.userId).eq(kolom(e.soort), e.id).maybeSingle()
  if (bestaand.error) {
    log('bestaande foto lezen', bestaand.error.message)
    await wisBestanden(admin, [pad])
    return null
  }
  const id = (bestaand.data as { id?: string } | null)?.id
  const { error } = id
    ? await admin.from('club_profielfotos').update(rij).eq('user_id', e.userId).eq('id', id)
    : await admin.from('club_profielfotos').insert(rij)
  if (error) {
    log('foto koppelen', error.message)
    await wisBestanden(admin, [pad])
    return null
  }
  await ruimProfielfotosOp(admin)
  return versie
}

/** Foto weghalen. True ook als er geen foto was (weghalen kan altijd). */
export async function verwijderProfielfoto(admin: SupabaseClient, e: FotoEigenaar): Promise<boolean> {
  const { error } = await admin.from('club_profielfotos').delete().eq('user_id', e.userId).eq(kolom(e.soort), e.id)
  if (error) {
    log('weghalen', error.message)
    return false
  }
  await ruimProfielfotosOp(admin)
  return true
}

export interface FotoInfo {
  bron: 'zelf' | 'sportschool'
  toegevoegdDoor: string | null
  toestemmingOp: string | null
}

/** Wie zette de foto (voor de uitleg in de ledenapp en op de ledenkaart). */
export async function haalFotoInfo(admin: SupabaseClient, e: FotoEigenaar): Promise<FotoInfo | null> {
  const { data, error } = await admin.from('club_profielfotos').select('bron, toegevoegd_door, toestemming_op').eq('user_id', e.userId).eq(kolom(e.soort), e.id).maybeSingle()
  if (error) {
    log('info lezen', error.message)
    return null
  }
  if (!data) return null
  const r = data as Record<string, unknown>
  return {
    bron: r.bron === 'sportschool' ? 'sportschool' : 'zelf',
    toegevoegdDoor: typeof r.toegevoegd_door === 'string' ? r.toegevoegd_door : null,
    toestemmingOp: typeof r.toestemming_op === 'string' ? r.toestemming_op : null,
  }
}

/**
 * Wist bestanden uit de wachtrij (vervangen, weggehaald, lid verwijderd,
 * medewerker uit dienst of gewist, bewaartermijn). Loopt over alle sportscholen:
 * de rij draagt alleen een pad. Bij elke upload en elke 5 minuten (cron club-meldingen).
 */
export async function ruimProfielfotosOp(admin: SupabaseClient, max = 50): Promise<number> {
  const { data, error } = await admin.from('club_profielfoto_opruimen').select('id, pad').order('id').limit(max)
  if (error) {
    log('wachtrij lezen', error.message)
    return 0
  }
  const rijen = (data ?? []) as { id: number; pad: string }[]
  if (rijen.length === 0) return 0
  if (!(await wisBestanden(admin, rijen.map((r) => r.pad)))) return 0
  const { error: weg } = await admin.from('club_profielfoto_opruimen').delete().in('id', rijen.map((r) => r.id))
  if (weg) log('wachtrij bijwerken', weg.message)
  return rijen.length
}

export interface Kaartje {
  id: string
  naam: string
  /** Versie van de profielfoto, of null. */
  foto: string | null
}

/** Naam en foto van een medewerker (bijvoorbeeld de coach van een lid), alleen als hij nog actief is of een beheerder. */
export async function haalMedewerkerKaartje(admin: SupabaseClient, userId: string, id: string | null): Promise<Kaartje | null> {
  if (!id) return null
  const { data, error } = await admin.from('club_medewerkers').select('id, naam, profielfoto, geanonimiseerd_op').eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) {
    log('medewerker lezen', error.message)
    return null
  }
  const r = data as { id?: unknown; naam?: unknown; profielfoto?: unknown; geanonimiseerd_op?: unknown } | null
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string' || r.geanonimiseerd_op) return null
  return { id: r.id, naam: r.naam, foto: typeof r.profielfoto === 'string' ? r.profielfoto : null }
}
