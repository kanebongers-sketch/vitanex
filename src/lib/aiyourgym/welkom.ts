// ─── AI Your Gym: wat de welkomstpagina toont (SERVER-ONLY) ─────────────────
// Na Stripe Checkout komt de bezoeker op /welkom?sessie=cs_... (of na een
// testbetaling op /welkom?sessie=test_..., zie testbetaling.ts). Wij zoeken de
// aanmelding bij die sessie. Is de webhook er nog niet, maar is de sessie bij
// Stripe wel afgerond, dan richten we de sportschool hier al in (dezelfde,
// idempotente stap). De eigenaar logt daarna in met e-mailadres en wachtwoord.

import { adresVan, sportschoolUrl } from '@/lib/club/kern/subdomein'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { stripeSleutel } from './config'
import { vindOpSessie, type AanmeldingRij } from './opslag'
import { haalCheckoutSessie } from './stripe-api'
import { SESSIE_ID, leesSessie, sessieKlaar } from './stripe-event'
import { verwerkSessie } from './verwerk'
import { isTestSessie } from './testbetaling'
import { standaardDeps } from './welkom-mail'
import { adminOfNull } from './api'

/** Zo lang na het aanmelden staat de inloglink op deze pagina. */
export const LINK_ZICHTBAAR_MS = 7 * 24 * 60 * 60 * 1000

export type Welkom =
  | { soort: 'onbekend' }
  | { soort: 'bezig' }
  | { soort: 'verlopen' }
  | { soort: 'gestopt' }
  /** Betaald, maar niet automatisch klaargezet (bijvoorbeeld een adres dat al een account heeft): Kane neemt contact op. */
  | { soort: 'nakijken' }
  | { soort: 'klaar'; sportschool: string; adres: string; inlogUrl: string; email: string; loginOpen: boolean }

const LOPEND = new Set(['actief', 'betaling_mislukt', 'gepauzeerd'])

async function probeerInTeRichten(a: AanmeldingRij, sessieId: string): Promise<boolean> {
  const sleutel = stripeSleutel()
  const admin = adminOfNull()
  if (!sleutel || !admin) return false
  const sessie = leesSessie(await haalCheckoutSessie(sleutel, sessieId))
  if (!sessie || sessie.sessieId !== sessieId || !sessieKlaar(sessie) || sessie.aanmeldingId !== a.id) return false
  return (await verwerkSessie(admin, sessie, standaardDeps())) === 'ingericht'
}

export async function haalWelkom(ruweSessie: unknown, nu: Date): Promise<Welkom> {
  const sessieId = typeof ruweSessie === 'string' ? ruweSessie : ''
  const admin = adminOfNull()
  const test = isTestSessie(sessieId)
  if ((!SESSIE_ID.test(sessieId) && !test) || !admin) return { soort: 'onbekend' }
  let a = await vindOpSessie(admin, sessieId)
  if (!a) return { soort: 'onbekend' }
  if (nu.getTime() - Date.parse(a.aangemaaktOp) > LINK_ZICHTBAAR_MS) return { soort: 'verlopen' }

  // Alleen bij Stripe: een testbetaling wordt afgerond op de testbetaalpagina zelf.
  if (!test && a.status === 'wacht_op_betaling' && (await probeerInTeRichten(a, sessieId))) a = (await vindOpSessie(admin, sessieId)) ?? a
  if (a.status === 'opgezegd') return { soort: 'gestopt' }
  if (a.status === 'aanvraag') return { soort: 'nakijken' }
  if (!LOPEND.has(a.status) || !a.organisatieId) return { soort: 'bezig' }

  // Het adres werkt meteen: aiyourgym.com/<slug> (of het subdomein met de schakelaar aan).
  const subdomeinen = process.env.CLUB_SUBDOMEINEN_ACTIEF === '1'
  return { soort: 'klaar', sportschool: a.sportschoolNaam, adres: adresVan(a.slug, subdomeinen), inlogUrl: subdomeinen ? sportschoolUrl(a.slug, true, '/inloggen') : `/${a.slug}/inloggen`, email: a.eigenaarEmail, loginOpen: CLUB_EIGEN_LOGIN }
}
