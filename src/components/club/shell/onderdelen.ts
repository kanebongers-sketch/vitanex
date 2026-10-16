// ─── Fit Factory clubsoftware: de onderdelen (PUUR) ─────────────────────────
// Eén lijst voor de navigatie, de sneltoetsen en de rechten per rol. De
// onderdelen zijn ingedeeld in vijf groepen (besluit Kane: een ingedeeld menu
// zoals Virtuagym, maar op onze eigen manier: groepen bovenin, de onderdelen van
// de groep eronder, en op de telefoon een menupaneel).

export const GROEPEN = [
  { sleutel: 'werkvloer', label: 'Werkvloer', uitleg: 'Wat er vandaag in de club gebeurt' },
  { sleutel: 'leden', label: 'Leden', uitleg: 'Leden, leads en de ledenapp' },
  { sleutel: 'planning', label: 'Planning', uitleg: 'Groepslessen, personeel en taken' },
  { sleutel: 'coaching', label: 'Coaching', uitleg: "Intakes, schema's en oefeningen" },
  { sleutel: 'beheer', label: 'Beheer', uitleg: 'Cijfers en instellingen' },
] as const

export type GroepSleutel = (typeof GROEPEN)[number]['sleutel']

export interface Onderdeel {
  sleutel: string
  /** Pad binnen /clubkane ('' = Vandaag). */
  pad: string
  label: string
  /** Korte uitleg voor de zoekbalk en de presentatie. */
  uitleg: string
  groep: GroepSleutel
}

export const ONDERDELEN: readonly Onderdeel[] = [
  { sleutel: 'vandaag', pad: '', label: 'Vandaag', uitleg: 'Wat er nu speelt in je vestiging', groep: 'werkvloer' },
  { sleutel: 'checkin', pad: '/checkin', label: 'Check-in', uitleg: 'Balie: leden inchecken en wie er binnen is', groep: 'werkvloer' },
  { sleutel: 'taken', pad: '/taken', label: 'Taken', uitleg: 'Dagelijkse taken, afsluitronde en poetsrooster', groep: 'werkvloer' },
  { sleutel: 'notities', pad: '/notities', label: 'Notities', uitleg: 'Overdracht, afspraken, kennis en ideeën', groep: 'werkvloer' },
  { sleutel: 'leden', pad: '/leden', label: 'Leden', uitleg: 'Ledenkaart, bezoek, notities en status', groep: 'leden' },
  { sleutel: 'leads', pad: '/leads', label: 'Leads', uitleg: 'Proeflessen en nieuwe leden opvolgen', groep: 'leden' },
  { sleutel: 'app', pad: '/app', label: 'Ledenapp', uitleg: 'Zo ziet een lid het op zijn telefoon', groep: 'leden' },
  { sleutel: 'rooster', pad: '/rooster', label: 'Groepslessen', uitleg: 'Lesrooster, reserveringen en wachtlijst', groep: 'planning' },
  { sleutel: 'personeel', pad: '/personeel', label: 'Personeel', uitleg: 'Diensten en uren van het fitnesspersoneel', groep: 'planning' },
  { sleutel: 'agenda', pad: '/agenda', label: 'Agenda', uitleg: 'Overleg, intakes en afspraken per week', groep: 'planning' },
  { sleutel: 'schemas', pad: '/training', label: 'Training', uitleg: "Intakes, schema's en oefeningen", groep: 'coaching' },
  { sleutel: 'cijfers', pad: '/cijfers', label: 'Cijfers', uitleg: 'Groei, bezoek, bezetting en behoud per maand', groep: 'beheer' },
  { sleutel: 'instellingen', pad: '/instellingen', label: 'Instellingen', uitleg: 'Zalen, lessen, regels en medewerkers', groep: 'beheer' },
]

/** Is dit onderdeel actief op dit pad? */
export function isActief(onderdeel: Onderdeel, pad: string): boolean {
  const basis = `/clubkane${onderdeel.pad}`
  if (onderdeel.pad === '') return pad === '/clubkane' || pad === '/clubkane/'
  return pad === basis || pad.startsWith(`${basis}/`)
}

/** Het onderdeel dat bij dit pad hoort (het langste passende pad wint), of Vandaag. */
export function actiefOnderdeel(pad: string): Onderdeel {
  const passend = ONDERDELEN.filter((o) => isActief(o, pad)).sort((a, b) => b.pad.length - a.pad.length)
  return passend[0] ?? ONDERDELEN[0]
}

/** De onderdelen van een groep, in vaste volgorde. */
export function onderdelenVan(groep: GroepSleutel): Onderdeel[] {
  return ONDERDELEN.filter((o) => o.groep === groep)
}
