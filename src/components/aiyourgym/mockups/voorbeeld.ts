// ─── AI Your Gym: de voorbeeldsportschool in de productbeelden (PUUR) ──────
// Besluit Kane (27-10-2026): de website toont overal Kernhal, een verzonnen
// premium strength-sportschool in Utrecht. Kernhal is geen klant en bestaat niet;
// de schermen zeggen er altijd bij dat het voorbeeldgegevens zijn (KADERS.bijschrift).
// Los van kaders.tsx (een clientcomponent), zodat ook servercomponenten deze
// waarden gewoon kunnen gebruiken. Namen, adres en lesnamen blijven in elke taal gelijk.
// Let op: de demo-sportschool in Club (database, migratie 403) heet nog "Voorbeeld Gym";
// die naam staat hier los van.

export const VOORBEELD_NAAM = 'Kernhal'
export const VOORBEELD_VESTIGING = 'Utrecht'
export const VOORBEELD_ADRES = 'aiyourgym.com/kernhal'
/** Verzonnen adres. */
export const VOORBEELD_STRAAT = 'Staalwerfstraat 12, Utrecht'

/** De lessen van Kernhal (Engelse namen, zoals veel strength-studio's ze voeren). */
export const LES = {
  strength: 'Strength',
  conditioning: 'Conditioning',
  mobility: 'Mobility',
  barbell: 'Barbell Club',
  kettlebell: 'Kettlebell',
  engine: 'Engine',
  core: 'Core & Carry',
  sterk50: 'Strong 50+',
} as const

/** De coaches van Kernhal: initialen en voornaam (verzonnen). */
export const COACHES = [
  { ini: 'DK', naam: 'Daan' },
  { ini: 'IV', naam: 'Iris' },
  { ini: 'SB', naam: 'Sem' },
  { ini: 'FA', naam: 'Fleur' },
] as const
