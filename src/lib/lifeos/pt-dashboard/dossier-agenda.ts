// ─── Fit Factory PT — dossiers deze week (PUUR) ─────────────────────────────
// Voor het overzicht van de PT'er: bij welke lopende klant staat er volgens het
// 13-weekse traject deze week iets op het programma (check, test, eindevaluatie),
// en bij wie ontbreekt de basis nog (intake, nulmeting)? Zo zie je op maandag
// wie je deze week moet meten of spreken, zonder elk dossier te openen.

import { isLopend, type PtKlant } from './abonnementen'
import type { DossierStand } from './dossier-opslag'
import { MOMENTEN, TRAJECT_WEKEN, trajectWeek, type TrajectMoment } from './traject'

export type DossierSignaal = 'intake_ontbreekt' | 'nulmeting_ontbreekt'

export const DOSSIER_SIGNAAL_LABEL: Record<DossierSignaal, string> = {
  intake_ontbreekt: 'Intake nog niet ingevuld',
  nulmeting_ontbreekt: 'Nulmeting ontbreekt',
}

export interface DossierTaak {
  klant: PtKlant
  /** 0 = nog niet gestart, 1–13 in het traject. */
  week: number
  /** Het trajectmoment van deze week, als er een is. */
  moment: TrajectMoment | null
  signalen: DossierSignaal[]
  /** Dagen sinds de laatste meting of weging (null = nog nooit). */
  dagenSindsMeting: number | null
}

const DAG_MS = 86_400_000

function dagenTussen(van: string, tot: string): number {
  return Math.round((Date.parse(`${tot}T12:00:00Z`) - Date.parse(`${van}T12:00:00Z`)) / DAG_MS)
}

/** Na zoveel dagen zonder meting/weging in een lopend traject vragen we erom. */
export const METING_STIL_DAGEN = 21

/**
 * Wat er deze week in de dossiers te doen is, voor lopende klanten in hun
 * traject (week 0 t/m 13, ook wie nog moet starten): met een trajectmoment deze week, zonder
 * intake, zonder nulmeting, of langer dan drie weken niet gemeten. Volgorde:
 * eindevaluatie en checks eerst, dan ontbrekende basis, dan stille dossiers.
 */
export function dossierTaken(klanten: readonly PtKlant[], stand: ReadonlyMap<string, DossierStand>, vandaag: string): DossierTaak[] {
  const uit: DossierTaak[] = []
  for (const klant of klanten) {
    // Lopend, óf nog te starten: de intake en nulmeting horen vóór de eerste training.
    const nogTeStarten = klant.status === 'actief' && klant.startdatum > vandaag
    if (!isLopend(klant, vandaag) && !nogTeStarten) continue
    // Bevroren (blessure, ziekte): er wordt niet getraind, dus ook geen 'niet gemeten'-signalen.
    if (klant.status === 'bevroren') continue
    const week = trajectWeek(klant.startdatum, vandaag)
    if (week > TRAJECT_WEKEN) continue
    const s = stand.get(klant.id) ?? { intake: false, startmeting: false, laatsteMeting: null, laatsteSessie: null }
    const moment = MOMENTEN.find((m) => m.week === week && m.week >= 1) ?? null
    const signalen: DossierSignaal[] = []
    if (!s.intake) signalen.push('intake_ontbreekt')
    if (!s.startmeting && week >= 1) signalen.push('nulmeting_ontbreekt')
    const dagenSindsMeting = s.laatsteMeting ? dagenTussen(s.laatsteMeting, vandaag) : null
    const stil = week >= 1 && s.startmeting && (dagenSindsMeting === null || dagenSindsMeting >= METING_STIL_DAGEN)
    if (moment || signalen.length > 0 || stil) uit.push({ klant, week, moment, signalen, dagenSindsMeting })
  }
  const rang = (t: DossierTaak) => (t.moment?.soort === 'eind' ? 0 : t.moment ? 1 : t.signalen.length > 0 ? 2 : 3)
  return uit.sort((a, b) => rang(a) - rang(b) || b.week - a.week || a.klant.naam.localeCompare(b.klant.naam, 'nl'))
}

/** Eén regel per taak: wat er deze week moet gebeuren. */
export function dossierTaakTekst(t: DossierTaak): string {
  if (t.moment) return `Week ${t.week} · ${t.moment.label}`
  if (t.signalen.length > 0) return t.week === 0 ? 'Start nog niet geweest' : `Week ${t.week}`
  return t.dagenSindsMeting === null ? `Week ${t.week} · nog niet gemeten` : `Week ${t.week} · ${t.dagenSindsMeting} dagen niet gemeten`
}
