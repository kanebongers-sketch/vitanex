// ─── Club, voeding: kleine weergavehulp (PUUR) ──────────────────────────────

import { DOEL_INFO, type VoedingDoel } from '@/lib/club/voeding/rekenhulp'

export function doelLabel(doel: VoedingDoel | null): string {
  return doel ? DOEL_INFO[doel].label : 'Geen doel gekozen'
}

/** "17 oktober 2026" in Nederlandse tijd, of een lege tekst. */
export function datumLang(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' })
}
