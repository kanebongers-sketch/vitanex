import { describe, expect, it } from 'vitest'
import { leesGelezen, leesMededeling, leesUitvoering, leesWerkwijze, leesWerkwijzeWijziging } from './invoer'

const NU = new Date('2026-11-03T10:00:00Z')
const EIGENAAR = { eigenaar: true, vestigingen: ['budel', 'eersel'], alleVestigingen: true }
const MANAGER = { eigenaar: false, vestigingen: ['budel'], alleVestigingen: true }
const ID = '00000000-0000-4000-8000-000000000001'

describe('prikbord: invoer mededeling', () => {
  it('leest een geldige mededeling', () => {
    // Act
    const uit = leesMededeling({ titel: ' Kluisjes ', inhoud: 'Vanaf maandag.', vestigingen: ['budel', 'budel'], rollen: ['trainer'], verplicht: true, verlooptOp: '2026-11-10' }, EIGENAAR, NU)
    // Assert
    expect(uit).toEqual({ ok: true, waarde: { titel: 'Kluisjes', inhoud: 'Vanaf maandag.', vestigingen: ['budel'], rollen: ['trainer'], verplicht: true, verlooptOp: '2026-11-10T23:59:59.000Z' } })
  })

  it('weigert lege titel, vreemde vestiging, onbekende rol en een datum in het verleden', () => {
    expect(leesMededeling({ titel: '' }, EIGENAAR, NU)).toEqual({ ok: false, fout: 'titel' })
    expect(leesMededeling({ titel: 'x', vestigingen: ['eersel'] }, MANAGER, NU)).toEqual({ ok: false, fout: 'vestiging' })
    expect(leesMededeling({ titel: 'x', rollen: ['baas'] }, EIGENAAR, NU)).toEqual({ ok: false, fout: 'rol' })
    expect(leesMededeling({ titel: 'x', verlooptOp: '2026-11-01' }, EIGENAAR, NU)).toEqual({ ok: false, fout: 'verloopt' })
  })

  it('een clubmanager richt nooit iets aan de eigenaar alleen; de eigenaar wel', () => {
    expect(leesMededeling({ titel: 'x', rollen: ['eigenaar'] }, MANAGER, NU)).toEqual({ ok: false, fout: 'alleenEigenaar' })
    expect(leesMededeling({ titel: 'x', rollen: ['eigenaar', 'manager'] }, MANAGER, NU).ok).toBe(true)
    expect(leesMededeling({ titel: 'x', rollen: ['eigenaar'] }, EIGENAAR, NU).ok).toBe(true)
  })

  it('gelezen: een uuid, bevestig alleen als het echt true is', () => {
    expect(leesGelezen({ mededelingId: ID, bevestig: 'ja' })).toEqual({ ok: true, waarde: { mededelingId: ID, bevestig: false } })
    expect(leesGelezen({ mededelingId: 'x' })).toEqual({ ok: false, fout: 'ongeldig' })
  })
})

describe('prikbord: invoer werkwijze', () => {
  it('een voorbeeld, een notitie of een eigen werkwijze', () => {
    expect(leesWerkwijze({ voorbeeld: 'sluiten' }, EIGENAAR)).toEqual({ ok: true, waarde: { soort: 'voorbeeld', voorbeeld: 'sluiten', vestigingen: [], rollen: [] } })
    expect(leesWerkwijze({ voorbeeld: 'eigen' }, EIGENAAR)).toEqual({ ok: false, fout: 'ongeldig' })
    expect(leesWerkwijze({ notitieId: ID }, EIGENAAR)).toEqual({ ok: true, waarde: { soort: 'notitie', notitieId: ID } })
    const eigen = leesWerkwijze({ titel: 'Kassa', stappen: [{ tekst: 'Tellen', uitleg: '' }] }, EIGENAAR)
    expect(eigen).toEqual({ ok: true, waarde: { soort: 'eigen', titel: 'Kassa', werkwijzeSoort: 'eigen', vestigingen: [], rollen: [], stappen: [{ tekst: 'Tellen', uitleg: null }], takenlijstId: null } })
  })

  it('weigert geen stappen, een lege stap of te veel stappen', () => {
    expect(leesWerkwijze({ titel: 'x', stappen: [] }, EIGENAAR)).toEqual({ ok: false, fout: 'stappen' })
    expect(leesWerkwijze({ titel: 'x', stappen: [{ tekst: ' ' }] }, EIGENAAR)).toEqual({ ok: false, fout: 'stappen' })
    expect(leesWerkwijze({ titel: 'x', stappen: Array.from({ length: 41 }, () => ({ tekst: 'a' })) }, EIGENAAR)).toEqual({ ok: false, fout: 'stappen' })
  })

  it('een belangrijke nieuwe versie vraagt wat er anders is', () => {
    const stappen = [{ tekst: 'Licht uit' }]
    expect(leesWerkwijzeWijziging({ stappen, belangrijk: true }, EIGENAAR)).toEqual({ ok: false, fout: 'watAnders' })
    expect(leesWerkwijzeWijziging({ stappen, belangrijk: true, watAnders: 'Nieuw alarm.' }, EIGENAAR)).toEqual({
      ok: true,
      waarde: { soort: 'versie', versie: { stappen: [{ tekst: 'Licht uit', uitleg: null }], watAnders: 'Nieuw alarm.', belangrijk: true } },
    })
    expect(leesWerkwijzeWijziging({ gearchiveerd: true }, EIGENAAR)).toEqual({ ok: true, waarde: { soort: 'meta', meta: { gearchiveerd: true } } })
    expect(leesWerkwijzeWijziging({}, EIGENAAR)).toEqual({ ok: false, fout: 'ongeldig' })
  })
})

describe('prikbord: invoer uitvoering', () => {
  it('alleen een eigen vestiging, geldige stappen en een start van vandaag', () => {
    // Act
    const uit = leesUitvoering({ werkwijzeId: ID, versie: 2, vestiging: 'budel', afgevinkt: [2, 0, 2], notitie: ' ok ', gestartOp: '2026-11-03T09:50:00Z' }, ['budel'], NU)
    // Assert
    expect(uit).toEqual({ ok: true, waarde: { werkwijzeId: ID, versie: 2, vestiging: 'budel', gestartOp: '2026-11-03T09:50:00.000Z', afgevinkt: [0, 2], notitie: 'ok', lidId: null } })
    expect(leesUitvoering({ werkwijzeId: ID, versie: 2, vestiging: 'eersel', afgevinkt: [] }, ['budel'], NU)).toEqual({ ok: false, fout: 'vestiging' })
    expect(leesUitvoering({ werkwijzeId: ID, versie: 2, vestiging: 'budel', afgevinkt: [-1] }, ['budel'], NU)).toEqual({ ok: false, fout: 'afgevinkt' })
  })

  it('een start in de toekomst telt als nu', () => {
    const uit = leesUitvoering({ werkwijzeId: ID, versie: 1, vestiging: 'budel', afgevinkt: [], gestartOp: '2026-11-04T09:00:00Z' }, ['budel'], NU)
    expect(uit.ok && uit.waarde.gestartOp).toBe(NU.toISOString())
  })
})
