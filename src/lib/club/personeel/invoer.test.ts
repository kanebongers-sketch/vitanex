import { describe, expect, it } from 'vitest'
import { leesBeschikbaar, leesDienst, leesMedewerkerInstelling, leesNotitie, leesToepassen, leesUren, leesVast } from './invoer'
import { leesStaat, personeelHref, zonderPaneel } from './url'

const ID = '7d0f3c2a-1b2c-4d5e-8f90-123456789abc'

describe('leesDienst', () => {
  it('accepteert een open dienst', () => {
    const uit = leesDienst({ vestiging: 'budel', datum: '2026-10-14', begin: '08:00', eind: '14:00' })
    expect(uit).toEqual({ ok: true, waarde: { vestiging: 'budel', datum: '2026-10-14', begin: '08:00', eind: '14:00', medewerkerId: null, soortId: null, notitie: null, uursoort: 'werk' } })
  })

  it('weigert einde voor begin, onbekende vestiging en ziek zonder persoon', () => {
    expect(leesDienst({ vestiging: 'budel', datum: '2026-10-14', begin: '21:30', eind: '14:00' }).ok).toBe(false)
    expect(leesDienst({ vestiging: 'Parijs!', datum: '2026-10-14', begin: '08:00', eind: '14:00' }).ok).toBe(false)
    expect(leesDienst({ vestiging: 'budel', datum: '2026-10-14', begin: '08:00', eind: '14:00', uursoort: 'ziek' }).ok).toBe(false)
    expect(leesDienst({ vestiging: 'budel', datum: '2026-10-14', begin: '08:00', eind: '14:00', medewerkerId: 'x' }).ok).toBe(false)
  })
})

describe('overige invoer', () => {
  it('uren: pauze en tijden', () => {
    expect(leesUren({ actie: 'bevestig', gewerktBegin: '14:00', gewerktEind: '22:15', pauzeMin: 30 }).ok).toBe(true)
    expect(leesUren({ actie: 'bevestig', pauzeMin: 500 }).ok).toBe(false)
    expect(leesUren({ actie: 'weg' }).ok).toBe(false)
  })

  it('patroon toepassen vraagt een maandag en 1 tot 12 weken', () => {
    expect(leesToepassen({ vestiging: 'budel', maandag: '2026-10-12', weken: 4 }).ok).toBe(true)
    expect(leesToepassen({ vestiging: 'budel', maandag: '2026-10-13', weken: 4 }).ok).toBe(false)
    expect(leesToepassen({ vestiging: 'budel', maandag: '2026-10-12', weken: 20 }).ok).toBe(false)
  })

  it('beschikbaarheid: verlof over meerdere dagen', () => {
    const uit = leesBeschikbaar({ medewerkerId: ID, datum: '2026-10-26', datumTot: '2026-10-28', reden: 'verlof' })
    expect(uit).toMatchObject({ ok: true, waarde: { beschikbaar: false, reden: 'verlof', datumTot: '2026-10-28' } })
    expect(leesBeschikbaar({ medewerkerId: ID, datum: '2026-10-26', datumTot: '2026-10-20' }).ok).toBe(false)
  })

  it('vaste week: zeven dagen, tijden alleen als beschikbaar', () => {
    const dagen = Array.from({ length: 7 }, (_, i) => (i === 0 ? { beschikbaar: true, van: '16:00', tot: '22:00' } : i === 4 ? { beschikbaar: false, van: '08:00' } : {}))
    const uit = leesVast({ medewerkerId: ID, dagen })
    expect(uit.ok && uit.waarde.dagen[4]).toEqual({ beschikbaar: false, van: null, tot: null })
    expect(uit.ok && uit.waarde.dagen[1].beschikbaar).toBeNull()
    expect(leesVast({ medewerkerId: ID, dagen: [] }).ok).toBe(false)
  })

  it('medewerker: contracturen en kleur', () => {
    expect(leesMedewerkerInstelling({ contracturen: 23.7 })).toEqual({ ok: true, waarde: { contracturen: 23.5 } })
    expect(leesMedewerkerInstelling({ kleur: 'paars' }).ok).toBe(false)
    expect(leesMedewerkerInstelling({}).ok).toBe(false)
  })

  it('mededeling vraagt tekst', () => {
    expect(leesNotitie({ vestiging: 'budel', datum: '2026-10-13', van: '18:45', tekst: 'Muziek zachter voor Body balance' }).ok).toBe(true)
    expect(leesNotitie({ vestiging: 'budel', datum: '2026-10-13', tekst: '  ' }).ok).toBe(false)
  })
})

describe('url', () => {
  it('leest en schrijft de staat', () => {
    const s = leesStaat({ v: 'budel', tab: 'uren', periode: 'maand', op: '2026-10-01', week: 'fout', dienst: ID }, 'budel')
    expect(s).toMatchObject({ tab: 'uren', periode: 'maand', op: '2026-10-01', week: null, dienst: ID })
    expect(personeelHref(zonderPaneel(s))).toBe('/clubkane/personeel?v=budel&tab=uren&periode=maand&op=2026-10-01')
  })

  it('valt terug op het weekrooster', () => {
    expect(leesStaat({ tab: 'iets' }, 'budel').tab).toBe('week')
  })
})
