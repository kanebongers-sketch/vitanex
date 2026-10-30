// ─── Club, rollen v2: de standaardrechten en startpagina's (PUUR) ───────────
// Besluit Kane (29-10-2026). De eigenaar past dit per sportschool aan bij
// Rechten per rol; wat ALLEEN_EIGENAAR is, ligt vast.

import { ONDERDEEL_SLEUTELS } from '@/lib/club/kern/org-instellingen'
import { ALLEEN_EIGENAAR, EXTRA_SLEUTELS, ROLLEN, type Niveau, type NiveauKaart, type Rol, type Rolrechten } from './typen'

function kaart(per: Partial<Record<Niveau, readonly string[]>>): NiveauKaart {
  const uit: Record<string, Niveau> = {}
  for (const [niveau, sleutels] of Object.entries(per) as [Niveau, readonly string[]][]) {
    for (const s of sleutels) uit[s] = niveau
  }
  return uit
}

const VERGRENDELD = [...ALLEEN_EIGENAAR]

/** Alles wat niet alleen voor de eigenaar is: de clubmanager mag bijna alles. */
const BIJNA_ALLES = [...ONDERDEEL_SLEUTELS, ...EXTRA_SLEUTELS].filter((s) => !ALLEEN_EIGENAAR.has(s))

export const STANDAARD_RECHTEN: Readonly<Record<Rol, NiveauKaart>> = {
  // Cijfers, rapporten, team, financien, abonnement en instellingen; leden en leads alleen zien. Geen werkvloer, geen coaching.
  eigenaar: kaart({
    beheren: ['cijfers', 'rapporten', 'team', 'instellingen', 'beheer', ...VERGRENDELD],
    zien: ['leden', 'leads', 'app', 'hulp'],
  }),
  manager: kaart({ beheren: BIJNA_ALLES }),
  // Werkvloer, leden, coaching en afspraken.
  trainer: kaart({
    bewerken: ['vandaag', 'checkin', 'taken', 'opvolgen', 'notities', 'leden', 'leads', 'berichten', 'schemas', 'voeding', 'afspraken'],
    zien: ['challenges', 'community', 'app', 'hulp'],
  }),
  // Het groepslesrooster bewerken; Vandaag en Notities zien.
  instructeur: kaart({ bewerken: ['rooster'], zien: ['vandaag', 'notities', 'hulp'] }),
  // Keuze Kane: de roosteraar plant het personeelsrooster en het groepslesrooster.
  roosteraar: kaart({ beheren: ['personeel', 'rooster'], bewerken: ['afspraken'], zien: ['hulp'] }),
  // Uren beheren en rapporten; het personeelsrooster zien om bij de uren te komen.
  administratie: kaart({ beheren: ['uren'], zien: ['personeel', 'rapporten', 'hulp'] }),
}

/** De startpagina per rol (besluit Kane 29-10-2026). */
export const STANDAARD_START: Readonly<Record<Rol, string>> = {
  eigenaar: 'cijfers',
  manager: 'vandaag',
  trainer: 'vandaag',
  instructeur: 'rooster',
  roosteraar: 'personeel',
  administratie: 'uren',
}

/** Bij meerdere rollen geldt de startpagina van de eerste rol in deze volgorde. */
export const START_VOLGORDE: readonly Rol[] = ['manager', 'trainer', 'instructeur', 'roosteraar', 'administratie', 'eigenaar']

/** De pagina's die als startpagina te kiezen zijn: sleutel en pad binnen /club. */
export const START_OPTIES: readonly { sleutel: string; pad: string }[] = [
  { sleutel: 'vandaag', pad: '' },
  { sleutel: 'cijfers', pad: '/cijfers' },
  { sleutel: 'rapporten', pad: '/rapporten' },
  { sleutel: 'leden', pad: '/leden' },
  { sleutel: 'leads', pad: '/leads' },
  { sleutel: 'rooster', pad: '/rooster' },
  { sleutel: 'personeel', pad: '/personeel' },
  { sleutel: 'uren', pad: '/personeel?tab=uren' },
  { sleutel: 'afspraken', pad: '/afspraken' },
  { sleutel: 'schemas', pad: '/training' },
  { sleutel: 'taken', pad: '/taken' },
  { sleutel: 'agenda', pad: '/agenda' },
]

export function isStartSleutel(v: unknown): v is string {
  return typeof v === 'string' && START_OPTIES.some((o) => o.sleutel === v)
}

export function standaardRolrechten(): Rolrechten {
  return {
    rollen: Object.fromEntries(ROLLEN.map((r) => [r, { ...STANDAARD_RECHTEN[r] }])) as Record<Rol, NiveauKaart>,
    start: { ...STANDAARD_START },
  }
}
