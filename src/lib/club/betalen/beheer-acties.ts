// ─── Club, betalen: acties van Kane of de eigenaar (SERVER-ONLY) ────────────
// Connect-onboarding, de schakelaar per sportschool, producten en
// terugbetalen. De aanroeper heeft de toegang al gecontroleerd
// (vereisBetalenBeheer); alles hier filtert nog op t.userId.

import type { NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, type ClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { NIET_KLAAR, clubStripeSleutel } from './config'
import { onboardingAdressen } from './adressen'
import { leesProductInvoer, productRij } from './invoer'
import { bewaarAccountId, claimTerugbetaling, geefTerugbetalingVrij, haalBetaalAccount, haalVerkoopStripe, maakProduct, verwijderProduct, werkAccountStandBij, wijzigProduct, zetBetalenAan } from './opslag'
import { magTerugbetalen } from './regels'
import { haalAccount, maakAccount, maakAccountLink, maakDashboardLink, maakTerugbetaling } from './stripe-api'
import { leesAccount } from './stripe-event'

const ONBEREIKBAAR = 'Stripe reageerde niet. Probeer het over een paar minuten opnieuw.'

/** Onboarding starten of hervatten: een Express-account (een keer) en een verse account link. */
export async function startOnboarding(t: ClubToegang, oorsprong: string | null): Promise<NextResponse> {
  const sleutel = clubStripeSleutel()
  if (!sleutel) return clubFout(NIET_KLAAR, 503)
  if (!oorsprong) return clubFout('Onboarding kon niet worden gestart.', 400)
  const huidig = await haalBetaalAccount(t.admin, t.userId)
  if (!huidig) return clubFout('De betaalgegevens konden niet worden gelezen.', 500)
  let accountId = huidig.stripeAccountId
  if (!accountId) {
    accountId = await maakAccount(sleutel, t.userId, t.organisatie.naam)
    if (!accountId || !(await bewaarAccountId(t.admin, t.userId, accountId))) return clubFout(ONBEREIKBAAR, 502)
    await logActie(t, 'Stripe-account aangemaakt voor betalen', null, null)
  }
  const adressen = onboardingAdressen(oorsprong)
  const url = await maakAccountLink(sleutel, accountId, adressen.terug, adressen.opnieuw)
  return url ? clubJson({ url }) : clubFout(ONBEREIKBAAR, 502)
}

/** De stand bij Stripe ophalen en bewaren (na terugkomen van de onboarding). */
export async function verversStand(t: ClubToegang): Promise<NextResponse> {
  const sleutel = clubStripeSleutel()
  const huidig = await haalBetaalAccount(t.admin, t.userId)
  if (!huidig) return clubFout('De betaalgegevens konden niet worden gelezen.', 500)
  if (!sleutel || !huidig.stripeAccountId) return clubJson({ account: huidig })
  const stand = leesAccount(await haalAccount(sleutel, huidig.stripeAccountId))
  if (!stand || stand.accountId !== huidig.stripeAccountId) return clubFout(ONBEREIKBAAR, 502)
  if ((await werkAccountStandBij(t.admin, stand)) === 'fout') return clubFout('De stand kon niet worden bewaard.', 500)
  return clubJson({ account: { ...huidig, chargesAan: stand.chargesAan, uitbetalenAan: stand.uitbetalenAan, gegevensCompleet: stand.gegevensCompleet } })
}

export async function dashboardLink(t: ClubToegang): Promise<NextResponse> {
  const sleutel = clubStripeSleutel()
  const huidig = await haalBetaalAccount(t.admin, t.userId)
  if (!sleutel) return clubFout(NIET_KLAAR, 503)
  if (!huidig?.stripeAccountId || !huidig.gegevensCompleet) return clubFout('Rond eerst de onboarding bij Stripe af.', 409)
  const url = await maakDashboardLink(sleutel, huidig.stripeAccountId)
  return url ? clubJson({ url }) : clubFout(ONBEREIKBAAR, 502)
}

export async function zetSchakelaar(t: ClubToegang, aan: unknown): Promise<NextResponse> {
  if (typeof aan !== 'boolean') return clubFout('Kies aan of uit.', 400)
  const huidig = await haalBetaalAccount(t.admin, t.userId)
  if (!huidig) return clubFout('De betaalgegevens konden niet worden gelezen.', 500)
  if (aan && !huidig.chargesAan) return clubFout('Rond eerst de onboarding bij Stripe af. Daarna kun je betalen aanzetten.', 409)
  if (!(await zetBetalenAan(t.admin, t.userId, aan))) return clubFout('Opslaan is niet gelukt.', 500)
  await logActie(t, aan ? 'Betalen in de ledenapp aangezet' : 'Betalen in de ledenapp uitgezet', null, null)
  return clubJson({ betalenAan: aan })
}

// ─── Producten ──────────────────────────────────────────────────────────────

function vestigingSlugs(t: ClubToegang): string[] {
  return t.vestigingen.map((v) => v.sleutel)
}

export async function nieuwProduct(t: ClubToegang, body: unknown): Promise<NextResponse> {
  const invoer = leesProductInvoer(body, vestigingSlugs(t))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const product = await maakProduct(t.admin, t.userId, productRij(invoer.waarde))
  if (!product) return clubFout('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  await logActie(t, 'Product toegevoegd', product.naam, null)
  return clubJson({ product }, 201)
}

export async function pasProductAan(t: ClubToegang, id: string, body: unknown): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const invoer = leesProductInvoer(body, vestigingSlugs(t))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const product = await wijzigProduct(t.admin, t.userId, id, productRij(invoer.waarde))
  if (!product) return clubFout('Niet gevonden.', 404)
  await logActie(t, 'Product aangepast', product.naam, null)
  return clubJson({ product })
}

export async function haalProductWeg(t: ClubToegang, id: string): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const uit = await verwijderProduct(t.admin, t.userId, id)
  if (uit === 'fout') return clubFout('Verwijderen is niet gelukt.', 500)
  await logActie(t, uit === 'weg' ? 'Product verwijderd' : 'Product uit de verkoop gehaald', null, null)
  return clubJson({ uitkomst: uit })
}

// ─── Terugbetalen ───────────────────────────────────────────────────────────

/** Het hele bedrag terug naar het lid. De webhook (charge.refunded) zet de verkoop en het tegoed bij. */
export async function betaalTerug(t: ClubToegang, id: string): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const sleutel = clubStripeSleutel()
  if (!sleutel) return clubFout(NIET_KLAAR, 503)
  const v = await haalVerkoopStripe(t.admin, t.userId, id)
  if (!v) return clubFout('Niet gevonden.', 404)
  if (!magTerugbetalen(v) || !v.paymentIntent) return clubFout('Deze verkoop kan niet (meer) worden terugbetaald.', 409)
  if (!(await claimTerugbetaling(t.admin, t.userId, id))) return clubFout('Er loopt al een terugbetaling voor deze verkoop.', 409)
  const ok = await maakTerugbetaling(sleutel, v.stripeAccountId, v.paymentIntent, v.id, v.platformFeeCent > 0)
  if (!ok) {
    await geefTerugbetalingVrij(t.admin, t.userId, id)
    return clubFout('Stripe kon de terugbetaling niet uitvoeren. Kijk of er genoeg saldo op het Stripe-account staat.', 502)
  }
  await logActie(t, 'Terugbetaling aangevraagd', v.productNaam, v.vestiging)
  return clubJson({ aangevraagd: true })
}
