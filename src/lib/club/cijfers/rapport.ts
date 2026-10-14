// ─── Fit Factory Club: het cijferrapport samenstellen (PUUR) ────────────────
// Krijgt de opgehaalde rijen van alle vestigingen en maakt er een rapport van
// voor het gekozen bereik (een vestiging of alle), plus de vergelijking.

import { VESTIGINGEN, VESTIGING_LABEL, type Vestiging } from '@/lib/club/gedeeld/vestiging'
import { bezoekPerWeek, drukteRaster, piekUur, som, zichtbareUren, type BezoekTelling } from './bezoek'
import {
  geslachtsverdeling,
  isActiefLid,
  ledenbestandPerWeek,
  leeftijdsverdeling,
  stroomPerWeek,
  telStatussen,
  type LidCijferRij,
  type StatusTelling,
  type Stroom,
  type Verdeling,
} from './leden'
import { conversiePerBron, type Conversie, type LeadCijferRij } from './leads'
import {
  bezettingPerLestype,
  bezettingPerTijdslot,
  geweestVoor,
  lesTotalen,
  wachtlijstdruk,
  type BezettingGroep,
  type LesTelling,
  type Totalen,
  type Wachtlijstdruk,
} from './lessen'
import type { Bereik } from './periode'
import { plusDagen } from './tijd'

export interface RapportInvoer {
  vandaag: string
  nu: Date
  maandagen: readonly string[]
  bereik: Bereik
  vestiging: Vestiging
  leden: readonly LidCijferRij[]
  bezoek: readonly BezoekTelling[]
  /** Lessen in de periode tot nu. */
  lessen: readonly LesTelling[]
  /** Lessen van nu tot 14 dagen vooruit. */
  komend: readonly LesTelling[]
  leads: readonly LeadCijferRij[]
}

export interface VestigingRij {
  vestiging: Vestiging
  label: string
  actief: number
  groei: number
  bezoekPerWeek: number
  bezoekPerLid: number | null
  bezetting: number | null
  noShow: number | null
  leads: number
  conversie: number | null
}

export interface Rapport {
  status: StatusTelling
  ledenbestand: number[]
  startBestand: number
  groei: number
  stroom: Stroom
  bezoek: number[]
  bezoekGemiddeld: number
  bezoekPerLid: number | null
  drukte: number[][]
  uren: number[]
  piek: { weekdag: number; uur: number; aantal: number } | null
  totalen: Totalen
  perLestype: BezettingGroep[]
  perTijdslot: BezettingGroep[]
  wachtlijst: Wachtlijstdruk
  leads: { perBron: Conversie[]; totaal: Conversie }
  leeftijd: Verdeling[]
  geslacht: Verdeling[]
  vergelijking: VestigingRij[]
}

/** Gemiddelde over de complete weken (de lopende week telt niet mee). */
export function gemiddeldPerWeek(reeks: readonly number[]): number {
  const compleet = reeks.length > 1 ? reeks.slice(0, -1) : reeks
  return compleet.length > 0 ? som(compleet) / compleet.length : 0
}

function bestandOp(leden: readonly LidCijferRij[], dag: string): number {
  return leden.filter((l) => l.status !== 'proef' && l.lidSinds !== null && l.lidSinds <= dag && (l.einddatum === null || l.einddatum > dag)).length
}

function vestigingRij(inv: RapportInvoer, v: Vestiging): VestigingRij {
  const leden = inv.leden.filter((l) => l.vestiging === v)
  const actief = leden.filter((l) => isActiefLid(l, inv.vandaag)).length
  const voorStart = plusDagen(inv.maandagen[0], -1)
  const perWeek = gemiddeldPerWeek(bezoekPerWeek(inv.bezoek, inv.maandagen, new Set([v])))
  const geweest = geweestVoor(
    inv.lessen.filter((l) => l.vestiging === v),
    inv.nu,
  )
  const t = lesTotalen(geweest)
  const leads = conversiePerBron(inv.leads.filter((l) => l.vestiging === v)).totaal
  return {
    vestiging: v,
    label: VESTIGING_LABEL[v],
    actief,
    groei: bestandOp(leden, inv.vandaag) - bestandOp(leden, voorStart),
    bezoekPerWeek: perWeek,
    bezoekPerLid: actief > 0 ? perWeek / actief : null,
    bezetting: t.lessen > 0 ? t.bezetting : null,
    noShow: t.noShowAandeel,
    leads: leads.leads,
    conversie: leads.leads > 0 ? leads.conversie : null,
  }
}

export function maakRapport(inv: RapportInvoer): Rapport {
  const set: ReadonlySet<Vestiging> | null = inv.bereik === 'alle' ? null : new Set([inv.vestiging])
  const hier = <T extends { vestiging: Vestiging }>(rijen: readonly T[]): T[] => (set ? rijen.filter((r) => set.has(r.vestiging)) : [...rijen])
  const leden = hier(inv.leden)
  const actieveLeden = leden.filter((l) => isActiefLid(l, inv.vandaag))
  const status = telStatussen(leden, inv.vandaag)
  const bezoek = bezoekPerWeek(inv.bezoek, inv.maandagen, set)
  const gemiddeld = gemiddeldPerWeek(bezoek)
  const drukte = drukteRaster(inv.bezoek, set)
  const geweest = geweestVoor(hier(inv.lessen), inv.nu)
  const startBestand = bestandOp(leden, plusDagen(inv.maandagen[0], -1))
  return {
    status,
    ledenbestand: ledenbestandPerWeek(leden, inv.maandagen, inv.vandaag),
    startBestand,
    groei: bestandOp(leden, inv.vandaag) - startBestand,
    stroom: stroomPerWeek(leden, inv.maandagen, inv.vandaag),
    bezoek,
    bezoekGemiddeld: gemiddeld,
    bezoekPerLid: status.actief > 0 ? gemiddeld / status.actief : null,
    drukte,
    uren: zichtbareUren(drukte),
    piek: piekUur(drukte),
    totalen: lesTotalen(geweest),
    perLestype: bezettingPerLestype(geweest),
    perTijdslot: bezettingPerTijdslot(geweest),
    wachtlijst: wachtlijstdruk(hier(inv.komend)),
    leads: conversiePerBron(hier(inv.leads)),
    leeftijd: leeftijdsverdeling(actieveLeden, inv.vandaag),
    geslacht: geslachtsverdeling(actieveLeden),
    vergelijking: VESTIGINGEN.map((v) => vestigingRij(inv, v)),
  }
}
