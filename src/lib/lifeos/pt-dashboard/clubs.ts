// ─── Fit Factory — de clubs (PUUR) ──────────────────────────────────────────
// Zelfde indeling als de Excel-tracker: Eindhoven is gesplitst in Boschdijk en
// Tongelre. De sleutels staan ook als check in migratie 352.

export const CLUBS = ['budel', 'bergeijk', 'someren', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel'] as const
export type Club = (typeof CLUBS)[number]

export const CLUB_LABEL: Record<Club, string> = {
  budel: 'Budel',
  bergeijk: 'Bergeijk',
  someren: 'Someren',
  eindhoven_boschdijk: 'Eindhoven Boschdijk',
  eindhoven_tongelre: 'Eindhoven Tongelre',
  eersel: 'Eersel',
  oisterwijk: 'Oisterwijk',
  bladel: 'Bladel',
}

export function isClub(v: unknown): v is Club {
  return typeof v === 'string' && (CLUBS as readonly string[]).includes(v)
}
