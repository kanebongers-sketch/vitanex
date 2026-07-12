// ─── XP anti-cheat guard ──────────────────────────────────────────────────────
// Pure logica, losgetrokken van /api/xp zodat hij unit-testbaar is
// (zie xp-guard.test.ts).

// Het maximum dat een gebruiker op één dag legitiem kan verdienen.
// Check-in 75 + topscore 25 + doellog 15 + doel voltooid 150 + streak-bonus 250
// + een stapel achievement-bonussen. Ruim genomen: alles daarboven is geen
// normale dag maar een handmatige POST.
export const MAX_XP_DELTA_PER_SYNC = 1000

/**
 * Beoordeelt of een XP-sync een onwaarschijnlijk grote sprong maakt.
 *
 * `huidigeXp === null` betekent: geen server-rij (allereerste sync). Die is
 * altijd toegestaan — een langdurige localStorage-gebruiker mag zijn opgebouwde
 * historie meenemen, anders raakt hij permanent gedesynchroniseerd.
 */
export function isVerdachteXpSprong(huidigeXp: number | null, nieuweXp: number): boolean {
  if (huidigeXp === null) return false
  return nieuweXp - huidigeXp > MAX_XP_DELTA_PER_SYNC
}
