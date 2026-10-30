// ─── Club: schakelaar voor het rollenmodel v2 ───────────────────────────────
// Besluit Kane (30-10-2026): overal aan. Daarvoor alleen de demo (Voorbeeld Gym)
// en Test Gym. Terugdraaien: CLUB_ROLLEN_V2_OVERAL op false, dan geldt weer de
// lijst hieronder en elders precies het oude gedrag (beheerders/rechten.ts en
// medewerker-login/rechten.ts). Bouwplan: docs/club/ROLLEN-PLAN.md.

export const CLUB_ROLLEN_V2_OVERAL = true

/** Sportscholen waar v2 aan staat als CLUB_ROLLEN_V2_OVERAL uit is (organisatie-id's). */
export const CLUB_ROLLEN_V2_ORGS: readonly string[] = [
  'de000000-0000-4000-8000-0000000000c1', // Voorbeeld Gym (demo)
  '7e570000-0000-4000-8000-000000000001', // Test Gym
]

export function rollenV2Aan(organisatieId: string): boolean {
  return CLUB_ROLLEN_V2_OVERAL || CLUB_ROLLEN_V2_ORGS.includes(organisatieId)
}
