// ─── AI Your Gym: regels voor een sterk wachtwoord (PUUR) ───────────────────
// Ook in de browser (aanmeldformulier, inlogpagina). De opslag staat in
// wachtwoord.ts (server).

export const MIN_LENGTE = 12
export const MAX_LENGTE = 128

/** Veelgebruikte wachtwoorden en woorden die een aanvaller als eerste probeert. */
const ZWAK = ['wachtwoord', 'password', 'welkom', 'welcome', 'qwerty', 'azerty', 'letmein', 'sportschool', 'aiyourgym', 'fitness', 'gym', 'admin', 'geheim', '123456', 'abcdef']

export interface WachtwoordContext {
  email?: string | null
  naam?: string | null
}

function soorten(w: string): number {
  return [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(w)).length
}

/** Waarom dit wachtwoord niet sterk genoeg is, of null als het goed is. */
export function wachtwoordFout(w: unknown, ctx: WachtwoordContext = {}): string | null {
  if (typeof w !== 'string' || w.length === 0) return 'Kies een wachtwoord.'
  if (w.length < MIN_LENGTE) return `Gebruik minstens ${MIN_LENGTE} tekens.`
  if (w.length > MAX_LENGTE) return `Gebruik hooguit ${MAX_LENGTE} tekens.`
  const klein = w.toLowerCase()
  if (new Set(klein).size < 5) return 'Gebruik meer verschillende tekens.'
  if (ZWAK.some((z) => klein.includes(z))) return 'Dit wachtwoord bevat een woord dat te makkelijk te raden is.'
  const eigen = [ctx.email?.split('@')[0], ...(ctx.naam ?? '').split(/\s+/)].map((d) => d?.trim().toLowerCase() ?? '').filter((d) => d.length >= 3)
  if (eigen.some((d) => klein.includes(d))) return 'Gebruik niet je naam of e-mailadres in je wachtwoord.'
  // Lang genoeg is sterk genoeg (een zin); korter moet gevarieerd zijn.
  if (w.length < 16 && soorten(w) < 3) return 'Gebruik 16 tekens of meer, of mix kleine letters, hoofdletters, cijfers en tekens.'
  return null
}

/** Een e-mailadres zoals we het vergelijken en opslaan. */
export function normaalEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const e = v.trim().toLowerCase()
  return e.length <= 120 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : null
}
