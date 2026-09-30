// ─── LifeOS — kleur per categorie in je Google Agenda (puur) ────────────────
// Elke afspraak krijgt de kleur van zijn categorie, zodat je week in één blik
// leest: PT-klanten rood, PT-team groen, enz. Dit is je Google Agenda, niet de
// LifeOS-UI — daar geldt het navy/cyaan-merk niet; hier gaat het om herkenning.
//
// Jij blijft de baas over je agenda:
//   - Heb je een afspraak zelf een kleur gegeven (een andere dan LifeOS ooit
//     schreef), dan blijft die. LifeOS onthoudt wat het zelf schreef.
//   - "Overig" krijgt geen kleur: die houdt de kleur van je agenda.

import type { AgendaCategorie } from './categorie'

/** Google's vaste kleuren (Event colorId) met hun naam in de Google-app. */
export const GOOGLE_KLEUR = {
  lavendel: '1',
  salie: '2',
  druif: '3',
  flamingo: '4',
  banaan: '5',
  mandarijn: '6',
  pauw: '7',
  grafiet: '8',
  bosbes: '9',
  basilicum: '10',
  tomaat: '11',
} as const

/** De kleur per categorie. null = niet kleuren (kleur van de agenda houden). */
export const CATEGORIE_KLEUR: Record<AgendaCategorie, string | null> = {
  pt_klant: GOOGLE_KLEUR.tomaat, // rood
  pt_team: GOOGLE_KLEUR.basilicum, // groen
  management: GOOGLE_KLEUR.bosbes, // blauw
  budel_team: GOOGLE_KLEUR.mandarijn, // oranje
  marketing: GOOGLE_KLEUR.druif, // paars
  persoonlijk: GOOGLE_KLEUR.pauw, // turquoise
  overig: null,
}

/**
 * Welke kleur moet deze afspraak krijgen? `null` = niets doen.
 * `huidig` = de kleur die er nu in Google op staat (null = agendakleur);
 * `geschreven` = de kleur die LifeOS er eerder zelf op zette (null = nooit).
 */
export function bepaalKleur(
  categorie: AgendaCategorie,
  huidig: string | null,
  geschreven: string | null,
): string | null {
  const doel = CATEGORIE_KLEUR[categorie]
  if (doel === null || huidig === doel) return null
  // Een kleur die niet van LifeOS komt, is jouw keuze: afblijven.
  if (huidig !== null && huidig !== geschreven) return null
  return doel
}
