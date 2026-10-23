// ─── Club, lidgeld-outbox: de werker die opdrachten aan Stripe uitvoert ─────
// Bouwplan 1.3. Claimen met skip locked (of een gelijkwaardige claim per rij),
// vlak voor elke aanroep de toestand opnieuw controleren (factuur open,
// contract niet gepauzeerd, geen andere lopende poging), aanroepen met de
// vaste sleutel `ayg_<soort>_<id>`. Een time-out is geen mislukking: later
// opnieuw met dezelfde sleutel, zodat Stripe het eerdere resultaat teruggeeft
// en nooit twee keer afschrijft.

import { platformFeeCent } from '../config'
import type { StripeUitkomst } from '../stripe-api'
import { beweegtGeld, leesOpdracht, type Opdracht, type OpdrachtRij } from './opdracht'
import type { StripeSchrijver } from './stripe-client'
import { naMislukking } from './wachten'

export type OpdrachtAfloop =
  | { status: 'klaar'; stripeId: string; url: string | null; stripeStatus: string | null }
  | { status: 'afgewezen'; code: string | null }
  | { status: 'geannuleerd'; reden: string }
  | { status: 'opnieuw'; code: string | null; volgendeOp: Date }
  | { status: 'vast'; code: string | null }

export interface OutboxOpslag {
  /** Opdrachten claimen: elke opdracht hooguit bij een werker tegelijk. */
  claim(max: number): Promise<OpdrachtRij[]>
  /** De toestand opnieuw controleren vlak voor de aanroep. */
  controleer(o: Opdracht): Promise<'door' | 'stop'>
  accountVanSportschool(organisatieId: string): Promise<string | null>
  /** Naam en e-mail voor een nieuwe Stripe-klant, pas op het laatste moment gelezen. */
  klantGegevens(organisatieId: string, lidId: string): Promise<{ naam: string; email: string | null } | null>
  rond(rij: OpdrachtRij, o: Opdracht | null, afloop: OpdrachtAfloop): Promise<void>
  meld(wat: string): Promise<void>
}

export interface OutboxDeps {
  opslag: OutboxOpslag
  stripe: StripeSchrijver
  nu: () => Date
  /** De platformfee bij een bedrag (standaard uit config, nu 0). */
  fee?: (bedragCent: number) => number
}

type Resultaat = StripeUitkomst<{ id: string; url?: string; status?: string | null }>

const ONGELDIG = (code: string): Resultaat => ({ ok: false, soort: 'ongeldig', status: 0, code })

async function voerUit(o: Opdracht, account: string, d: OutboxDeps): Promise<Resultaat> {
  const fee = d.fee ?? platformFeeCent
  const org = o.organisatieId
  const k = o.sleutel
  switch (o.soort) {
    case 'klant': {
      const g = await d.opslag.klantGegevens(org, o.invoer.lidId)
      return g ? d.stripe.maakKlant(account, k, { organisatieId: org, lidId: o.invoer.lidId, ...g }) : ONGELDIG('lid_onbekend')
    }
    case 'eerste_betaling':
      return d.stripe.maakEersteBetaalSessie(account, k, { ...o.invoer, organisatieId: org, platformFeeCent: fee(o.invoer.bedragCent) })
    case 'machtiging':
      return d.stripe.maakMachtigingSessie(account, k, { ...o.invoer, organisatieId: org })
    case 'incasso':
      return d.stripe.maakIncasso(account, k, { ...o.invoer, organisatieId: org, platformFeeCent: fee(o.invoer.bedragCent) })
    case 'terugbetaling':
      return d.stripe.maakTerugbetaling(account, k, { ...o.invoer, organisatieId: org })
    case 'klant_verwijderen':
      return d.stripe.verwijderKlant(o.invoer.account ?? account, k, o.invoer.klant)
    case 'mandaat_loskoppelen':
      return d.stripe.koppelBetaalmethodeLos(account, k, o.invoer.betaalmethode)
    case 'betaling_annuleren':
      return d.stripe.annuleerBetaling(account, k, o.invoer.paymentIntent)
  }
}

function naUitkomst(o: Opdracht, u: Resultaat, nu: Date): OpdrachtAfloop {
  if (u.ok) return { status: 'klaar', stripeId: u.data.id, url: u.data.url ?? null, stripeStatus: u.data.status ?? null }
  if (u.soort === 'afgewezen') return { status: 'afgewezen', code: u.code }
  if (u.soort !== 'tijdelijk') return { status: 'vast', code: u.code ?? u.soort }
  const h = naMislukking(o.pogingen + 1, nu, beweegtGeld(o.soort) ? (o.eersteOp ?? nu) : undefined)
  return h.status === 'vast' ? { status: 'vast', code: u.code } : { status: 'opnieuw', code: u.code, volgendeOp: h.volgendeOp }
}

/** Een geclaimde opdracht afhandelen. */
export async function voerOpdrachtUit(o: Opdracht, d: OutboxDeps): Promise<OpdrachtAfloop> {
  const eigen = await d.opslag.accountVanSportschool(o.organisatieId)
  const account = o.soort === 'klant_verwijderen' ? (o.invoer.account ?? eigen) : eigen
  if (!account) return { status: 'vast', code: 'geen_account' }
  if ((await d.opslag.controleer(o)) === 'stop') return { status: 'geannuleerd', reden: 'toestand_gewijzigd' }
  let u: Resultaat
  try {
    u = await voerUit(o, account, d)
  } catch (err) {
    // Een onverwachte fout tijdens de aanroep behandelen we als een time-out.
    u = { ok: false, soort: 'tijdelijk', status: 0, code: err instanceof Error ? err.name.slice(0, 40) : 'onbekend' }
  }
  return naUitkomst(o, u, d.nu())
}

export interface OutboxVerslag {
  geclaimd: number
  klaar: number
  afgewezen: number
  geannuleerd: number
  opnieuw: number
  vast: number
}

async function afloopVan(rij: OpdrachtRij, o: Opdracht | null, d: OutboxDeps): Promise<OpdrachtAfloop> {
  if (!o) return { status: 'vast', code: 'ongeldige_opdracht' }
  try {
    return await voerOpdrachtUit(o, d)
  } catch {
    // De database gaf geen antwoord voor de aanroep: veilig om later opnieuw te proberen.
    const h = naMislukking(rij.pogingen + 1, d.nu())
    return h.status === 'vast' ? { status: 'vast', code: 'database' } : { status: 'opnieuw', code: 'database', volgendeOp: h.volgendeOp }
  }
}

export async function werkOutboxAf(d: OutboxDeps, opties: { max: number }): Promise<OutboxVerslag> {
  const rijen = await d.opslag.claim(opties.max)
  const verslag: OutboxVerslag = { geclaimd: rijen.length, klaar: 0, afgewezen: 0, geannuleerd: 0, opnieuw: 0, vast: 0 }
  for (const rij of rijen) {
    const o = leesOpdracht(rij)
    const afloop = await afloopVan(rij, o, d)
    verslag[afloop.status] += 1
    if (afloop.status === 'vast') await d.opslag.meld(`Lidgeld-opdracht zit vast (${rij.soort}, ${afloop.code ?? 'onbekend'})`)
    try {
      await d.opslag.rond(rij, o, afloop)
    } catch (err) {
      // Blijft 'bezig'; de claim neemt hem na een tijd weer mee, met dezelfde sleutel.
      console.error('[club/betalen] outbox afronden mislukt', rij.soort, err instanceof Error ? err.name : 'onbekend')
    }
  }
  return verslag
}
