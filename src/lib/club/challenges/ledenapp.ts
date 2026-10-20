// ─── Club, challenges: data voor de ledenapp (SERVER-ONLY) ──────────────────
// Haalt voor een lid zijn eigen momenten (alle check-ins, trainingen en
// aanwezige groepslessen), de challenges van zijn sportschool, zijn
// inschrijvingen en, waar de ranglijst aan staat, de stand. Alles op user_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalOpLijst } from '@/lib/club/community/lezen'
import { alleRijen } from '@/lib/club/leden/data'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { appChallenge, gehaaldeChallenges, momentenVoor, sorteerApp, toonInApp, type LedenappChallengesData } from './app'
import { berekenBadges } from './badges'
import { haalChallenges, haalInschrijvingen, haalMomenten, haalStand, type StandData } from './lezen'
import type { Challenge } from './model'
import { statusVan } from './periode'
import { maakStandCache, standSleutel, standVoorLid } from './stand-cache'
import type { Stand } from './voortgang'

export type { LedenappChallengesData } from './app'

/** Alles vanaf het begin: badges tellen over de hele historie. */
const ALTIJD = { van: '2000-01-01T00:00:00Z', tot: '2100-01-01T00:00:00Z' }

async function haalAfgerondeSchemas(admin: SupabaseClient, userId: string, lidId: string): Promise<string[] | null> {
  const rijen = await alleRijen('afgeronde schemas', (van, tot) =>
    admin.from('club_schemas').select('id, bijgewerkt_op').eq('user_id', userId).eq('lid_id', lidId).eq('status', 'afgerond').order('id').range(van, tot),
  )
  if (!rijen) return null
  return rijen.map((r) => (r as { bijgewerkt_op?: unknown }).bijgewerkt_op).filter((op): op is string => typeof op === 'string')
}

/** De stand per challenge, een minuut gedeeld door alle leden die de app openen (zie stand-cache.ts). */
const STANDEN = maakStandCache<StandData>()

/** De top van de stand plus de eigen plek; de volledige stand wordt hoogstens eens per minuut gerekend. */
async function haalAppStand(admin: SupabaseClient, userId: string, c: Challenge, lidId: string): Promise<Stand[] | null> {
  const data = await STANDEN.haal(standSleutel(userId, c), () => haalStand(admin, userId, c))
  return data ? standVoorLid(data.stand, lidId) : null
}

/**
 * Challenges en badges van een lid voor de ledenapp. Het lid moet al
 * gecontroleerd zijn (hoort bij userId). Leesfouten komen in `fouten`.
 */
export async function haalLedenappChallenges(admin: SupabaseClient, userId: string, lid: { id: string; vestiging: string }, nu = new Date()): Promise<LedenappChallengesData> {
  const vandaag = nlDelen(nu).datum
  const [lijst, ingeschreven, bezoeken, trainingen, lessen, schemas] = await Promise.all([
    haalChallenges(admin, userId),
    haalInschrijvingen(admin, userId, lid.id),
    haalMomenten(admin, userId, 'bezoeken', ALTIJD, lid.id),
    haalMomenten(admin, userId, 'trainingen', ALTIJD, lid.id),
    haalMomenten(admin, userId, 'lessen', ALTIJD, lid.id),
    haalAfgerondeSchemas(admin, userId, lid.id),
  ])
  const m = {
    bezoeken: (bezoeken ?? []).map((x) => x.op),
    trainingen: (trainingen ?? []).map((x) => x.op),
    lessen: (lessen ?? []).map((x) => x.op),
  }
  const ins = ingeschreven ?? new Set<string>()
  const zichtbaar = (lijst ?? []).filter((c) => toonInApp(c, lid.vestiging, vandaag))
  const standen = await Promise.all(
    zichtbaar.map((c) => (c.ranglijst && statusVan(c, vandaag) !== 'gepland' ? haalAppStand(admin, userId, c, lid.id) : Promise.resolve(null))),
  )
  // AVG: bij automatisch meedoen staan andere leden alleen op de ranglijst als
  // ze daar zelf voor kozen (dezelfde keuze als bij de community). Wie zich
  // voor een challenge inschreef, koos zelf om mee te doen.
  const anderen = [...new Set(standen.flatMap((s, i) => (s && zichtbaar[i].deelname !== 'inschrijven' ? s.map((x) => x.lidId) : [])))].filter((id) => id !== lid.id)
  const opLijst = (await haalOpLijst(admin, userId, anderen)) ?? new Set<string>()
  const challenges = sorteerApp(
    zichtbaar.map((c, i) => appChallenge(c, lid, ins.has(c.id), momentenVoor(c.soort, m), vandaag, standen[i], c.deelname === 'inschrijven' ? undefined : (id) => opLijst.has(id))),
  )
  const badges = berekenBadges({
    bezoeken: m.bezoeken,
    lessen: m.lessen,
    schemasAfgerond: schemas ?? [],
    challengesGehaald: gehaaldeChallenges(lijst ?? [], lid, ins, m),
  })
  const fouten = [
    ...(lijst === null || ingeschreven === null ? ['challenges'] : []),
    ...(bezoeken === null || trainingen === null || lessen === null || schemas === null ? ['voortgang'] : []),
  ]
  return { lidId: lid.id, challenges, badges, fouten }
}
