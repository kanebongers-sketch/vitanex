// ─── Club, community: wat een lid doet (SERVER-ONLY) ────────────────────────
// Lid worden, berichten plaatsen, reageren, melden en de voorkeur voor
// ranglijsten. Het lid komt altijd uit de toegang (sessie). Elke actie
// controleert dat het lid in de groep zit en dat de groep niet gearchiveerd is.

import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { filterBericht } from './filter'
import { groepZichtbaarVoor, type BerichtStatus, type ReactieSoort } from './model'
import { BERICHT_REM, MELD_REM, remVenster, remt } from './rem'
import { haalGroep, lidStatusIn, meld, type LidContext } from './lezen'
import type { MeldInvoer } from './invoer'

/** Zoveel meldingen van verschillende leden en het bericht gaat uit de groep tot de sportschool kijkt. */
export const AUTOMATISCH_VASTHOUDEN_BIJ = 3

const LEESFOUT = 'Er ging iets mis. Probeer het opnieuw.'

export async function wordLid(c: LidContext, groepId: string): Promise<Resultaat<{ ok: true }>> {
  const [g, status] = await Promise.all([haalGroep(c.admin, c.userId, groepId), lidStatusIn(c.admin, c.userId, groepId, c.lid.id)])
  if (g === undefined || status === undefined) return mislukt(LEESFOUT, 500)
  if (status === 'verwijderd') return mislukt('Je kunt niet zelf lid worden van deze groep. Vraag het de sportschool.', 403)
  if (status === 'lid') return gelukt({ ok: true })
  if (!g || g.toegang !== 'open' || !groepZichtbaarVoor(g, c.lid.vestiging, false)) return mislukt('Deze groep bestaat niet.', 404)
  const { error } = await c.admin.from('club_community_groepsleden').insert({ user_id: c.userId, groep_id: g.id, lid_id: c.lid.id, status: 'lid', toegevoegd_door: 'Zelf' })
  if (error && error.code !== '23505') {
    meld('lid worden', error)
    return mislukt(LEESFOUT, 500)
  }
  return gelukt({ ok: true })
}

export async function verlaatGroep(c: LidContext, groepId: string): Promise<Resultaat<{ ok: true }>> {
  const { error } = await c.admin.from('club_community_groepsleden').delete().eq('user_id', c.userId).eq('groep_id', groepId).eq('lid_id', c.lid.id).eq('status', 'lid')
  if (error) {
    meld('groep verlaten', error)
    return mislukt(LEESFOUT, 500)
  }
  return gelukt({ ok: true })
}

/** Zit het lid in een actieve groep? */
async function magInGroep(c: LidContext, groepId: string): Promise<Resultaat<true>> {
  const [g, status] = await Promise.all([haalGroep(c.admin, c.userId, groepId), lidStatusIn(c.admin, c.userId, groepId, c.lid.id)])
  if (g === undefined || status === undefined) return mislukt(LEESFOUT, 500)
  if (!g || g.gearchiveerdOp || status !== 'lid') return mislukt('Deze groep bestaat niet.', 404)
  return gelukt(true)
}

async function eigenTijden(c: LidContext, tabel: 'club_community_berichten' | 'club_community_meldingen', vensterMs: number, nu: Date): Promise<string[] | null> {
  const { data, error } = await c.admin
    .from(tabel)
    .select('aangemaakt_op')
    .eq('user_id', c.userId)
    .eq('lid_id', c.lid.id)
    .gte('aangemaakt_op', new Date(nu.getTime() - vensterMs).toISOString())
    .limit(200)
  if (error) {
    meld('rem lezen', error)
    return null
  }
  return (data ?? []).map((r: { aangemaakt_op: unknown }) => r.aangemaakt_op).filter((op): op is string => typeof op === 'string')
}

export async function plaatsBericht(c: LidContext, groepId: string, tekst: string, nu = new Date()): Promise<Resultaat<{ id: string; status: BerichtStatus }>> {
  const mag = await magInGroep(c, groepId)
  if (!mag.ok) return mag
  const eerdere = await eigenTijden(c, 'club_community_berichten', remVenster(BERICHT_REM), nu)
  if (!eerdere) return mislukt(LEESFOUT, 500)
  const rem = remt(BERICHT_REM, eerdere, nu)
  if (rem) return mislukt(rem, 429)
  const filter = filterBericht(tekst)
  const status: BerichtStatus = filter.vasthouden ? 'vastgehouden' : 'zichtbaar'
  const { data, error } = await c.admin
    .from('club_community_berichten')
    .insert({ user_id: c.userId, groep_id: groepId, lid_id: c.lid.id, tekst, status, reden: filter.reden })
    .select('id')
    .single()
  if (error || typeof data?.id !== 'string') {
    if (error) meld('bericht plaatsen', error)
    return mislukt(LEESFOUT, 500)
  }
  return gelukt({ id: data.id, status })
}

/** Een eigen bericht weghalen (met de reacties en meldingen erop). */
export async function verwijderEigenBericht(c: LidContext, berichtId: string): Promise<Resultaat<{ ok: true }>> {
  const { data, error } = await c.admin.from('club_community_berichten').delete().eq('user_id', c.userId).eq('id', berichtId).eq('lid_id', c.lid.id).select('id')
  if (error) {
    meld('bericht verwijderen', error)
    return mislukt(LEESFOUT, 500)
  }
  return (data ?? []).length > 0 ? gelukt({ ok: true }) : mislukt('Dit bericht bestaat niet.', 404)
}

interface BerichtKern {
  groepId: string
  lidId: string
  status: BerichtStatus
}

/** Een zichtbaar bericht van een ander in een groep waar het lid in zit. */
async function berichtVanAnder(c: LidContext, berichtId: string): Promise<Resultaat<BerichtKern>> {
  const { data, error } = await c.admin.from('club_community_berichten').select('groep_id, lid_id, status').eq('user_id', c.userId).eq('id', berichtId).maybeSingle()
  if (error) {
    meld('bericht lezen', error)
    return mislukt(LEESFOUT, 500)
  }
  if (!data || data.status !== 'zichtbaar' || typeof data.groep_id !== 'string') return mislukt('Dit bericht bestaat niet.', 404)
  if (data.lid_id === c.lid.id) return mislukt('Dit is je eigen bericht.', 400)
  const mag = await magInGroep(c, data.groep_id)
  return mag.ok ? gelukt({ groepId: data.groep_id, lidId: data.lid_id as string, status: data.status }) : mag
}

export async function zetReactie(c: LidContext, berichtId: string, soort: ReactieSoort, aan: boolean): Promise<Resultaat<{ ok: true }>> {
  if (aan) {
    const b = await berichtVanAnder(c, berichtId)
    if (!b.ok) return b
    const { error } = await c.admin.from('club_community_reacties').insert({ user_id: c.userId, bericht_id: berichtId, lid_id: c.lid.id, soort })
    if (error && error.code !== '23505') {
      meld('reactie geven', error)
      return mislukt(LEESFOUT, 500)
    }
    return gelukt({ ok: true })
  }
  const { error } = await c.admin.from('club_community_reacties').delete().eq('user_id', c.userId).eq('bericht_id', berichtId).eq('lid_id', c.lid.id).eq('soort', soort)
  if (error) {
    meld('reactie weghalen', error)
    return mislukt(LEESFOUT, 500)
  }
  return gelukt({ ok: true })
}

/** Na genoeg meldingen van verschillende leden gaat het bericht ter beoordeling uit de groep. */
async function houdVastNaMeldingen(c: LidContext, berichtId: string): Promise<void> {
  const { count, error } = await c.admin.from('club_community_meldingen').select('id', { count: 'exact', head: true }).eq('user_id', c.userId).eq('bericht_id', berichtId).eq('status', 'open')
  if (error) return meld('meldingen tellen', error)
  if ((count ?? 0) < AUTOMATISCH_VASTHOUDEN_BIJ) return
  const { error: fout } = await c.admin
    .from('club_community_berichten')
    .update({ status: 'vastgehouden', reden: 'Door meerdere leden gemeld' })
    .eq('user_id', c.userId)
    .eq('id', berichtId)
    .eq('status', 'zichtbaar')
  if (fout) meld('bericht vasthouden', fout)
}

export async function meldBericht(c: LidContext, berichtId: string, invoer: MeldInvoer, nu = new Date()): Promise<Resultaat<{ ok: true }>> {
  const b = await berichtVanAnder(c, berichtId)
  if (!b.ok) return b
  const eerdere = await eigenTijden(c, 'club_community_meldingen', remVenster(MELD_REM), nu)
  if (!eerdere) return mislukt(LEESFOUT, 500)
  const rem = remt(MELD_REM, eerdere, nu)
  if (rem) return mislukt(rem, 429)
  const { error } = await c.admin.from('club_community_meldingen').insert({ user_id: c.userId, bericht_id: berichtId, lid_id: c.lid.id, reden: invoer.reden, toelichting: invoer.toelichting })
  if (error && error.code !== '23505') {
    meld('bericht melden', error)
    return mislukt(LEESFOUT, 500)
  }
  await houdVastNaMeldingen(c, berichtId)
  return gelukt({ ok: true })
}

async function zetVoorkeurVeld(c: LidContext, velden: { op_ranglijst?: boolean; activiteit_gezien_op?: string }): Promise<boolean> {
  const { data: oud, error: leesFout } = await c.admin.from('club_community_voorkeuren').select('lid_id').eq('user_id', c.userId).eq('lid_id', c.lid.id).maybeSingle()
  if (leesFout) {
    meld('voorkeur lezen', leesFout)
    return false
  }
  const nu = new Date().toISOString()
  const { error } = oud
    ? await c.admin.from('club_community_voorkeuren').update({ ...velden, gewijzigd_op: nu }).eq('user_id', c.userId).eq('lid_id', c.lid.id)
    : await c.admin.from('club_community_voorkeuren').insert({ lid_id: c.lid.id, user_id: c.userId, op_ranglijst: false, ...velden, gewijzigd_op: nu })
  if (error) meld('voorkeur opslaan', error)
  return !error
}

export async function zetOpRanglijst(c: LidContext, opRanglijst: boolean): Promise<Resultaat<{ opRanglijst: boolean }>> {
  return (await zetVoorkeurVeld(c, { op_ranglijst: opRanglijst })) ? gelukt({ opRanglijst }) : mislukt(LEESFOUT, 500)
}

export async function markeerActiviteitGezien(c: LidContext): Promise<Resultaat<{ ok: true }>> {
  return (await zetVoorkeurVeld(c, { activiteit_gezien_op: new Date().toISOString() })) ? gelukt({ ok: true }) : mislukt(LEESFOUT, 500)
}
