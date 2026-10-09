// ─── PT-team — CSV-export voor Kane (PUUR) ──────────────────────────────────
// Leads en PT-klanten van het hele team als CSV, met dezelfde kolommen als de
// oude Excel-tracker. Geschreven voor Excel NL: UTF-8 met BOM (anders worden
// é/ë rommel), puntkomma als scheidingsteken, CRLF-regeleinden, datums als
// dd-mm-jjjj.
//
// Veiligheid: PT'ers vullen de velden zelf in. Een cel die met = + - @ (of een
// tab/CR) begint, kan Excel als formule uitvoeren ("CSV-injectie"); die krijgt
// een ' ervoor, zodat Excel hem als tekst toont.

import { BRON_LABEL, INTERESSE_LABEL, STAP_LABEL, STATUS_LABEL, type Lead } from '@/lib/lifeos/leads/leads'
import { CLUB_LABEL } from './clubs'
import { ABONNEMENT, KLANT_STATUS_LABEL, eindeVastePeriode, klantPrijs, laatsteDag, type PtKlant } from './abonnementen'

export type ExportSoort = 'leads' | 'klanten'

export function isExportSoort(v: unknown): v is ExportSoort {
  return v === 'leads' || v === 'klanten'
}

/** Eén PT'er met zijn leads/klanten, in de volgorde waarin hij in de export komt. */
export interface ExportTrainer<T> {
  naam: string
  items: readonly T[]
}

const SCHEIDING = ';'
const REGELEINDE = '\r\n'
const BOM = '﻿'

const LEAD_KOLOMMEN = [
  'Datum', 'Trainer', 'Naam lead', 'Telefoon / contact', 'Club', 'Bron', 'Interesse', 'Status', 'Volgende stap',
  'Opvolgdatum', 'Google review gevraagd', 'Referral gevraagd', 'Kent iemand', 'Notities',
] as const

const KLANT_KOLOMMEN = [
  'Trainer', 'Naam', 'Duo-partner', 'Contact', 'Club', 'Abonnement', 'Prijs p/m', 'Start', 'Vast t/m', 'Status',
  'Opgezegd op', 'Loopt t/m', 'Notities',
] as const

/** Maakt één cel veilig: formule-prefix, en quotes waar nodig. */
export function csvCel(waarde: string): string {
  const veilig = /^[=+\-@\t\r]/.test(waarde) ? `'${waarde}` : waarde
  return /[;"\r\n]|^\s|\s$/.test(veilig) ? `"${veilig.replace(/"/g, '""')}"` : veilig
}

function csvRegel(cellen: readonly string[]): string {
  return cellen.map(csvCel).join(SCHEIDING)
}

function csv(kolommen: readonly string[], rijen: readonly (readonly string[])[]): string {
  return BOM + [kolommen, ...rijen].map(csvRegel).join(REGELEINDE) + REGELEINDE
}

/** "2026-10-08" → "08-10-2026"; leeg blijft leeg. */
export function datumNl(dag: string | null): string {
  if (!dag) return ''
  const [j, m, d] = dag.split('-')
  return `${d}-${m}-${j}`
}

const jaNee = (b: boolean): string => (b ? 'Ja' : 'Nee')

function leadRij(trainer: string, l: Lead): string[] {
  return [
    datumNl(l.gesprokenOp),
    trainer,
    l.naam,
    l.contact ?? '',
    l.club ? CLUB_LABEL[l.club] : '',
    BRON_LABEL[l.bron],
    l.interesse ? INTERESSE_LABEL[l.interesse] : '',
    STATUS_LABEL[l.status],
    l.volgendeStap ? STAP_LABEL[l.volgendeStap] : '',
    datumNl(l.opvolgdatum),
    jaNee(l.reviewGevraagd),
    jaNee(l.referralGevraagd),
    l.kentIemand ?? '',
    l.notitie ?? '',
  ]
}

/** 299 → "299", 299.5 → "299,50". */
export function bedragNl(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')
}

function klantRij(trainer: string, k: PtKlant): string[] {
  return [
    trainer,
    k.naam,
    k.duoPartner ?? '',
    k.contact ?? '',
    CLUB_LABEL[k.club],
    ABONNEMENT[k.abonnement].label,
    // Wat de klant écht betaalt: de afwijkende prijs (korting, actie) als die er is.
    // Decimale komma: Excel met Nederlandse instellingen leest "299.5" niet als getal.
    bedragNl(klantPrijs(k)),
    datumNl(k.startdatum),
    datumNl(eindeVastePeriode(k.startdatum)),
    KLANT_STATUS_LABEL[k.status],
    datumNl(k.opgezegdOp),
    // Alleen bij opzeggen loopt het abonnement nog door; gestopt = direct klaar.
    k.status === 'opgezegd' && k.opgezegdOp ? datumNl(laatsteDag(k.startdatum, k.opgezegdOp)) : '',
    k.notitie ?? '',
  ]
}

/** Alle leads: per trainer (in de meegegeven volgorde), nieuwste gesprek eerst. */
export function leadsCsv(trainers: readonly ExportTrainer<Lead>[]): string {
  const rijen = trainers.flatMap((t) =>
    [...t.items]
      .sort((a, b) => b.gesprokenOp.localeCompare(a.gesprokenOp) || b.aangemaaktOp.localeCompare(a.aangemaaktOp))
      .map((l) => leadRij(t.naam, l)),
  )
  return csv(LEAD_KOLOMMEN, rijen)
}

/** Alle PT-klanten: per trainer, nieuwste start eerst. */
export function klantenCsv(trainers: readonly ExportTrainer<PtKlant>[]): string {
  const rijen = trainers.flatMap((t) =>
    [...t.items].sort((a, b) => b.startdatum.localeCompare(a.startdatum)).map((k) => klantRij(t.naam, k)),
  )
  return csv(KLANT_KOLOMMEN, rijen)
}

/** "pt-leads-2026-10-08.csv" */
export function exportBestandsnaam(soort: ExportSoort, vandaag: string): string {
  return `pt-${soort}-${vandaag}.csv`
}
