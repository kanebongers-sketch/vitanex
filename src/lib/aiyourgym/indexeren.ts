// ─── AI Your Gym: zoekmachines buiten de deur houden (PUUR) ─────────────────
// Zolang de schakelaar aygIndexeren() uit staat (src/lib/aiyourgym/schakelaar.ts)
// hoort niets van de verkoopwebsite in zoekmachines, ook niet als de site
// actief is. Uitgevoerd door src/proxy.ts (header op aiyourgym.com),
// next.config.ts (header op de /aiyourgym-paden), src/app/(aiyourgym)/(website)/aiyourgym/layout.tsx
// (robots-metadata) en src/app/robots.ts (alles afschermen op aiyourgym.com).

import { AYG_API, AYG_PREFIX, isAygHost } from './host'

export const AYG_NOINDEX = 'noindex, nofollow'

function isAygPad(pad: string): boolean {
  return [AYG_PREFIX, AYG_API].some((p) => pad === p || pad.startsWith(`${p}/`))
}

/** Moet dit antwoord een X-Robots-Tag noindex krijgen? */
export function moetNoindex(host: string | null | undefined, pad: string, indexeren: boolean): boolean {
  if (indexeren) return false
  return isAygHost(host) || isAygPad(pad)
}

export interface RobotsRegels {
  rules: { userAgent: string; allow?: string; disallow?: string }
}

/**
 * De robots.txt per host. Op aiyourgym.com met de schakelaar uit: alles
 * afschermen (het domein is nieuw, er staan geen oude resultaten die eerst de
 * noindex moeten zien). Elders blijft crawlen toegestaan (zie src/app/robots.ts).
 */
export function robotsRegels(host: string | null | undefined, indexeren: boolean): RobotsRegels {
  if (!indexeren && isAygHost(host)) return { rules: { userAgent: '*', disallow: '/' } }
  return { rules: { userAgent: '*', allow: '/' } }
}
