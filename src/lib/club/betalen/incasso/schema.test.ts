import { describe, expect, it } from 'vitest'
import { datum } from '../contract/datum'
import { controleerSchema, FOUT_CATEGORIEEN, foutCategorie, GRENZEN, herinneringNu, schemaMetAanpassing, STANDAARD_SCHEMA, volgendePoging } from './schema'

const d = datum

describe('foutCategorie', () => {
  it('deelt Stripe-faalcodes in', () => {
    expect(foutCategorie('insufficient_funds')).toBe('saldo')
    expect(foutCategorie('authorization_revoked')).toBe('machtiging')
    expect(foutCategorie('account_closed')).toBe('rekening')
    expect(foutCategorie('debit_disputed')).toBe('betwist')
    expect(foutCategorie('iets_nieuws')).toBe('onbekend')
    expect(foutCategorie('toString')).toBe('onbekend')
    expect(foutCategorie(null)).toBe('onbekend')
  })
})

describe('schema', () => {
  it('de standaard is geldig en herhaalt alleen bij saldo of storing', () => {
    expect(controleerSchema(STANDAARD_SCHEMA)).toEqual([])
    for (const c of FOUT_CATEGORIEEN) {
      const herhaalt = STANDAARD_SCHEMA.perCategorie[c].herhaalNaDagen.length > 0
      expect(herhaalt).toBe(c === 'saldo' || c === 'tijdelijk')
    }
    expect(STANDAARD_SCHEMA.perCategorie.machtiging.nieuweMethodeNodig).toBe(true)
  })

  it('een sportschool kan aanpassen binnen de grenzen', () => {
    const s = schemaMetAanpassing({ perCategorie: { saldo: { herhaalNaDagen: [7], nieuweMethodeNodig: false } } })
    expect(s.perCategorie.saldo.herhaalNaDagen).toEqual([7])
    expect(s.perCategorie.tijdelijk).toEqual(STANDAARD_SCHEMA.perCategorie.tijdelijk)
    expect(schemaMetAanpassing(null)).toEqual(STANDAARD_SCHEMA)
  })

  it('weigert te veel, te late of verboden herhalingen en rommelige herinneringen', () => {
    expect(() => schemaMetAanpassing({ perCategorie: { saldo: { herhaalNaDagen: [1, 2, 3], nieuweMethodeNodig: false } } })).toThrow()
    expect(() => schemaMetAanpassing({ perCategorie: { saldo: { herhaalNaDagen: [GRENZEN.maxDagenNaEersteMislukking + 1], nieuweMethodeNodig: false } } })).toThrow()
    expect(() => schemaMetAanpassing({ perCategorie: { saldo: { herhaalNaDagen: [5, 5], nieuweMethodeNodig: false } } })).toThrow()
    expect(() => schemaMetAanpassing({ perCategorie: { machtiging: { herhaalNaDagen: [3], nieuweMethodeNodig: true } } })).toThrow()
    expect(() => schemaMetAanpassing({ perCategorie: { betwist: { herhaalNaDagen: [3], nieuweMethodeNodig: false } } })).toThrow()
    expect(() => schemaMetAanpassing({ herinneringen: [{ stap: 2, naDagen: 3, kanaal: 'mail', betaallink: true }] })).toThrow()
    expect(() =>
      schemaMetAanpassing({
        herinneringen: [
          { stap: 1, naDagen: 5, kanaal: 'mail', betaallink: true },
          { stap: 2, naDagen: 5, kanaal: 'mail', betaallink: true },
        ],
      }),
    ).toThrow()
  })
})

describe('volgendePoging', () => {
  it('volgt de dagen na de eerste mislukking en stopt daarna', () => {
    const eerste = d('2026-01-28')
    expect(volgendePoging(STANDAARD_SCHEMA, 'saldo', eerste, 0)).toBe('2026-02-02')
    expect(volgendePoging(STANDAARD_SCHEMA, 'saldo', eerste, 1)).toBe('2026-02-11')
    expect(volgendePoging(STANDAARD_SCHEMA, 'saldo', eerste, 2)).toBeNull()
    expect(volgendePoging(STANDAARD_SCHEMA, 'machtiging', eerste, 0)).toBeNull()
    expect(volgendePoging(STANDAARD_SCHEMA, 'saldo', eerste, -1)).toBeNull()
  })
})

describe('herinneringNu', () => {
  const verval = d('2026-03-01')
  it('op tijd, een keer, en na gemiste dagen alleen de laatste stap', () => {
    expect(herinneringNu(STANDAARD_SCHEMA, verval, d('2026-03-03'), [])).toBeNull()
    expect(herinneringNu(STANDAARD_SCHEMA, verval, d('2026-03-04'), [])?.stap).toBe(1)
    expect(herinneringNu(STANDAARD_SCHEMA, verval, d('2026-03-05'), [1])).toBeNull()
    expect(herinneringNu(STANDAARD_SCHEMA, verval, d('2026-03-25'), [])?.stap).toBe(3)
    expect(herinneringNu(STANDAARD_SCHEMA, verval, d('2026-03-25'), [3])).toBeNull()
    expect(herinneringNu(STANDAARD_SCHEMA, verval, d('2026-03-12'), [1])?.stap).toBe(2)
  })
})
