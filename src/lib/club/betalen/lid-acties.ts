// ─── Club, betalen: acties van een lid in de ledenapp (SERVER-ONLY) ─────────
// Het lid komt altijd uit de sessie (vereisLidToegang). Bedragen komen altijd
// uit onze database, nooit uit de body. Kaartgegevens zien wij nooit: het lid
// betaalt op de pagina van Stripe.

import type { NextResponse } from 'next/server'
import { clubFout, clubJson, logActie } from '@/lib/club/toegang'
import type { LidToegang } from '@/lib/club/ledenlogin/toegang'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { isUuid } from '@/lib/club/kern/organisatie'
import { haalLesRij } from '@/lib/club/rooster/basis-opslag'
import { reserveer, trekBoekingIn } from '@/lib/club/rooster/reserveren-opslag'
import { haalVormVanLid, telLessenVanLid } from '@/lib/club/lidmaatschappen/toegang-opslag'
import { appMelding, lesAanvraag } from '@/lib/club/lidmaatschappen/koppeling'
import { magLesBoeken } from '@/lib/club/lidmaatschappen/regels'
import { NIET_KLAAR, betalenActief, clubStripeSleutel, PLATFORM_FEE_CENT } from './config'
import { kopenAdressen } from './adressen'
import { boekTegoedAf, haalBetaalAccount, haalProduct, haalTegoeden, kanAfrekenen, koppelSessie, maakVerkoop, telOpenVanLid } from './opslag'
import { bruikbaarSaldo, productVoorVestiging, stripBesluit } from './regels'
import { maakCheckoutSessie } from './stripe-api'
import { stripTerugNaAnnuleren } from './terug-bij-annuleren'

const MAX_OPEN_PER_UUR = 5
const VOORVERTONING = 'In de voorvertoning reken je niet af en boek je geen strippen. Dat doet het lid zelf in de app.'

/** Een product kopen: een verkoop vastleggen en een Checkout Session op het account van de sportschool. */
export async function koopProduct(l: LidToegang, productId: unknown, oorsprong: string | null): Promise<NextResponse> {
  if (!betalenActief()) return clubFout('Niet gevonden.', 404)
  if (l.voorvertoning) return clubFout(VOORVERTONING, 403)
  if (!isUuid(productId)) return clubFout('Kies een product.', 400)
  const sleutel = clubStripeSleutel()
  const account = await haalBetaalAccount(l.admin, l.userId)
  if (!sleutel || !kanAfrekenen(account)) return clubFout(NIET_KLAAR, 503)
  if (!oorsprong) return clubFout('Afrekenen kon niet worden gestart.', 400)
  const product = await haalProduct(l.admin, l.userId, productId)
  if (!product || !productVoorVestiging(product, l.lid.vestiging)) return clubFout('Dit product is niet (meer) te koop.', 404)
  const nu = new Date()
  const open = await telOpenVanLid(l.admin, l.userId, l.lid.id, nu)
  if (open === null) return clubFout('Afrekenen lukte niet. Probeer het opnieuw.', 500)
  if (open >= MAX_OPEN_PER_UUR) return clubFout('Je hebt al een paar betalingen openstaan. Probeer het over een uur opnieuw.', 429)

  const verkoopId = await maakVerkoop(l.admin, l.userId, { lidId: l.lid.id, vestiging: l.lid.vestiging, product, platformFeeCent: PLATFORM_FEE_CENT, stripeAccountId: account.stripeAccountId })
  if (!verkoopId) return clubFout('Afrekenen lukte niet. Probeer het opnieuw.', 500)
  const adressen = kopenAdressen(oorsprong, null)
  const sessie = await maakCheckoutSessie(sleutel, account.stripeAccountId, {
    verkoopId,
    organisatieId: l.userId,
    productNaam: product.naam,
    bedragCent: product.prijsCent,
    email: l.lid.email,
    succesUrl: adressen.succes,
    terugUrl: adressen.terug,
  })
  if (!sessie || !(await koppelSessie(l.admin, l.userId, verkoopId, sessie.id))) return clubFout('Betalen kon niet worden gestart. Probeer het later opnieuw.', 502)
  await logActie(l, 'Afrekenen gestart in ledenapp', `${volledigeNaam(l.lid)}, ${product.naam}`, l.lid.vestiging)
  return clubJson({ url: sessie.url })
}

/** Mag deze les met een strip, en heeft het lid er een? Null = ja; anders de melding. */
async function stripToets(l: LidToegang, les: { id: string; vestiging: string; startOp: string; eindOp: string }, nu: Date): Promise<string | null> {
  const vorm = await haalVormVanLid(l.admin, l.userId, l.lid.abonnement)
  const start = new Date(les.startOp)
  const lessen = vorm?.groepslessen && vorm.maxLessenPerWeek !== null ? await telLessenVanLid(l.admin, l.userId, l.lid.id, les.id, start) : 0
  const uitslag = magLesBoeken(vorm, lesAanvraag({ vestiging: les.vestiging, start, eind: new Date(les.eindOp) }, lessen ?? 0))
  const besluit = stripBesluit(uitslag)
  if (besluit.soort === 'niet_nodig') return 'Je lidmaatschap dekt deze les. Boek hem gewoon met Reserveren.'
  if (besluit.soort === 'nee') return uitslag.mag ? besluit.reden : appMelding(uitslag.waarom, uitslag.reden)
  const tegoeden = await haalTegoeden(l.admin, l.userId, l.lid.id)
  if (!tegoeden) return 'Je strippenkaart kon niet worden gelezen. Probeer het opnieuw.'
  return bruikbaarSaldo(tegoeden, 'les', les.vestiging, nu) > 0 ? null : 'Je hebt geen geldige strippen voor deze vestiging. Koop een strippenkaart onder Kopen.'
}

/** Terugdraaien van een strip-boeking lukte niet: eerlijk melden en vastleggen voor de sportschool. */
async function terugdraaienMislukt(l: LidToegang, reserveringId: string): Promise<NextResponse> {
  console.error('[club/betalen] strip-boeking terugdraaien mislukt', reserveringId)
  await logActie(l, 'Strip-boeking niet teruggedraaid', `${volledigeNaam(l.lid)}, reservering ${reserveringId}`, l.lid.vestiging)
  return clubFout('Er ging iets mis met deze boeking. Kijk bij Mijn lessen of meld je daar af; er is geen strip afgeboekt.', 500)
}

/** Een groepsles boeken met de strippenkaart: boeken, dan een strip afboeken (of de boeking terugdraaien). */
export async function boekMetStrippenkaart(l: LidToegang, lesId: unknown): Promise<NextResponse> {
  if (!betalenActief()) return clubFout('Niet gevonden.', 404)
  if (l.voorvertoning) return clubFout(VOORVERTONING, 403)
  if (!isUuid(lesId)) return clubFout('Kies een les.', 400)
  const les = await haalLesRij(l.admin, l.userId, lesId)
  if (!les) return clubFout('Deze les bestaat niet.', 404)
  const nu = new Date()
  const melding = await stripToets(l, les, nu)
  if (melding) return clubFout(melding, 409)

  const uit = await reserveer(l, { lesId, lidId: l.lid.id, bron: 'app', toch: false }, nu, { metStrippenkaart: true })
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  if (!('id' in uit.waarde)) return clubFout('Boeken is niet gelukt. Probeer het opnieuw.', 500)
  const reserveringId = uit.waarde.id
  // Met een strip boek je alleen een vrije plek: de wachtlijst zou een strip vasthouden zonder les.
  if (uit.waarde.status === 'wachtlijst') {
    if (!(await trekBoekingIn(l, reserveringId, nu))) return terugdraaienMislukt(l, reserveringId)
    return clubFout('Deze les is net vol. Met een strip boek je alleen een vrije plek.', 409)
  }
  const af = await boekTegoedAf(l.admin, { userId: l.userId, lidId: l.lid.id, soort: 'les', vestiging: les.vestiging, reserveringId, afspraakId: null, door: l.naam })
  if (af === 'geen' || af === 'fout') {
    if (!(await trekBoekingIn(l, reserveringId, nu))) return terugdraaienMislukt(l, reserveringId)
    return clubFout(af === 'geen' ? 'Je hebt geen geldige strippen meer.' : 'De strip kon niet worden afgeboekt. Je bent niet geboekt; probeer het opnieuw.', af === 'geen' ? 409 : 500)
  }
  await logActie(l, 'Les geboekt met strippenkaart', volledigeNaam(l.lid), les.vestiging)
  return clubJson({ id: reserveringId, status: 'geboekt', wachtpositie: null, strip: true })
}

/**
 * Na een afmelding door het lid: was de les met een strip betaald en op tijd
 * afgemeld, dan krijgt het lid de strip terug. Te laat afgemeld: geen strip
 * terug (zoals een no-show). Best effort, breekt de afmelding nooit.
 */
export async function stripTerugNaAfmelden(l: LidToegang, reserveringId: string): Promise<void> {
  if (!betalenActief() || !isUuid(reserveringId)) return
  const terug = await stripTerugNaAnnuleren(l.admin, l.userId, reserveringId, l.naam, l.lid.id)
  if (terug) await logActie(l, 'Strip teruggegeven na afmelden', volledigeNaam(l.lid), null)
}
