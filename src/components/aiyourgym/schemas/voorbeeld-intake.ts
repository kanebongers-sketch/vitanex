// ─── AI Your Gym: de voorbeeldintake op /trainingsschemas (PUUR) ────────────
// Een lid dat spiermassa wil opbouwen, gemiddeld niveau, drie dagen per week,
// met een keer ja bij de gezondheidsvragen. Het voorstel (stelSchemaVoor) en de
// Engelse tekst ervan (woorden/website/schemas.ts) gaan allebei van deze intake uit.

export const VOORBEELD_INTAKE = {
  doelen: ['spiermassa' as const],
  niveau: 2 as const,
  dagenPerWeek: 3,
  minutenPerSessie: 60,
  voorkeuren: ['sportschool' as const],
  gezondheid: { blessures: [], blessureToelichting: null, klachten: null, medicatie: null, parqJa: ['gewricht' as const] },
}
