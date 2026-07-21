// Zaken-analyse — geaggregeerde momentopname uit Kane's Fit Factory-import.
//
// EERLIJKHEID: dit zijn géén verzonnen cijfers. Ze zijn één keer uitgerekend uit
// de geïmporteerde klantenlijst (alleen status "Actief" én prijs > 0, 43 klanten)
// en hier als literale constanten vastgelegd. De som van de vestiging-omzetten is
// exact € 13.567 — gelijk aan de MRR in de bron (zie analyse-data.test.ts).
//
// Het is een MOMENTOPNAME van het importmoment, geen live-koppeling. De UI vermeldt
// dat expliciet. Peildatum voor "deze maand" = 2026-07 (de importmaand).
//
// Normalisatie omzet-per-traject: er wordt gegroepeerd op traject-TYPE, niet op de
// ruwe labeltekst. "Eersel (1x/week)" telt mee bij "1× per week"; "Duo (1x/week)"
// en "Duo (1x/week) Start actie" vallen samen onder "Duo (1× per week)". Er gaat
// niets verloren of bij: de totalen blijven € 13.567 over 43 klanten.

export interface VestigingOmzet {
  naam: string
  omzet: number
  aantal: number
}

export interface TrajectOmzet {
  naam: string
  omzet: number
  aantal: number
}

export interface ContractEinde {
  /** Maand in 'YYYY-MM'. */
  maand: string
  aantal: number
  omzet: number
}

export interface NieuweKlanten {
  /** Maand in 'YYYY-MM'. */
  maand: string
  aantal: number
}

export interface AnalyseTotaal {
  omzet: number
  klanten: number
  vestigingen: number
  /** Maand ('YYYY-MM') die als "deze maand" geldt bij het verleng-signaal. */
  peildatum: string
  /** Actieve klanten zonder vastgelegde einddatum (buiten de tijdlijn gelaten). */
  zonderEinddatum: number
}

/** Omzet per vestiging, aflopend van hoog naar laag. */
export const OMZET_PER_VESTIGING: readonly VestigingOmzet[] = [
  { naam: 'Bergeijk', omzet: 4994, aantal: 16 },
  { naam: 'Bladel', omzet: 3698, aantal: 12 },
  { naam: 'Budel', omzet: 2662, aantal: 8 },
  { naam: 'Someren', omzet: 1296, aantal: 4 },
  { naam: 'Eersel', omzet: 319, aantal: 1 },
  { naam: 'Eindhoven', omzet: 299, aantal: 1 },
  { naam: 'Oisterwijk', omzet: 299, aantal: 1 },
]

/** Omzet per traject-type, aflopend van hoog naar laag. */
export const OMZET_PER_TRAJECT: readonly TrajectOmzet[] = [
  { naam: '1× per week', omzet: 8740, aantal: 30 },
  { naam: '2× per week', omzet: 2954, aantal: 6 },
  { naam: 'Duo (1× per week)', omzet: 1396, aantal: 4 },
  { naam: '1× per 2 weken', omzet: 338, aantal: 2 },
  { naam: 'Coaching', omzet: 139, aantal: 1 },
]

/** Contract-einde per maand — het verleng-/opzegsignaal. Oplopend op maand. */
export const CONTRACT_EINDE: readonly ContractEinde[] = [
  { maand: '2026-02', aantal: 1, omzet: 169 },
  { maand: '2026-04', aantal: 18, omzet: 5442 },
  { maand: '2026-05', aantal: 7, omzet: 2253 },
  { maand: '2026-06', aantal: 4, omzet: 1416 },
  { maand: '2026-07', aantal: 6, omzet: 1794 },
  { maand: '2026-08', aantal: 5, omzet: 1895 },
  { maand: '2026-09', aantal: 1, omzet: 299 },
]

/** Nieuwe klanten per startmaand — de groei-curve. Oplopend op maand. */
export const NIEUWE_KLANTEN: readonly NieuweKlanten[] = [
  { maand: '2026-01', aantal: 19 },
  { maand: '2026-02', aantal: 7 },
  { maand: '2026-03', aantal: 4 },
  { maand: '2026-04', aantal: 6 },
  { maand: '2026-05', aantal: 4 },
  { maand: '2026-06', aantal: 1 },
  { maand: '2026-07', aantal: 2 },
]

export const ANALYSE_TOTAAL: AnalyseTotaal = {
  omzet: 13567,
  klanten: 43,
  vestigingen: 7,
  peildatum: '2026-07',
  zonderEinddatum: 1,
}
