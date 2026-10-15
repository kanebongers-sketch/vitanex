import { describe, expect, it } from 'vitest'
import { bestandOp, geslachtsverdeling, isActiefLid, leeftijdsverdeling, stroomIn, telStatussen, vroegsteLidSinds, type LidCijferRij } from './leden'

function lid(deel: Partial<LidCijferRij>): LidCijferRij {
  return { id: 'x', vestiging: 'budel', status: 'actief', lidSinds: '2025-01-01', einddatum: null, geboortedatum: null, geslacht: null, ...deel }
}

const VANDAAG = '2026-10-14'

describe('actief lid', () => {
  it('telt opgezegd mee tot de einddatum', () => {
    expect(isActiefLid(lid({ status: 'opgezegd', einddatum: '2026-11-01' }), VANDAAG)).toBe(true)
    expect(isActiefLid(lid({ status: 'opgezegd', einddatum: '2026-10-14' }), VANDAAG)).toBe(false)
    expect(isActiefLid(lid({ status: 'gepauzeerd' }), VANDAAG)).toBe(false)
    expect(isActiefLid(lid({ status: 'proef' }), VANDAAG)).toBe(false)
  })

  it('telt statussen apart', () => {
    const t = telStatussen(
      [lid({}), lid({ status: 'proef' }), lid({ status: 'gepauzeerd' }), lid({ status: 'opgezegd', einddatum: '2026-12-01' }), lid({ status: 'gestopt' })],
      VANDAAG,
    )
    expect(t).toEqual({ actief: 2, proef: 1, gepauzeerd: 1, opgezegdLopend: 1 })
  })
})

describe('ledenbestand en stroom per maand', () => {
  const leden = [
    lid({ lidSinds: '2026-01-01' }),
    lid({ lidSinds: '2026-10-06' }),
    lid({ lidSinds: '2025-05-05', status: 'gestopt', einddatum: '2026-10-01' }),
    lid({ lidSinds: '2026-10-13', status: 'proef' }),
    lid({ lidSinds: '2026-10-20' }),
  ]

  it('rekent het bestand terug uit lid sinds en einddatum', () => {
    expect(bestandOp(leden, '2026-09-30')).toBe(2)
    expect(bestandOp(leden, '2026-10-14')).toBe(2)
    expect(bestandOp(leden, '2026-10-01')).toBe(1)
  })

  it('telt instroom zonder proefleden en uitstroom tot vandaag', () => {
    expect(stroomIn(leden, '2026-10-01', '2026-10-31', VANDAAG)).toEqual({ instroom: 1, uitstroom: 1 })
    expect(stroomIn(leden, '2026-09-01', '2026-09-30', VANDAAG)).toEqual({ instroom: 0, uitstroom: 0 })
  })

  it('laat instroom min uitstroom precies de groei van het bestand zijn', () => {
    const meer = [
      ...leden,
      lid({ lidSinds: null, status: 'gestopt', einddatum: '2026-10-07' }),
      lid({ lidSinds: '2026-09-01', status: 'proef', einddatum: '2026-10-08' }),
      lid({ lidSinds: '2024-01-01', status: 'gestopt', einddatum: null }),
      lid({ lidSinds: '2026-09-30', status: 'opgezegd', einddatum: '2026-10-14' }),
      lid({ lidSinds: '2026-10-02', status: 'gestopt', einddatum: '2026-10-09' }),
      lid({ lidSinds: '2026-10-03', status: 'gestopt', einddatum: '2026-10-03' }),
      lid({ lidSinds: '2026-08-01', status: 'opgezegd', einddatum: '2026-10-30' }),
    ]
    const { instroom, uitstroom } = stroomIn(meer, '2026-10-01', '2026-10-31', VANDAAG)
    expect(instroom - uitstroom).toBe(bestandOp(meer, VANDAAG) - bestandOp(meer, '2026-09-30'))
  })

  it('vindt de vroegste lid sinds van de leden die meetellen', () => {
    expect(vroegsteLidSinds(leden)).toBe('2025-05-05')
    expect(vroegsteLidSinds([lid({ status: 'proef', lidSinds: '2020-01-01' })])).toBeNull()
  })
})

describe('demografie', () => {
  it('groepeert leeftijd en meldt onbekend apart', () => {
    const v = leeftijdsverdeling([lid({ geboortedatum: '2005-01-01' }), lid({ geboortedatum: '1960-01-01' }), lid({})], VANDAAG)
    expect(v.find((g) => g.label === 'Onder 25')?.aantal).toBe(1)
    expect(v.find((g) => g.label === '65 en ouder')?.aantal).toBe(1)
    expect(v.at(-1)).toEqual({ label: 'Onbekend', aantal: 1 })
  })

  it('telt geslacht en laat lege extra groepen weg', () => {
    expect(geslachtsverdeling([lid({ geslacht: 'vrouw' }), lid({ geslacht: 'vrouw' }), lid({ geslacht: 'man' })])).toEqual([
      { label: 'Vrouw', aantal: 2 },
      { label: 'Man', aantal: 1 },
    ])
  })
})
