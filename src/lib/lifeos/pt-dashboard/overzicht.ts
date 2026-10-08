// ─── PT-dashboard — de cijfers (PUUR) ───────────────────────────────────────
// Eén plek voor wat de PT'er op zijn dashboard ziet én wat Kane per PT'er en per
// club in LifeOS ziet. Alles wordt afgeleid uit de leads en klanten; er wordt
// niets geschat. `vandaag` = YYYY-MM-DD (Nederlandse tijd).

import { LEAD_STATUSSEN, OPEN_STATUSSEN, moetOpvolgen, type Lead, type LeadStatus } from '@/lib/lifeos/leads/leads'
import { CLUBS, type Club } from './clubs'
import { plusDagen, vatKlantenSamen, type KlantSamenvatting, type PtKlant } from './abonnementen'

export interface LeadCijfers {
  totaal: number
  dezeWeek: number
  dezeMaand: number
  open: number
  klant: number
  geenInteresse: number
  /** Klant geworden ÷ alle leads, in hele procenten; null zonder leads. */
  conversie: number | null
  perStatus: Record<LeadStatus, number>
}

export interface PtOverzicht {
  leads: LeadCijfers
  /** Open leads met een opvolgdatum vandaag. */
  vandaag: Lead[]
  /** Open leads waarvan de opvolgdatum voorbij is. */
  teLaat: Lead[]
  /** Open leads zonder opvolgdatum en zonder volgende stap: dreigen te verdwijnen. */
  zonderPlan: Lead[]
  klanten: KlantSamenvatting
}

/** Maandag van de week van `dag` (ISO-week, NL). */
function maandag(dag: string): string {
  const d = new Date(`${dag}T12:00:00Z`)
  const wd = (d.getUTCDay() + 6) % 7
  return plusDagen(dag, -wd)
}

export function leadCijfers(leads: readonly Lead[], vandaag: string): LeadCijfers {
  const weekStart = maandag(vandaag)
  const maandStart = `${vandaag.slice(0, 8)}01`
  const perStatus = Object.fromEntries(LEAD_STATUSSEN.map((s) => [s, 0])) as Record<LeadStatus, number>
  for (const l of leads) perStatus[l.status]++
  const klant = perStatus.klant
  return {
    totaal: leads.length,
    dezeWeek: leads.filter((l) => l.gesprokenOp >= weekStart && l.gesprokenOp <= vandaag).length,
    dezeMaand: leads.filter((l) => l.gesprokenOp >= maandStart && l.gesprokenOp <= vandaag).length,
    open: leads.filter((l) => OPEN_STATUSSEN.includes(l.status)).length,
    klant,
    geenInteresse: perStatus.geen_interesse,
    conversie: leads.length === 0 ? null : Math.round((klant / leads.length) * 100),
    perStatus,
  }
}

export function ptOverzicht(leads: readonly Lead[], klanten: readonly PtKlant[], vandaag: string): PtOverzicht {
  const open = leads.filter((l) => OPEN_STATUSSEN.includes(l.status))
  const opDatum = (a: Lead, b: Lead) => (a.opvolgdatum ?? '').localeCompare(b.opvolgdatum ?? '')
  return {
    leads: leadCijfers(leads, vandaag),
    vandaag: open.filter((l) => l.opvolgdatum === vandaag),
    teLaat: open.filter((l) => moetOpvolgen(l, vandaag) && l.opvolgdatum !== vandaag).sort(opDatum),
    zonderPlan: open.filter((l) => l.opvolgdatum === null && (l.volgendeStap === null || l.volgendeStap === 'afgesloten')),
    klanten: vatKlantenSamen(klanten, vandaag),
  }
}

/** Per club: aantal leads per status — het "Overzicht"-tabblad uit de Excel. */
export type ClubMatrix = { club: Club | 'onbekend'; totaal: number; perStatus: Record<LeadStatus, number> }[]

export function clubMatrix(leads: readonly Lead[]): ClubMatrix {
  const rijen = new Map<Club | 'onbekend', Record<LeadStatus, number>>()
  for (const l of leads) {
    const sleutel = l.club ?? 'onbekend'
    const r = rijen.get(sleutel) ?? (Object.fromEntries(LEAD_STATUSSEN.map((s) => [s, 0])) as Record<LeadStatus, number>)
    r[l.status]++
    rijen.set(sleutel, r)
  }
  const volgorde: (Club | 'onbekend')[] = [...CLUBS, 'onbekend']
  return volgorde
    .filter((c) => rijen.has(c))
    .map((club) => {
      const perStatus = rijen.get(club) as Record<LeadStatus, number>
      return { club, perStatus, totaal: Object.values(perStatus).reduce((a, b) => a + b, 0) }
    })
}

/** Telefoonnummer → "31612345678" voor wa.me / tel:, of null als het geen NL-mobiel/vast lijkt. */
export function belbaarNummer(contact: string | null): string | null {
  if (!contact) return null
  const cijfers = contact.replace(/[^\d+]/g, '')
  if (/^\+31\d{9}$/.test(cijfers)) return cijfers.slice(1)
  if (/^0031\d{9}$/.test(cijfers)) return cijfers.slice(2)
  if (/^0\d{9}$/.test(cijfers)) return `31${cijfers.slice(1)}`
  return null
}

/** De club waar deze PT'er het meest werkt (voor de standaardkeuze in formulieren). */
export function meestGebruikteClub(leads: readonly Pick<Lead, 'club'>[], klanten: readonly Pick<PtKlant, 'club'>[]): Club | null {
  const tel = new Map<Club, number>()
  for (const c of [...leads.map((l) => l.club), ...klanten.map((k) => k.club)]) if (c) tel.set(c, (tel.get(c) ?? 0) + 1)
  let beste: Club | null = null
  for (const [c, n] of tel) if (beste === null || n > (tel.get(beste) ?? 0)) beste = c
  return beste
}
