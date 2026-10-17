// ─── AI Your Gym: schakelaar voor de verkoopwebsite (PUUR) ──────────────────
// UIT (standaard): de website en het aanmelden zijn alleen zichtbaar voor Kane,
// op fitfactorypt.nl/aiyourgym (een gewone 404 voor iedereen anders). Club is
// geheim tot de presentatie (besluit Kane).
//
// AAN (AIYOURGYM_SITE_ACTIEF=1 in Render): de website is openbaar op
// aiyourgym.com en www.aiyourgym.com (src/proxy.ts herschrijft naar /aiyourgym).
// Pas aanzetten als het domein er is en Kane het zegt.

export function siteActief(env: Record<string, string | undefined> = process.env): boolean {
  return env.AIYOURGYM_SITE_ACTIEF === '1'
}
