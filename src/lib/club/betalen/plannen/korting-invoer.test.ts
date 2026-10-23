import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { CODE_PATROON, gezinsKortingGeldt, leesGezinInvoer, leesKortingInvoer, normaliseerCode, zelfdeCode } from './korting-invoer'

const PLAN = '11111111-1111-4111-8111-111111111111'
const ANDER = '22222222-2222-4222-8222-222222222222'
const GOED = { naam: 'Zomeractie', soort: 'procent', waarde: 25 }

function fout(body: unknown): string {
  const uit = leesKortingInvoer(body, [PLAN])
  if (uit.ok) throw new Error('verwacht een fout')
  return uit.fout
}

describe('leesKortingInvoer', () => {
  it('neemt een procentkorting aan met standaarden', () => {
    expect(leesKortingInvoer(GOED, [PLAN])).toEqual({
      ok: true,
      waarde: { naam: 'Zomeractie', code: null, soort: 'procent', waarde: 25, planId: null, geldigVanaf: null, geldigTot: null, duurTermijnen: null, maxGebruik: null, vereistBewijs: false, actief: true },
    })
  })

  it('procent 1 tot 100, bedrag in hele centen', () => {
    expect(fout({ ...GOED, waarde: 0 })).toMatch(/procenten/)
    expect(fout({ ...GOED, waarde: 101 })).toMatch(/procenten/)
    expect(fout({ ...GOED, soort: 'bedrag', waarde: 4.5 })).toMatch(/euro/)
    expect(leesKortingInvoer({ ...GOED, soort: 'bedrag', waarde: 500 }, [PLAN]).ok).toBe(true)
    expect(fout({ ...GOED, soort: 'gratis' })).toMatch(/procenten of in euro/)
  })

  it('code: hoofdletters, 3 tot 30 tekens zonder spaties', () => {
    const uit = leesKortingInvoer({ ...GOED, code: ' welkom2026 ' }, [PLAN])
    expect(uit.ok && uit.waarde.code).toBe('WELKOM2026')
    expect(fout({ ...GOED, code: 'ab' })).toMatch(/code/)
    expect(fout({ ...GOED, code: 'met spatie' })).toMatch(/code/)
    expect(leesKortingInvoer({ ...GOED, code: '' }, [PLAN]).ok).toBe(true)
  })

  it('geldt voor: alle plannen of een plan van de eigen sportschool', () => {
    expect(leesKortingInvoer({ ...GOED, planId: PLAN }, [PLAN]).ok).toBe(true)
    expect(fout({ ...GOED, planId: ANDER })).toMatch(/sportschool/)
    const alle = leesKortingInvoer({ ...GOED, planId: 'alle' }, [PLAN])
    expect(alle.ok && alle.waarde.planId).toBeNull()
  })

  it('periode, duur en maximum', () => {
    expect(fout({ ...GOED, geldigVanaf: '2026-07-01', geldigTot: '2026-06-30' })).toMatch(/voor de begindatum/)
    expect(fout({ ...GOED, geldigVanaf: '2026-02-30' })).toMatch(/begindatum/)
    expect(fout({ ...GOED, duurTermijnen: 61 })).toMatch(/termijnen/)
    expect(fout({ ...GOED, maxGebruik: 0 })).toMatch(/maximum/)
    expect(leesKortingInvoer({ ...GOED, geldigVanaf: '2026-06-01', geldigTot: '2026-08-31', duurTermijnen: '3', maxGebruik: '50' }, [PLAN]).ok).toBe(true)
  })

  it('eigenschap: elke geaccepteerde korting past in de check-regels van migratie 460', () => {
    fc.assert(
      fc.property(fc.constantFrom('procent', 'bedrag'), fc.integer({ min: -10, max: 1_100_000 }), fc.option(fc.string({ maxLength: 35 })), (soort, waarde, code) => {
        const uit = leesKortingInvoer({ naam: 'Actie', soort, waarde, code }, [])
        if (!uit.ok) return
        const k = uit.waarde
        if (k.soort === 'procent') expect(k.waarde >= 1 && k.waarde <= 100).toBe(true)
        else expect(k.waarde >= 1 && k.waarde <= 1_000_000).toBe(true)
        expect(k.code === null || CODE_PATROON.test(k.code)).toBe(true)
      }),
    )
  })
})

describe('codes', () => {
  it('normaliseren en vergelijken zonder hoofdletters', () => {
    expect(normaliseerCode('  zomer ')).toBe('ZOMER')
    expect(normaliseerCode('   ')).toBeNull()
    expect(normaliseerCode(12)).toBeNull()
    expect(zelfdeCode('Zomer', 'ZOMER')).toBe(true)
    expect(zelfdeCode('ZOMER1', 'ZOMER')).toBe(false)
  })
})

describe('gezinnen', () => {
  const K = '33333333-3333-4333-8333-333333333333'
  it('vanaf het 2e tot het 10e lid, korting van de eigen sportschool', () => {
    expect(leesGezinInvoer({ naam: 'Gezin Jansen', vanaf: '3', kortingId: K }, [K])).toEqual({ ok: true, waarde: { naam: 'Gezin Jansen', vanaf: 3, kortingId: K } })
    expect(leesGezinInvoer({ vanaf: 1 }, [K]).ok).toBe(false)
    expect(leesGezinInvoer({ vanaf: 11 }, [K]).ok).toBe(false)
    expect(leesGezinInvoer({ vanaf: 2, kortingId: 'vreemd' }, [K]).ok).toBe(false)
    expect(leesGezinInvoer({}, [])).toEqual({ ok: true, waarde: { naam: null, vanaf: 2, kortingId: null } })
  })
  it('de regel: vanaf het gekozen lid geldt de korting', () => {
    expect(gezinsKortingGeldt(1, 2)).toBe(false)
    expect(gezinsKortingGeldt(2, 2)).toBe(true)
    expect(gezinsKortingGeldt(4, 3)).toBe(true)
    fc.assert(fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 2, max: 10 }), (n, vanaf) => {
      expect(gezinsKortingGeldt(n, vanaf)).toBe(n >= vanaf)
    }))
  })
})
