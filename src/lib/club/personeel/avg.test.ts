import { describe, expect, it } from 'vitest'
import {
  bouwMedewerkerExport,
  letterlijkPatroon,
  magMedewerkerWissen,
  MEDEWERKER_AL_GEWIST,
  MEDEWERKER_NOG_ACTIEF,
  MEDEWERKER_SECTIES,
  medewerkerExportBestandsnaam,
  medewerkerNaamKlopt,
  medewerkerWisBlokkade,
  type MedewerkerExportRuw,
} from './avg'

function ruw(): MedewerkerExportRuw {
  return {
    medewerker: { id: 'mw-1', user_id: 'org-1', naam: 'Tom Trainer', email: 'tom@voorbeeld.nl', rollen: ['trainer', 'manager'], vestigingen: ['budel'], actief: false, contracturen_per_week: 24, demo: true },
    diensten: [{ id: 'd-1', datum: '2026-10-01', begin: '07:00', eind: '12:00', vestiging: 'budel', uur_status: 'goedgekeurd', club_dienst_soorten: { naam: 'Opening' } }],
    beschikbaarheid: [{ weekdag: 1, beschikbaar: false, reden: 'vrij' }],
    roosterNotities: [],
    afgevinkt: [{ datum: '2026-10-01', vestiging: 'budel', wie: 'TT', club_taken: [{ naam: 'Kleedkamers' }] }],
    taakNotities: [],
    afsluitrondes: [],
    // Ook als de database ze per ongeluk meestuurt: geheimen komen niet in het bestand.
    inloggen: [{ actief: true, pin_status: 'actief', code: 'GEHEIME-CODE-123456789012', pin_hash: 'GEHEIME-HASH', aangemaakt_op: '2026-09-01T10:00:00Z' }],
    sessies: [{ token_hash: 'GEHEIM-TOKEN', aangemaakt_op: '2026-10-01T10:00:00Z' }],
    logboek: [{ op: '2026-10-01T10:00:00Z', actie: 'lead aangemaakt', onderwerp: 'Sanne', vestiging: 'budel' }],
    hulpvragen: [{ onderwerp: 'Rooster', status: 'open', beschrijving: 'lang verhaal', aangemaakt_op: '2026-10-01T10:00:00Z' }],
  }
}

const META = { sportschool: 'Voorbeeld Gym', gemaaktOp: new Date('2026-10-20T10:00:00Z'), vestigingen: new Map([['budel', 'Budel']]) }

describe('bouwMedewerkerExport', () => {
  it('geeft Nederlandse sleutels, rollabels en vestigingnamen', () => {
    // Act
    const uit = bouwMedewerkerExport(ruw(), META)
    const mw = uit.Medewerker as Record<string, unknown>
    // Assert
    expect(mw.Naam).toBe('Tom Trainer')
    expect(mw.Rollen).toEqual(['Trainer', 'Clubmanager'])
    expect(mw.Vestigingen).toEqual(['Budel'])
    expect(mw['Contracturen per week']).toBe(24)
    const dienst = (uit['Diensten en uren'] as Record<string, unknown>[])[0]
    expect(dienst['Soort dienst']).toBe('Opening')
    expect(dienst.Vestiging).toBe('Budel')
    expect((uit['Afgevinkte taken'] as Record<string, unknown>[])[0].Taak).toBe('Kleedkamers')
    for (const sectie of MEDEWERKER_SECTIES) expect(Array.isArray(uit[sectie.titel])).toBe(true)
  })

  it('zet nooit inlogcode, pincode-hash, token of interne ids in het bestand', () => {
    // Act
    const tekst = JSON.stringify(bouwMedewerkerExport(ruw(), META))
    // Assert
    expect(tekst).not.toContain('GEHEIM')
    expect(tekst).not.toContain('mw-1')
    expect(tekst).not.toContain('org-1')
    expect(tekst).not.toContain('"d-1"')
    expect(tekst).not.toContain('user_id')
    expect(tekst).not.toContain('lang verhaal')
  })
})

describe('medewerkerExportBestandsnaam', () => {
  it('maakt een veilige naam', () => {
    expect(medewerkerExportBestandsnaam('Tom Trainer', new Date('2026-10-20T10:00:00Z'))).toBe('gegevens-medewerker-tom-trainer-2026-10-20.json')
  })
})

describe('magMedewerkerWissen', () => {
  it('laat alleen Kane en de eigenaar wissen', () => {
    expect(magMedewerkerWissen({ isPlatformEigenaar: true, rol: 'beheerder' })).toBe(true)
    expect(magMedewerkerWissen({ isPlatformEigenaar: false, rol: 'eigenaar' })).toBe(true)
    expect(magMedewerkerWissen({ isPlatformEigenaar: false, rol: 'clubmanager' })).toBe(false)
    expect(magMedewerkerWissen({ isPlatformEigenaar: false, rol: 'medewerker' })).toBe(false)
  })
})

describe('medewerkerWisBlokkade', () => {
  it('eist eerst uit dienst en wist niet twee keer', () => {
    expect(medewerkerWisBlokkade({ actief: true, gewist: false })).toBe(MEDEWERKER_NOG_ACTIEF)
    expect(medewerkerWisBlokkade({ actief: false, gewist: true })).toBe(MEDEWERKER_AL_GEWIST)
    expect(medewerkerWisBlokkade({ actief: false, gewist: false })).toBeNull()
  })
})

describe('medewerkerNaamKlopt', () => {
  it('vergelijkt als bij leden: hele naam, zonder hoofdletters of accenten', () => {
    expect(medewerkerNaamKlopt('tom  trainer', 'Tom Trainer')).toBe(true)
    expect(medewerkerNaamKlopt('Tom', 'Tom Trainer')).toBe(false)
    expect(medewerkerNaamKlopt(null, 'Tom Trainer')).toBe(false)
  })
})

describe('letterlijkPatroon', () => {
  it('maakt jokers in een naam letterlijk', () => {
    // Arrange: een naam met %, _ en een backslash, met spaties eromheen.
    const naam = ' 100%_Tom\\ '
    // Act + Assert
    expect(letterlijkPatroon(naam)).toBe('100\\%\\_Tom\\\\')
  })
})
