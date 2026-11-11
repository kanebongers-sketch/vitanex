// ─── Fit Factory — de clubs (PUUR) ──────────────────────────────────────────
// Boschdijk en Tongelre zijn in de PT-app samen een club Eindhoven (besluit Kane
// 11-11-2026, migratie 503). De sleutels staan ook als check in de database.

export const CLUBS = ['budel', 'bergeijk', 'someren', 'eindhoven', 'eersel', 'oisterwijk', 'bladel'] as const
export type Club = (typeof CLUBS)[number]

export const CLUB_LABEL: Record<Club, string> = {
  budel: 'Budel',
  bergeijk: 'Bergeijk',
  someren: 'Someren',
  eindhoven: 'Eindhoven',
  eersel: 'Eersel',
  oisterwijk: 'Oisterwijk',
  bladel: 'Bladel',
}

export function isClub(v: unknown): v is Club {
  return typeof v === 'string' && (CLUBS as readonly string[]).includes(v)
}

/** "Someren & Eindhoven" — de clubs van een clubmanager als één naam. */
export function clubsLabel(clubs: readonly Club[]): string {
  return clubs.map((c) => CLUB_LABEL[c]).join(' & ')
}
