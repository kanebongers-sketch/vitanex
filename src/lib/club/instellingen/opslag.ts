// ─── Fit Factory Club, instellingen: lezen en opslaan (SERVER) ──────────────
// Regels en openingstijden per vestiging, zalen, lestypen, het weekrooster
// (club_lesseries) en medewerkers. Elke query filtert op user_id; elke
// wijziging komt in het logboek.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Medewerker } from '@/lib/club/gedeeld/medewerker'
import { VESTIGING_LABEL, type Vestiging } from '@/lib/club/gedeeld/vestiging'
import { logActie, type ClubToegang } from '@/lib/club/toegang'
import { gelukt, haalRegels, haalStamdata, mislukt, type Resultaat, type VestigingInstellingen } from '@/lib/club/rooster/basis-opslag'
import { SERIE_KOLOMMEN, rijenNaar, serieUitRij, type LesSerie, type Lestype, type Zaal } from '@/lib/club/rooster/typen'
import {
  LESTYPE_SCHEMA,
  MEDEWERKER_SCHEMA,
  SERIE_SCHEMA,
  ZAAL_SCHEMA,
  controleerLooptijd,
  leesNieuw,
  leesVolgensSchema,
  type RegelsInvoer,
} from './validatie'

export interface Instellingen extends VestigingInstellingen {
  zalen: Zaal[]
  lestypen: Lestype[]
  series: LesSerie[]
  medewerkers: Medewerker[]
}

/** Alles voor de instellingenpagina van een vestiging. */
export async function haalInstellingen(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<Instellingen | null> {
  const [basis, stam, series] = await Promise.all([
    haalRegels(admin, userId, vestiging),
    haalStamdata(admin, userId, vestiging),
    admin.from('club_lesseries').select(SERIE_KOLOMMEN).eq('user_id', userId).eq('vestiging', vestiging).order('weekdag').order('starttijd'),
  ])
  if (!stam || series.error) {
    if (series.error) console.error('[club-instellingen] weekrooster lezen mislukt', series.error.message)
    return null
  }
  return { ...basis, zalen: stam.zalen, lestypen: stam.lestypen, series: rijenNaar(series.data, serieUitRij), medewerkers: stam.medewerkers }
}

/** Regels en openingstijden van een vestiging opslaan. */
export async function slaRegelsOp(t: ClubToegang, invoer: RegelsInvoer): Promise<Resultaat<{ opgeslagen: true }>> {
  const velden = { regels: invoer.regels, openingstijden: invoer.openingstijden }
  const { data, error } = await t.admin.from('club_vestigingen').update(velden).eq('user_id', t.userId).eq('vestiging', invoer.vestiging).select('vestiging')
  if (error) {
    console.error('[club-instellingen] regels opslaan mislukt', error.message)
    return mislukt('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data || data.length === 0) {
    const nieuw = await t.admin.from('club_vestigingen').insert({ ...velden, vestiging: invoer.vestiging, user_id: t.userId, naam: VESTIGING_LABEL[invoer.vestiging] })
    if (nieuw.error) {
      console.error('[club-instellingen] vestiging aanmaken mislukt', nieuw.error.message)
      return mislukt('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
    }
  }
  await logActie(t, 'Regels aangepast', VESTIGING_LABEL[invoer.vestiging], invoer.vestiging)
  return gelukt({ opgeslagen: true })
}

// ── Zalen, lestypen, weekrooster en medewerkers ───────────────────────────

export const SOORTEN = ['zalen', 'lestypen', 'weekrooster', 'medewerkers'] as const
export type InstellingSoort = (typeof SOORTEN)[number]

const TABEL: Record<InstellingSoort, string> = {
  zalen: 'club_zalen',
  lestypen: 'club_lestypen',
  weekrooster: 'club_lesseries',
  medewerkers: 'club_medewerkers',
}

const SCHEMA = { zalen: ZAAL_SCHEMA, lestypen: LESTYPE_SCHEMA, weekrooster: SERIE_SCHEMA, medewerkers: MEDEWERKER_SCHEMA }

const STANDAARD: Record<InstellingSoort, Record<string, unknown>> = {
  zalen: { actief: true },
  lestypen: { actief: true, omschrijving: null, intensiteit: 2 },
  weekrooster: { actief: true, zaalId: null, instructeurId: null, tot: null },
  medewerkers: { actief: true, email: null },
}

const LABEL: Record<InstellingSoort, string> = { zalen: 'Zaal', lestypen: 'Lestype', weekrooster: 'Vaste les', medewerkers: 'Medewerker' }

export function isInstellingSoort(v: unknown): v is InstellingSoort {
  return typeof v === 'string' && (SOORTEN as readonly string[]).includes(v)
}

/** Horen de verwijzingen van een vaste les bij deze gebruiker (en de zaal bij de vestiging)? */
async function controleerVerwijzingen(admin: SupabaseClient, userId: string, vestiging: Vestiging, v: Record<string, unknown>): Promise<string | null> {
  const stam = await haalStamdata(admin, userId, vestiging)
  if (!stam) return 'De gegevens konden niet worden gelezen.'
  if (typeof v.lestype_id === 'string' && !stam.lestypen.some((x) => x.id === v.lestype_id)) return 'Onbekende les.'
  if (typeof v.zaal_id === 'string' && !stam.zalen.some((x) => x.id === v.zaal_id)) return 'Deze zaal hoort niet bij deze vestiging.'
  if (typeof v.instructeur_id === 'string' && !stam.medewerkers.some((x) => x.id === v.instructeur_id)) return 'Onbekende instructeur.'
  return controleerLooptijd(v)
}

function naamVoorLog(v: Record<string, unknown>): string | null {
  return typeof v.naam === 'string' ? v.naam : null
}

/** Een nieuw item aanmaken. Zalen en vaste lessen horen bij de vestiging. */
export async function maakItem(t: ClubToegang, soort: InstellingSoort, vestiging: Vestiging, ruw: unknown): Promise<Resultaat<{ id: string }>> {
  const gelezen = leesNieuw(ruw, SCHEMA[soort], STANDAARD[soort])
  if (!gelezen.ok) return mislukt(gelezen.fout)
  const velden = gelezen.waarde
  if (soort === 'weekrooster') {
    const fout = await controleerVerwijzingen(t.admin, t.userId, vestiging, velden)
    if (fout) return mislukt(fout)
  }
  const metVestiging = soort === 'zalen' || soort === 'weekrooster' ? { ...velden, vestiging } : velden
  const { data, error } = await t.admin.from(TABEL[soort]).insert({ ...metVestiging, user_id: t.userId }).select('id').single()
  if (error || typeof data?.id !== 'string') {
    console.error('[club-instellingen] aanmaken mislukt', error?.message)
    return mislukt('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, `${LABEL[soort]} toegevoegd`, naamVoorLog(velden), vestiging)
  return gelukt({ id: data.id })
}

/** Een bestaand item wijzigen (alleen de meegegeven velden). */
export async function wijzigItem(t: ClubToegang, soort: InstellingSoort, id: string, vestiging: Vestiging, ruw: unknown): Promise<Resultaat<{ id: string }>> {
  const gelezen = leesVolgensSchema(ruw, SCHEMA[soort], true)
  if (!gelezen.ok) return mislukt(gelezen.fout)
  const velden = gelezen.waarde
  if (soort === 'weekrooster') {
    const fout = await controleerVerwijzingen(t.admin, t.userId, vestiging, velden)
    if (fout) return mislukt(fout)
  }
  let q = t.admin.from(TABEL[soort]).update(velden).eq('user_id', t.userId).eq('id', id)
  if (soort === 'zalen' || soort === 'weekrooster') q = q.eq('vestiging', vestiging)
  const { data, error } = await q.select('id')
  if (error) {
    console.error('[club-instellingen] wijzigen mislukt', error.message)
    return mislukt('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data || data.length === 0) return mislukt('Dit item bestaat niet (meer).', 404)
  await logActie(t, `${LABEL[soort]} aangepast`, naamVoorLog(velden), vestiging)
  return gelukt({ id })
}
