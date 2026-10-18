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

// Los daarvan: mag de website in zoekmachines? (besluit Kane 18-10-2026: nog niet,
// ook niet als de site actief is). UIT (standaard): overal noindex en op
// aiyourgym.com een robots.txt die alles afschermt, zie indexeren.ts.
// AAN: AIYOURGYM_INDEXEREN=1 in Render, alleen als Kane het zegt.
export function aygIndexeren(env: Record<string, string | undefined> = process.env): boolean {
  return env.AIYOURGYM_INDEXEREN === '1'
}
