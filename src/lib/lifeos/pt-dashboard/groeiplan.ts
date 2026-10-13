// ─── PT-app — groeiplan: meer PT-klanten (PUUR, ook client) ────────────────
// Eén plan voor het hele team: een focus, een doel per club (actieve
// PT-klanten) en concrete acties per rol. Kane en de eigenaren passen het aan;
// PT'ers en clubmanagers lezen het. De cijfers ernaast komen live uit de app —
// niets verzonnen: wat niet is ingevuld, telt als 0.

import { CLUBS, isClub, type Club } from './clubs'
import { plusDagen, type PtKlant } from './abonnementen'
import type { Lead } from '@/lib/lifeos/leads/leads'

export const ACTIE_VOOR = ['iedereen', 'pt', 'clubmanager'] as const
export type ActieVoor = (typeof ACTIE_VOOR)[number]
export const VOOR_LABEL: Record<ActieVoor, string> = { iedereen: 'Iedereen', pt: "PT'ers", clubmanager: 'Clubmanagers' }

export interface GroeiActie {
  titel: string
  uitleg: string
  voor: ActieVoor
}

export interface Groeiplan {
  focus: string
  /** Doel: aantal actieve PT-klanten per club. Ontbreekt = geen doel gezet. */
  doelen: Partial<Record<Club, number>>
  acties: GroeiActie[]
}

export const MAX_ACTIES = 12
const MAX_FOCUS = 300
const MAX_TITEL = 80
const MAX_UITLEG = 500
const MAX_DOEL = 500

/** Het startplan tot Kane of een eigenaar het aanpast. Bewust zonder getallen: doelen zet het team zelf. */
export const START_PLAN: Groeiplan = {
  focus: 'Meer PT-klanten in elke club: meer gesprekken op de vloer, elke lead snel opvolgen en tevreden klanten om een referral vragen.',
  doelen: {},
  acties: [
    {
      titel: 'Elke dienst: gesprekken op de vloer',
      uitleg: 'Spreek tijdens je dienst leden aan die aan het trainen zijn. Geen verkooppraatje: vraag naar hun doel en hoe het gaat. Interesse? Leg ze meteen vast als lead (bron: Vloer).',
      voor: 'pt',
    },
    {
      titel: 'Elke lead binnen 2 dagen opvolgen',
      uitleg: 'Een nieuwe lead krijgt binnen twee dagen een bericht of telefoontje. Zet altijd een volgende stap en een opvolgdatum, dan zie je in de app wie er aan de beurt is.',
      voor: 'pt',
    },
    {
      titel: 'Vraag tevreden klanten om een referral',
      uitleg: 'Na een behaald doel of een goede meting: vraag of ze iemand kennen met hetzelfde doel. Komt er iemand, leg die vast met bron Referral.',
      voor: 'pt',
    },
    {
      titel: 'Bied duo-training aan',
      uitleg: 'Train je iemand al? Bied aan om een partner of vriend mee te nemen als duo. Samen trainen is voor veel mensen een kleinere stap.',
      voor: 'pt',
    },
    {
      titel: 'Nieuwe leden voorstellen aan de PT\'er',
      uitleg: 'Vertel bij elke inschrijving dat er een PT\'er in de club is en wanneer die er is. Geef interesse door aan de PT\'er, die legt het vast met bron Intake.',
      voor: 'clubmanager',
    },
    {
      titel: 'Elke week samen de cijfers bekijken',
      uitleg: 'Bekijk één keer per week met de PT\'ers van je club deze pagina: hoeveel gesprekken, wie moet er nog opgevolgd worden, waar staat de club ten opzichte van het doel?',
      voor: 'clubmanager',
    },
    {
      titel: 'Laat resultaten zien',
      uitleg: 'Deel, met toestemming van de klant, een resultaat of een stukje training op de social media van de club. Leads die daaruit komen: bron Social media.',
      voor: 'iedereen',
    },
    {
      titel: 'Houd klanten vast',
      uitleg: 'Elke klant die blijft, hoef je niet te vervangen. Vraag regelmatig hoe het gaat en vul bij een opzegging altijd de reden in, zodat we zien wat we beter kunnen doen.',
      voor: 'iedereen',
    },
  ],
}

type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const tekst = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[ \t]+/g, ' ').trim().slice(0, max) : '')

/** Invoer van het bewerkformulier (of een opgeslagen plan) controleren. */
export function leesGroeiplan(ruw: unknown): Uitkomst<Groeiplan> {
  if (typeof ruw !== 'object' || ruw === null) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = ruw as Record<string, unknown>
  const focus = tekst(o.focus, MAX_FOCUS)
  if (!focus) return { ok: false, fout: 'Vul de focus in: waar werken we nu aan?' }

  const doelen: Partial<Record<Club, number>> = {}
  if (typeof o.doelen === 'object' && o.doelen !== null) {
    for (const [club, n] of Object.entries(o.doelen as Record<string, unknown>)) {
      if (!isClub(club) || n === null || n === '' || n === undefined) continue
      const getal = typeof n === 'number' ? n : Number(n)
      if (!Number.isInteger(getal) || getal < 0 || getal > MAX_DOEL) return { ok: false, fout: 'Een doel is een heel getal van 0 tot 500.' }
      doelen[club] = getal
    }
  }

  const ruweActies = Array.isArray(o.acties) ? o.acties : []
  if (ruweActies.length > MAX_ACTIES) return { ok: false, fout: `Maximaal ${MAX_ACTIES} acties.` }
  const acties: GroeiActie[] = []
  for (const a of ruweActies) {
    const r = typeof a === 'object' && a !== null ? (a as Record<string, unknown>) : {}
    const titel = tekst(r.titel, MAX_TITEL)
    const uitleg = tekst(r.uitleg, MAX_UITLEG)
    if (!titel && !uitleg) continue
    if (!titel) return { ok: false, fout: 'Elke actie heeft een titel nodig.' }
    const voor = (ACTIE_VOOR as readonly unknown[]).includes(r.voor) ? (r.voor as ActieVoor) : 'iedereen'
    acties.push({ titel, uitleg, voor })
  }
  return { ok: true, waarde: { focus, doelen, acties } }
}

/** De acties die voor deze rol gelden (eigenaren en Kane zien alles). */
export function actiesVoor(plan: Groeiplan, rol: 'pt' | 'clubmanager' | 'alles'): GroeiActie[] {
  return rol === 'alles' ? plan.acties : plan.acties.filter((a) => a.voor === 'iedereen' || a.voor === rol)
}

// ─── Live cijfers (laatste 30 dagen) ────────────────────────────────────────

export const PERIODE_DAGEN = 30

export interface GroeiCijfers {
  /** Leads gesproken in de periode. */
  leads: number
  /** Waarvan inmiddels klant geworden. */
  klantGeworden: number
  /** Nieuwe klanten gestart in de periode. */
  nieuweKlanten: number
  /** Leads die al 2+ dagen op "nieuw" staan, of met een verlopen opvolgdatum. */
  nietOpgevolgd: number
  /** Leads in de periode waarbij om een referral is gevraagd. */
  referralGevraagd: number
  /** Leads in de periode die via een referral kwamen. */
  viaReferral: number
}

export interface ClubStand {
  club: Club
  actief: number
  doel: number | null
  leads: number
  nieuweKlanten: number
}

const OPEN = new Set(['nieuw', 'opvolgen', 'proefles', 'intake', 'later'])

function nietOpgevolgd(l: Lead, vandaag: string): boolean {
  if (!OPEN.has(l.status)) return false
  if (l.status === 'nieuw' && !l.opvolgdatum) return l.gesprokenOp <= plusDagen(vandaag, -2)
  return l.opvolgdatum !== null && l.opvolgdatum < vandaag
}

/** De kerncijfers van de afgelopen 30 dagen (vandaag telt mee). */
export function groeiCijfers(leads: readonly Lead[], klanten: readonly PtKlant[], vandaag: string): GroeiCijfers {
  const van = plusDagen(vandaag, -(PERIODE_DAGEN - 1))
  const recent = leads.filter((l) => l.gesprokenOp >= van && l.gesprokenOp <= vandaag)
  return {
    leads: recent.length,
    klantGeworden: recent.filter((l) => l.status === 'klant').length,
    nieuweKlanten: klanten.filter((k) => k.startdatum >= van && k.startdatum <= vandaag).length,
    nietOpgevolgd: leads.filter((l) => nietOpgevolgd(l, vandaag)).length,
    referralGevraagd: recent.filter((l) => l.referralGevraagd).length,
    viaReferral: recent.filter((l) => l.bron === 'referral').length,
  }
}

/**
 * Per club: actieve PT-klanten tegenover het doel, plus leads en nieuwe klanten
 * van de afgelopen 30 dagen. Alleen `clubs` (een clubmanager: zijn eigen).
 * Klanten en leads zonder club tellen niet mee in een club.
 */
export function clubStanden(
  leads: readonly Lead[],
  klanten: readonly PtKlant[],
  plan: Groeiplan,
  vandaag: string,
  clubs: readonly Club[] = CLUBS,
): ClubStand[] {
  const van = plusDagen(vandaag, -(PERIODE_DAGEN - 1))
  return clubs.map((club) => ({
    club,
    actief: klanten.filter((k) => k.club === club && k.status === 'actief').length,
    doel: plan.doelen[club] ?? null,
    leads: leads.filter((l) => l.club === club && l.gesprokenOp >= van && l.gesprokenOp <= vandaag).length,
    nieuweKlanten: klanten.filter((k) => k.club === club && k.startdatum >= van && k.startdatum <= vandaag).length,
  }))
}
