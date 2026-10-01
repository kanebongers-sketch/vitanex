// ─── LifeOS — van mail naar to-do (PUUR) ────────────────────────────────────
// Welke mail wordt een taak, met welke titel en welke deadline? Een REGEL, geen
// model: je moet kunnen narekenen waarom iets op je lijst kwam (zelfde keuze als
// `inbox/classificeer.ts`, en om dezelfde reden).
//
// Wat we weten is alleen afzender + onderwerp — LifeOS leest de inhoud van je
// mail niet (zie de kop van `inbox/gmail.ts`). De titel zegt dus wat er te doen
// valt ("Reageren op …"), nooit wat er in de mail stond.
//
// DEADLINES zijn vuistregels, geen feiten uit de mail, en dat zegt de notitie ook:
//   factuur          → binnen 7 dagen (een aanmaning/herinnering: 2 dagen)
//   offerte/contract → binnen 3 dagen
//   reageren         → binnen 2 dagen; een vraag in het onderwerp: 1 dag;
//                      "dringend"/"urgent"/"spoed": vandaag

import type { BeoordeeldeMail } from '@/lib/lifeos/inbox/classificeer'
import { gmailLink } from '@/lib/lifeos/inbox/inbox'
import { dagPlus, dagVan } from '@/lib/lifeos/blokken/tijd'

export type MailTaakSoort = 'factuur' | 'offerte' | 'reageren'

export interface MailTaakVoorstel {
  berichtId: string
  threadId: string
  soort: MailTaakSoort
  titel: string
  /** Dagsleutel: wanneer het áf moet. */
  deadline: string
  inspanningMinuten: number
  notitie: string
  afzender: string | null
  onderwerp: string | null
  ontvangenOp: Date
}

const FACTUUR = /\b(factuur|facturen|invoice|betaling|betaalverzoek|aanmaning|herinnering\s+betaling|openstaand)\b/i
const AANMANING = /\b(aanmaning|herinnering|reminder|achterstallig)\b/i
const OFFERTE = /\b(offerte|contract|overeenkomst|voorstel|samenwerking|ondertekenen|tekenen)\b/i
const DRINGEND = /\b(dringend|urgent|spoed|asap)\b/i
/** Gmail-categorieën die nooit een taak worden, ook niet met "factuur" erin. */
const RECLAME = new Set(['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'CATEGORY_FORUMS'])
const MAX_TITEL = 110
/** Agenda-meldingen: die regelt je agenda al, geen to-do. */
const AGENDA_MELDING = /^(uitnodiging|bijgewerkte uitnodiging|invitation|updated invitation|geaccepteerd|accepted|afgewezen|declined|voorlopig|tentative|geannuleerd|canceled|cancelled)\b/i

/** Mail van jezelf of van LifeOS zelf (dagmail, verslag-pdf) wordt nooit een taak. */
function isEigen(adres: string | null, naam: string | null, eigen: ReadonlySet<string>): boolean {
  const a = adres?.trim().toLowerCase() ?? ''
  if (a.endsWith('@resend.dev') || a === 'calendar-notification@google.com') return true
  if (naam?.trim() === 'MentaForce') return true
  return a.length > 0 && eigen.has(a)
}

function kort(tekst: string, max: number): string {
  const t = tekst.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`
}

/** "Re: Fwd: Vraag" → "Vraag": de voorvoegsels zeggen niets over de taak. */
export function schoonOnderwerp(onderwerp: string | null): string {
  return (onderwerp ?? '').replace(/^\s*((re|fw|fwd|antw|doorst)\s*:\s*)+/i, '').trim()
}

function naamVan(m: BeoordeeldeMail['mail']): string {
  return m.afzenderNaam?.trim() || m.afzenderAdres?.trim() || 'onbekende afzender'
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })

/**
 * Wordt deze mail een taak? Alleen ONGELEZEN post:
 *   - die volgens de triage iets van je vraagt (direct aan jou, geen bulk), of
 *   - met een factuur in het onderwerp — die komt vaak van een no-reply-adres
 *     en valt dan door de triage, maar moet wél betaald.
 */
export function mailNaarTaak(b: BeoordeeldeMail, eigen: ReadonlySet<string> = new Set()): MailTaakVoorstel | null {
  const m = b.mail
  if (!m.labels.includes('UNREAD')) return null
  if (m.labels.some((l) => RECLAME.has(l))) return null
  if (isEigen(m.afzenderAdres, m.afzenderNaam, eigen)) return null

  const onderwerp = schoonOnderwerp(m.onderwerp)
  if (AGENDA_MELDING.test(onderwerp)) return null
  const naam = naamVan(m)
  const ontvangen = dagVan(m.ontvangenOp)
  const isFactuur = FACTUUR.test(onderwerp)
  if (!b.oordeel.vraagtActie && !isFactuur) return null

  let soort: MailTaakSoort
  let titel: string
  let dagen: number
  let minuten: number
  let regel: string
  if (isFactuur) {
    soort = 'factuur'
    titel = `Factuur afhandelen: ${onderwerp || naam} (${naam})`
    dagen = AANMANING.test(onderwerp) ? 2 : 7
    minuten = 15
    regel = dagen === 2 ? 'herinnering/aanmaning: binnen 2 dagen' : 'factuur: binnen 7 dagen'
  } else if (OFFERTE.test(onderwerp)) {
    soort = 'offerte'
    titel = `Bekijken en reageren: ${onderwerp} (${naam})`
    dagen = 3
    minuten = 30
    regel = 'offerte/contract: binnen 3 dagen'
  } else {
    soort = 'reageren'
    titel = onderwerp ? `Reageren op ${naam}: ${onderwerp}` : `Reageren op mail van ${naam}`
    dagen = DRINGEND.test(onderwerp) ? 0 : onderwerp.includes('?') ? 1 : 2
    minuten = 15
    regel = dagen === 0 ? 'dringend: vandaag' : dagen === 1 ? 'vraag in het onderwerp: binnen 1 dag' : 'reageren: binnen 2 dagen'
  }

  const notitie = [
    `Uit je mail van ${naam} (${DATUM.format(m.ontvangenOp)}).`,
    `Deadline is een vuistregel (${regel}), niet uit de mail zelf — pas gerust aan.`,
    `Openen in Gmail: ${gmailLink(m.id)}`,
  ].join('\n')

  return {
    berichtId: m.id,
    threadId: m.threadId,
    soort,
    titel: kort(titel, MAX_TITEL),
    deadline: dagPlus(ontvangen, dagen),
    inspanningMinuten: minuten,
    notitie,
    afzender: naam,
    onderwerp: m.onderwerp,
    ontvangenOp: m.ontvangenOp,
  }
}
