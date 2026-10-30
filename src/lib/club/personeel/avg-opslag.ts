// ─── Club, AVG voor medewerkers: lezen en wissen in de database (SERVER-ONLY) ─
// Alles filtert op de sportschool (user_id) en de medewerker. Het wissen zelf
// zit in de database-functie club_medewerker_anonimiseren (migratie 449).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Rij } from '@/lib/club/kern/avg-velden'
import { letterlijkPatroon, type MedewerkerExportRuw, type MedewerkerSectieSleutel } from './avg'

type Uitslag = { ok: true; ruw: MedewerkerExportRuw } | { ok: false; fout: 'niet gevonden' | 'lezen mislukt' }

/** De medewerker zelf, zoals de wis-route hem nodig heeft. */
export interface MedewerkerAvgStaat {
  naam: string
  actief: boolean
  gewist: boolean
}

const MAX_RIJEN = 10_000
const MAX_LOGBOEK = 2000

/** Tabel en kolommen per onderdeel; alle op medewerker_id, behalve logboek en hulpvragen. */
const BRONNEN: Record<Exclude<MedewerkerSectieSleutel, 'logboek' | 'hulpvragen'>, { tabel: string; select: string; volgorde: string }> = {
  diensten: {
    tabel: 'club_diensten',
    select:
      'datum, begin, eind, vestiging, status, uursoort, uur_status, gewerkt_begin, gewerkt_eind, pauze_min, uren_opmerking, notitie, bevestigd_door, bevestigd_op, goedgekeurd_door, goedgekeurd_op, verwerkt_op, club_dienst_soorten(naam)',
    volgorde: 'datum',
  },
  beschikbaarheid: { tabel: 'club_beschikbaarheid', select: 'weekdag, datum, datum_tot, beschikbaar, van, tot, reden, notitie, aangemaakt_op', volgorde: 'aangemaakt_op' },
  roosterNotities: { tabel: 'club_rooster_notities', select: 'datum, van, tot, vestiging, soort, tekst, aangemaakt_op', volgorde: 'datum' },
  afgevinkt: { tabel: 'club_taak_afvinken', select: 'datum, vestiging, afgevinkt_op, wie, notitie, club_taken(naam)', volgorde: 'afgevinkt_op' },
  taakNotities: { tabel: 'club_taak_notities', select: 'datum, vestiging, tekst, wie, aangemaakt_op', volgorde: 'aangemaakt_op' },
  afsluitrondes: { tabel: 'club_taak_afsluitrondes', select: 'datum, vestiging, wie, open_taken, op', volgorde: 'op' },
  // Nooit de code, pin_hash of blokkades: alleen wat de medewerker mag weten.
  inloggen: { tabel: 'club_medewerker_toegang', select: 'actief, email, pin_status, laatst_ingelogd_op, aangemaakt_op', volgorde: 'aangemaakt_op' },
  // Nooit token_hash: alleen de tijden.
  sessies: { tabel: 'club_medewerker_sessies', select: 'aangemaakt_op, laatst_gebruikt_op, verloopt_op', volgorde: 'aangemaakt_op' },
  // Rollen v2 (migratie 469): welke rollen, wie ze gaf en wanneer.
  profielRollen: { tabel: 'club_profiel_rollen', select: 'rol, toegekend_door, toegekend_op', volgorde: 'toegekend_op' },
  // Profielfoto (migratie 473): nooit het pad in de opslag.
  profielfoto: { tabel: 'club_profielfotos', select: 'bron, aangemaakt_op', volgorde: 'aangemaakt_op' },
}

function log(wat: string, bericht: string): void {
  console.error(`[club/personeel/avg] ${wat} mislukt`, bericht)
}

async function leesAlles(admin: SupabaseClient, userId: string, mwId: string, bron: (typeof BRONNEN)[keyof typeof BRONNEN]): Promise<Rij[] | null> {
  const uit: Rij[] = []
  for (let van = 0; van < MAX_RIJEN; van += 1000) {
    const { data, error } = await admin.from(bron.tabel).select(bron.select).eq('user_id', userId).eq('medewerker_id', mwId).order(bron.volgorde).range(van, van + 999)
    if (error) {
      log(`${bron.tabel} lezen`, error.message)
      return null
    }
    const rijen = (data ?? []) as unknown as Rij[]
    uit.push(...rijen)
    if (rijen.length < 1000) break
  }
  return uit
}

/** Logboekregels waar deze medewerker de "wie" is (zoals de database vergelijkt: hoofdletters tellen niet). */
async function leesLogboek(admin: SupabaseClient, userId: string, naam: string): Promise<Rij[] | null> {
  if (naam.trim().length < 2) return []
  const { data, error } = await admin
    .from('club_logboek')
    .select('op, actie, onderwerp, vestiging')
    .eq('user_id', userId)
    .ilike('wie', letterlijkPatroon(naam))
    .order('op', { ascending: false })
    .limit(MAX_LOGBOEK)
  if (error) {
    log('logboek lezen', error.message)
    return null
  }
  return (data ?? []) as Rij[]
}

async function leesHulpvragen(admin: SupabaseClient, userId: string, mwId: string): Promise<Rij[] | null> {
  const { data, error } = await admin.from('club_support').select('onderwerp, status, aangemaakt_op').eq('user_id', userId).eq('melder_id', mwId).order('aangemaakt_op').limit(MAX_LOGBOEK)
  if (error) {
    log('hulpvragen lezen', error.message)
    return null
  }
  return (data ?? []) as Rij[]
}

/** Alles wat Club over deze medewerker bewaart. Lukt een deel niet, dan geen half bestand maar een fout. */
export async function haalMedewerkerExportRuw(admin: SupabaseClient, userId: string, mwId: string): Promise<Uitslag> {
  const { data: mw, error } = await admin
    .from('club_medewerkers')
    .select('naam, email, rollen, vestigingen, actief, contracturen_per_week, aangemaakt_op, geanonimiseerd_op')
    .eq('user_id', userId)
    .eq('id', mwId)
    .maybeSingle()
  if (error) {
    log('medewerker lezen', error.message)
    return { ok: false, fout: 'lezen mislukt' }
  }
  if (!mw) return { ok: false, fout: 'niet gevonden' }
  const naam = typeof mw.naam === 'string' ? mw.naam : ''
  const sleutels = Object.keys(BRONNEN) as (keyof typeof BRONNEN)[]
  const [delen, logboek, hulpvragen] = await Promise.all([
    Promise.all(sleutels.map((s) => leesAlles(admin, userId, mwId, BRONNEN[s]))),
    leesLogboek(admin, userId, naam),
    leesHulpvragen(admin, userId, mwId),
  ])
  if (delen.some((d) => d === null) || !logboek || !hulpvragen) return { ok: false, fout: 'lezen mislukt' }
  const per = Object.fromEntries(sleutels.map((s, i) => [s, delen[i] as Rij[]])) as Record<keyof typeof BRONNEN, Rij[]>
  return { ok: true, ruw: { medewerker: mw as Rij, ...per, logboek, hulpvragen } }
}

/** Naam, in dienst en al gewist; null = niet gevonden of leesfout (de route geeft dan 404). */
export async function haalMedewerkerAvgStaat(admin: SupabaseClient, userId: string, mwId: string): Promise<MedewerkerAvgStaat | null> {
  const { data, error } = await admin.from('club_medewerkers').select('naam, actief, geanonimiseerd_op').eq('user_id', userId).eq('id', mwId).maybeSingle()
  if (error) log('medewerker lezen', error.message)
  if (error || !data || typeof data.naam !== 'string') return null
  return { naam: data.naam, actief: data.actief !== false, gewist: typeof data.geanonimiseerd_op === 'string' }
}

/** De ids van gewiste medewerkers van deze sportschool (voor de lijst bij Instellingen). Leeg bij een leesfout. */
export async function haalGewisteMedewerkers(admin: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await admin.from('club_medewerkers').select('id').eq('user_id', userId).not('geanonimiseerd_op', 'is', null).limit(2000)
  if (error) {
    log('gewiste medewerkers lezen', error.message)
    return []
  }
  return (data ?? []).flatMap((r) => (typeof r.id === 'string' ? [r.id] : []))
}

/** Wissen via de database-functie. true = gewist, false = niet gevonden of al gewist, null = fout. */
export async function wisMedewerker(admin: SupabaseClient, userId: string, mwId: string, door: string): Promise<boolean | null> {
  const { data, error } = await admin.rpc('club_medewerker_anonimiseren', { p_user: userId, p_mw: mwId, p_wie: door.slice(0, 80) })
  if (error) {
    log('medewerker wissen', `${error.code ?? ''} ${error.message}`)
    return null
  }
  return data === true
}
