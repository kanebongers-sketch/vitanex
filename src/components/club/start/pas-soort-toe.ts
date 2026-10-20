// ─── Club startwizard: het startpakket van een soort toepassen (CLIENT) ─────
// Via de gewone API's van Club, dus met dezelfde controles en rechten als in
// het instellingencentrum. Een voor een; bij de eerste fout stoppen we en
// zeggen we wat er niet lukte. Wat al gelukt is blijft staan (en een tweede
// keer toepassen doet niets dubbel, zie toepasPlan).

import { stuur } from '@/components/club/rooster/vraag'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import type { SoortPakket, ToepasPlan } from '@/lib/club/start/soorten'

export interface Taak {
  label: string
  doe: () => Promise<{ ok: true } | { ok: false; fout: string }>
}

async function alsTaak(p: ReturnType<typeof stuur>): Promise<{ ok: true } | { ok: false; fout: string }> {
  const uit = await p
  return uit.ok ? { ok: true } : { ok: false, fout: uit.fout }
}

/** Alle stappen om het pakket neer te zetten, in een vaste volgorde. */
export function taken(pakket: SoortPakket, plan: ToepasPlan, org: HuisstijlWaarden, lesVestiging: string | null): Taak[] {
  const lijst: Taak[] = [
    { label: 'Onderdelen', doe: () => alsTaak(stuur('/api/club/organisatie', 'PATCH', { ...org, slogan: org.slogan ?? '', uit: plan.uit })) },
    { label: 'Rechten per rol', doe: () => alsTaak(stuur('/api/club/organisatie/instellingen', 'PATCH', { rechten: plan.rechten })) },
    ...plan.vestigingen.map((vestiging) => ({
      label: 'Openingstijden en regels',
      doe: () => alsTaak(stuur('/api/club/instellingen/regels', 'PUT', { vestiging, regels: pakket.regels, openingstijden: pakket.openingstijden })),
    })),
  ]
  if (!lesVestiging || plan.uit.includes('rooster')) return lijst
  return [
    ...lijst,
    ...plan.lestypen.map((l) => ({
      label: `Lestype ${l.naam}`,
      doe: () => alsTaak(stuur('/api/club/instellingen/lestypen', 'POST', { vestiging: lesVestiging, naam: l.naam, omschrijving: l.omschrijving, soort: l.soort, duurMin: l.duurMin, intensiteit: l.intensiteit })),
    })),
  ]
}

/** Voert de taken uit; `bij` krijgt de voortgang. Geeft de fout of null. */
export async function voerUit(lijst: readonly Taak[], bij: (klaar: number) => void): Promise<string | null> {
  for (const [i, taak] of lijst.entries()) {
    const uit = await taak.doe()
    if (!uit.ok) return `${taak.label}: ${uit.fout}`
    bij(i + 1)
  }
  return null
}
