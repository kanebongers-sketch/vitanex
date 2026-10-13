// ─── PT-app — waarom stoppen klanten? (PUUR) ───────────────────────────────
// Telt opgezegde en gestopte klanten per reden, en per trainer hoeveel er
// stopten en wat de meest genoemde reden was. "Zonder reden" telt apart mee,
// zodat het beeld eerlijk blijft (geen percentages over alleen de ingevulde).

import { STOP_REDENEN, type PtKlant, type StopReden } from './abonnementen'

export interface RedenRij {
  reden: StopReden | 'onbekend'
  aantal: number
  /** Aandeel van alle stoppers, afgerond op hele procenten. */
  pct: number
}

export interface TrainerStop {
  id: string
  naam: string
  gestopt: number
  /** Meest genoemde reden (bij gelijke stand de eerste in de vaste volgorde), of null. */
  vaakst: StopReden | null
}

export interface StopOverzicht {
  totaal: number
  redenen: RedenRij[]
  perTrainer: TrainerStop[]
}

const isStopper = (k: Pick<PtKlant, 'status'>) => k.status === 'opgezegd' || k.status === 'gestopt'

export function stopOverzicht(team: readonly { id: string; naam: string }[], klanten: ReadonlyMap<string, readonly PtKlant[]>): StopOverzicht {
  const stoppers = team.flatMap((p) => (klanten.get(p.id) ?? []).filter(isStopper))
  const totaal = stoppers.length
  const tel = (r: StopReden | 'onbekend') => stoppers.filter((k) => (k.stopReden ?? 'onbekend') === r).length
  const redenen = [...STOP_REDENEN, 'onbekend' as const]
    .map((reden) => ({ reden, aantal: tel(reden) }))
    .filter((r) => r.aantal > 0)
    .map((r) => ({ ...r, pct: totaal === 0 ? 0 : Math.round((r.aantal / totaal) * 100) }))
    .sort((a, b) => b.aantal - a.aantal)
  const perTrainer = team
    .map((p) => {
      const eigen = (klanten.get(p.id) ?? []).filter(isStopper)
      const metReden = STOP_REDENEN.map((r) => [r, eigen.filter((k) => k.stopReden === r).length] as const).filter(([, n]) => n > 0)
      const max = Math.max(0, ...metReden.map(([, n]) => n))
      return { id: p.id, naam: p.naam, gestopt: eigen.length, vaakst: metReden.find(([, n]) => n === max)?.[0] ?? null }
    })
    .filter((t) => t.gestopt > 0)
    .sort((a, b) => b.gestopt - a.gestopt || a.naam.localeCompare(b.naam, 'nl'))
  return { totaal, redenen, perTrainer }
}
