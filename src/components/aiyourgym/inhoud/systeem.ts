// ─── AI Your Gym: alles in een systeem (PUUR) ───────────────────────────────
// Wie er in een sportschool met Club werkt en wat ze daar doen, in een zin per
// plek. Alleen functies die Club echt heeft (dezelfde bron als functies.ts).
// De details staan op de subpagina's; elke plek linkt naar de juiste.

export type RolSleutel = 'balie' | 'vloer' | 'trainer' | 'eigenaar' | 'lid'

export interface Rol {
  sleutel: RolSleutel
  /** Kort: "Balie". */
  naam: string
  /** Een zin: wat deze plek met Club doet. */
  kop: string
  /** Waar de details staan, onder de basis van de website. */
  pad: string
}

export const ROLLEN: readonly Rol[] = [
  { sleutel: 'balie', naam: 'Balie', kop: 'Inchecken met QR, de ledenkaart en notities voor de volgende dienst.', pad: '/functies#beheer' },
  { sleutel: 'vloer', naam: 'Vloer', kop: 'Lessen met wachtlijst, diensten en de taken van vandaag.', pad: '/functies#planning' },
  { sleutel: 'trainer', naam: 'Trainer', kop: 'Van intake tot schema, met coaching bij elke oefening.', pad: '/trainingsschemas' },
  { sleutel: 'eigenaar', naam: 'Eigenaar', kop: 'Cijfers per maand, rechten per rol en je eigen huisstijl.', pad: '/functies#groei' },
  { sleutel: 'lid', naam: 'Lid', kop: 'Een app in jouw naam: reserveren, inchecken en het eigen schema.', pad: '/ledenapp' },
]
