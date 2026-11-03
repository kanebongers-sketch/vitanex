import { describe, expect, it } from 'vitest'
import { kaartActies, kaartRechten, zichtbareLidTabs, type KaartRechtenInvoer } from './rechten'

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

describe('zichtbareLidTabs', () => {
  it('met alles aan: drie tabbladen', () => {
    expect(zichtbareLidTabs(kaartRechten(ALLES))).toEqual(['overzicht', 'training', 'lidmaatschap'])
  })

  it('een tabblad zonder blok valt weg: Training zonder schema, voeding, apps of challenges', () => {
    const r = kaartRechten({ ...ALLES, onderdelen: ['leden', 'rooster'] })
    expect(zichtbareLidTabs(r)).toEqual(['overzicht', 'lidmaatschap'])
  })

  it('challenges alleen houden Training open (challenges staan nu op Training)', () => {
    const r = kaartRechten({ ...ALLES, onderdelen: ['leden', 'challenges'] })
    expect(zichtbareLidTabs(r)).toContain('training')
  })

  it('Overzicht en Lidmaatschap (gegevens en privacy) staan er altijd', () => {
    const r = kaartRechten({ ...ALLES, onderdelen: ['leden'], modulesUit: ['training', 'rooster', 'app'] })
    expect(zichtbareLidTabs(r)).toEqual(['overzicht', 'lidmaatschap'])
  })
})

describe('kaartActies', () => {
  const r = kaartRechten(ALLES)

  it('een hoofdactie per tabblad', () => {
    expect(kaartActies(r, 'overzicht', true).hoofd).toBe('notitie')
    expect(kaartActies(r, 'training', true).hoofd).toBe('schema')
    expect(kaartActies(r, 'training', false).hoofd).toBe('intake')
    expect(kaartActies(r, 'lidmaatschap', true).hoofd).toBe('lidmaatschap')
  })

  it('de hoofdactie staat nooit ook onder Meer acties', () => {
    for (const tab of ['overzicht', 'training', 'lidmaatschap'] as const) {
      const a = kaartActies(r, tab, false)
      expect(a.meer).not.toContain(a.hoofd)
    }
    expect(kaartActies(r, 'overzicht', true).meer).toEqual(['inchecken', 'lesBoeken', 'afspraak', 'intake', 'schema'])
  })

  it('alleen wat deze persoon mag; in leesmodus geen hoofdactie', () => {
    const lees = kaartRechten({ ...ALLES, bewerkbaar: () => false })
    expect(kaartActies(lees, 'overzicht', true)).toEqual({ hoofd: null, meer: ['inchecken'] })
    expect(kaartActies(lees, 'training', true).hoofd).toBeNull()
    const zonderCheckin = kaartRechten({ ...ALLES, modulesUit: ['checkin'], bewerkbaar: () => false })
    expect(kaartActies(zonderCheckin, 'lidmaatschap', true)).toEqual({ hoofd: null, meer: [] })
  })
})
