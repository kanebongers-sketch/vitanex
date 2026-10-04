// ─── LifeOS — herhalende taken in de database (SERVER-ONLY) ─────────────────
// De regel staat in `taak_herhalingen` (migratie 350), één rij per lopende taak.
//
// ─── DE VOLGENDE KEER, PRECIES ÉÉN KEER ─────────────────────────────────────
// Afvinken → de regel van de oude taak VERWIJDEREN (met `select`, dus we weten of
// wij hem kregen) → de volgende taak aanmaken → de regel op die nieuwe taak
// zetten. Twee gelijktijdige afvinkverzoeken kunnen de rij niet allebei
// verwijderen, dus er komt nooit een dubbele volgende taak. Mislukt het aanmaken,
// dan zetten we de regel terug op de oude taak: de reeks raakt niet kwijt.
//
// Zolang migratie 350 niet gedraaid is, bestaat de tabel niet. Dan werkt alles
// gewoon zonder herhaling; alleen het instellen van een regel meldt het eerlijk.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Taak } from './taken'
import { maakTaak } from './opslag'
import { isHerhaalRegel, schuifDeadline, volgendeKeer, type HerhaalRegel } from './herhaling'

const TABEL = 'taak_herhalingen'
/** Postgres: tabel bestaat niet (migratie nog niet gedraaid). */
const GEEN_TABEL = '42P01'

function foutCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null
}

export type ZetUitkomst = { ok: true } | { ok: false; melding: string }

/** Zet de herhaalregel op een (net aangemaakte) taak. */
export async function zetHerhaling(
  admin: SupabaseClient,
  userId: string,
  taakId: string,
  regel: HerhaalRegel,
): Promise<ZetUitkomst> {
  const { error } = await admin.from(TABEL).upsert({ taak_id: taakId, user_id: userId, regel })
  if (!error) return { ok: true }
  if (foutCode(error) === GEEN_TABEL) {
    return { ok: false, melding: 'Taak staat erin, maar herhalen kan pas na migratie 350.' }
  }
  console.error('[taken/herhaling] regel opslaan mislukt', error)
  return { ok: false, melding: 'Taak staat erin, maar de herhaling kon niet worden opgeslagen.' }
}

/**
 * Na het afvinken: is dit een herhalende taak, maak dan de volgende keer aan.
 * Geeft de nieuwe taak terug, of null als er niets te herhalen viel. Gooit nooit:
 * het afvinken zelf is al gelukt, en een mislukte herhaling wordt gelogd.
 */
export async function maakVolgendeKeer(
  admin: SupabaseClient,
  userId: string,
  taak: Taak,
  vandaag: string,
): Promise<Taak | null> {
  const { data, error } = await admin
    .from(TABEL)
    .delete()
    .eq('user_id', userId)
    .eq('taak_id', taak.id)
    .select('regel')
    .maybeSingle()

  if (error) {
    if (foutCode(error) !== GEEN_TABEL) console.error('[taken/herhaling] regel lezen mislukt', error)
    return null
  }
  const regel = (data as { regel?: unknown } | null)?.regel
  if (!isHerhaalRegel(regel)) return null

  const dag = volgendeKeer(regel, taak.datum, vandaag)
  const nieuw = await maakTaak(admin, userId, {
    titel: taak.titel,
    notitie: taak.notitie,
    categorie: taak.categorie,
    datum: dag,
    // Een top-3-plek is een keuze voor één dag, die erft de volgende keer niet.
    top3Positie: null,
    impact: taak.impact,
    inspanningMinuten: taak.inspanningMinuten,
    energie: taak.energie,
    deadline: schuifDeadline(taak.deadline, taak.datum, dag),
    projectId: taak.projectId,
  })

  if (!nieuw.ok) {
    console.error('[taken/herhaling] volgende keer aanmaken mislukt', nieuw.reden)
    await admin.from(TABEL).insert({ taak_id: taak.id, user_id: userId, regel })
    return null
  }

  const verhuisd = await zetHerhaling(admin, userId, nieuw.waarde.id, regel)
  if (!verhuisd.ok) console.error('[taken/herhaling] regel verhuizen mislukt', verhuisd.melding)
  return nieuw.waarde
}
