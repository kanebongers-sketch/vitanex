// ─── AI Your Gym: hreflang voor de website (PUUR) ───────────────────────────
// Elke pagina bestaat in beide talen op hetzelfde pad, Engels met /en ervoor.
// Relatief, zodat metadataBase (https://aiyourgym.com) er het volle adres van maakt.

import { taalPad } from './pad'
import { HTML_LANG, TALEN, type Taal } from './taal'

export interface TaalAlternates {
  canonical: string
  languages: Record<string, string>
}

/** canonical en hreflang (nl, en, x-default) voor een publiek pad zonder taal. */
export function taalAlternates(publiekPad: string, taal: Taal): TaalAlternates {
  const languages: Record<string, string> = {}
  for (const t of TALEN) languages[HTML_LANG[t]] = taalPad(t, publiekPad)
  languages['x-default'] = taalPad('nl', publiekPad)
  return { canonical: taalPad(taal, publiekPad), languages }
}
