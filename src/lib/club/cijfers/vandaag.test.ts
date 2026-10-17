import { describe, expect, it } from 'vitest'
import { jarigen, lesFase, nieuwDezeWeek, nuBinnen, vergelijkMetVorigeWeek, verschil, type VandaagLid } from './vandaag'
import { haalAlles } from './pagina'
import { bezoekTellingUitRij, lesTellingUitRij, lidCijferUitRij } from './rijen'

function lid(id: string, deel: Partial<VandaagLid> = {}): VandaagLid {
  return { id, voornaam: 'Sanne', achternaam: 'de Vries', status: 'actief', lidSinds: '2025-01-01', einddatum: null, geboortedatum: null, abonnement: null, ...deel }
}

const VANDAAG = '2026-10-14'

describe('Vandaag', () => {
  it('telt wie in de laatste 90 minuten binnenkwam, ieder lid een keer', () => {
    const nu = new Date('2026-10-14T18:00:00Z')
    const ops = [
      { lidId: 'a', op: new Date('2026-10-14T17:00:00Z') },
      { lidId: 'a', op: new Date('2026-10-14T17:10:00Z') },
      { lidId: 'b', op: new Date('2026-10-14T16:31:00Z') },
      { lidId: null, op: new Date('2026-10-14T16:40:00Z') },
      { lidId: 'c', op: new Date('2026-10-14T16:29:00Z') },
    ]
    expect(nuBinnen(ops, nu)).toBe(3)
  })

  it('geeft het verschil met vorige week', () => {
    expect(verschil(12, 9)).toEqual({ verschil: 3, richting: 'meer' })
    expect(verschil(3, 3).richting).toBe('gelijk')
  })

  it('vergelijkt alleen met vorige week als die dag data heeft', () => {
    expect(vergelijkMetVorigeWeek(11, 0, 0)).toBeNull()
    expect(vergelijkMetVorigeWeek(11, 0, 40)).toEqual({ verschil: 11, richting: 'meer' })
    expect(vergelijkMetVorigeWeek(5, 9, 30)).toEqual({ verschil: -4, richting: 'minder' })
  })

  it('vindt nieuwe leden en proefleden van deze week', () => {
    const r = nieuwDezeWeek([lid('a', { lidSinds: '2026-10-12' }), lid('b', { lidSinds: '2026-10-11' }), lid('c', { lidSinds: '2026-10-13', status: 'proef' })], '2026-10-12', VANDAAG)
    expect(r.map((l) => l.id)).toEqual(['c', 'a'])
  })

  it('vindt jarigen met hun leeftijd', () => {
    const r = jarigen([lid('a', { geboortedatum: '1990-10-14' }), lid('b', { geboortedatum: '1990-10-15' }), lid('c', { geboortedatum: '1990-10-14', status: 'gestopt' })], VANDAAG)
    expect(r).toEqual([{ lid: expect.objectContaining({ id: 'a' }), leeftijd: 36 }])
  })

  it('weet of een les voorbij, bezig of nog moet komen', () => {
    const s = new Date('2026-10-14T17:00:00Z')
    const e = new Date('2026-10-14T18:00:00Z')
    expect(lesFase(s, e, new Date('2026-10-14T16:00:00Z'))).toBe('straks')
    expect(lesFase(s, e, new Date('2026-10-14T17:30:00Z'))).toBe('bezig')
    expect(lesFase(s, e, new Date('2026-10-14T18:00:00Z'))).toBe('voorbij')
  })
})

describe('systeemgrens en ophalen', () => {
  it('weigert onbruikbare rijen', () => {
    expect(lidCijferUitRij({ id: '1', vestiging: 'Nergens!', status: 'actief' })).toBeNull()
    expect(bezoekTellingUitRij({ vestiging: 'budel', soort: 'week', sleutel: 'x', aantal: 1 })).toBeNull()
    expect(bezoekTellingUitRij({ vestiging: 'budel', soort: 'dag', sleutel: '2026-10-12', aantal: '7' })).toMatchObject({ aantal: 7 })
    expect(lesTellingUitRij({ id: 'l', vestiging: 'budel', lestype: 'Yoga', start_op: '2026-10-14T08:00:00Z', capaciteit: 12, geannuleerd: false, bezet: '5' })).toMatchObject({
      lestype: 'Yoga',
      bezet: 5,
      wachtlijst: 0,
    })
  })

  it('haalt in blokken tot de laatste onvolle pagina', async () => {
    const vragen: number[] = []
    const r = await haalAlles(async (van) => {
      vragen.push(van)
      return { data: Array.from({ length: van === 0 ? 1000 : 3 }, () => ({})), error: null }
    })
    expect(vragen).toEqual([0, 1000])
    expect(r.rijen).toHaveLength(1003)
    expect(r.afgekapt).toBe(false)
  })

  it('meldt een fout met de code', async () => {
    const r = await haalAlles(async () => ({ data: null, error: { message: 'bestaat niet', code: 'PGRST202' } }))
    expect(r).toMatchObject({ fout: 'bestaat niet', code: 'PGRST202' })
  })
})
