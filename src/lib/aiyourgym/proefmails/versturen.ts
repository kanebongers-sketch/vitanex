// ─── AI Your Gym: de proefmails versturen (SERVER-ONLY) ─────────────────────
// De cron (/api/aiyourgym/cron/proefmails) roept dit aan. Alleen met de
// schakelaar AIYOURGYM_PROEFMAILS=1 en een afzender (AIYOURGYM_RESEND_FROM plus
// RESEND_API_KEY), dezelfde Resend als de welkomstmail. Elke mail gaat precies
// een keer weg: eerst een claim in ayg_proefmails (migratie 459), dan versturen;
// mislukt het versturen, dan gaat de claim weer weg zodat een volgende run het
// opnieuw probeert. Alleen naar het e-mailadres van de eigenaar die zich aanmeldde.

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'
import { abonnementUitRij, ABONNEMENT_PAD } from '../abonnement'
import { stripeAbonnementVan } from '../abonnement-opslag'
import { mailAfzender } from '../config'
import { PROEFDAGEN } from '../pakketten'
import { subdomeinenActief } from '../schakelaar'
import { PROEFMAIL_SOORTEN, isProefmailSoort, planProefmail, proefmailsAan, type ProefmailSoort } from './planner'
import { DAG_MS, proefTotVan } from './proefperiode'
import { proefmailTekst } from './teksten'

const MAX_PER_RUN = 100

export interface ProefmailVerslag {
  aan: boolean
  bekeken: number
  verstuurd: number
  mislukt: number
}

interface Kandidaat {
  id: string
  /** club_organisaties.id: daar staan de actuele naam en het actuele adres. */
  organisatieId: string | null
  sportschool: string
  slug: string
  voornaam: string
  email: string
  aangemaaktOp: string
  /** De ruwe rij, voor het abonnement bij Stripe. */
  rij: unknown
  metStripe: boolean
}

function kandidaatUit(r: Record<string, unknown>): Kandidaat | null {
  if (typeof r.id !== 'string' || typeof r.eigenaar_email !== 'string' || typeof r.slug !== 'string' || typeof r.aangemaakt_op !== 'string') return null
  const naam = typeof r.eigenaar_naam === 'string' ? r.eigenaar_naam.trim() : ''
  return {
    id: r.id,
    organisatieId: typeof r.organisatie_id === 'string' ? r.organisatie_id : null,
    sportschool: typeof r.sportschool_naam === 'string' ? r.sportschool_naam : 'Je sportschool',
    slug: r.slug,
    voornaam: naam.split(' ')[0] || 'daar',
    email: r.eigenaar_email,
    aangemaaktOp: r.aangemaakt_op,
    rij: r,
    metStripe: Boolean(r.stripe_customer_id || r.stripe_subscription_id),
  }
}

/** Actieve sportscholen waarvan de proefperiode nog kan lopen. */
async function haalKandidaten(admin: SupabaseClient, nu: Date): Promise<Kandidaat[] | null> {
  const sinds = new Date(nu.getTime() - (PROEFDAGEN + 2) * DAG_MS).toISOString()
  const { data, error } = await admin
    .from('ayg_aanmeldingen')
    .select('id, pakket, aantal_vestigingen, sportschool_naam, slug, eigenaar_naam, eigenaar_email, status, stripe_customer_id, stripe_subscription_id, organisatie_id, aangemaakt_op')
    .eq('status', 'actief')
    .not('organisatie_id', 'is', null)
    .gte('aangemaakt_op', sinds)
    .order('aangemaakt_op', { ascending: true })
    .limit(MAX_PER_RUN)
  if (error) {
    console.error('[aiyourgym] proefmails: aanmeldingen lezen mislukt', error.code ?? '')
    return null
  }
  const kandidaten = (data ?? []).map((r) => kandidaatUit(r as Record<string, unknown>)).filter((k): k is Kandidaat => k !== null)
  return metActueleNaam(admin, kandidaten)
}

/**
 * De naam en het adres bij het aanmelden kunnen sindsdien veranderd zijn (Huisstijl, Adres).
 * De mail noemt altijd de actuele naam en linkt naar het actuele adres; lukt het lezen niet, dan die van het aanmelden.
 */
async function metActueleNaam(admin: SupabaseClient, kandidaten: Kandidaat[]): Promise<Kandidaat[]> {
  const ids = [...new Set(kandidaten.map((k) => k.organisatieId).filter((id): id is string => id !== null))]
  if (ids.length === 0) return kandidaten
  const { data, error } = await admin.from('club_organisaties').select('id, naam, slug').in('id', ids)
  if (error) {
    console.error('[aiyourgym] proefmails: actuele namen lezen mislukt', error.code ?? '')
    return kandidaten
  }
  return actueleSportschool(kandidaten, (data ?? []) as { id: unknown; naam: unknown; slug: unknown }[])
}

/** PUUR: vervang naam en adres door die uit club_organisaties, als die er zijn. */
export function actueleSportschool<K extends { organisatieId: string | null; sportschool: string; slug: string }>(kandidaten: K[], rijen: readonly { id: unknown; naam: unknown; slug: unknown }[]): K[] {
  const opId = new Map(rijen.filter((r) => typeof r.id === 'string').map((r) => [r.id as string, r]))
  return kandidaten.map((k) => {
    const r = k.organisatieId ? opId.get(k.organisatieId) : undefined
    if (!r) return k
    return {
      ...k,
      sportschool: typeof r.naam === 'string' && r.naam.trim() ? r.naam : k.sportschool,
      slug: typeof r.slug === 'string' && r.slug ? r.slug : k.slug,
    }
  })
}

async function haalVerstuurd(admin: SupabaseClient, ids: string[]): Promise<Map<string, Set<ProefmailSoort>> | null> {
  if (ids.length === 0) return new Map()
  const { data, error } = await admin.from('ayg_proefmails').select('aanmelding_id, soort').in('aanmelding_id', ids)
  if (error) {
    console.error('[aiyourgym] proefmails: verstuurde mails lezen mislukt', error.code ?? '')
    return null
  }
  const uit = new Map<string, Set<ProefmailSoort>>()
  for (const r of data ?? []) {
    const id = String((r as { aanmelding_id: unknown }).aanmelding_id)
    const soort = (r as { soort: unknown }).soort
    if (isProefmailSoort(soort)) uit.set(id, new Set([...(uit.get(id) ?? []), soort]))
  }
  return uit
}

/** Het einde van de proefperiode (bij Stripe het einde dat Stripe noemt). */
async function eindeVan(k: Kandidaat): Promise<Date | null> {
  const rij = abonnementUitRij(k.rij)
  if (!rij) return null
  const stripe = k.metStripe ? await stripeAbonnementVan(rij) : null
  return proefTotVan({ status: rij.status, aangemaaktOp: k.aangemaaktOp, metStripe: k.metStripe }, stripe)
}

async function claim(admin: SupabaseClient, id: string, soort: ProefmailSoort, nu: Date): Promise<boolean> {
  const { error } = await admin.from('ayg_proefmails').insert({ aanmelding_id: id, soort, verstuurd_op: nu.toISOString() })
  if (error && error.code !== '23505') console.error('[aiyourgym] proefmails: claim mislukt', error.code ?? '')
  return !error
}

async function stuur(resend: Resend, van: string, k: Kandidaat, soort: ProefmailSoort, einde: Date): Promise<boolean> {
  const sub = subdomeinenActief()
  const { onderwerp, tekst } = proefmailTekst(soort, {
    voornaam: k.voornaam,
    sportschool: k.sportschool,
    inlogUrl: sportschoolUrl(k.slug, sub, '/inloggen'),
    abonnementUrl: sportschoolUrl(k.slug, sub, ABONNEMENT_PAD),
    einde,
    metBetaling: k.metStripe,
  })
  try {
    const { error } = await resend.emails.send({ from: van, to: k.email, subject: onderwerp, text: tekst })
    if (error) console.error('[aiyourgym] proefmail mislukt', error.name)
    return !error
  } catch (err) {
    console.error('[aiyourgym] proefmail mislukt', err instanceof Error ? err.name : 'onbekend')
    return false
  }
}

/** Verstuur wat aan de beurt is. Null bij een databasefout. */
export async function verstuurProefmails(admin: SupabaseClient, nu: Date, env: Record<string, string | undefined> = process.env): Promise<ProefmailVerslag | null> {
  const leeg: ProefmailVerslag = { aan: false, bekeken: 0, verstuurd: 0, mislukt: 0 }
  const van = mailAfzender(env)
  if (!proefmailsAan(env) || !van) return leeg
  const kandidaten = await haalKandidaten(admin, nu)
  const verstuurd = kandidaten ? await haalVerstuurd(admin, kandidaten.map((k) => k.id)) : null
  if (!kandidaten || !verstuurd) return null
  const resend = new Resend(env.RESEND_API_KEY)
  let teller = { ...leeg, aan: true, bekeken: kandidaten.length }
  for (const k of kandidaten) {
    const al = verstuurd.get(k.id) ?? new Set<ProefmailSoort>()
    if (al.size >= PROEFMAIL_SOORTEN.length) continue
    // Het echte einde: bij Stripe opgevraagd (alleen voor de paar sportscholen in hun eerste weken), anders begin plus PROEFDAGEN.
    const einde = await eindeVan(k)
    const soort = planProefmail({ start: new Date(k.aangemaaktOp), einde, verstuurd: al, nu })
    if (!soort || !einde || !(await claim(admin, k.id, soort, nu))) continue
    if (await stuur(resend, van, k, soort, einde)) teller = { ...teller, verstuurd: teller.verstuurd + 1 }
    else {
      await admin.from('ayg_proefmails').delete().eq('aanmelding_id', k.id).eq('soort', soort)
      teller = { ...teller, mislukt: teller.mislukt + 1 }
    }
  }
  return teller
}
