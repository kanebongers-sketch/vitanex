// ─── Club, betalen: de staat van het planformulier (PUUR) ───────────────────
// Velden als tekst zoals ze in het formulier staan, en terug naar de body voor
// de API. De controle zelf is leesPlanInvoer (dezelfde als op de server), zodat
// het voorbeeld live meekijkt met precies dezelfde regels.

import type { BtwProcent } from '@/lib/club/betalen/geld/btw-tarieven'
import type { Doelgroep, Interval, PlanVerlenging } from '@/lib/club/betalen/plannen/model'
import type { PlanWeergave } from '@/lib/club/betalen/plannen/weergave'
import { centNaarInvoer, invoerNaarCent } from '@/lib/club/betalen/plannen/tekst'

export interface PlanStaat {
  naam: string
  interval: Interval
  bedrag: string
  btw: BtwProcent
  looptijd: string
  opzeg: string
  verlenging: PlanVerlenging
  proef: string
  inschrijf: string
  alle: boolean
  vestigingen: string[]
  doelgroep: Doelgroep
  bewijs: boolean
  factuurDag: string
  proRata: boolean
  actief: boolean
  prijsVanaf: string
  volgorde: number
}

export function beginPlanStaat(p?: PlanWeergave): PlanStaat {
  return {
    naam: p?.naam ?? '',
    interval: p?.interval ?? 'maand',
    bedrag: p ? centNaarInvoer(p.laatste.bedragCent) : '',
    btw: p?.laatste.btwProcent ?? 9,
    looptijd: p?.contractMaanden ? String(p.contractMaanden) : '',
    opzeg: String(p?.opzegtermijnDagen ?? 30),
    verlenging: p?.verlenging ?? 'onbepaald',
    proef: String(p?.proefDagen ?? 0),
    inschrijf: p && p.inschrijfkostenCent > 0 ? centNaarInvoer(p.inschrijfkostenCent) : '',
    alle: !p || p.vestigingen === null,
    vestigingen: p?.vestigingen ?? [],
    doelgroep: p?.doelgroep ?? 'iedereen',
    bewijs: p?.vereistBewijs ?? false,
    factuurDag: p?.factuurDag ? String(p.factuurDag) : '',
    proRata: p?.proRataEerste ?? true,
    actief: p?.actief ?? true,
    prijsVanaf: '',
    volgorde: p?.volgorde ?? 0,
  }
}

/** De body voor de API. Een onleesbaar bedrag wordt NaN: de controle meldt het dan. */
export function planBody(s: PlanStaat, vormId: string): Record<string, unknown> {
  const bedrag = invoerNaarCent(s.bedrag)
  const inschrijf = invoerNaarCent(s.inschrijf, 0)
  return {
    vormId,
    naam: s.naam,
    interval: s.interval,
    bedragCent: bedrag ?? Number.NaN,
    btwProcent: s.btw,
    contractMaanden: s.looptijd === '' ? null : s.looptijd,
    opzegtermijnDagen: s.opzeg,
    verlenging: s.verlenging,
    proefDagen: s.proef === '' ? 0 : s.proef,
    inschrijfkostenCent: inschrijf ?? Number.NaN,
    vestigingen: s.alle ? null : s.vestigingen,
    doelgroep: s.doelgroep,
    vereistBewijs: s.bewijs,
    factuurDag: s.factuurDag === '' ? null : s.factuurDag,
    proRataEerste: s.proRata,
    actief: s.actief,
    prijsVanaf: s.prijsVanaf === '' ? null : s.prijsVanaf,
    volgorde: s.volgorde,
  }
}
