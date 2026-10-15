// ─── Fit Factory Club: ledencijfers (PUUR) ──────────────────────────────────
// Rekenen op het ledenbestand zoals het nu in de database staat. Statussen komen
// straks uit Sportivity; de geschiedenis van pauzes kennen we niet, dus het
// teruggerekende ledenbestand per maand kijkt alleen naar lid sinds en einddatum.

import type { LidStatus } from '@/lib/club/kern/lid'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { leeftijdOp } from './tijd'

export interface LidCijferRij {
  id: string
  vestiging: Vestiging
  status: LidStatus
  lidSinds: string | null
  einddatum: string | null
  geboortedatum: string | null
  geslacht: 'man' | 'vrouw' | 'anders' | null
}

/** Actief = status actief, of opgezegd met een einddatum die nog moet komen. */
export function isActiefLid(lid: Pick<LidCijferRij, 'status' | 'einddatum'>, dag: string): boolean {
  if (lid.status === 'actief') return true
  return lid.status === 'opgezegd' && (lid.einddatum === null || lid.einddatum > dag)
}

export interface StatusTelling {
  actief: number
  proef: number
  gepauzeerd: number
  opgezegdLopend: number
}

export function telStatussen(leden: readonly LidCijferRij[], dag: string): StatusTelling {
  let actief = 0
  let proef = 0
  let gepauzeerd = 0
  let opgezegdLopend = 0
  for (const l of leden) {
    if (isActiefLid(l, dag)) actief += 1
    if (l.status === 'opgezegd' && isActiefLid(l, dag)) opgezegdLopend += 1
    if (l.status === 'proef') proef += 1
    if (l.status === 'gepauzeerd') gepauzeerd += 1
  }
  return { actief, proef, gepauzeerd, opgezegdLopend }
}

/**
 * Telt dit lid mee in het ledenbestand? Geen proefleden, en een lid sinds is
 * nodig. Gestopt zonder einddatum: we weten niet wanneer, dus niet meetellen.
 */
function telbaar(l: LidCijferRij): l is LidCijferRij & { lidSinds: string } {
  if (l.status === 'proef' || !l.lidSinds) return false
  return !(l.status === 'gestopt' && l.einddatum === null)
}

/** Was dit lid op deze dag lid volgens lid sinds en einddatum? */
export function lidOp(l: LidCijferRij, dag: string): boolean {
  return telbaar(l) && l.lidSinds <= dag && (l.einddatum === null || l.einddatum > dag)
}

/** Ledenbestand aan het eind van een dag. */
export function bestandOp(leden: readonly LidCijferRij[], dag: string): number {
  return leden.filter((l) => lidOp(l, dag)).length
}

/** De vroegste lid sinds van de leden die meetellen; null als er geen zijn. */
export function vroegsteLidSinds(leden: readonly LidCijferRij[]): string | null {
  let vroegst: string | null = null
  for (const l of leden) if (telbaar(l) && (vroegst === null || l.lidSinds < vroegst)) vroegst = l.lidSinds
  return vroegst
}

export interface Stroom {
  instroom: number
  uitstroom: number
}

/**
 * Instroom = lid sinds in het venster. Uitstroom = einddatum in het venster,
 * tot en met vandaag. Dezelfde leden als het ledenbestand (zie telbaar), zodat
 * instroom min uitstroom precies het bestand aan het eind min dat van de dag
 * voor het venster is.
 */
export function stroomIn(leden: readonly LidCijferRij[], van: string, tot: string, vandaag: string): Stroom {
  const eind = tot < vandaag ? tot : vandaag
  let instroom = 0
  let uitstroom = 0
  for (const l of leden) {
    if (!telbaar(l)) continue
    const blijft = l.einddatum === null || l.einddatum > l.lidSinds
    if (!blijft) continue
    if (l.lidSinds >= van && l.lidSinds <= eind) instroom += 1
    if (l.einddatum && l.einddatum >= van && l.einddatum <= eind) uitstroom += 1
  }
  return { instroom, uitstroom }
}

export interface Verdeling {
  label: string
  aantal: number
}

export const LEEFTIJD_GROEPEN: readonly { label: string; tot: number }[] = [
  { label: 'Onder 25', tot: 25 },
  { label: '25 tot 34', tot: 35 },
  { label: '35 tot 44', tot: 45 },
  { label: '45 tot 54', tot: 55 },
  { label: '55 tot 64', tot: 65 },
  { label: '65 en ouder', tot: 200 },
]

/** Leeftijdsgroepen van de gegeven leden; zonder geboortedatum telt als "Onbekend". */
export function leeftijdsverdeling(leden: readonly LidCijferRij[], dag: string): Verdeling[] {
  const tellers = LEEFTIJD_GROEPEN.map((g) => ({ label: g.label, aantal: 0 }))
  let onbekend = 0
  for (const l of leden) {
    const jaren = leeftijdOp(l.geboortedatum, dag)
    if (jaren === null) {
      onbekend += 1
      continue
    }
    const i = LEEFTIJD_GROEPEN.findIndex((g) => jaren < g.tot)
    tellers[i].aantal += 1
  }
  return onbekend > 0 ? [...tellers, { label: 'Onbekend', aantal: onbekend }] : tellers
}

export function geslachtsverdeling(leden: readonly LidCijferRij[]): Verdeling[] {
  const tel = (g: LidCijferRij['geslacht']): number => leden.filter((l) => l.geslacht === g).length
  const rijen: Verdeling[] = [
    { label: 'Vrouw', aantal: tel('vrouw') },
    { label: 'Man', aantal: tel('man') },
    { label: 'Anders', aantal: tel('anders') },
    { label: 'Onbekend', aantal: tel(null) },
  ]
  return rijen.filter((r) => r.aantal > 0 || r.label === 'Vrouw' || r.label === 'Man')
}
