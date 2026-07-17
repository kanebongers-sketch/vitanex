// ─── LifeOS — Vita's geheugen in de database ────────────────────────────────
// SERVER-ONLY. `geheugen.ts` draagt de vorm en de validatie (puur, gedeeld met de
// browser); dit bestand doet de database. Zelfde split als `taken/taken.ts` +
// `taken/opslag.ts`, en om dezelfde reden: het geheugenpaneel importeert de types
// en de grenzen, en hoort daar geen database-code bij mee te krijgen.
//
// De service-role client komt als PARAMETER binnen, niet uit een import. Zo praat
// deze module gegarandeerd met de LifeOS-database die de route achter de
// founder-gate ophaalde — zie `@/lib/lifeos/admin`.

import type { SupabaseClient } from '@supabase/supabase-js'
import { geheugenVanRij, type GeheugenRegel, type NieuwGeheugen } from './geheugen'

const KOLOMMEN = 'id, soort, inhoud, bron, aangemaakt_op'

/** Postgres: unieke index geschonden. */
const UNIEK_GESCHONDEN = '23505'
/** Postgres: check-constraint geschonden. */
const CHECK_GESCHONDEN = '23514'

export type Reden = 'db' | 'dubbel' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === UNIEK_GESCHONDEN) return 'dubbel'
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  return 'db'
}

/**
 * Legt één feit vast.
 *
 * Een duplicaat wordt hier een expliciete `dubbel` (de unieke index uit 120), geen
 * stille `on conflict do nothing`. Dat verschil is de gebruiker: "die staat er al"
 * is een antwoord, een knop die niets doet is een bug die je zelf mag raden.
 */
export async function bewaarGeheugen(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuwGeheugen,
): Promise<Uitkomst<GeheugenRegel>> {
  const { data, error } = await admin
    .from('vita_geheugen')
    .insert({ user_id: userId, soort: nieuw.soort, inhoud: nieuw.inhoud, bron: nieuw.bron })
    .select(KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const regel = geheugenVanRij(data)
  return regel ? { ok: true, waarde: regel } : { ok: false, reden: 'db' }
}

/**
 * Wist één feit. Hard en definitief — geen archiefvlag: wat Vita over je onthoudt,
 * moet je écht weg kunnen halen. "Gearchiveerd maar nog in de database" is niet wat
 * iemand bedoelt die op vergeten drukt.
 *
 * `.eq('user_id')` staat er ook al draait dit op de service-role (die RLS omzeilt):
 * de gate ervoor is het slot, maar een id van een andere gebruiker mag ook bij een
 * fout in die gate nooit te wissen zijn.
 */
export async function wisGeheugen(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('vita_geheugen')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}

/**
 * Alles wat Vita over Kane onthoudt, nieuwste eerst.
 *
 * Geen `limit`: dit is de beheerlijst, en een lijst die stilzwijgend afkapt laat je
 * een feit niet vinden dat je wél wilt wissen. Het plafond hoort waar het pijn doet
 * — in de prompt (zie `GEHEUGEN_LIMIET` in context.ts).
 */
export async function haalGeheugen(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<GeheugenRegel[]>> {
  const { data, error } = await admin
    .from('vita_geheugen')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .order('aangemaakt_op', { ascending: false })

  if (error) return { ok: false, reden: vertaalFout(error) }
  const rijen = Array.isArray(data) ? data : []
  return { ok: true, waarde: rijen.map(geheugenVanRij).filter((r): r is GeheugenRegel => r !== null) }
}
