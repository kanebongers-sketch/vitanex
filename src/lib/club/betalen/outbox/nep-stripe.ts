// ─── Club, lidgeld: een nep-Stripe in het geheugen (ALLEEN VOOR TESTS) ──────
// Onthoudt idempotentiesleutels zoals Stripe: dezelfde sleutel met dezelfde
// vraag geeft hetzelfde resultaat terug en maakt niets nieuws; dezelfde
// sleutel met een andere vraag geeft een fout. Een time-out na het uitvoeren
// (het antwoord raakt kwijt) is na te bootsen met `verliesAntwoorden`.

import type { OphaalSoort, StripeUitkomst } from '../stripe-api'
import type { StripeClient } from './stripe-client'

type Uitkomst = StripeUitkomst<{ id: string; url?: string; status?: string | null }>

const tik = (): Promise<void> => new Promise((r) => setImmediate(r))

export class NepStripe implements StripeClient {
  /** Objecten per account en id, zoals Stripe ze nu teruggeeft. */
  readonly objecten = new Map<string, unknown>()
  readonly geschillen = new Map<string, unknown[]>()
  readonly accounts = new Map<string, unknown>()
  /** Alles wat echt is aangemaakt (per soort). */
  readonly aangemaakt: { soort: string; account: string; id: string }[] = []
  private readonly sleutels = new Map<string, { vraag: string; uit: Uitkomst }>()
  private teller = 0
  /** Zoveel volgende schrijfacties voeren uit, maar het antwoord gaat verloren (time-out). */
  verliesAntwoorden = 0
  /** Zoveel volgende schrijfacties komen niet eens aan (netwerk weg). */
  onbereikbaar = 0

  zet(account: string, id: string, object: unknown): void {
    this.objecten.set(`${account}:${id}`, object)
  }

  async haal(account: string, _soort: OphaalSoort, id: string): Promise<StripeUitkomst<unknown>> {
    await tik()
    const o = this.objecten.get(`${account}:${id}`)
    return o === undefined ? { ok: false, soort: 'niet_gevonden', status: 404, code: 'resource_missing' } : { ok: true, data: structuredClone(o) }
  }

  async haalGeschillen(account: string, pi: string): Promise<StripeUitkomst<unknown>> {
    await tik()
    return { ok: true, data: { object: 'list', data: structuredClone(this.geschillen.get(`${account}:${pi}`) ?? []) } }
  }

  async haalAccount(account: string): Promise<StripeUitkomst<unknown>> {
    await tik()
    const a = this.accounts.get(account)
    return a === undefined ? { ok: false, soort: 'geweigerd', status: 403, code: 'account_invalid' } : { ok: true, data: structuredClone(a) }
  }

  private async schrijf(soort: string, voorvoegsel: string, account: string, sleutel: string, vraag: unknown, maak: (id: string) => Uitkomst): Promise<Uitkomst> {
    await tik()
    if (this.onbereikbaar > 0) {
      this.onbereikbaar -= 1
      return { ok: false, soort: 'tijdelijk', status: 0, code: 'netwerk' }
    }
    const tekst = JSON.stringify({ account, vraag })
    const eerder = this.sleutels.get(sleutel)
    let uit: Uitkomst
    if (eerder) {
      uit = eerder.vraag === tekst ? eerder.uit : { ok: false, soort: 'ongeldig', status: 400, code: 'idempotency_error' }
    } else {
      this.teller += 1
      const id = `${voorvoegsel}nep${String(this.teller).padStart(6, '0')}`
      uit = maak(id)
      this.sleutels.set(sleutel, { vraag: tekst, uit })
      if (uit.ok) this.aangemaakt.push({ soort, account, id })
    }
    if (this.verliesAntwoorden > 0) {
      this.verliesAntwoorden -= 1
      return { ok: false, soort: 'tijdelijk', status: 0, code: 'timeout' }
    }
    return uit
  }

  maakKlant: StripeClient['maakKlant'] = (account, sleutel, k) => this.schrijf('klant', 'cus_', account, sleutel, k, (id) => ({ ok: true, data: { id } }))

  private async sessie(account: string, sleutel: string, vraag: unknown): Promise<StripeUitkomst<{ id: string; url: string }>> {
    const u = await this.schrijf('sessie', 'cs_', account, sleutel, vraag, (id) => ({ ok: true, data: { id, url: `https://checkout.stripe.test/${id}` } }))
    return u.ok ? { ok: true, data: { id: u.data.id, url: u.data.url ?? '' } } : u
  }

  maakEersteBetaalSessie: StripeClient['maakEersteBetaalSessie'] = (account, sleutel, c) => this.sessie(account, sleutel, c)

  maakMachtigingSessie: StripeClient['maakMachtigingSessie'] = (account, sleutel, m) => this.sessie(account, sleutel, m)

  maakIncasso: StripeClient['maakIncasso'] = async (account, sleutel, i) => {
    const u = await this.schrijf('payment_intent', 'pi_', account, sleutel, i, (id) => ({ ok: true, data: { id, status: 'processing' } }))
    return u.ok ? { ok: true, data: { id: u.data.id, status: u.data.status ?? null } } : u
  }

  maakTerugbetaling: StripeClient['maakTerugbetaling'] = async (account, sleutel, t) => {
    const u = await this.schrijf('refund', 're_', account, sleutel, t, (id) => ({ ok: true, data: { id, status: 'pending' } }))
    return u.ok ? { ok: true, data: { id: u.data.id, status: u.data.status ?? null } } : u
  }

  verwijderKlant: StripeClient['verwijderKlant'] = (account, sleutel, klant) => this.schrijf('klant_weg', 'cus_', account, sleutel, klant, () => ({ ok: true, data: { id: klant } }))

  koppelBetaalmethodeLos: StripeClient['koppelBetaalmethodeLos'] = (account, sleutel, pm) => this.schrijf('pm_los', 'pm_', account, sleutel, pm, () => ({ ok: true, data: { id: pm } }))

  annuleerBetaling: StripeClient['annuleerBetaling'] = async (account, sleutel, pi) => {
    const u = await this.schrijf('pi_geannuleerd', 'pi_', account, sleutel, pi, () => ({ ok: true, data: { id: pi, status: 'canceled' } }))
    return u.ok ? { ok: true, data: { id: u.data.id, status: u.data.status ?? null } } : u
  }

  aantal(soort: string): number {
    return this.aangemaakt.filter((a) => a.soort === soort).length
  }
}
