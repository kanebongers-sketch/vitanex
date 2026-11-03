// ─── Club: "Alles tonen, ook wat nog leeg is" (PUUR plus lezer) ─────────────
// Ontwerp "Club in 10 minuten" (03-11-2026): wat nog nooit gebruikt is (Taken,
// Leads, Diensten, het Prikbord) staat standaard niet in het menu; dat is de
// eenvoudige stand, geen knop. Wie toch alles wil zien, zet bij Instellingen ·
// Pakketten en onderdelen "Alles tonen" aan. Het staat per sportschool in
// club_organisaties.instellingen als { menu: { alles_tonen: true } }; andere
// sleutels in die kolom blijven staan. Het menu (inGebruik in de shell) leest
// het met haalAllesTonen.

import type { SupabaseClient } from '@supabase/supabase-js'

export const ALLES_TONEN_PAD = '/api/club/organisatie/instellingen/menu'

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Staat "Alles tonen" aan in de ruwe instellingen van de sportschool? Alles wat geen `true` is, is uit. */
export function leesAllesTonen(instellingen: unknown): boolean {
  return object(object(instellingen)?.menu)?.alles_tonen === true
}

/** De ruwe instellingen met "Alles tonen" gezet; alle andere sleutels blijven zoals ze waren. */
export function metAllesTonen(instellingen: unknown, aan: boolean): Record<string, unknown> {
  const basis = object(instellingen) ?? {}
  const menu = object(basis.menu) ?? {}
  return { ...basis, menu: { ...menu, alles_tonen: aan } }
}

/** Het verzoek { aan: boolean } lezen; anders null. */
export function leesAllesTonenInvoer(body: unknown): boolean | null {
  const aan = object(body)?.aan
  return typeof aan === 'boolean' ? aan : null
}

/** Lees de stand van een sportschool; bij een fout (gelogd) uit, dan blijft het menu eenvoudig. */
export async function haalAllesTonen(admin: SupabaseClient, organisatieId: string): Promise<boolean> {
  const { data, error } = await admin.from('club_organisaties').select('instellingen').eq('id', organisatieId).maybeSingle()
  if (error) {
    console.error('[club] alles tonen lezen mislukt', error.message)
    return false
  }
  return leesAllesTonen((data as { instellingen?: unknown } | null)?.instellingen)
}

export type AllesTonenOpslag = 'ok' | 'weg' | 'fout'

/** Ontbreekt de database-functie (migratie 492 nog niet uitgevoerd)? */
function functieOntbreekt(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST202' || error.code === '42883'
}

/**
 * Zet alleen het sleuteltje menu.alles_tonen (migratie 492, functie
 * club_organisatie_alles_tonen: een update in de database, andere sleutels en
 * gelijktijdige wijzigingen blijven staan). Zonder die functie: lezen en
 * terugschrijven, met de fout in het log.
 */
export async function zetAllesTonen(admin: SupabaseClient, organisatieId: string, beheerderId: string, aan: boolean): Promise<AllesTonenOpslag> {
  const { data, error } = await admin.rpc('club_organisatie_alles_tonen', { p_org: organisatieId, p_beheerder: beheerderId, p_aan: aan })
  if (!error) return data === true ? 'ok' : 'weg'
  console.error('[club] alles tonen via de database-functie mislukt', error.message)
  if (!functieOntbreekt(error)) return 'fout'
  const huidig = await admin.from('club_organisaties').select('instellingen').eq('id', organisatieId).eq('beheerder_id', beheerderId).maybeSingle()
  if (huidig.error) {
    console.error('[club] instellingen lezen mislukt', huidig.error.message)
    return 'fout'
  }
  if (!huidig.data) return 'weg'
  const ruw: unknown = (huidig.data as { instellingen?: unknown }).instellingen
  const schrijf = await admin
    .from('club_organisaties')
    .update({ instellingen: metAllesTonen(ruw, aan), bijgewerkt_op: new Date().toISOString() })
    .eq('id', organisatieId)
    .eq('beheerder_id', beheerderId)
  if (schrijf.error) console.error('[club] alles tonen opslaan mislukt', schrijf.error.message)
  return schrijf.error ? 'fout' : 'ok'
}
