// ─── Fit Factory Club: ledencijfers (PUUR) ──────────────────────────────────
// Rekenen op het ledenbestand zoals het nu in de database staat. Statussen komen
// straks uit Sportivity; de geschiedenis van pauzes kennen we niet, dus het
// teruggerekende ledenbestand per week kijkt alleen naar lid sinds en einddatum.

import type { LidStatus } from '@/lib/club/kern/lid'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { leeftijdOp, plusDagen } from './tijd'

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

/** Was dit lid (geen proeflid) op deze dag lid volgens lid sinds en einddatum? */
function lidOp(l: LidCijferRij, dag: string): boolean {
  if (l.status === 'proef' || !l.lidSinds) return false
  return l.lidSinds <= dag && (l.einddatum === null || l.einddatum > dag)
}

/** Ledenbestand aan het eind van elke week (zondag, of vandaag voor de lopende week). */
export function ledenbestandPerWeek(leden: readonly LidCijferRij[], maandagen: readonly string[], vandaag: string): number[] {
  return maandagen.map((ma) => {
    const zondag = plusDagen(ma, 6)
    const peil = zondag < vandaag ? zondag : vandaag
    return leden.filter((l) => lidOp(l, peil)).length
  })
}

export interface Stroom {
  instroom: number[]
  uitstroom: number[]
}

/** Instroom = lid sinds in die week (geen proeflid). Uitstroom = einddatum in die week, tot en met vandaag. */
export function stroomPerWeek(leden: readonly LidCijferRij[], maandagen: readonly string[], vandaag: string): Stroom {
  const instroom = maandagen.map(() => 0)
  const uitstroom = maandagen.map(() => 0)
  const index = (dag: string): number => maandagen.findIndex((ma) => dag >= ma && dag <= plusDagen(ma, 6))
  for (const l of leden) {
    if (l.lidSinds && l.status !== 'proef' && l.lidSinds <= vandaag) {
      const i = index(l.lidSinds)
      if (i >= 0) instroom[i] += 1
    }
    if (l.einddatum && l.einddatum <= vandaag) {
      const i = index(l.einddatum)
      if (i >= 0) uitstroom[i] += 1
    }
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
