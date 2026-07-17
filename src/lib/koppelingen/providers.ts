// De providers die in wearable_tokens mogen staan.
//
// Deze lijst is de spiegel van de check-constraint op de kolom (zie
// 014_wearable_tokens_google_fit.sql:6-7). Hij staat hier zodat een onbekende
// provider al op de systeemgrens sneuvelt in plaats van als constraint-fout
// terug te komen uit Postgres — dat laatste levert een 500 op waar een 400
// hoort.
//
// Loopt deze lijst uit de pas met de constraint, dan faalt providers.test.ts
// niet vanzelf: de database is de baas. Wie de constraint wijzigt, wijzigt hier.

export const PROVIDERS = ['fitbit', 'google_health', 'google_calendar', 'google_fit'] as const

export type Provider = (typeof PROVIDERS)[number]

/**
 * Narrowing op de systeemgrens: van `unknown` (request body) naar `Provider`.
 * Geeft null bij alles wat niet exact in de allowlist staat — geen trim, geen
 * lowercase, geen "bijna goed". De waarden zijn machinaal, niet met de hand
 * ingetypt, dus soepel zijn levert hier alleen maar aanvalsoppervlak op.
 */
export function leesProvider(waarde: unknown): Provider | null {
  if (typeof waarde !== 'string') return null
  return (PROVIDERS as readonly string[]).includes(waarde) ? (waarde as Provider) : null
}
