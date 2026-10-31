import { describe, expect, it } from 'vitest'
import { dagInNederland, lidVoorTellingUitRij, telActieveLeden, teltAlsActiefLid, type LidVoorTelling } from './actief-tellen'

const DAG = '2026-10-31'
const lid = (extra: Partial<LidVoorTelling> = {}): LidVoorTelling => ({ vestiging: 'budel', status: 'actief', demo: false, lidSinds: '2026-01-01', einddatum: null, ...extra })

describe('wat telt als actief lid voor de staffel (besluit Kane 31-10-2026)', () => {
  it('actief en proef tellen', () => {
    expect(teltAlsActiefLid(lid(), DAG)).toBe(true)
    expect(teltAlsActiefLid(lid({ status: 'proef' }), DAG)).toBe(true)
  })
  it('gepauzeerd, gestopt en een onbekende status tellen niet', () => {
    expect(teltAlsActiefLid(lid({ status: 'gepauzeerd' }), DAG)).toBe(false)
    expect(teltAlsActiefLid(lid({ status: 'gestopt' }), DAG)).toBe(false)
    expect(teltAlsActiefLid(lid({ status: 'iets' }), DAG)).toBe(false)
  })
  it('opgezegd telt tot en met de einddatum, daarna niet', () => {
    expect(teltAlsActiefLid(lid({ status: 'opgezegd', einddatum: '2026-11-30' }), DAG)).toBe(true)
    expect(teltAlsActiefLid(lid({ status: 'opgezegd', einddatum: DAG }), DAG)).toBe(true)
    expect(teltAlsActiefLid(lid({ status: 'opgezegd', einddatum: '2026-10-30' }), DAG)).toBe(false)
    expect(teltAlsActiefLid(lid({ status: 'opgezegd', einddatum: null }), DAG)).toBe(true)
  })
  it('demoleden en leden die pas later beginnen tellen niet', () => {
    expect(teltAlsActiefLid(lid({ demo: true }), DAG)).toBe(false)
    expect(teltAlsActiefLid(lid({ lidSinds: '2026-11-01' }), DAG)).toBe(false)
    expect(teltAlsActiefLid(lid({ lidSinds: DAG }), DAG)).toBe(true)
    expect(teltAlsActiefLid(lid({ lidSinds: null }), DAG)).toBe(true)
  })
  it('per vestiging tellen, zonder de invoer te wijzigen', () => {
    const leden = [lid(), lid(), lid({ vestiging: 'eersel' }), lid({ vestiging: 'eersel', status: 'gestopt' }), lid({ demo: true })]
    const kopie = JSON.stringify(leden)
    expect(telActieveLeden(leden, DAG)).toEqual({ budel: 2, eersel: 1 })
    expect(JSON.stringify(leden)).toBe(kopie)
    expect(telActieveLeden([], DAG)).toEqual({})
  })
  it('rijen uit de database: datums afgekapt, onbruikbare rijen weg', () => {
    expect(lidVoorTellingUitRij({ vestiging: 'budel', status: 'actief', demo: null, lid_sinds: '2026-01-01T00:00:00Z', einddatum: 'onzin' })).toEqual({ vestiging: 'budel', status: 'actief', demo: false, lidSinds: '2026-01-01', einddatum: null })
    expect(lidVoorTellingUitRij({ status: 'actief' })).toBeNull()
    expect(lidVoorTellingUitRij(null)).toBeNull()
  })
  it('de dag in Nederland, ook net na middernacht', () => {
    expect(dagInNederland(new Date('2026-10-30T23:30:00Z'))).toBe('2026-10-31')
    expect(dagInNederland(new Date('2026-10-31T10:00:00Z'))).toBe('2026-10-31')
  })
})
