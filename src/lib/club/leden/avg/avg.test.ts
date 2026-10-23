import { describe, expect, it } from 'vitest'
import { bouwExport, bouwSamenvatting, exportBestandsnaam, SECTIES, waardeOpPad, type ExportRuw } from './export'
import { aanvraagFout, dagenTot, magLidVerwijderen, naamKlopt, verzoekTekst, verzoekUitRij } from './verwijderen'

function leeg(): ExportRuw {
  return {
    lid: { voornaam: 'Sanne', achternaam: 'de Vries', email: 'sanne@voorbeeld.nl', vestiging: 'budel', coach_id: 'm1', qr_token: 'GEHEIM-QR', user_id: 'org', demo: true },
    bezoeken: [],
    lesboekingen: [],
    afspraken: [],
    intakes: [],
    metingen: [],
    schemas: [],
    trainingen: [],
    sets: [],
    voeding: [],
    notities: [],
    challenges: [],
    opvolgtaken: [],
    meldingen: [],
    meldingVoorkeuren: [],
    pushToestellen: [],
    ledenapp: [],
    sessies: [],
    leads: [],
    leadHistorie: [],
    verwijderverzoek: [],
    communityGroepen: [],
    communityBerichten: [],
    communityReacties: [],
    communityMeldingen: [],
    communityVoorkeur: [],
    aankopen: [],
    tegoeden: [],
    tegoedMutaties: [],
    betaalklant: [],
    betaalmethoden: [],
    contracten: [],
    contractPauzes: [],
    facturen: [],
    betalingen: [],
    terugbetalingen: [],
    geschillen: [],
    betaalherinneringen: [],
    kasboek: [],
    betaalopdrachten: [],
    healthToestemmingen: [],
    healthKoppelingen: [],
    healthMetingen: [],
  }
}

const META = { sportschool: 'Voorbeeld Gym', gemaaktOp: new Date('2026-10-18T10:00:00Z'), vestigingNaam: 'Budel' }
const MEDEWERKERS = new Map([['m1', 'Tom Trainer']])

describe('waardeOpPad', () => {
  it('leest door ingesloten tabellen, ook als die een lijst zijn', () => {
    // Arrange
    const rij = { club_lessen: [{ start_op: 'x', club_lestypen: { naam: 'Spinning' } }] }
    // Act + Assert
    expect(waardeOpPad(rij, 'club_lessen.club_lestypen.naam')).toBe('Spinning')
    expect(waardeOpPad(rij, 'club_lessen.bestaat_niet')).toBeNull()
    expect(waardeOpPad({}, 'a.b')).toBeNull()
  })
})

describe('bouwExport', () => {
  it('geeft Nederlandse sleutels, de vestigingnaam en de naam van de coach', () => {
    const uit = bouwExport(leeg(), MEDEWERKERS, META)
    const lid = uit.Lid as Record<string, unknown>
    expect(lid.Voornaam).toBe('Sanne')
    expect(lid['E-mail']).toBe('sanne@voorbeeld.nl')
    expect(lid.Vestiging).toBe('Budel')
    expect(lid.Coach).toBe('Tom Trainer')
    expect(uit['Over dit bestand']).toMatchObject({ Sportschool: 'Voorbeeld Gym' })
  })

  it('zet nooit geheimen of interne velden in het bestand', () => {
    const ruw = leeg()
    ruw.ledenapp = [{ actief: true, code: 'GEHEIME-CODE', pin_hash: 'GEHEIME-HASH', wachtwoord_hash: 'GEHEIM-WACHTWOORD', email: 'sanne@voorbeeld.nl', laatst_ingelogd_op: '2026-10-01T10:00:00Z' }]
    ruw.sessies = [{ token_hash: 'GEHEIM-TOKEN', aangemaakt_op: '2026-10-01T10:00:00Z' }]
    ruw.meldingVoorkeuren = [{ mails: true, afmeld_token: 'GEHEIM-AFMELD' }]
    const tekst = JSON.stringify(bouwExport(ruw, MEDEWERKERS, META))
    expect(tekst).not.toMatch(/GEHEIM/)
    expect(tekst).not.toContain('user_id')
    expect(tekst).toContain('Laatst ingelogd op')
    expect(tekst).toContain('Inlog e-mailadres')
  })

  it('neemt gezondheidsgegevens wel mee (recht van het lid)', () => {
    const ruw = leeg()
    ruw.metingen = [{ datum: '2026-09-01', gewicht_kg: 80.5, bloeddruk: '120/80', medewerker_id: 'weg' }]
    const metingen = bouwExport(ruw, MEDEWERKERS, META).Metingen as Record<string, unknown>[]
    expect(metingen[0]['Gewicht (kg)']).toBe(80.5)
    expect(metingen[0].Bloeddruk).toBe('120/80')
    expect(metingen[0]['Gemeten door']).toBe('Medewerker (niet meer bekend)')
  })

  it('vertaalt ingesloten lijsten, zoals de oefeningen van een schema', () => {
    const ruw = leeg()
    ruw.schemas = [{ naam: 'Kracht', club_schema_oefeningen: [{ dag: 1, sets: 3, club_oefeningen: { naam: 'Squat' } }] }]
    const schemas = bouwExport(ruw, MEDEWERKERS, META)["Trainingsschema's"] as Record<string, unknown>[]
    expect(schemas[0].Oefeningen).toEqual([expect.objectContaining({ Oefening: 'Squat', Sets: 3 })])
  })

  it('heeft voor elk onderdeel een sectie, ook als die leeg is', () => {
    const uit = bouwExport(leeg(), MEDEWERKERS, META)
    for (const s of SECTIES) expect(uit[s.titel]).toEqual([])
  })
})

describe('bouwSamenvatting', () => {
  it('noemt alleen gevulde onderdelen met aantal en periode', () => {
    const ruw = leeg()
    ruw.bezoeken = [{ op: '2026-09-01T08:00:00Z' }, { op: '2026-10-01T08:00:00Z' }]
    const tekst = bouwSamenvatting(ruw, META)
    expect(tekst).toContain('Gegevens van Sanne de Vries bij Voorbeeld Gym')
    expect(tekst).toContain('- Bezoeken: 2 (van 1 september 2026 tot en met 1 oktober 2026)')
    expect(tekst).not.toContain('Metingen')
  })

  it('meldt een lopend verzoek tot verwijderen', () => {
    const ruw = leeg()
    ruw.verwijderverzoek = [{ definitief_op: '2026-11-17T08:00:00Z' }]
    expect(bouwSamenvatting(ruw, META)).toContain('wordt verwijderd op 17 november 2026')
  })

  it('gebruikt geen gedachtestreepjes', () => {
    expect(bouwSamenvatting(leeg(), META)).not.toMatch(/[–—]/)
  })
})

describe('exportBestandsnaam', () => {
  it('maakt een veilige naam zonder accenten of tekens', () => {
    expect(exportBestandsnaam({ voornaam: 'Zoë', achternaam: "d'Hondt / \"x\"" }, META.gemaaktOp, 'json')).toBe('gegevens-zoe-d-hondt-x-2026-10-18.json')
    expect(exportBestandsnaam({}, META.gemaaktOp, 'txt')).toBe('gegevens-lid-2026-10-18.txt')
  })
})

describe('verwijderen', () => {
  it('alleen Kane en de eigenaar mogen verwijderen', () => {
    expect(magLidVerwijderen({ isPlatformEigenaar: true, rol: 'beheerder' })).toBe(true)
    expect(magLidVerwijderen({ isPlatformEigenaar: false, rol: 'eigenaar' })).toBe(true)
    expect(magLidVerwijderen({ isPlatformEigenaar: false, rol: 'clubmanager' })).toBe(false)
    expect(magLidVerwijderen({ isPlatformEigenaar: false, rol: 'medewerker' })).toBe(false)
  })

  it('de bevestiging moet de volledige naam zijn; hoofdletters, spaties en accenten tellen niet', () => {
    const lid = { voornaam: 'Zoë', achternaam: 'de Vries' }
    expect(naamKlopt('zoe  DE vries ', lid)).toBe(true)
    expect(naamKlopt('Zoë de Vries', lid)).toBe(true)
    expect(naamKlopt('Zoë', lid)).toBe(false)
    expect(naamKlopt('', lid)).toBe(false)
    expect(naamKlopt(null, lid)).toBe(false)
    expect(naamKlopt('x'.repeat(201), lid)).toBe(false)
  })

  it('leest een verzoek uit de database en weigert rommel', () => {
    expect(verzoekUitRij({ aangevraagd_op: '2026-10-18T08:00:00Z', definitief_op: '2026-11-17T08:00:00Z', aangevraagd_door: 'Kane' })).toEqual({
      aangevraagdOp: '2026-10-18T08:00:00Z',
      definitiefOp: '2026-11-17T08:00:00Z',
      aangevraagdDoor: 'Kane',
    })
    expect(verzoekUitRij(null)).toBeNull()
    expect(verzoekUitRij({ aangevraagd_op: 'nee', definitief_op: '2026-11-17T08:00:00Z' })).toBeNull()
  })

  it('telt de dagen tot het definitieve verwijderen', () => {
    const nu = new Date('2026-10-18T08:00:00Z')
    expect(dagenTot('2026-11-17T08:00:00Z', nu)).toBe(30)
    expect(dagenTot('2026-10-18T09:00:00Z', nu)).toBe(1)
    expect(dagenTot('2026-10-01T08:00:00Z', nu)).toBe(0)
    const v = { aangevraagdOp: '2026-10-18T08:00:00Z', definitiefOp: '2026-11-17T08:00:00Z', aangevraagdDoor: 'Kane' }
    expect(verzoekTekst(v, nu)).toBe('Wordt over 30 dagen definitief verwijderd (op 17 november 2026).')
    expect(verzoekTekst({ ...v, definitiefOp: '2026-10-01T08:00:00Z' }, nu)).toContain('vannacht')
  })

  it('vertaalt databasefouten naar nette meldingen', () => {
    expect(aanvraagFout('23505').status).toBe(409)
    expect(aanvraagFout('P0002').status).toBe(404)
    expect(aanvraagFout(undefined).status).toBe(500)
  })
})
