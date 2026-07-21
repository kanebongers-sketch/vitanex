// ─── LifeOS — wie mag de WhatsApp-bot bedienen? ─────────────────────────────
// Puur: env-waarde erin, besluit eruit. Geen `process.env` binnenin, zodat dit
// zonder env-gerommel te testen is — dezelfde regel als `telegram/toegang.ts`.
//
// ─── WAAROM DIT FAIL-CLOSED IS ──────────────────────────────────────────────
// De Meta-handtekening (zie `handtekening.ts`) bewijst "dit komt van WhatsApp",
// niet "dit komt van Kane". Wie het bot-nummer kent kan hem aanschrijven; de
// allowlist is het slot dat bewijst dát het Kane is. Achter deze deur schrijft
// LifeOS AUTONOOM in Kane's echte agenda en taken — een vreemde mag daar niets
// aanmaken. Dus: geen allowlist → niets komt binnen.
//
// GEEN leer-modus (anders dan Telegram): bij WhatsApp is de afzender gewoon je
// eigen telefoonnummer, dat ken je al. Er is geen kip-ei om op te lossen, dus
// geen escape nodig die de deur op een kier zet.

/** De afzender staat op de allowlist, of niet — meer smaken zijn er niet. */
export type AfzenderBesluit = { soort: 'toegestaan' } | { soort: 'geweigerd' }

/**
 * Reduceer een telefoonnummer tot enkel cijfers. Zo matcht "+31 6 12345678"
 * (zoals WhatsApp 'm in `from` levert kan variëren met/zonder `+` en spaties)
 * met een allowlist-item "31612345678". We vergelijken appels met appels door
 * BEIDE kanten door dezelfde molen te halen.
 */
function alleenCijfers(nummer: string): string {
  return nummer.replace(/\D/g, '')
}

/** Komma-gescheiden env-waarde → losse, genormaliseerde, niet-lege nummers. */
function leesNummers(ruw: string | undefined): string[] {
  return (ruw ?? '')
    .split(',')
    .map((item) => alleenCijfers(item))
    .filter((item) => item.length > 0)
}

/**
 * Mag dit nummer de WhatsApp-bot bedienen?
 *
 * Geen allowlist (leeg/afwezig) → `geweigerd`. Niet `toegestaan`: zie de kop van
 * dit bestand. Een `from` zonder cijfers kan per definitie niets matchen en wordt
 * ook geweigerd. Alleen een genormaliseerde match op het HELE nummer opent de
 * deur — geen prefix-match, want de allowlist gebruikt `includes` op de
 * volledige, opgeschoonde waarde.
 */
export function beoordeelAfzender(from: string, ruweAllowlist: string | undefined): AfzenderBesluit {
  const toegestaneNummers = leesNummers(ruweAllowlist)
  if (toegestaneNummers.length === 0) return { soort: 'geweigerd' }

  const genormaliseerdeFrom = alleenCijfers(from)
  if (genormaliseerdeFrom.length === 0) return { soort: 'geweigerd' }

  return toegestaneNummers.includes(genormaliseerdeFrom)
    ? { soort: 'toegestaan' }
    : { soort: 'geweigerd' }
}
