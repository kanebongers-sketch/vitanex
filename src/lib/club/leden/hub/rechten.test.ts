import { describe, expect, it } from 'vitest'
import { kaartRechten, type KaartRechtenInvoer } from './rechten'

const ALLES: KaartRechtenInvoer = { onderdelen: null, modulesUit: [], healthAan: false, lidgeldOpen: false }

describe('kaartRechten', () => {
  it('Kane en de eigenaar zien alles wat aan staat', () => {
    const r = kaartRechten(ALLES)
    expect(r).toMatchObject({ training: true, voeding: true, rooster: true, afspraken: true, checkin: true, challenges: true, berichten: true, ledenapp: true })
    expect(r.apps).toBe(false)
    expect(r.betalen).toBe(false)
  })

  it('een clubmanager ziet alleen de onderdelen die de eigenaar aanvinkt', () => {
    const r = kaartRechten({ ...ALLES, onderdelen: ['vandaag', 'leden', 'rooster'] })
    expect(r.rooster).toBe(true)
    expect(r.training).toBe(false)
    expect(r.afspraken).toBe(false)
    expect(r.checkin).toBe(false)
    expect(r.berichten).toBe(false)
    expect(r.voeding).toBe(false)
  })

  it('een trainer met Training en Afspraken ziet die blokken', () => {
    const r = kaartRechten({ ...ALLES, onderdelen: ['leden', 'schemas', 'afspraken'] })
    expect(r.training).toBe(true)
    expect(r.afspraken).toBe(true)
    expect(r.rooster).toBe(false)
  })

  it('een module die uit staat telt niet, ook niet voor Kane', () => {
    const r = kaartRechten({ ...ALLES, modulesUit: ['training', 'rooster', 'app', 'checkin'] })
    expect(r.training).toBe(false)
    expect(r.rooster).toBe(false)
    expect(r.ledenapp).toBe(false)
    expect(r.checkin).toBe(false)
  })

  it('metingen uit apps alleen met de schakelaar aan en het recht op Training', () => {
    expect(kaartRechten({ ...ALLES, healthAan: true }).apps).toBe(true)
    expect(kaartRechten({ ...ALLES, healthAan: true, onderdelen: ['leden'] }).apps).toBe(false)
  })

  it('betalen alleen met lidgeld open en het recht Lidmaatschappen', () => {
    expect(kaartRechten({ ...ALLES, lidgeldOpen: true }).betalen).toBe(true)
    expect(kaartRechten({ ...ALLES, lidgeldOpen: true, onderdelen: ['leden'] }).betalen).toBe(false)
    expect(kaartRechten({ ...ALLES, lidgeldOpen: false }).betalen).toBe(false)
  })
})

describe('kaartRechten in leesmodus (rollen v2)', () => {
  it('zonder bewerkregel is alles wat zichtbaar is ook te bewerken', () => {
    expect(kaartRechten(ALLES).bewerk).toEqual({ leden: true, training: true, voeding: true, rooster: true, afspraken: true, berichten: true })
  })

  it('wie Leden alleen mag zien, ziet de blokken maar wijzigt niets', () => {
    const r = kaartRechten({ ...ALLES, bewerkbaar: () => false })
    expect(r.training).toBe(true)
    expect(r.bewerk).toEqual({ leden: false, training: false, voeding: false, rooster: false, afspraken: false, berichten: false })
  })

  it('bewerken per onderdeel, en nooit iets dat niet zichtbaar is', () => {
    const r = kaartRechten({ ...ALLES, onderdelen: ['leden', 'schemas'], bewerkbaar: (s) => s === 'schemas' || s === 'rooster' })
    expect(r.bewerk.training).toBe(true)
    expect(r.bewerk.leden).toBe(false)
    expect(r.bewerk.rooster).toBe(false)
  })
})
