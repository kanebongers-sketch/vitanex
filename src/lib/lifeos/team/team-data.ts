// ─── LifeOS — Team-KPI (Fit Factory) ────────────────────────────────────────
// Statische MOMENTOPNAME. Deze cijfers zijn ÉÉN keer geaggregeerd uit Kane's
// Fit Factory-import (43 actieve inschrijvingen, MRR € 13.567) en hier als
// literale data vastgelegd — de app leest géén JSON tijdens runtime.
//
// Aggregatie (per trainer, case-insensitief genormaliseerd, "NIeck" → "Nieck"):
//   - klanten     = aantal actieve inschrijvingen
//   - omzet       = som van `prijs` van die inschrijvingen (euro/maand)
//   - gemPerKlant = omzet / klanten, afgerond op hele euro's
//   - vestigingen = unieke vestiging(en) in volgorde van voorkomen
// Puur: geen React, geen imports. De som van alle `omzet` is exact € 13.567
// (== de MRR uit de import); dat bewaakt de test in `team-data.test.ts`.

export interface TrainerKpi {
  naam: string
  klanten: number
  omzet: number
  gemPerKlant: number
  vestigingen: string[]
}

// Gesorteerd op omzet, hoogste eerst. Bij gelijke omzet blijft de invoervolgorde
// uit de import behouden (Brandon vóór Tristan).
export const TEAM_KPI: readonly TrainerKpi[] = [
  { naam: 'Kane',    klanten: 15, omzet: 4815, gemPerKlant: 321, vestigingen: ['Budel', 'Bergeijk', 'Someren', 'Eersel'] },
  { naam: 'Amey',    klanten: 9,  omzet: 2801, gemPerKlant: 311, vestigingen: ['Bladel'] },
  { naam: 'Iris',    klanten: 6,  omzet: 1764, gemPerKlant: 294, vestigingen: ['Bergeijk'] },
  { naam: 'Nieck',   klanten: 4,  omzet: 1196, gemPerKlant: 299, vestigingen: ['Budel'] },
  { naam: 'Michael', klanten: 3,  omzet: 997,  gemPerKlant: 332, vestigingen: ['Someren'] },
  { naam: 'Deveny',  klanten: 3,  omzet: 897,  gemPerKlant: 299, vestigingen: ['Bladel'] },
  { naam: 'Dylan',   klanten: 1,  omzet: 499,  gemPerKlant: 499, vestigingen: ['Bergeijk'] },
  { naam: 'Brandon', klanten: 1,  omzet: 299,  gemPerKlant: 299, vestigingen: ['Eindhoven'] },
  { naam: 'Tristan', klanten: 1,  omzet: 299,  gemPerKlant: 299, vestigingen: ['Oisterwijk'] },
] as const

// Totalen afgeleid uit TEAM_KPI — geen los ingetypt cijfer dat kan gaan afwijken.
export const TEAM_TOTAAL: { trainers: number; klanten: number; omzet: number } = {
  trainers: TEAM_KPI.length,
  klanten: TEAM_KPI.reduce((som, t) => som + t.klanten, 0),
  omzet: TEAM_KPI.reduce((som, t) => som + t.omzet, 0),
}
