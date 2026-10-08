// ─── PT-team overzicht voor Kane (PUUR) ─────────────────────────────────────
// Per PT'er de kerncijfers uit diens dashboard, plus per club de leads per
// status (het "Overzicht"-tabblad uit de oude Excel). Opbouwen gebeurt op de
// server (GET /api/lifeos/pt-team), uitlezen in de browser — beide hier, zodat de
// vorm over de draad op één plek staat.

import { LEAD_STATUSSEN, leesLead, type Lead, type LeadStatus, isPinStatus, type PinStatus } from '@/lib/lifeos/leads/leads'
import { isClub, type Club } from './clubs'
import { leesKlant, type PtKlant } from './abonnementen'
import { clubMatrix, ptOverzicht, type ClubMatrix, type LeadCijfers } from './overzicht'

export interface TeamRij {
  id: string
  naam: string
  code: string | null
  pinStatus: PinStatus | null
  leads: LeadCijfers
  teLaat: number
  vandaag: number
  zonderPlan: number
  klantenLopend: number
  bevroren: number
  maandwaarde: number
  sessiesPerWeek: number
  vastBijnaKlaar: number
  /** Dagsleutel van de laatst gesproken lead, of null. */
  laatsteLead: string | null
}

export interface TeamOverzicht {
  vandaag: string
  rijen: TeamRij[]
  clubs: ClubMatrix
}

export function bouwTeamOverzicht(
  team: readonly { id: string; naam: string; code: string | null; pinStatus: PinStatus | null }[],
  leads: ReadonlyMap<string, readonly Lead[]>,
  klanten: ReadonlyMap<string, readonly PtKlant[]>,
  vandaag: string,
): TeamOverzicht {
  const rijen = team.map((p): TeamRij => {
    const l = leads.get(p.id) ?? []
    const o = ptOverzicht(l, klanten.get(p.id) ?? [], vandaag)
    return {
      ...p,
      leads: o.leads,
      teLaat: o.teLaat.length,
      vandaag: o.vandaag.length,
      zonderPlan: o.zonderPlan.length,
      klantenLopend: o.klanten.lopend,
      bevroren: o.klanten.bevroren,
      maandwaarde: o.klanten.maandwaarde,
      sessiesPerWeek: o.klanten.sessiesPerWeek,
      vastBijnaKlaar: o.klanten.vastBijnaKlaar.length,
      laatsteLead: l.reduce<string | null>((m, x) => (m === null || x.gesprokenOp > m ? x.gesprokenOp : m), null),
    }
  })
  return { vandaag, rijen, clubs: clubMatrix([...leads.values()].flat()) }
}

// ─── Uitlezen (systeemgrens) ──────────────────────────────────────────────────

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}
const getal = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function perStatus(v: unknown): Record<LeadStatus, number> {
  const o = obj(v) ?? {}
  return Object.fromEntries(LEAD_STATUSSEN.map((s) => [s, getal(o[s])])) as Record<LeadStatus, number>
}

function leesCijfers(v: unknown): LeadCijfers {
  const o = obj(v) ?? {}
  return {
    totaal: getal(o.totaal), dezeWeek: getal(o.dezeWeek), dezeMaand: getal(o.dezeMaand), open: getal(o.open),
    klant: getal(o.klant), geenInteresse: getal(o.geenInteresse),
    conversie: typeof o.conversie === 'number' ? o.conversie : null, perStatus: perStatus(o.perStatus),
  }
}

export function leesTeamOverzicht(ruw: unknown): TeamOverzicht | null {
  const o = obj(ruw)
  if (!o || typeof o.vandaag !== 'string' || !Array.isArray(o.rijen) || !Array.isArray(o.clubs)) return null
  const rijen = o.rijen.flatMap((r): TeamRij[] => {
    const x = obj(r)
    if (!x || typeof x.id !== 'string' || typeof x.naam !== 'string') return []
    return [{
      id: x.id, naam: x.naam,
      code: typeof x.code === 'string' ? x.code : null,
      pinStatus: isPinStatus(x.pinStatus) ? x.pinStatus : null,
      leads: leesCijfers(x.leads),
      teLaat: getal(x.teLaat), vandaag: getal(x.vandaag), zonderPlan: getal(x.zonderPlan),
      klantenLopend: getal(x.klantenLopend), bevroren: getal(x.bevroren), maandwaarde: getal(x.maandwaarde),
      sessiesPerWeek: getal(x.sessiesPerWeek), vastBijnaKlaar: getal(x.vastBijnaKlaar),
      laatsteLead: typeof x.laatsteLead === 'string' ? x.laatsteLead : null,
    }]
  })
  const clubs = o.clubs.flatMap((c): ClubMatrix => {
    const x = obj(c)
    if (!x || !(isClub(x.club) || x.club === 'onbekend')) return []
    return [{ club: x.club as Club | 'onbekend', totaal: getal(x.totaal), perStatus: perStatus(x.perStatus) }]
  })
  return { vandaag: o.vandaag, rijen, clubs }
}

export interface PtDetail {
  naam: string
  code: string | null
  vandaag: string
  leads: Lead[]
  klanten: PtKlant[]
}

export function leesPtDetail(ruw: unknown): PtDetail | null {
  const o = obj(ruw)
  if (!o || typeof o.naam !== 'string' || typeof o.vandaag !== 'string' || !Array.isArray(o.leads) || !Array.isArray(o.klanten)) return null
  return {
    naam: o.naam,
    code: typeof o.code === 'string' ? o.code : null,
    vandaag: o.vandaag,
    leads: o.leads.flatMap((l) => {
      const x = leesLead(l)
      return x ? [x] : []
    }),
    klanten: o.klanten.flatMap((k) => {
      const x = leesKlant(k)
      return x ? [x] : []
    }),
  }
}
