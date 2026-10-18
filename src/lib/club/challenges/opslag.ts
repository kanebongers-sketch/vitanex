// ─── Club, challenges: schrijven (SERVER-ONLY) ──────────────────────────────
// Maken, wijzigen, stoppen (nooit verwijderen: de voortgang blijft
// terug te zien) en inschrijven of uitschrijven. Alles op user_id van de
// actieve sportschool; een id van buiten wordt altijd tegen user_id gecontroleerd.

import { logActie, type ClubSchrijver, type ClubToegang } from '@/lib/club/toegang'
import { gelukt, mislukt, type Resultaat } from '@/lib/club/rooster/basis-opslag'
import { nlDelen } from '@/lib/club/rooster/tijd'
import type { ChallengeInvoer } from './invoer'
import { haalChallenge } from './lezen'
import { geldtVoor, statusVan } from './periode'

const NIET_GEVONDEN = 'Deze challenge bestaat niet.'
const OPSLAAN_MISLUKT = 'Opslaan is niet gelukt. Probeer het opnieuw.'

function naarRij(c: ChallengeInvoer) {
  return {
    titel: c.titel,
    uitleg: c.uitleg,
    soort: c.soort,
    doel: c.doel,
    start_op: c.start,
    eind_op: c.eind,
    vestigingen: c.vestigingen,
    deelname: c.deelname,
    zichtbaar_app: c.zichtbaarApp,
    ranglijst: c.ranglijst,
  }
}

function vandaag(): string {
  return nlDelen(new Date()).datum
}

export async function maakChallenge(t: ClubToegang, c: ChallengeInvoer): Promise<Resultaat<{ id: string }>> {
  const { data, error } = await t.admin.from('club_challenges').insert({ ...naarRij(c), user_id: t.userId }).select('id').single()
  if (error) {
    console.error('[club] challenge maken mislukt', error.message)
    return mislukt(OPSLAAN_MISLUKT, 500)
  }
  await logActie(t, 'Challenge gemaakt', c.titel, null)
  return gelukt({ id: String(data.id) })
}

export async function wijzigChallenge(t: ClubToegang, id: string, c: ChallengeInvoer): Promise<Resultaat<{ id: string }>> {
  const oud = await haalChallenge(t.admin, t.userId, id)
  if (!oud) return mislukt(NIET_GEVONDEN, 404)
  if (statusVan(oud, vandaag()) === 'afgelopen') return mislukt('Een afgelopen challenge pas je niet meer aan; zo blijft de uitslag kloppen.', 409)
  const { error } = await t.admin.from('club_challenges').update({ ...naarRij(c), bijgewerkt_op: new Date().toISOString() }).eq('user_id', t.userId).eq('id', id)
  if (error) {
    console.error('[club] challenge wijzigen mislukt', error.message)
    return mislukt(OPSLAAN_MISLUKT, 500)
  }
  await logActie(t, 'Challenge aangepast', c.titel, null)
  return gelukt({ id })
}

/** Vroegtijdig stoppen: telt vanaf vandaag niet meer mee en staat bij Afgelopen. */
export async function stopChallenge(t: ClubToegang, id: string): Promise<Resultaat<{ id: string }>> {
  const oud = await haalChallenge(t.admin, t.userId, id)
  if (!oud) return mislukt(NIET_GEVONDEN, 404)
  if (statusVan(oud, vandaag()) === 'afgelopen') return mislukt('Deze challenge is al afgelopen.', 409)
  const nu = new Date().toISOString()
  const { error } = await t.admin.from('club_challenges').update({ gestopt_op: nu, bijgewerkt_op: nu }).eq('user_id', t.userId).eq('id', id)
  if (error) {
    console.error('[club] challenge stoppen mislukt', error.message)
    return mislukt('Stoppen is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Challenge gestopt', oud.titel, null)
  return gelukt({ id })
}

async function haalLidVestiging(t: ClubSchrijver, lidId: string): Promise<string | null> {
  const { data, error } = await t.admin.from('club_leden').select('vestiging').eq('user_id', t.userId).eq('id', lidId).maybeSingle()
  if (error) console.error('[club] lid lezen (challenge) mislukt', error.message)
  return typeof data?.vestiging === 'string' ? data.vestiging : null
}

export async function schrijfIn(t: ClubSchrijver, challengeId: string, lidId: string): Promise<Resultaat<{ ingeschreven: true }>> {
  const [c, vestiging] = await Promise.all([haalChallenge(t.admin, t.userId, challengeId), haalLidVestiging(t, lidId)])
  if (!c) return mislukt(NIET_GEVONDEN, 404)
  if (!vestiging) return mislukt('Dit lid bestaat niet.', 404)
  if (c.deelname !== 'inschrijven') return mislukt('Bij deze challenge doet iedereen automatisch mee.', 409)
  if (!geldtVoor(c, vestiging)) return mislukt('Deze challenge is niet voor de vestiging van dit lid.', 409)
  if (statusVan(c, vandaag()) === 'afgelopen') return mislukt('Deze challenge is al afgelopen.', 409)
  const { error } = await t.admin.from('club_challenge_deelnemers').insert({ user_id: t.userId, challenge_id: c.id, lid_id: lidId })
  // Al ingeschreven is geen fout: het resultaat is hetzelfde.
  if (error && error.code !== '23505') {
    console.error('[club] inschrijven challenge mislukt', error.message)
    return mislukt('Inschrijven is niet gelukt. Probeer het opnieuw.', 500)
  }
  return gelukt({ ingeschreven: true })
}

export async function schrijfUit(t: ClubSchrijver, challengeId: string, lidId: string): Promise<Resultaat<{ uitgeschreven: true }>> {
  const c = await haalChallenge(t.admin, t.userId, challengeId)
  if (!c) return mislukt(NIET_GEVONDEN, 404)
  if (statusVan(c, vandaag()) === 'afgelopen') return mislukt('Deze challenge is al afgelopen.', 409)
  const { error } = await t.admin.from('club_challenge_deelnemers').delete().eq('user_id', t.userId).eq('challenge_id', c.id).eq('lid_id', lidId)
  if (error) {
    console.error('[club] uitschrijven challenge mislukt', error.message)
    return mislukt('Uitschrijven is niet gelukt. Probeer het opnieuw.', 500)
  }
  return gelukt({ uitgeschreven: true })
}
