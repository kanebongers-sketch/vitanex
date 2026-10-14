// ─── Fit Factory Club: cijfers van de leads (PUUR) ──────────────────────────
// Heldere definities, want "conversie" betekent overal iets anders:
//   Nieuwe leads deze maand: leads aangemaakt sinds de eerste van deze maand (NL-tijd).
//   Proeflessen gepland: leads met status "Proefles gepland" en een tijdstip dat nog komt.
//   Conversie lead naar lid (90 dagen): van alle leads die de laatste 90 dagen
//   binnenkwamen, het deel dat nu lid is. Leads die nog lopen tellen mee in de
//   noemer, dus het cijfer kan nog stijgen naarmate zij beslissen.

import { LEAD_BRONNEN, type Lead, type LeadBron } from './model'
import { dagPlus, dagVan } from './regels'

export const CONVERSIE_DAGEN = 90

export const CONVERSIE_UITLEG =
  'Van alle leads die de laatste 90 dagen binnenkwamen: het deel dat nu lid is. Lopende leads tellen mee, dus het cijfer kan nog stijgen.'

export interface Conversie {
  leads: number
  leden: number
  /** Afgerond procent, of null zonder leads (geen verzonnen 0%). */
  procent: number | null
}

export interface BronCijfer extends Conversie {
  bron: LeadBron
}

export interface LeadCijfers {
  nieuwDezeMaand: number
  proeflessenGepland: number
  conversie: Conversie
  perBron: BronCijfer[]
}

export function isLidGeworden(lead: Pick<Lead, 'status' | 'lidId'>): boolean {
  return lead.status === 'lid' || lead.lidId !== null
}

export function conversie(leads: readonly Pick<Lead, 'status' | 'lidId'>[]): Conversie {
  const leden = leads.filter(isLidGeworden).length
  return { leads: leads.length, leden, procent: leads.length === 0 ? null : Math.round((leden / leads.length) * 100) }
}

/** Leads die binnen de laatste `dagen` dagen (NL-dagen, vandaag meegeteld) zijn aangemaakt. */
export function binnenDagen<T extends Pick<Lead, 'aangemaaktOp'>>(leads: readonly T[], nu: Date, dagen: number): T[] {
  const vanaf = dagPlus(dagVan(nu), -(dagen - 1))
  return leads.filter((l) => dagVan(new Date(l.aangemaaktOp)) >= vanaf)
}

export function berekenCijfers(leads: readonly Lead[], nu: Date): LeadCijfers {
  const maandStart = `${dagVan(nu).slice(0, 7)}-01`
  const recent = binnenDagen(leads, nu, CONVERSIE_DAGEN)
  const perBron = LEAD_BRONNEN.map((bron) => ({ bron, ...conversie(recent.filter((l) => l.bron === bron)) }))
    .filter((b) => b.leads > 0)
    .sort((a, b) => b.leads - a.leads)
  return {
    nieuwDezeMaand: leads.filter((l) => dagVan(new Date(l.aangemaaktOp)) >= maandStart).length,
    proeflessenGepland: leads.filter((l) => l.status === 'proefles' && l.proeflesOp !== null && new Date(l.proeflesOp).getTime() > nu.getTime()).length,
    conversie: conversie(recent),
    perBron,
  }
}
