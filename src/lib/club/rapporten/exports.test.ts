import { describe, expect, it } from 'vitest'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { RAPPORT_SLEUTELS } from './definities'
import { isAlles, keuzeZoek, rapportKeuze } from './keuze'
import { CIJFER_EXPORTS, CIJFER_HOOFDSTUKKEN, alleExports, exportHref, hoofdstukExports } from './exports'

const LIJST: VestigingInfo[] = [
  { sleutel: 'budel', naam: 'Budel', standaard: true },
  { sleutel: 'eersel', naam: 'Eersel', standaard: false },
]
const VANDAAG = '2026-11-03'

/** Zo maakt /club/rapporten de CSV-link voor dezelfde zoekstring. */
function vanRapporten(zoek: Record<string, string | string[]>): string {
  const keuze = rapportKeuze(zoek, LIJST, null, VANDAAG)
  return `/api/club/rapporten/csv?${keuzeZoek(keuze, isAlles(keuze, LIJST)).toString()}`
}

describe('exports op Cijfers', () => {
  it('elk exportblok heeft dezelfde export als /club/rapporten (een vestiging)', () => {
    const per = hoofdstukExports({ maand: '2026-10', vestigingen: ['eersel'], alle: false })
    for (const h of CIJFER_HOOFDSTUKKEN) {
      expect(per[h].map((l) => l.rapport), h).toEqual(CIJFER_EXPORTS[h])
      for (const l of per[h]) expect(l.href, `${h} ${l.rapport}`).toBe(vanRapporten({ rapport: l.rapport, maand: '2026-10', vs: 'eersel' }))
    }
  })

  it('met alle vestigingen ook dezelfde export als /club/rapporten', () => {
    const per = hoofdstukExports({ maand: '2026-09', vestigingen: ['budel', 'eersel'], alle: true })
    for (const h of CIJFER_HOOFDSTUKKEN) {
      for (const l of per[h]) expect(l.href).toBe(vanRapporten({ rapport: l.rapport, maand: '2026-09', vs: 'alle' }))
    }
  })

  it('Alle exports bevat elk rapport precies een keer, en de voorbeeldlink opent Rapporten met dezelfde keuze', () => {
    const groepen = alleExports({ maand: '2026-10', vestigingen: ['budel'], alle: false })
    const sleutels = groepen.flatMap((g) => g.links.map((l) => l.rapport))
    expect([...sleutels].sort()).toEqual([...RAPPORT_SLEUTELS].sort())
    const leden = groepen[0].links[0]
    expect(leden.voorbeeld).toBe(`/club/rapporten?rapport=${leden.rapport}&maand=2026-10&vs=budel`)
  })

  it('elke hoofdstukexport is een bestaand rapport', () => {
    for (const h of CIJFER_HOOFDSTUKKEN) for (const r of CIJFER_EXPORTS[h]) expect(RAPPORT_SLEUTELS).toContain(r)
    expect(exportHref({ rapport: 'uren', maand: '2026-10', vestigingen: ['budel'] }, false)).toBe('/api/club/rapporten/csv?rapport=uren&maand=2026-10&vs=budel')
  })
})
