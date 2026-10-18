// ─── Club, ledenlogin: welke tabbladen de ledenapp toont (PUUR) ─────────────
// Uit staat: wat de sportschool in de ledenapp-instellingen uitzette, plus de
// tabbladen van onderdelen die bij de sportschool uit staan. Home staat altijd aan.

import type { Organisatie } from '@/lib/club/kern/organisatie'
import { LEDENAPP_TABBLADEN, type LedenappTabblad } from './contract'

export function tabsUitVoor(org: Pick<Organisatie, 'uit' | 'instellingen'>): LedenappTabblad[] {
  const uit = new Set<string>(org.instellingen.ledenapp.tabsUit)
  if (org.uit.includes('afspraken')) uit.add('afspraken')
  if (org.uit.includes('rooster')) uit.add('lessen')
  if (org.uit.includes('training')) {
    uit.add('schema')
    uit.add('voeding')
  }
  return LEDENAPP_TABBLADEN.filter((t) => t !== 'home' && uit.has(t))
}
