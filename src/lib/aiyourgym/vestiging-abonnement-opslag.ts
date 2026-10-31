// ─── AI Your Gym: abonnementen per vestiging koppelen en maken (SERVER-ONLY) ─
// Een functie voor drie plekken: na het inrichten (webhook), na een nieuwe
// vestiging in Club en in de dagelijkse cron (als vangnet). Zie
// vestiging-abonnement.ts voor het model en koppelPlan voor de regels.
// Alleen met een Stripe-sleutel en een lopend hoofdabonnement uit het nieuwe
// model; zonder Stripe (testbetaling) gebeurt er niets.

import type { SupabaseClient } from '@supabase/supabase-js'
import { leesAfgenomen } from '@/lib/club/kern/pakketten'
import { dagInNederland } from '@/lib/club/leden/actief-tellen'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { isAbonnementId, isKlantId } from './abonnement'
import { vindAbonnement } from './abonnement-opslag'
import { stripeRegels, stripeSleutel } from './config'
import { stripeHoeveelheid } from './staffel'
import { actieveLedenVan, claimVestigingAbonnement, rondVestigingAbonnementAf, vestigingAbonnementen } from './staffel-opslag'
import { haalAbonnement, lijstAbonnementen, maakAbonnement, werkAbonnementBij } from './stripe-api'
import { bestaandVoorVestiging, hoofdMetadataFormulier, isVestigingModel, koppelPlan, leesAbonnementBasis, maakSleutel, nieuwAbonnementFormulier, type VestigingKort } from './vestiging-abonnement'

export type KoppelUitkomst = 'geen_stripe' | 'geen_abonnement' | 'oud_model' | 'klaar' | 'fout'

async function vestigingenVan(admin: SupabaseClient, organisatieId: string): Promise<VestigingKort[] | null> {
  const { data, error } = await admin.from('club_vestigingen').select('vestiging, standaard, volgorde').eq('user_id', organisatieId).order('volgorde')
  if (error) return null
  return (data ?? []).flatMap((r) => {
    const v = r as { vestiging?: unknown; standaard?: unknown }
    return typeof v.vestiging === 'string' ? [{ sleutel: v.vestiging, standaard: v.standaard === true }] : []
  })
}

async function organisatieKort(admin: SupabaseClient, organisatieId: string): Promise<{ slug: string; pakketten: ReturnType<typeof leesAfgenomen> } | null> {
  const { data, error } = await admin.from('club_organisaties').select('slug, pakketten').eq('id', organisatieId).maybeSingle()
  if (error || !data) return null
  const r = data as { slug?: unknown; pakketten?: unknown }
  return { slug: typeof r.slug === 'string' ? r.slug : '', pakketten: leesAfgenomen(r.pakketten) }
}

async function melden(wat: string): Promise<void> {
  await meldFout({ fout: wat, route: '/api/aiyourgym/cron/staffel', methode: 'POST', soort: 'handmatig' }).catch(() => undefined)
}

/** Het hoofdabonnement aan de eerste vestiging hangen (rij plus metadata bij Stripe). */
async function koppelHoofd(admin: SupabaseClient, sleutel: string, organisatieId: string, vestiging: string, abonnementId: string, klantId: string): Promise<boolean> {
  const claim = await claimVestigingAbonnement(admin, { organisatieId, vestiging, klantId, bron: 'hoofd', abonnementId, status: 'actief' })
  if (claim === 'fout') return false
  if (claim === 'bestaat') {
    // Een vastgelopen claim zonder abonnement op deze vestiging: het hoofdabonnement neemt hem over.
    const { error } = await admin.from('ayg_vestiging_abonnementen').update({ stripe_subscription_id: abonnementId, bron: 'hoofd', status: 'actief', bijgewerkt_op: new Date().toISOString() }).eq('organisatie_id', organisatieId).eq('vestiging', vestiging).is('stripe_subscription_id', null)
    if (error) return false
  }
  return werkAbonnementBij(sleutel, abonnementId, hoofdMetadataFormulier(organisatieId, vestiging), `ayg_hoofd_meta_${abonnementId}_${vestiging}`)
}

interface MaakInvoer {
  sleutel: string
  organisatieId: string
  vestiging: string
  slug: string
  klantId: string
  betaalmethode: string | null
  anker: number | null
  regels: NonNullable<ReturnType<typeof stripeRegels>>
}

/** Een abonnement voor een extra vestiging: claimen, eerst zoeken bij Stripe, dan pas maken. */
async function maakVoorVestiging(admin: SupabaseClient, m: MaakInvoer): Promise<boolean> {
  const claim = await claimVestigingAbonnement(admin, { organisatieId: m.organisatieId, vestiging: m.vestiging, klantId: m.klantId, bron: 'vestiging' })
  if (claim === 'fout') return false
  const { data } = await admin.from('ayg_vestiging_abonnementen').select('id, stripe_subscription_id').eq('organisatie_id', m.organisatieId).eq('vestiging', m.vestiging).maybeSingle()
  const rij = data as { id?: unknown; stripe_subscription_id?: unknown } | null
  if (typeof rij?.id !== 'string') return false
  if (typeof rij.stripe_subscription_id === 'string') return true
  const leden = await actieveLedenVan(admin, m.organisatieId, m.vestiging, dagInNederland(new Date()))
  const hoeveelheid = stripeHoeveelheid(leden ?? 1)
  if (hoeveelheid === null) {
    await melden('Nieuwe vestiging met meer dan 5000 leden: prijs op maat, geen abonnement automatisch gemaakt')
    return false
  }
  // Een eerdere poging die bij Stripe wel lukte nemen we over: nooit twee abonnementen voor een vestiging.
  const bestaand = bestaandVoorVestiging(await lijstAbonnementen(m.sleutel, m.klantId), m.organisatieId, m.vestiging)
  const abonnementId = bestaand ?? (await maakAbonnement(m.sleutel, nieuwAbonnementFormulier({ klantId: m.klantId, regels: m.regels, hoeveelheid, organisatieId: m.organisatieId, vestiging: m.vestiging, slug: m.slug, betaalmethode: m.betaalmethode, anker: m.anker }, Math.floor(Date.now() / 1000)), maakSleutel(m.organisatieId, m.vestiging)))
  if (!abonnementId) return false
  return rondVestigingAbonnementAf(admin, m.organisatieId, rij.id, abonnementId, hoeveelheid)
}

/**
 * Zorg dat elke vestiging van deze sportschool een eigen Stripe-abonnement
 * heeft (idempotent: nog een keer aanroepen doet niets extra).
 */
export async function zorgVoorVestigingAbonnementen(admin: SupabaseClient, organisatieId: string): Promise<KoppelUitkomst> {
  const sleutel = stripeSleutel()
  if (!sleutel) return 'geen_stripe'
  const gelezen = await vindAbonnement(admin, organisatieId)
  if (gelezen.soort === 'fout') return 'fout'
  const a = gelezen.soort === 'gevonden' ? gelezen.rij : null
  if (!a || a.status === 'test' || !isAbonnementId(a.stripeAbonnementId) || !isKlantId(a.stripeKlantId) || !['actief', 'betaling_mislukt'].includes(a.status)) return 'geen_abonnement'

  const hoofd = leesAbonnementBasis(await haalAbonnement(sleutel, a.stripeAbonnementId))
  if (!hoofd) return 'fout'
  // Een abonnement uit het oude model (hoeveelheid = aantal vestigingen) zetten we nooit vanzelf om.
  if (!isVestigingModel(hoofd)) return 'oud_model'

  const [vestigingen, rijen, org] = await Promise.all([vestigingenVan(admin, organisatieId), vestigingAbonnementen(admin, organisatieId), organisatieKort(admin, organisatieId)])
  if (!vestigingen || !rijen || !org) return 'fout'
  const plan = koppelPlan(vestigingen, rijen, hoofd.id)
  if (plan.hoofdNaar && !(await koppelHoofd(admin, sleutel, organisatieId, plan.hoofdNaar, hoofd.id, a.stripeKlantId))) return 'fout'
  if (plan.maken.length === 0) return 'klaar'

  const regels = stripeRegels(org.pakketten)
  if (!regels) return 'fout'
  let alles = true
  for (const vestiging of plan.maken) {
    const ok = await maakVoorVestiging(admin, { sleutel, organisatieId, vestiging, slug: org.slug, klantId: a.stripeKlantId, betaalmethode: hoofd.betaalmethode, anker: hoofd.periodeTot, regels })
    alles = alles && ok
  }
  return alles ? 'klaar' : 'fout'
}

/** De Stripe-abonnementen van een sportschool: het hoofdabonnement plus die per vestiging (zonder dubbelen). */
export async function alleAbonnementIds(admin: SupabaseClient, organisatieId: string, hoofd: string | null): Promise<string[]> {
  const rijen = (await vestigingAbonnementen(admin, organisatieId)) ?? []
  const ids = [hoofd, ...rijen.filter((r) => r.status === 'actief').map((r) => r.abonnementId)].filter((id): id is string => isAbonnementId(id))
  return [...new Set(ids)]
}
