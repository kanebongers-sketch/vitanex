// ─── LifeOS — PT-dashboard: weekcheck-in (PUUR, ook client) ─────────────────
// De PT'er bereidt het wekelijkse coachgesprek met Kane voor: energie (1–5) en
// vier korte vragen. Eén check-in per week; de week is de maandag (NL-tijd) en
// wordt altijd server-side bepaald (`weekVan`), nooit door de browser gekozen.
// Tabel: `pt_weekcheckins` (migratie 353).

import { dagSleutelNl } from '@/lib/lifeos/leads/leads'

export type Energie = 1 | 2 | 3 | 4 | 5
export const ENERGIE_NIVEAUS: readonly Energie[] = [1, 2, 3, 4, 5]
export const ENERGIE_LABEL: Record<Energie, string> = { 1: 'Leeg', 2: 'Moe', 3: 'Oké', 4: 'Goed', 5: 'Top' }

export type CheckinTekstVeld = 'gewonnen' | 'lastig' | 'bespreken' | 'focus'

/** De vier vragen, in deze volgorde op het formulier, bij Kane en in het verslag. */
export const CHECKIN_VRAGEN: readonly { veld: CheckinTekstVeld; label: string; kort: string; hint: string; max: number }[] = [
  { veld: 'gewonnen', label: 'Wat ging goed deze week?', kort: 'Ging goed', hint: 'Een klant die vooruitging, een lead die klant werd, iets waar je trots op bent.', max: 600 },
  { veld: 'lastig', label: 'Waar liep je tegenaan?', kort: 'Lastig', hint: 'Een klant die afhaakt, planning, motivatie: wat het ook is.', max: 600 },
  { veld: 'bespreken', label: 'Wat wil je met Kane bespreken?', kort: 'Wil bespreken', hint: 'Dan begint het gesprek waar het voor jou om draait.', max: 600 },
  { veld: 'focus', label: 'Jouw focus voor volgende week', kort: 'Focus volgende week', hint: 'Eén ding is genoeg.', max: 300 },
]

export interface CheckinInvoer {
  energie: Energie | null
  gewonnen: string | null
  lastig: string | null
  bespreken: string | null
  focus: string | null
}

export interface Checkin extends CheckinInvoer {
  /** Maandag van de week, YYYY-MM-DD. */
  week: string
  /** ISO-moment van de laatste keer opslaan. */
  bijgewerktOp: string
}

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const DAG = /^\d{4}-\d{2}-\d{2}$/

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Spaties samenvouwen (enters blijven), trimmen, inkorten; leeg → null. */
function tekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  return t.length === 0 ? null : t.slice(0, max).trim()
}

export function isEnergie(v: unknown): v is Energie {
  return typeof v === 'number' && (ENERGIE_NIVEAUS as readonly number[]).includes(v)
}

/** Het formulier van de PT'er → een check-in, of een leesbare fout. */
export function leesCheckinInvoer(body: unknown): Lees<CheckinInvoer> {
  const o = obj(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  if (o.energie !== null && o.energie !== undefined && !isEnergie(o.energie)) {
    return { ok: false, fout: 'Kies je energie van 1 tot 5.' }
  }
  const waarde: CheckinInvoer = {
    energie: isEnergie(o.energie) ? o.energie : null,
    gewonnen: null,
    lastig: null,
    bespreken: null,
    focus: null,
  }
  for (const v of CHECKIN_VRAGEN) waarde[v.veld] = tekst(o[v.veld], v.max)
  if (isLeeg(waarde)) return { ok: false, fout: 'Vul minstens je energie of één vraag in.' }
  return { ok: true, waarde }
}

export function isLeeg(c: CheckinInvoer): boolean {
  return c.energie === null && CHECKIN_VRAGEN.every((v) => c[v.veld] === null)
}

/** De maandag (YYYY-MM-DD) van de week waarin `dag` (YYYY-MM-DD) valt. */
export function weekVan(dag: string): string {
  const d = new Date(`${dag}T12:00:00Z`)
  const terug = (d.getUTCDay() + 6) % 7 // ma = 0 … zo = 6
  d.setUTCDate(d.getUTCDate() - terug)
  return d.toISOString().slice(0, 10)
}

/** De lopende week in Nederlandse tijd. */
export function huidigeWeek(nu: Date): string {
  return weekVan(dagSleutelNl(nu))
}

const WEEK_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const MOMENT = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam',
})

/** "week van 5 okt" */
export function weekLabel(week: string): string {
  return `week van ${WEEK_KORT.format(new Date(`${week}T12:00:00Z`))}`
}

/** "wo 8 okt om 14:32" (NL-tijd). */
export function momentLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const delen = MOMENT.formatToParts(d)
  const deel = (t: Intl.DateTimeFormatPartTypes) => delen.find((p) => p.type === t)?.value ?? ''
  return `${deel('weekday')} ${deel('day')} ${deel('month')} om ${deel('hour')}:${deel('minute')}`
}

/** Eén check-in uit JSON (API-antwoord), of null. */
export function leesCheckin(ruw: unknown): Checkin | null {
  const x = obj(ruw)
  if (!x || typeof x.week !== 'string' || !DAG.test(x.week) || typeof x.bijgewerktOp !== 'string') return null
  if (x.energie !== null && x.energie !== undefined && !isEnergie(x.energie)) return null
  const waarde: CheckinInvoer = { energie: isEnergie(x.energie) ? x.energie : null, gewonnen: null, lastig: null, bespreken: null, focus: null }
  for (const v of CHECKIN_VRAGEN) waarde[v.veld] = tekst(x[v.veld], v.max)
  return { week: x.week, bijgewerktOp: x.bijgewerktOp, ...waarde }
}

/** De check-in als platte tekst (voor het pdf-verslag). */
export function checkinTekst(c: Checkin): string {
  const regels = c.energie ? [`Energie: ${c.energie}/5 (${ENERGIE_LABEL[c.energie]})`] : []
  for (const v of CHECKIN_VRAGEN) {
    const t = c[v.veld]
    if (t) regels.push(`${v.kort}: ${t}`)
  }
  regels.push(`Ingevuld ${momentLabel(c.bijgewerktOp)}`)
  return regels.join('\n')
}
