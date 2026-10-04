// ─── LifeOS — werkvergaderingen herkennen (PUUR) ────────────────────────────
// "Vergadering Fit Factory", "Teamoverleg", "PT-meeting": werk, geen persoon en
// geen PT-sessie met een klant. Herkend op het woord (ook als deel van een
// samenstelling: "teamvergadering", "werkoverleg"), zodat je er geen nep-persoon
// voor hoeft aan te maken om 'm in de goede categorie te krijgen.

import { woordTokens } from '@/lib/lifeos/crm/agenda-match'

const VERGADER_WOORDEN = ['vergadering', 'vergaderen', 'overleg', 'meeting', 'bespreking', 'teamdag', 'teamavond']

/** Is dit een (werk)vergadering? */
export function isVergadering(titel: string | null | undefined): boolean {
  if (!titel) return false
  return woordTokens(titel).some((w) => VERGADER_WOORDEN.some((v) => w === v || w.endsWith(v)))
}

/** Met wie: MT-overleg → management, Budel → Team Budel, marketing → marketing, anders je PT-team. */
export function vergaderCategorie(tokens: readonly string[]): 'management' | 'budel_team' | 'marketing' | 'pt_team' {
  if (tokens.some((w) => w === 'mt' || w === 'management' || VERGADER_WOORDEN.some((v) => w === `mt${v}`))) return 'management'
  if (tokens.includes('budel')) return 'budel_team'
  if (tokens.some((w) => w === 'marketing' || w === 'content' || w === 'social')) return 'marketing'
  return 'pt_team'
}
