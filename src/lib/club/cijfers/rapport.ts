// ─── Fit Factory Club: het maandrapport samenstellen (PUUR) ─────────────────
// Krijgt de opgehaalde rijen van alle vestigingen en maakt er een rapport van
// voor de gekozen kalendermaand en het gekozen bereik (een vestiging of alle):
// kerncijfers met vergelijkingen, 12 maanden trend, de maand zelf per dag en
// per uur, lessen, leads en de acht vestigingen naast elkaar.

import { VESTIGINGEN, VESTIGING_LABEL, type Vestiging } from '@/lib/club/kern/vestiging'
import { bezoekPerDag, drukteRaster, piekUur, zichtbareUren } from './bezoek'
import { geslachtsverdeling, isActiefLid, leeftijdsverdeling, telStatussen, type StatusTelling, type Verdeling } from './leden'
import { conversiePerBron, leadsIn, type Conversie } from './leads'
import {
  bezettingPerLestype,
  bezettingPerTijdslot,
  geweestVoor,
  wachtlijstdruk,
  type BezettingGroep,
  type LesTelling,
  type Wachtlijstdruk,
} from './lessen'
import { cijfersVoor, dataVanaf, dekkingVan, type Bronnen, type DataVanaf, type Dekking, type Maandcijfers, type Selectie } from './maandcijfers'
import { dagenVan, maandenReeks, maandVenster, plusMaanden, vergelijkVenster, type Maand, type MaandVenster } from './maand'
import type { Bereik } from './periode'

/** Aantal maanden in de trendgrafieken en het overzicht. */
export const TREND_MAANDEN = 12

export interface RapportInvoer {
  vandaag: string
  nu: Date
  maand: Maand
  bereik: Bereik
  vestiging: Vestiging
  bronnen: Bronnen
  /** Tellingen per les in de gekozen maand (tot nu). */
  lessen: readonly LesTelling[]
  /** Lessen van nu tot 14 dagen vooruit. */
  komend: readonly LesTelling[]
}

/** Een venster met zijn cijfers en of er genoeg data was. */
export interface Kant {
  venster: MaandVenster
  cijfers: Maandcijfers
  dekking: Dekking
}

export interface VestigingRij {
  vestiging: Vestiging
  label: string
  cijfers: Maandcijfers
}

export interface Rapport {
  huidig: Kant
  vorige: Kant
  vorigJaar: Kant
  /** 12 maanden tot en met de gekozen maand, oudste eerst. */
  trend: Kant[]
  vanaf: DataVanaf
  /** Stand van nu (niet van de gekozen maand). */
  status: StatusTelling
  leeftijd: Verdeling[]
  geslacht: Verdeling[]
  /** Bezoek per dag van de gekozen maand, tot en met vandaag. */
  perDag: { dag: string; aantal: number }[]
  drukte: number[][]
  uren: number[]
  piek: { weekdag: number; uur: number; aantal: number } | null
  perLestype: BezettingGroep[]
  perTijdslot: BezettingGroep[]
  wachtlijst: Wachtlijstdruk
  leads: { perBron: Conversie[]; totaal: Conversie }
  vergelijking: VestigingRij[]
}

function kant(inv: RapportInvoer, set: Selectie, vanaf: DataVanaf, venster: MaandVenster): Kant {
  return { venster, cijfers: cijfersVoor(inv.bronnen, set, venster, inv.vandaag), dekking: dekkingVan(vanaf, venster) }
}

function maandDeel(inv: RapportInvoer, set: Selectie, huidig: MaandVenster) {
  const hier = <T extends { vestiging: Vestiging }>(rijen: readonly T[]): T[] => (set ? rijen.filter((r) => set.has(r.vestiging)) : [...rijen])
  const perDagMap = bezoekPerDag(inv.bronnen.bezoek, set)
  const drukte = drukteRaster(inv.bronnen.bezoek, set)
  const geweest = geweestVoor(hier(inv.lessen), inv.nu)
  return {
    perDag: dagenVan(huidig).map((dag) => ({ dag, aantal: perDagMap.get(dag) ?? 0 })),
    drukte,
    uren: zichtbareUren(drukte),
    piek: piekUur(drukte),
    perLestype: bezettingPerLestype(geweest),
    perTijdslot: bezettingPerTijdslot(geweest),
    wachtlijst: wachtlijstdruk(hier(inv.komend)),
    leads: conversiePerBron(leadsIn(hier(inv.bronnen.leads), huidig)),
  }
}

export function maakRapport(inv: RapportInvoer): Rapport {
  const set: Selectie = inv.bereik === 'alle' ? null : new Set([inv.vestiging])
  const vanaf = dataVanaf(inv.bronnen, set)
  const huidig = maandVenster(inv.maand, inv.vandaag)
  const leden = set ? inv.bronnen.leden.filter((l) => set.has(l.vestiging)) : inv.bronnen.leden
  const actieveLeden = leden.filter((l) => isActiefLid(l, inv.vandaag))
  return {
    huidig: kant(inv, set, vanaf, huidig),
    vorige: kant(inv, set, vanaf, vergelijkVenster(plusMaanden(inv.maand, -1), huidig)),
    vorigJaar: kant(inv, set, vanaf, vergelijkVenster(plusMaanden(inv.maand, -12), huidig)),
    trend: maandenReeks(inv.maand, TREND_MAANDEN).map((m) => kant(inv, set, vanaf, maandVenster(m, inv.vandaag))),
    vanaf,
    status: telStatussen(leden, inv.vandaag),
    leeftijd: leeftijdsverdeling(actieveLeden, inv.vandaag),
    geslacht: geslachtsverdeling(actieveLeden),
    ...maandDeel(inv, set, huidig),
    vergelijking: VESTIGINGEN.map((v) => ({
      vestiging: v,
      label: VESTIGING_LABEL[v],
      cijfers: cijfersVoor(inv.bronnen, new Set([v]), huidig, inv.vandaag),
    })),
  }
}
