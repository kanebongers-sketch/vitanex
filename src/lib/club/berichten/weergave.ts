// ─── Club: berichten in woorden (PUUR) ───────────────────────────────────────

import type { LidStatus } from '@/lib/club/kern/lid'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { Bericht } from './model'

const MEERVOUD: Record<LidStatus, string> = {
  actief: 'actieve leden',
  gepauzeerd: 'gepauzeerde leden',
  opgezegd: 'opgezegde leden',
  gestopt: 'gestopte leden',
  proef: 'proefleden',
}

function opsomming(delen: readonly string[]): string {
  if (delen.length <= 1) return delen[0] ?? ''
  return `${delen.slice(0, -1).join(', ')} en ${delen.at(-1)}`
}

/** "Alle leden van alle vestigingen" of "Proefleden in Budel met tag Ochtendploeg". */
export function doelgroepTekst(b: Pick<Bericht, 'vestigingen' | 'statussen' | 'tag'>, vestigingen: readonly VestigingInfo[]): string {
  const groep = b.statussen.length === 0 ? 'alle leden' : opsomming(b.statussen.map((s) => MEERVOUD[s]))
  const wie = groep.charAt(0).toUpperCase() + groep.slice(1)
  const waar = b.vestigingen.length === 0 ? 'van alle vestigingen' : `in ${opsomming(b.vestigingen.map((v) => naamVan(vestigingen, v)))}`
  const tag = b.tag ? ` met tag ${b.tag}` : ''
  return `${wie} ${waar}${tag}`
}
