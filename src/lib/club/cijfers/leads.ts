// ─── Fit Factory Club: leadconversie (PUUR) ─────────────────────────────────
// Per bron: hoeveel leads, hoeveel kwamen tot een proefles, hoeveel werden lid.

import type { Vestiging } from '@/lib/club/kern/vestiging'

export const LEAD_BRONNEN = ['website', 'balie', 'telefoon', 'social', 'verwijzing', 'actie', 'overig'] as const
export type LeadBron = (typeof LEAD_BRONNEN)[number]
export const LEAD_STATUSSEN = ['nieuw', 'contact', 'proefles', 'proefles_geweest', 'lid', 'verloren'] as const
export type LeadStatus = (typeof LEAD_STATUSSEN)[number]

export const BRON_LABEL: Record<LeadBron, string> = {
  website: 'Website',
  balie: 'Balie',
  telefoon: 'Telefoon',
  social: 'Social media',
  verwijzing: 'Via een lid',
  actie: 'Actie',
  overig: 'Overig',
}

export function isLeadBron(v: unknown): v is LeadBron {
  return typeof v === 'string' && (LEAD_BRONNEN as readonly string[]).includes(v)
}

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === 'string' && (LEAD_STATUSSEN as readonly string[]).includes(v)
}

export interface LeadCijferRij {
  vestiging: Vestiging
  bron: LeadBron
  status: LeadStatus
  proeflesOp: string | null
}

export interface Conversie {
  bron: LeadBron | 'totaal'
  label: string
  leads: number
  proefles: number
  lid: number
  verloren: number
  open: number
  /** lid / leads, 0..1 */
  conversie: number
}

function heeftProefles(l: LeadCijferRij): boolean {
  return l.proeflesOp !== null || l.status === 'proefles' || l.status === 'proefles_geweest' || l.status === 'lid'
}

function tel(leads: readonly LeadCijferRij[], bron: LeadBron | 'totaal', label: string): Conversie {
  const lid = leads.filter((l) => l.status === 'lid').length
  const verloren = leads.filter((l) => l.status === 'verloren').length
  return {
    bron,
    label,
    leads: leads.length,
    proefles: leads.filter(heeftProefles).length,
    lid,
    verloren,
    open: leads.length - lid - verloren,
    conversie: leads.length > 0 ? lid / leads.length : 0,
  }
}

/** Conversie per bron (alleen bronnen met leads, meeste leads eerst), plus een totaalregel. */
export function conversiePerBron(leads: readonly LeadCijferRij[]): { perBron: Conversie[]; totaal: Conversie } {
  const perBron = LEAD_BRONNEN.map((b) =>
    tel(
      leads.filter((l) => l.bron === b),
      b,
      BRON_LABEL[b],
    ),
  )
    .filter((c) => c.leads > 0)
    .sort((a, b) => b.leads - a.leads)
  return { perBron, totaal: tel(leads, 'totaal', 'Totaal') }
}
