// ─── AI Your Gym: wat de welkomstpagina toont (SERVER-ONLY) ─────────────────
// Na Stripe Checkout komt de bezoeker op /welkom?sessie=cs_... . Wij zoeken de
// aanmelding bij die sessie. Is de webhook er nog niet, maar is de sessie bij
// Stripe wel afgerond, dan richten we de sportschool hier al in (dezelfde,
// idempotente stap). De inloglink tonen we alleen kort na het aanmelden.

import { adresVan } from '@/lib/club/kern/subdomein'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { stripeSleutel } from './config'
import { portaalLink, oorsprongVan } from './links'
import { vindOpSessie, type AanmeldingRij } from './opslag'
import { eigenaarCode } from './sportschool'
import { haalCheckoutSessie } from './stripe-api'
import { SESSIE_ID, leesSessie, sessieKlaar } from './stripe-event'
import { verwerkSessie } from './verwerk'
import { standaardDeps } from './welkom-mail'
import { adminOfNull } from './api'

/** Zo lang na het aanmelden staat de inloglink op deze pagina. */
export const LINK_ZICHTBAAR_MS = 7 * 24 * 60 * 60 * 1000

export type Welkom =
  | { soort: 'onbekend' }
  | { soort: 'bezig' }
  | { soort: 'verlopen' }
  | { soort: 'gestopt' }
  | { soort: 'klaar'; sportschool: string; adres: string; link: string | null; loginOpen: boolean }

const LOPEND = new Set(['actief', 'betaling_mislukt', 'gepauzeerd'])

async function probeerInTeRichten(a: AanmeldingRij, sessieId: string): Promise<boolean> {
  const sleutel = stripeSleutel()
  const admin = adminOfNull()
  if (!sleutel || !admin) return false
  const sessie = leesSessie(await haalCheckoutSessie(sleutel, sessieId))
  if (!sessie || sessie.sessieId !== sessieId || !sessieKlaar(sessie) || sessie.aanmeldingId !== a.id) return false
  return (await verwerkSessie(admin, sessie, standaardDeps())) === 'ingericht'
}

export async function haalWelkom(ruweSessie: unknown, host: string, nu: Date): Promise<Welkom> {
  const sessieId = typeof ruweSessie === 'string' ? ruweSessie : ''
  const admin = adminOfNull()
  if (!SESSIE_ID.test(sessieId) || !admin) return { soort: 'onbekend' }
  let a = await vindOpSessie(admin, sessieId)
  if (!a) return { soort: 'onbekend' }
  if (nu.getTime() - Date.parse(a.aangemaaktOp) > LINK_ZICHTBAAR_MS) return { soort: 'verlopen' }

  if (a.status === 'wacht_op_betaling' && (await probeerInTeRichten(a, sessieId))) a = (await vindOpSessie(admin, sessieId)) ?? a
  if (a.status === 'opgezegd') return { soort: 'gestopt' }
  if (!LOPEND.has(a.status) || !a.organisatieId) return { soort: 'bezig' }

  const code = await eigenaarCode(admin, a.organisatieId, a.eigenaarEmail)
  const link = code
    ? portaalLink({ code, slug: a.slug, subdomeinenAan: process.env.CLUB_SUBDOMEINEN_ACTIEF === '1', portaalUrl: process.env.AIYOURGYM_PORTAAL_URL ?? null, oorsprong: oorsprongVan(host), host })
    : null
  return { soort: 'klaar', sportschool: a.sportschoolNaam, adres: adresVan(a.slug), link, loginOpen: CLUB_EIGEN_LOGIN }
}
