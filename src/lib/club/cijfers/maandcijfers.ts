// ─── Fit Factory Club: de kerncijfers van een venster (PUUR) ────────────────
// Een venster is een maand, of het eerste deel ervan. Alles wordt uit dezelfde
// rijen geteld, zodat de gekozen maand, de vorige maand, dezelfde maand vorig
// jaar en de 12 maanden in de grafiek precies dezelfde regels volgen.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import { bezoekIn, bezoekPerDag, type BezoekTelling } from './bezoek'
import { bestandOp, stroomIn, vroegsteLidSinds, type LidCijferRij } from './leden'
import { leadsIn, type LeadCijferRij } from './leads'
import { lesSomIn, type LesDag } from './lesdagen'
import type { MaandVenster } from './maand'
import type { BeginBron, BeginRij } from './rijen'
import { plusDagen } from './tijd'
import { aandeel, perLidPerWeek } from './vergelijking'

/** Alle opgehaalde rijen, van alle vestigingen. */
export interface Bronnen {
  leden: readonly LidCijferRij[]
  bezoek: readonly BezoekTelling[]
  lesDagen: readonly LesDag[]
  leads: readonly LeadCijferRij[]
  begin: readonly BeginRij[]
}

/** Welke vestigingen meetellen; null = alle. */
export type Selectie = ReadonlySet<Vestiging> | null

export interface Maandcijfers {
  /** Ledenbestand aan het eind van de dag voor het venster. */
  bestandBegin: number
  /** Ledenbestand aan het eind van de laatste dag van het venster. */
  bestandEind: number
  instroom: number
  uitstroom: number
  groei: number
  bezoek: number
  bezoekPerLidPerWeek: number | null
  lessen: number
  bezetting: number | null
  noShow: number | null
  noShowAantal: number
  aanwezig: number
  leads: number
  leadsLid: number
  conversie: number | null
}

/** Is er voor dit venster genoeg data om eerlijk mee te vergelijken? */
export interface Dekking {
  leden: boolean
  bezoek: boolean
  lessen: boolean
  leads: boolean
}

export interface DataVanaf {
  leden: string | null
  bezoek: string | null
  lessen: string | null
  leads: string | null
}

function hier<T extends { vestiging: Vestiging }>(rijen: readonly T[], set: Selectie): readonly T[] {
  return set === null ? rijen : rijen.filter((r) => set.has(r.vestiging))
}

export function cijfersVoor(b: Bronnen, set: Selectie, v: MaandVenster, vandaag: string): Maandcijfers {
  const leden = hier(b.leden, set)
  const eind = v.tot < vandaag ? v.tot : vandaag
  const bestandBegin = bestandOp(leden, plusDagen(v.van, -1))
  const bestandEind = bestandOp(leden, eind)
  const stroom = stroomIn(leden, v.van, v.tot, vandaag)
  const bezoek = bezoekIn(bezoekPerDag(b.bezoek, set), v)
  const les = lesSomIn(b.lesDagen, v, set)
  const leads = leadsIn(hier(b.leads, set), v)
  const leadsLid = leads.filter((l) => l.status === 'lid').length
  return {
    bestandBegin,
    bestandEind,
    instroom: stroom.instroom,
    uitstroom: stroom.uitstroom,
    groei: bestandEind - bestandBegin,
    bezoek,
    bezoekPerLidPerWeek: perLidPerWeek(bezoek, v.dagen, (bestandBegin + bestandEind) / 2),
    lessen: les.lessen,
    bezetting: les.bezetting,
    noShow: les.noShowAandeel,
    noShowAantal: les.noShow,
    aanwezig: les.aanwezig,
    leads: leads.length,
    leadsLid,
    conversie: aandeel(leadsLid, leads.length),
  }
}

function vroegste(begin: readonly BeginRij[], bron: BeginBron, set: Selectie): string | null {
  let vroegst: string | null = null
  for (const r of begin) {
    if (r.bron !== bron || (set !== null && !set.has(r.vestiging))) continue
    if (vroegst === null || r.dag < vroegst) vroegst = r.dag
  }
  return vroegst
}

/** Vanaf welke dag er per bron data is voor de selectie. */
export function dataVanaf(b: Bronnen, set: Selectie): DataVanaf {
  return {
    leden: vroegsteLidSinds(hier(b.leden, set)),
    bezoek: vroegste(b.begin, 'bezoek', set),
    lessen: vroegste(b.begin, 'lessen', set),
    leads: vroegste(b.begin, 'leads', set),
  }
}

/**
 * Een venster is gedekt als er al data was voor het begin ervan. Begint de data
 * halverwege, dan is het venster niet eerlijk te vergelijken.
 */
export function dekkingVan(vanaf: DataVanaf, v: MaandVenster): Dekking {
  const gedekt = (d: string | null): boolean => d !== null && d <= v.van
  return { leden: gedekt(vanaf.leden), bezoek: gedekt(vanaf.bezoek), lessen: gedekt(vanaf.lessen), leads: gedekt(vanaf.leads) }
}
