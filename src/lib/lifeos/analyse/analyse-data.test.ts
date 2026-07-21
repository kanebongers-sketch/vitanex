import { describe, it, expect } from 'vitest'
import {
  OMZET_PER_VESTIGING,
  OMZET_PER_TRAJECT,
  CONTRACT_EINDE,
  NIEUWE_KLANTEN,
  ANALYSE_TOTAAL,
} from './analyse-data'

const som = (getal: number, n: number): number => getal + n

describe('analyse-data — aggregaten reconciliëren met de import', () => {
  it('som van vestiging-omzetten is exact de MRR (€ 13.567)', () => {
    const totaal = OMZET_PER_VESTIGING.reduce((acc, v) => som(acc, v.omzet), 0)
    expect(totaal).toBe(13567)
    expect(totaal).toBe(ANALYSE_TOTAAL.omzet)
  })

  it('som van vestiging-klanten is het totaal aantal (43)', () => {
    const totaal = OMZET_PER_VESTIGING.reduce((acc, v) => som(acc, v.aantal), 0)
    expect(totaal).toBe(ANALYSE_TOTAAL.klanten)
    expect(OMZET_PER_VESTIGING.length).toBe(ANALYSE_TOTAAL.vestigingen)
  })

  it('omzet per traject telt óók op tot € 13.567 over 43 klanten', () => {
    const omzet = OMZET_PER_TRAJECT.reduce((acc, t) => som(acc, t.omzet), 0)
    const aantal = OMZET_PER_TRAJECT.reduce((acc, t) => som(acc, t.aantal), 0)
    expect(omzet).toBe(13567)
    expect(aantal).toBe(43)
  })

  it('contract-einde + klanten zonder einddatum dekken alle 43 klanten', () => {
    const metEinde = CONTRACT_EINDE.reduce((acc, r) => som(acc, r.aantal), 0)
    expect(metEinde + ANALYSE_TOTAAL.zonderEinddatum).toBe(ANALYSE_TOTAAL.klanten)
  })

  it('nieuwe klanten per startmaand tellen op tot alle 43 klanten', () => {
    const totaal = NIEUWE_KLANTEN.reduce((acc, r) => som(acc, r.aantal), 0)
    expect(totaal).toBe(ANALYSE_TOTAAL.klanten)
  })

  it('maanden staan chronologisch en de peildatum bestaat in de tijdlijn', () => {
    const maanden = CONTRACT_EINDE.map((r) => r.maand)
    expect([...maanden].sort()).toEqual(maanden)
    expect(maanden).toContain(ANALYSE_TOTAAL.peildatum)
  })
})
