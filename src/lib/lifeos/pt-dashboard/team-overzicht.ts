// ─── PT-team overzicht voor Kane (PUUR) ─────────────────────────────────────
// Per PT'er de kerncijfers uit diens dashboard, plus per club de leads per
// status (het "Overzicht"-tabblad uit de oude Excel). Opgebouwd op de server voor
// de eigenaren en de beheerder in de PT-app; plus het uitlezen van de eigenaren
// (Beheer, via de LifeOS-API).

import { isPinStatus, type Lead, type PinStatus } from '@/lib/lifeos/leads/leads'
import { vatKlantenSamen, type PtKlant } from './abonnementen'
import { CLUBS, type Club } from './clubs'
import { clubMatrix, ptOverzicht, type ClubMatrix, type LeadCijfers } from './overzicht'
import { analyseer, type Analyse } from './analyse'
import type { PtDoelen } from './doelen'

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
  /** Doelen die Kane zette (pt_doelen), of null. */
  doelen: PtDoelen | null
}

/** Per vestiging: lopende abonnementen, personen en maandomzet (zoals de Excel-samenvatting). */
export interface VestigingRij {
  club: Club
  lopend: number
  personen: number
  bevroren: number
  maandwaarde: number
}

export interface TeamOverzicht {
  vandaag: string
  rijen: TeamRij[]
  clubs: ClubMatrix
  /** Funnel & trends over alle leads van het team; null als het antwoord die niet bevat. */
  analyse: Analyse | null
  /** Klanten en omzet per vestiging; alleen vestigingen met klanten. */
  vestigingen: VestigingRij[]
}

/** Klanten van het hele team per vestiging samengevat. */
export function perVestiging(klanten: readonly PtKlant[], vandaag: string): VestigingRij[] {
  return CLUBS.flatMap((club) => {
    const s = vatKlantenSamen(klanten.filter((k) => k.club === club), vandaag)
    return s.lopend === 0 ? [] : [{ club, lopend: s.lopend, personen: s.personen, bevroren: s.bevroren, maandwaarde: s.maandwaarde }]
  }).sort((a, b) => b.maandwaarde - a.maandwaarde)
}

export function bouwTeamOverzicht(
  team: readonly { id: string; naam: string; code: string | null; pinStatus: PinStatus | null }[],
  leads: ReadonlyMap<string, readonly Lead[]>,
  klanten: ReadonlyMap<string, readonly PtKlant[]>,
  vandaag: string,
  doelen: ReadonlyMap<string, PtDoelen> = new Map(),
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
      doelen: doelen.get(p.id) ?? null,
    }
  })
  const alle = [...leads.values()].flat()
  return { vandaag, rijen, clubs: clubMatrix(alle), analyse: analyseer(alle, vandaag), vestigingen: perVestiging([...klanten.values()].flat(), vandaag) }
}

// ─── Uitlezen (systeemgrens) ──────────────────────────────────────────────────

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

// ─── Eigenaren (meekijkers, bv. Ruben) ────────────────────────────────────────

/** Een eigenaar met zijn PT-app-link, zodat Kane de pincode kan goedkeuren. */
export interface EigenaarRij {
  id: string
  naam: string
  code: string
  pinStatus: PinStatus
  pinAangevraagdOp: string | null
  /** Bij een wachtende pin: de controlecode om na te vragen. */
  controle?: string
}

export function leesEigenaren(ruw: unknown): EigenaarRij[] {
  const lijst = obj(ruw)?.eigenaren
  if (!Array.isArray(lijst)) return []
  return lijst.flatMap((e): EigenaarRij[] => {
    const x = obj(e)
    if (!x || typeof x.id !== 'string' || typeof x.naam !== 'string' || typeof x.code !== 'string' || !isPinStatus(x.pinStatus)) return []
    return [{
      id: x.id, naam: x.naam, code: x.code, pinStatus: x.pinStatus,
      pinAangevraagdOp: typeof x.pinAangevraagdOp === 'string' ? x.pinAangevraagdOp : null,
      ...(typeof x.controle === 'string' && /^\d{4}$/.test(x.controle) ? { controle: x.controle } : {}),
    }]
  })
}
