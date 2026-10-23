// ─── Club, lidgeld-inbox: opslag in het geheugen (ALLEEN VOOR TESTS) ────────
// Gedraagt zich als de databasefuncties: een event een keer, claimen met skip
// locked, vergelijken en wijzigen in een stap, boekingen uniek per oorzaak.
// Elke methode wacht eerst een tik, zodat gelijktijdige aanroepen door elkaar
// lopen zoals in het echt.

import type { AccountStand } from '../stripe-event'
import type { InboxEvent } from './event'
import type { BetalingRij } from './koppeling'
import type { InboxAfloop, InboxOpslag, InboxRij, MachtigingVastlegging, MachtigingWijziging } from './opslag'
import type { BetaalStatus } from './overgang'

const tik = (): Promise<void> => new Promise((r) => setImmediate(r))

interface EventRegel {
  rij: InboxRij
  status: 'ontvangen' | 'bezig' | InboxAfloop['status']
  volgendeOp: number
  reden: string | null
}

const BOEK_SOORT: Partial<Record<BetaalStatus, string>> = { geslaagd: 'betaling', gestorneerd: 'storno', storno_teruggedraaid: 'storno_terug' }

export class NepInboxOpslag implements InboxOpslag {
  readonly events = new Map<string, EventRegel>()
  readonly betalingen = new Map<string, BetalingRij>()
  readonly accounts = new Map<string, string>()
  /** Boekingen, uniek op soort plus oorzaak (zoals de unieke index). */
  readonly boekingen = new Map<string, number>()
  readonly machtigingen: MachtigingVastlegging[] = []
  readonly machtigingWijzigingen: MachtigingWijziging[] = []
  readonly accountStanden: AccountStand[] = []
  readonly ontkoppeld: string[] = []
  readonly verkoopTerug: { paymentIntent: string; terugCent: number }[] = []
  readonly meldingen: string[] = []

  constructor(private readonly klok: () => Date = () => new Date()) {}

  async bewaar(e: InboxEvent): Promise<'nieuw' | 'dubbel'> {
    await tik()
    if (this.events.has(e.eventId)) return 'dubbel'
    this.events.set(e.eventId, { rij: { eventId: e.eventId, type: e.type, object: e.object, account: e.account, objectId: e.objectId, livemode: e.livemode, pogingen: 0 }, status: 'ontvangen', volgendeOp: 0, reden: null })
    return 'nieuw'
  }

  async claim(max: number, eventId?: string): Promise<InboxRij[]> {
    await tik()
    const nu = this.klok().getTime()
    const uit: InboxRij[] = []
    for (const regel of this.events.values()) {
      if (uit.length >= max) break
      if (eventId && regel.rij.eventId !== eventId) continue
      if (regel.status !== 'ontvangen' || regel.volgendeOp > nu) continue
      regel.status = 'bezig'
      uit.push({ ...regel.rij })
    }
    return uit
  }

  async rond(rij: InboxRij, a: InboxAfloop): Promise<void> {
    await tik()
    const regel = this.events.get(rij.eventId)
    if (!regel) return
    regel.reden = a.reden
    if (a.status === 'opnieuw') {
      regel.status = 'ontvangen'
      regel.volgendeOp = a.volgendeOp.getTime()
      regel.rij = { ...regel.rij, pogingen: regel.rij.pogingen + 1 }
      return
    }
    regel.status = a.status
  }

  async sportschoolVanAccount(account: string): Promise<string | null> {
    await tik()
    for (const [org, acct] of this.accounts) if (acct === account) return org
    return null
  }

  async accountVanSportschool(org: string): Promise<string | null> {
    await tik()
    return this.accounts.get(org) ?? null
  }

  async betaling(id: string): Promise<BetalingRij | null> {
    await tik()
    const b = this.betalingen.get(id)
    return b ? { ...b } : null
  }

  async pasBetalingToe(w: Parameters<InboxOpslag['pasBetalingToe']>[0]): Promise<'ok' | 'verouderd' | 'afwijkend'> {
    await tik()
    const b = this.betalingen.get(w.betalingId)
    if (!b) return 'afwijkend'
    if (b.status !== w.van) return 'verouderd'
    if (b.paymentIntent && w.paymentIntent && b.paymentIntent !== w.paymentIntent) return 'afwijkend'
    for (const stap of w.pad) {
      const soort = BOEK_SOORT[stap]
      if (soort) this.boek(`${soort}:${b.id}`, b.bedragCent)
    }
    for (const t of w.nieuweTerug) this.boek(`terug:${t.id}`, t.cent)
    const terugIds = [...new Set([...b.terugIds, ...w.nieuweTerug.map((t) => t.id)])]
    this.betalingen.set(b.id, { ...b, status: w.naar, terugIds, paymentIntent: b.paymentIntent ?? w.paymentIntent })
    return 'ok'
  }

  private boek(oorzaak: string, cent: number): void {
    if (!this.boekingen.has(oorzaak)) this.boekingen.set(oorzaak, cent)
  }

  async werkAccountStandBij(stand: AccountStand): Promise<void> {
    await tik()
    this.accountStanden.push(stand)
  }

  async accountOntkoppeld(account: string): Promise<void> {
    await tik()
    this.ontkoppeld.push(account)
  }

  async legMachtigingVast(m: MachtigingVastlegging): Promise<'ok' | 'onbekend'> {
    await tik()
    if (!this.machtigingen.some((x) => x.mandaat === m.mandaat)) this.machtigingen.push(m)
    return 'ok'
  }

  async werkMachtigingBij(m: MachtigingWijziging): Promise<void> {
    await tik()
    this.machtigingWijzigingen.push(m)
  }

  async verkoopTerugbetaald(paymentIntent: string, _account: string, terugCent: number): Promise<void> {
    await tik()
    this.verkoopTerug.push({ paymentIntent, terugCent })
  }

  async meld(wat: string): Promise<void> {
    this.meldingen.push(wat)
  }

  statusVan(eventId: string): string | undefined {
    return this.events.get(eventId)?.status
  }
}
