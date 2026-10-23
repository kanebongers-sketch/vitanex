// ─── Club, lidgeld-outbox: opslag in het geheugen (ALLEEN VOOR TESTS) ───────
// Claimen zoals skip locked (een opdracht hooguit bij een werker tegelijk) en
// afronden zoals de echte opslag dat doet.

import type { Opdracht, OpdrachtRij } from './opdracht'
import type { OpdrachtAfloop, OutboxOpslag } from './werker'

const tik = (): Promise<void> => new Promise((r) => setImmediate(r))

interface Regel {
  rij: OpdrachtRij
  status: 'wacht' | 'bezig' | Exclude<OpdrachtAfloop['status'], 'opnieuw'>
  volgendeOp: number
  laatste: OpdrachtAfloop | null
}

type NieuweRij = Pick<OpdrachtRij, 'id' | 'organisatieId' | 'soort' | 'gegevens'> & Partial<Pick<OpdrachtRij, 'sleutel' | 'lidId' | 'factuurId' | 'betalingId'>>

export class NepOutboxOpslag implements OutboxOpslag {
  readonly opdrachten = new Map<string, Regel>()
  readonly accounts = new Map<string, string>()
  readonly leden = new Map<string, { naam: string; email: string | null }>()
  readonly meldingen: string[] = []
  /** Wat de controle vlak voor de aanroep zegt (standaard door). */
  controle: (o: Opdracht) => 'door' | 'stop' = () => 'door'

  constructor(private readonly klok: () => Date = () => new Date()) {}

  voegToe(r: NieuweRij): void {
    const rij: OpdrachtRij = { sleutel: null, lidId: null, factuurId: null, betalingId: null, ...r, pogingen: 0, eersteOp: this.klok() }
    this.opdrachten.set(r.id, { rij, status: 'wacht', volgendeOp: 0, laatste: null })
  }

  async claim(max: number): Promise<OpdrachtRij[]> {
    await tik()
    const nu = this.klok().getTime()
    const uit: OpdrachtRij[] = []
    for (const regel of this.opdrachten.values()) {
      if (uit.length >= max) break
      if (regel.status !== 'wacht' || regel.volgendeOp > nu) continue
      regel.status = 'bezig'
      uit.push({ ...regel.rij })
    }
    return uit
  }

  async controleer(o: Opdracht): Promise<'door' | 'stop'> {
    await tik()
    return this.controle(o)
  }

  async accountVanSportschool(org: string): Promise<string | null> {
    await tik()
    return this.accounts.get(org) ?? null
  }

  async klantGegevens(_org: string, lidId: string): Promise<{ naam: string; email: string | null } | null> {
    await tik()
    return this.leden.get(lidId) ?? null
  }

  async rond(rij: OpdrachtRij, _o: Opdracht | null, a: OpdrachtAfloop): Promise<void> {
    await tik()
    const regel = this.opdrachten.get(rij.id)
    if (!regel || regel.status !== 'bezig') return
    regel.laatste = a
    regel.rij = { ...regel.rij, pogingen: regel.rij.pogingen + 1 }
    if (a.status === 'opnieuw') {
      regel.status = 'wacht'
      regel.volgendeOp = a.volgendeOp.getTime()
      return
    }
    regel.status = a.status
  }

  async meld(wat: string): Promise<void> {
    this.meldingen.push(wat)
  }
}
