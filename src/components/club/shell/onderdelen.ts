// ─── Fit Factory clubsoftware: de onderdelen (PUUR) ─────────────────────────
// Eén lijst voor de navigatie, de sneltoetsen en de rechten per rol.

export interface Onderdeel {
  sleutel: string
  /** Pad binnen /clubkane ('' = Vandaag). */
  pad: string
  label: string
  /** Korte uitleg voor de zoekbalk en de presentatie. */
  uitleg: string
}

export const ONDERDELEN: readonly Onderdeel[] = [
  { sleutel: 'vandaag', pad: '', label: 'Vandaag', uitleg: 'Wat er nu speelt in je vestiging' },
  { sleutel: 'checkin', pad: '/checkin', label: 'Check-in', uitleg: 'Balie: leden inchecken en wie er binnen is' },
  { sleutel: 'leden', pad: '/leden', label: 'Leden', uitleg: 'Ledenkaart, bezoek, notities en status' },
  { sleutel: 'rooster', pad: '/rooster', label: 'Rooster', uitleg: 'Groepslessen, reserveringen en wachtlijst' },
  { sleutel: 'personeel', pad: '/personeel', label: 'Personeel', uitleg: 'Diensten van het fitnesspersoneel per week' },
  { sleutel: 'taken', pad: '/taken', label: 'Taken', uitleg: 'Dagelijkse taken, afsluitronde en poetsrooster' },
  { sleutel: 'leads', pad: '/leads', label: 'Leads', uitleg: 'Proeflessen en nieuwe leden opvolgen' },
  { sleutel: 'schemas', pad: '/training', label: 'Training', uitleg: "Intakes, schema's en oefeningen" },
  { sleutel: 'cijfers', pad: '/cijfers', label: 'Cijfers', uitleg: 'Groei, bezoek, bezetting en behoud' },
  { sleutel: 'app', pad: '/app', label: 'Ledenapp', uitleg: 'Zo ziet een lid het op zijn telefoon' },
  { sleutel: 'instellingen', pad: '/instellingen', label: 'Instellingen', uitleg: 'Zalen, lessen, regels en medewerkers' },
]

/** Is dit onderdeel actief op dit pad? */
export function isActief(onderdeel: Onderdeel, pad: string): boolean {
  const basis = `/clubkane${onderdeel.pad}`
  if (onderdeel.pad === '') return pad === '/clubkane' || pad === '/clubkane/'
  return pad === basis || pad.startsWith(`${basis}/`)
}
