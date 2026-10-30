// ─── Club, nieuwe leden: de intake die het lid zelf invult (PUUR) ───────────
// Vier korte schermen in de ledenapp (doel; gewicht en lengte; gezondheid;
// ervaring en beschikbaarheid). Het resultaat is een gewone intake in
// club_intakes met bron 'lid', zodat de trainer hem op de ledenkaart ziet en er
// een schemavoorstel mee maakt. Dezelfde validatie als de intake van de
// trainer (training/intake.ts): zonder aangevinkte toestemming bewaren we geen
// gezondheidsgegevens (gezondheidsvragen, gewicht en lengte), ook niet als de
// browser ze toch stuurt. Een lid geeft alleen gewicht en lengte op; de andere
// metingen doet de trainer.

import { leesAntwoorden, leesMetingen, type Antwoorden, type Metingen } from '@/lib/club/training/intake'
import { LID_DOELEN, MAX_LID_DAGEN, MIN_DAGEN, type LidDoel, type SnelleStart } from '@/lib/club/training/lid-schemas/regels'

export interface LidIntake {
  antwoorden: Antwoorden
  metingen: Metingen
  toestemming: boolean
}

export type LidIntakeUitslag = { ok: true; waarde: LidIntake } | { ok: false; fout: string }

function rij(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

/**
 * De intake uit het verzoek van het lid. Alleen gewicht en lengte als meting;
 * eigen vragen van de sportschool vult het lid hier niet in (die neemt de
 * trainer later af), motivatie wel.
 */
export function leesLidIntake(body: unknown): LidIntakeUitslag {
  const r = rij(body)
  const toestemming = r.toestemming === true
  const antwoorden = leesAntwoorden({ ...rij(r.antwoorden), eigen: [] }, toestemming)
  if (!antwoorden.ok) return antwoorden
  // Gezondheid overgeslagen: echt leeg laten (null), niet "overal nee".
  const overgeslagen = rij(r.antwoorden).gezondheid === null || rij(r.antwoorden).gezondheid === undefined
  const a = overgeslagen ? { ...antwoorden.waarde, gezondheid: null } : antwoorden.waarde
  const m = rij(r.metingen)
  const metingen = leesMetingen({ gewicht_kg: m.gewicht_kg, lengte_cm: m.lengte_cm }, toestemming)
  if (!metingen.ok) return metingen
  return { ok: true, waarde: { antwoorden: a, metingen: metingen.waarde, toestemming } }
}

/** De rij voor club_intakes (de route vult sportschool, lid en datum). */
export function intakeRij(i: LidIntake, nu: Date, versie: string): Record<string, unknown> {
  return {
    medewerker_id: null,
    antwoorden: i.antwoorden,
    metingen: i.metingen,
    toestemming_gezondheid: i.toestemming,
    toestemming_op: i.toestemming ? nu.toISOString() : null,
    toestemming_versie: i.toestemming ? versie : null,
    bron: 'lid',
    notitie: null,
  }
}

/**
 * De snelle start van het eigen schema, al ingevuld met de intake: het eerste
 * doel dat een lid zelf kan kiezen, de dagen (hooguit 6), het niveau, en thuis
 * als het lid alleen thuis traint.
 */
export function snelleStartUitIntake(a: Pick<Antwoorden, 'doelen' | 'dagenPerWeek' | 'niveau' | 'voorkeuren'>): SnelleStart {
  const doel = (a.doelen.find((d) => (LID_DOELEN as readonly string[]).includes(d)) as LidDoel | undefined) ?? 'gezondheid'
  const dagen = Math.min(Math.max(a.dagenPerWeek, MIN_DAGEN), MAX_LID_DAGEN)
  const thuis = a.voorkeuren.includes('thuis') && !a.voorkeuren.includes('sportschool')
  return { doel, dagen, niveau: a.niveau, materiaal: thuis ? 'thuis' : 'gym' }
}

/** Het adres van het schematabblad dat meteen de snelle start opent, met de intake ingevuld. */
export function startschemaPad(s: SnelleStart): string {
  const q = new URLSearchParams({ tab: 'schema', start: 'intake', doel: s.doel, dagen: String(s.dagen), niveau: String(s.niveau), materiaal: s.materiaal })
  return `/mijn?${q.toString()}`
}
