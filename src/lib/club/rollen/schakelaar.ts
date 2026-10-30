// ─── Club: schakelaar voor het rollenmodel v2 ───────────────────────────────
// Besluit Kane (29-10-2026): standaard uit. Aan voor de demo (Voorbeeld Gym) en
// Test Gym; Kane zet hem later overal aan met CLUB_ROLLEN_V2_OVERAL.
// Uit: alles precies zoals voor het rollenmodel (beheerders/rechten.ts en
// medewerker-login/rechten.ts). Bouwplan: docs/club/ROLLEN-PLAN.md.

export const CLUB_ROLLEN_V2_OVERAL = false

/** Sportscholen waar v2 al aan staat (organisatie-id's). */
export const CLUB_ROLLEN_V2_ORGS: readonly string[] = [
  'de000000-0000-4000-8000-0000000000c1', // Voorbeeld Gym (demo)
  '7e570000-0000-4000-8000-000000000001', // Test Gym
]

export function rollenV2Aan(organisatieId: string): boolean {
  return CLUB_ROLLEN_V2_OVERAL || CLUB_ROLLEN_V2_ORGS.includes(organisatieId)
}
