// ─── Club, voeding: kleine weergavehulp (PUUR) ──────────────────────────────

import type { VoedingDoel } from '@/lib/club/voeding/rekenhulp'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

export function doelLabel(doel: VoedingDoel | null, taal: Taal = 'nl'): string {
  const t = VOEDING[taal]
  return doel ? t.doel[doel].label : t.geenDoel
}

/** "17 oktober 2026" | "17 October 2026" in Nederlandse tijd, of een lege tekst. */
export function datumLang(iso: string, taal: Taal = 'nl'): string {
  return formatDatum(iso, taal, 'lang')
}
