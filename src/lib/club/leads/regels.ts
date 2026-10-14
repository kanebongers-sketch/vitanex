// ─── Fit Factory Club: regels voor opvolgen en proeflessen (PUUR) ───────────
// Dagen zijn sleutels "YYYY-MM-DD" in Nederlandse tijd (Europe/Amsterdam).
// "Vandaag" wordt altijd van buiten meegegeven, zodat alles testbaar is.

import { AFGESLOTEN, type Lead } from './model'

const DAG_NL = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Amsterdam' })
const TIJD_NL = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
const DATUM_NL = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })
const DAG_RE = /^\d{4}-\d{2}-\d{2}$/

/** De dagsleutel (YYYY-MM-DD) van een moment in Nederlandse tijd. */
export function dagVan(moment: Date): string {
  return DAG_NL.format(moment)
}

export function isDagSleutel(v: unknown): v is string {
  if (typeof v !== 'string' || !DAG_RE.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

/** Een dagsleutel plus n dagen (n mag negatief zijn). */
export function dagPlus(dag: string, n: number): string {
  const d = new Date(`${dag}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export type OpvolgStatus = 'te_laat' | 'vandaag' | 'gepland' | 'geen'

/** Hoe staat de opvolging ervoor? Afgesloten leads (lid, verloren) hoeven niets. */
export function opvolgStatus(lead: Pick<Lead, 'status' | 'opvolgenOp'>, vandaag: string): OpvolgStatus {
  if (AFGESLOTEN.includes(lead.status) || !lead.opvolgenOp) return 'geen'
  const dag = lead.opvolgenOp.slice(0, 10)
  if (dag < vandaag) return 'te_laat'
  if (dag === vandaag) return 'vandaag'
  return 'gepland'
}

export type ProeflesStand = 'geen' | 'komt' | 'vandaag' | 'uitkomst_nodig'

/** Waar staat de proefles? Na het tijdstip moet iemand "geweest" of "niet gekomen" kiezen. */
export function proeflesStand(lead: Pick<Lead, 'status' | 'proeflesOp'>, nu: Date): ProeflesStand {
  if (lead.status !== 'proefles' || !lead.proeflesOp) return 'geen'
  const moment = new Date(lead.proeflesOp)
  if (Number.isNaN(moment.getTime())) return 'geen'
  if (moment.getTime() <= nu.getTime()) return 'uitkomst_nodig'
  return dagVan(moment) === dagVan(nu) ? 'vandaag' : 'komt'
}

export type VandaagReden = 'te_laat' | 'opvolgen' | 'proefles' | 'uitkomst'

export interface VandaagItem {
  lead: Lead
  reden: VandaagReden
}

const VOLGORDE: Record<VandaagReden, number> = { uitkomst: 0, proefles: 1, te_laat: 2, opvolgen: 3 }

/** De actielijst van vandaag: proeflessen (vandaag of zonder uitkomst) en opvolgingen die nu of al eerder moesten. */
export function vandaagOpvolgen(leads: readonly Lead[], nu: Date): VandaagItem[] {
  const vandaag = dagVan(nu)
  const items: VandaagItem[] = []
  for (const lead of leads) {
    const stand = proeflesStand(lead, nu)
    const opvolg = opvolgStatus(lead, vandaag)
    if (stand === 'uitkomst_nodig') items.push({ lead, reden: 'uitkomst' })
    else if (stand === 'vandaag') items.push({ lead, reden: 'proefles' })
    else if (opvolg === 'te_laat') items.push({ lead, reden: 'te_laat' })
    else if (opvolg === 'vandaag') items.push({ lead, reden: 'opvolgen' })
  }
  return items.sort((a, b) => VOLGORDE[a.reden] - VOLGORDE[b.reden] || sorteerMoment(a.lead).localeCompare(sorteerMoment(b.lead)))
}

function sorteerMoment(lead: Lead): string {
  return lead.proeflesOp ?? lead.opvolgenOp ?? lead.aangemaaktOp
}

export interface Snelkeuze {
  label: string
  dag: string
}

/** De snelkeuzes voor de volgende opvolgdatum: morgen, over 3 dagen, volgende week. */
export function opvolgSnelkeuzes(vandaag: string): Snelkeuze[] {
  return [
    { label: 'Morgen', dag: dagPlus(vandaag, 1) },
    { label: 'Over 3 dagen', dag: dagPlus(vandaag, 3) },
    { label: 'Volgende week', dag: dagPlus(vandaag, 7) },
  ]
}

/** "di 14 okt, 18:00" in Nederlandse tijd. */
export function toonMoment(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${DATUM_NL.format(d)}, ${TIJD_NL.format(d)}`
}

/** Een dagsleutel als "di 14 okt", of "vandaag"/"morgen"/"gisteren" ten opzichte van `vandaag`. */
export function toonDag(dag: string, vandaag: string): string {
  if (dag === vandaag) return 'vandaag'
  if (dag === dagPlus(vandaag, 1)) return 'morgen'
  if (dag === dagPlus(vandaag, -1)) return 'gisteren'
  return DATUM_NL.format(new Date(`${dag}T12:00:00Z`))
}

/** Een tel:-link zonder spaties en streepjes (internationaal + blijft staan). */
export function telLink(telefoon: string): string {
  return `tel:${telefoon.replace(/[^\d+]/g, '')}`
}
