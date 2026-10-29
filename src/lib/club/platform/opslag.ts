// ─── AI Your Gym: het platformoverzicht ophalen (SERVER-ONLY) ───────────────
// Alleen voor Kane (/club/platform, layout met eisPlatformEigenaar). Leest per
// sportschool van Kane de tellingen, de aanmeldingen uit ayg_aanmeldingen, de
// open supportmeldingen en de fouten van de laatste 24 uur. Elke vraag is
// begrensd; wat niet te lezen is wordt null en komt als melding op de pagina,
// de rest van het overzicht blijft gewoon werken.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import { stripeAbonnementVan } from '@/lib/aiyourgym/abonnement-opslag'
import { stripeSleutel } from '@/lib/aiyourgym/config'
import type { AanmeldStatus } from '@/lib/aiyourgym/status'
import {
  AANMELDING_KOLOMMEN,
  aanmeldingPerOrganisatie,
  aanmeldingUitRij,
  isInProef,
  kerncijfers,
  maandBegin,
  nieuwsteEerst,
  startStand,
  urenGeleden,
  type Kerncijfers,
  type PlatformAanmelding,
  type StartStand,
} from './tellingen'
import { haalDemoAanvragen, telOpen, type PlatformDemoAanvraag } from './demo-aanvragen'

/** Grenzen per vraag, zodat de pagina ook bij veel klanten snel en klein blijft. */
export const MAX_SPORTSCHOLEN = 60
export const MAX_AANMELDINGEN = 200
const MAX_SUPPORT = 1000
const STRIPE_WACHT_MS = 5000
/** Statussen waarbij Stripe een lopend abonnement bijhoudt (en dus een proefperiode kan hebben). */
const LOPEND: ReadonlySet<AanmeldStatus> = new Set(['actief', 'betaling_mislukt', 'gepauzeerd'])

export interface LaatsteActiviteit {
  op: string
  actie: string
  wie: string | null
}

export interface SportschoolRegel {
  id: string
  naam: string
  slug: string | null
  demo: boolean
  /** De eigen sportschool van Kane (Fit Factory). */
  eigen: boolean
  actief: boolean
  vestigingen: number | null
  leden: number | null
  medewerkers: number | null
  checkins: number | null
  /** null = niet te lezen. */
  start: StartStand | null
  /** undefined = niet te lezen; null = nog niets in het logboek. */
  laatste: LaatsteActiviteit | null | undefined
  aanmelding: PlatformAanmelding | null
  /** Het einde van de proefperiode (ISO) als die nog loopt; undefined = Stripe niet te lezen. */
  proefTot: string | null | undefined
}

export interface PlatformStand {
  sportscholen: SportschoolRegel[]
  /** Nieuwste eerst; null = niet te lezen. */
  aanmeldingen: PlatformAanmelding[] | null
  /** Demo-aanvragen van de website, open eerst; null = niet te lezen. */
  demoAanvragen: PlatformDemoAanvraag[] | null
  cijfers: Kerncijfers
  /** Korte meldingen over wat niet te lezen was. */
  problemen: string[]
  /** Er zijn meer sportscholen dan we tonen. */
  afgekapt: boolean
}

type Telling = { count: number | null; error: { message: string } | null }

function telUit(r: Telling, wat: string, problemen: Set<string>): number | null {
  if (r.error || r.count === null) {
    console.error(`[platform] ${wat} tellen mislukt`, r.error?.message ?? '')
    problemen.add(`${wat} niet te tellen.`)
    return null
  }
  return r.count
}

async function telPerSportschool(admin: SupabaseClient, id: string, vanaf: string, problemen: Set<string>) {
  const [vestigingen, leden, medewerkers, checkins] = await Promise.all([
    admin.from('club_vestigingen').select('vestiging', { count: 'exact', head: true }).eq('user_id', id),
    admin.from('club_leden').select('id', { count: 'exact', head: true }).eq('user_id', id).in('status', ['actief', 'proef']),
    admin.from('club_medewerkers').select('id', { count: 'exact', head: true }).eq('user_id', id).eq('actief', true),
    admin.from('club_checkins').select('id', { count: 'exact', head: true }).eq('user_id', id).gte('op', vanaf),
  ])
  return {
    vestigingen: telUit(vestigingen, 'Vestigingen', problemen),
    leden: telUit(leden, 'Leden', problemen),
    medewerkers: telUit(medewerkers, 'Medewerkers', problemen),
    checkins: telUit(checkins, 'Check-ins', problemen),
  }
}

async function laatsteActiviteit(admin: SupabaseClient, id: string, problemen: Set<string>): Promise<LaatsteActiviteit | null | undefined> {
  const { data, error } = await admin.from('club_logboek').select('op, actie, wie').eq('user_id', id).order('op', { ascending: false }).limit(1).maybeSingle()
  if (error) {
    console.error('[platform] logboek lezen mislukt', error.message)
    problemen.add('Logboek niet te lezen.')
    return undefined
  }
  if (!data || typeof data.op !== 'string') return null
  return { op: data.op, actie: typeof data.actie === 'string' ? data.actie : '', wie: typeof data.wie === 'string' ? data.wie : null }
}

/** De ruwe instellingen (voor de startwizard) per sportschool; null bij een leesfout. */
async function haalInstellingen(admin: SupabaseClient, beheerderId: string, problemen: Set<string>): Promise<Map<string, unknown> | null> {
  const { data, error } = await admin.from('club_organisaties').select('id, instellingen').eq('beheerder_id', beheerderId).limit(MAX_SPORTSCHOLEN)
  if (error) {
    console.error('[platform] instellingen lezen mislukt', error.message)
    problemen.add('Voortgang van de startwizard niet te lezen.')
    return null
  }
  return new Map((data ?? []).map((r) => [String(r.id), r.instellingen]))
}

async function haalAanmeldingen(admin: SupabaseClient, problemen: Set<string>): Promise<PlatformAanmelding[] | null> {
  const { data, error } = await admin.from('ayg_aanmeldingen').select(AANMELDING_KOLOMMEN).order('aangemaakt_op', { ascending: false }).limit(MAX_AANMELDINGEN)
  if (error) {
    console.error('[platform] aanmeldingen lezen mislukt', error.code ?? '')
    problemen.add('Aanmeldingen niet te lezen. Staat migratie 422 (ayg_aanmeldingen) op de database?')
    return null
  }
  return nieuwsteEerst((data ?? []).map(aanmeldingUitRij).filter((a): a is PlatformAanmelding => a !== null))
}

async function haalSupportStatussen(admin: SupabaseClient, ids: string[], problemen: Set<string>): Promise<string[] | null> {
  const { data, error } = await admin.from('club_support').select('status').in('user_id', ids).in('status', ['open', 'bezig']).limit(MAX_SUPPORT)
  if (error) {
    console.error('[platform] supportmeldingen lezen mislukt', error.message)
    problemen.add('Supportmeldingen niet te lezen.')
    return null
  }
  return (data ?? []).map((r) => String(r.status))
}

async function telFouten24(admin: SupabaseClient, nu: Date, problemen: Set<string>): Promise<number | null> {
  const r = await admin.from('club_fouten').select('id', { count: 'exact', head: true }).gte('laatst_op', urenGeleden(nu, 24))
  return telUit(r, 'Fouten', problemen)
}

/** Het abonnement bij Stripe, met een eigen korte wachttijd; null bij geen antwoord. */
async function proefVan(a: PlatformAanmelding, nu: Date): Promise<string | null | undefined> {
  if (!LOPEND.has(a.status) || !a.stripeAbonnementId) return null
  let klok: ReturnType<typeof setTimeout> | undefined
  const wacht = new Promise<undefined>((klaar) => {
    klok = setTimeout(() => klaar(undefined), STRIPE_WACHT_MS)
  })
  const vraag = stripeAbonnementVan({ pakket: a.pakket, pakketten: null, aantalVestigingen: a.aantalVestigingen, status: a.status, stripeKlantId: null, stripeAbonnementId: a.stripeAbonnementId, aangemaaktOp: a.aangemaaktOp })
    .then((s) => (s ? (isInProef(s.proefTot, nu) && s.proefTot ? s.proefTot.toISOString() : null) : undefined))
    .catch(() => undefined)
  try {
    return await Promise.race([vraag, wacht])
  } finally {
    clearTimeout(klok)
  }
}

async function regelVoor(admin: SupabaseClient, o: Organisatie, t: ClubToegang, ctx: { vanaf: string; nu: Date; instellingen: Map<string, unknown> | null; perOrg: Map<string, PlatformAanmelding>; problemen: Set<string> }): Promise<SportschoolRegel> {
  const aanmelding = ctx.perOrg.get(o.id) ?? null
  const [tellingen, laatste, proefTot] = await Promise.all([
    telPerSportschool(admin, o.id, ctx.vanaf, ctx.problemen),
    laatsteActiviteit(admin, o.id, ctx.problemen),
    aanmelding ? proefVan(aanmelding, ctx.nu) : Promise.resolve(null),
  ])
  return {
    id: o.id,
    naam: o.naam,
    slug: o.slug,
    demo: o.demo,
    eigen: o.id === t.beheerderId,
    actief: o.id === t.userId,
    ...tellingen,
    start: ctx.instellingen ? startStand(ctx.instellingen.get(o.id)) : null,
    laatste,
    aanmelding,
    proefTot,
  }
}

/** Alles voor /club/platform. Alleen aanroepen voor Kane (eisPlatformEigenaar). */
export async function haalPlatform(t: ClubToegang, nu: Date): Promise<PlatformStand> {
  const problemen = new Set<string>()
  const admin = t.admin
  const lijst = t.organisaties.slice(0, MAX_SPORTSCHOLEN)
  const ids = lijst.map((o) => o.id)
  const [aanmeldingen, demoAanvragen, instellingen, supportStatussen, fouten24] = await Promise.all([
    haalAanmeldingen(admin, problemen),
    haalDemoAanvragen(admin, problemen),
    haalInstellingen(admin, t.beheerderId, problemen),
    haalSupportStatussen(admin, ids, problemen),
    telFouten24(admin, nu, problemen),
  ])
  const ctx = { vanaf: maandBegin(nu), nu, instellingen, perOrg: aanmeldingPerOrganisatie(aanmeldingen ?? []), problemen }
  const sportscholen = await Promise.all(lijst.map((o) => regelVoor(admin, o, t, ctx)))

  const teLezen = sportscholen.filter((s) => s.aanmelding && LOPEND.has(s.aanmelding.status) && s.aanmelding.stripeAbonnementId)
  const stripeMist = teLezen.some((s) => s.proefTot === undefined)
  if (stripeMist) problemen.add(stripeSleutel() ? 'Stripe gaf niet op tijd antwoord: de proefperiodes zijn onvolledig.' : 'Geen Stripe-sleutel ingesteld: de proefperiodes zijn niet te lezen.')
  const inProef = stripeMist ? null : sportscholen.filter((s) => typeof s.proefTot === 'string').length

  return {
    sportscholen,
    aanmeldingen,
    demoAanvragen,
    cijfers: { ...kerncijfers({ aanmeldingen, inProef, supportStatussen, fouten24 }), demoOpen: telOpen(demoAanvragen) },
    problemen: [...problemen],
    afgekapt: t.organisaties.length > lijst.length,
  }
}
