import { describe, it, expect } from 'vitest'
import {
  leesNieuweNotitie,
  leesNotitieAntwoord,
  leesNotitieJson,
  leesNotitieWijziging,
  leesNotitiesAntwoord,
  leesTekst,
  leesTitel,
  isSoort,
  notitieVanRij,
  notitiesVanRijen,
  MAX_TEKST_LENGTE,
} from './notities'

const RIJ = {
  id: 'n-1',
  tekst: 'Bellen met de boekhouder',
  soort: 'brain_dump',
  datum: '2026-07-16',
  aangemaakt_op: '2026-07-16T09:00:00.000Z',
  bijgewerkt_op: '2026-07-16T09:00:00.000Z',
}

const JSON_NOTITIE = {
  id: 'n-1',
  tekst: 'Bellen met de boekhouder',
  soort: 'brain_dump',
  datum: '2026-07-16',
  aangemaaktOp: '2026-07-16T09:00:00.000Z',
  bijgewerktOp: '2026-07-16T09:00:00.000Z',
}

describe('isSoort', () => {
  it('kent precies twee soorten — de allowlist uit migratie 050', () => {
    expect(isSoort('brain_dump')).toBe(true)
    expect(isSoort('journal')).toBe(true)
    expect(isSoort('braindump')).toBe(false)
    expect(isSoort('')).toBe(false)
    expect(isSoort(null)).toBe(false)
    expect(isSoort(1)).toBe(false)
  })
})

describe('leesTekst', () => {
  it('trimt', () => {
    // Arrange
    const ruw = '   Idee: LifeOS offline-first   '

    // Act
    const uitkomst = leesTekst(ruw)

    // Assert
    expect(uitkomst).toEqual({ ok: true, waarde: 'Idee: LifeOS offline-first' })
  })

  it('weigert tekst die alleen uit spaties bestaat — dat is leeg', () => {
    // Arrange/Act
    const uitkomst = leesTekst('    ')

    // Assert — de database denkt er hetzelfde over (btrim-check).
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert tekst boven de limiet, en accepteert hem er precies op', () => {
    // Arrange
    const opDeGrens = 'a'.repeat(MAX_TEKST_LENGTE)
    const eroverheen = 'a'.repeat(MAX_TEKST_LENGTE + 1)

    // Act + Assert
    expect(leesTekst(opDeGrens).ok).toBe(true)
    expect(leesTekst(eroverheen).ok).toBe(false)
  })

  it('weigert niet-tekst', () => {
    expect(leesTekst(42).ok).toBe(false)
    expect(leesTekst(null).ok).toBe(false)
    expect(leesTekst(undefined).ok).toBe(false)
  })
})

describe('leesNieuweNotitie', () => {
  it('leest een volledige notitie', () => {
    // Arrange
    const body = { tekst: '  Idee voor Vita  ', soort: 'brain_dump', datum: '2026-07-16' }

    // Act
    const uitkomst = leesNieuweNotitie(body)

    // Assert
    expect(uitkomst).toEqual({
      ok: true,
      waarde: { tekst: 'Idee voor Vita', soort: 'brain_dump', datum: '2026-07-16' },
    })
  })

  it('eist een datum — een idee zonder dag ben je kwijt', () => {
    // Arrange/Act
    const uitkomst = leesNieuweNotitie({ tekst: 'Iets', soort: 'brain_dump' })

    // Assert — anders dan bij taken bestaat er hier geen "ooit"-bak: dan was de
    // dag geen ordening meer maar een suggestie.
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert een onbekende soort in plaats van er iets van te maken', () => {
    const uitkomst = leesNieuweNotitie({ tekst: 'Iets', soort: 'gedachte', datum: '2026-07-16' })

    expect(uitkomst.ok).toBe(false)
    if (!uitkomst.ok) expect(uitkomst.fout).toContain('brain_dump')
  })

  it('weigert een datum die niet bestaat', () => {
    // Arrange — 31 februari; JS rolt die stilletjes door naar 3 maart.
    const uitkomst = leesNieuweNotitie({
      tekst: 'Iets',
      soort: 'journal',
      datum: '2026-02-31',
    })

    // Assert
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert onzin als body', () => {
    expect(leesNieuweNotitie(null).ok).toBe(false)
    expect(leesNieuweNotitie('tekst').ok).toBe(false)
    expect(leesNieuweNotitie([]).ok).toBe(false)
  })
})

describe('notitieVanRij', () => {
  it('leest een rij uit Postgres', () => {
    // Act
    const notitie = notitieVanRij(RIJ)

    // Assert
    expect(notitie).toEqual({
      id: 'n-1',
      tekst: 'Bellen met de boekhouder',
      soort: 'brain_dump',
      datum: '2026-07-16',
      // Een rij zonder titel/tags/categorie levert de lege norm: geen naam, geen
      // labels, niet ingedeeld. Alle drie zijn post-hoc en optioneel.
      titel: null,
      tags: [],
      categorie: null,
      aangemaaktOp: '2026-07-16T09:00:00.000Z',
      bijgewerktOp: '2026-07-16T09:00:00.000Z',
    })
  })

  it('leest een titel als die er is', () => {
    expect(notitieVanRij({ ...RIJ, titel: '  Marge-model ' })?.titel).toBe('Marge-model')
  })

  it('laat een onleesbare titel terugvallen op null i.p.v. de hele rij te weigeren', () => {
    // Arrange — de tekst is het kostbare deel; de titel is versiering.
    const rij = { ...RIJ, titel: 42 }

    // Act
    const notitie = notitieVanRij(rij)

    // Assert
    expect(notitie?.titel).toBeNull()
    expect(notitie?.tekst).toBe('Bellen met de boekhouder')
  })

  it('weigert een rij met een onbekende soort in plaats van hem door te geven', () => {
    // Arrange — bv. na een migratie die de allowlist verruimde.
    const rij = { ...RIJ, soort: 'iets_nieuws' }

    // Act + Assert — de database is een systeemgrens als elke andere. Dit is
    // precies het gat waar een cast doorheen glipt.
    expect(notitieVanRij(rij)).toBeNull()
  })

  it('weigert een rij zonder id, tekst of datum', () => {
    expect(notitieVanRij({ ...RIJ, id: null })).toBeNull()
    expect(notitieVanRij({ ...RIJ, tekst: '   ' })).toBeNull()
    expect(notitieVanRij({ ...RIJ, datum: undefined })).toBeNull()
    expect(notitieVanRij({ ...RIJ, bijgewerkt_op: null })).toBeNull()
    expect(notitieVanRij(null)).toBeNull()
  })
})

describe('notitiesVanRijen', () => {
  it('laat kapotte rijen weg maar houdt de rest', () => {
    // Arrange
    const rijen = [RIJ, { onzin: true }, { ...RIJ, id: 'n-2' }]

    // Act
    const notities = notitiesVanRijen(rijen)

    // Assert
    expect(notities.map((n) => n.id)).toEqual(['n-1', 'n-2'])
  })

  it('geeft een lege lijst bij lege invoer', () => {
    expect(notitiesVanRijen([])).toEqual([])
  })
})

describe('leesNotitiesAntwoord', () => {
  it('leest het antwoord van GET /api/notities', () => {
    // Act
    const antwoord = leesNotitiesAntwoord({ notities: [JSON_NOTITIE] })

    // Assert
    expect(antwoord?.notities).toHaveLength(1)
    expect(antwoord?.notities[0]?.tekst).toBe('Bellen met de boekhouder')
    expect(antwoord?.onleesbaar).toBe(0)
  })

  it('leest een lege lijst — dat is geldig, niet fout', () => {
    // Assert — "je schreef nog niets vandaag" is een dag, geen storing.
    expect(leesNotitiesAntwoord({ notities: [] })).toEqual({
      notities: [],
      onleesbaar: 0,
      erIsMeer: false,
    })
  })

  // Deze test stond hier omgekeerd: één kapotte rij gaf `null`, en dus verdween
  // je hele brain dump achter "Onverwacht antwoord van de server". De regel
  // ("fout ≠ leeg") klopte, de conclusie niet — één kapotte rij is geen kapot
  // antwoord. Nu: de rest komt door, en de kapotte rij wordt GETELD.
  it('laat de goede notities door als er één kapot is', () => {
    // Arrange
    const ruw = { notities: [JSON_NOTITIE, { id: 'n-2' }] }

    // Act
    const antwoord = leesNotitiesAntwoord(ruw)

    // Assert
    expect(antwoord?.notities).toHaveLength(1)
    expect(antwoord?.notities[0]?.id).toBe('n-1')
  })

  it('TELT de onleesbare rijen — stil weglaten is de bug die dit voorkomt', () => {
    // Arrange — twee rommelrijen tussen één goede.
    const ruw = { notities: [{ id: 'kapot' }, JSON_NOTITIE, { soort: 'onzin' }] }

    // Act
    const antwoord = leesNotitiesAntwoord(ruw)

    // Assert — zonder dit telletje zou een idee stil uit je brain dump vallen.
    expect(antwoord?.onleesbaar).toBe(2)
  })

  it('leest erIsMeer, en claimt niets als het veld ontbreekt', () => {
    expect(leesNotitiesAntwoord({ notities: [], erIsMeer: true })?.erIsMeer).toBe(true)
    expect(leesNotitiesAntwoord({ notities: [] })?.erIsMeer).toBe(false)
    // Geen truthy-gok: alleen een echte `true` telt.
    expect(leesNotitiesAntwoord({ notities: [], erIsMeer: 'ja' })?.erIsMeer).toBe(false)
  })

  it('faalt als het antwoord geen notities-array heeft — dán is er geen pagina', () => {
    expect(leesNotitiesAntwoord({})).toBeNull()
    expect(leesNotitiesAntwoord({ notities: 'geen array' })).toBeNull()
    expect(leesNotitiesAntwoord(null)).toBeNull()
  })
})

describe('leesTitel', () => {
  it('normaliseert witruimte', () => {
    expect(leesTitel('  Marge   model ')).toEqual({ ok: true, waarde: 'Marge model' })
  })

  it('weigert een lege titel met een leesbare melding', () => {
    // Act
    const uitkomst = leesTitel('   ')

    // Assert
    expect(uitkomst.ok).toBe(false)
    if (!uitkomst.ok) expect(uitkomst.fout).toContain('lege titel')
  })

  it('weigert een te lange titel i.p.v. af te kappen', () => {
    // Act
    const uitkomst = leesTitel('x'.repeat(121))

    // Assert
    expect(uitkomst.ok).toBe(false)
    if (!uitkomst.ok) expect(uitkomst.fout).toContain('120')
  })

  it('weigert niet-tekst', () => {
    expect(leesTitel(42).ok).toBe(false)
    expect(leesTitel(null).ok).toBe(false)
  })
})

// De PATCH kon alleen tags en categorie wijzigen. Een typefout corrigeren kwam
// daardoor neer op weggooien en opnieuw typen — nieuw id, nieuwe aangemaakt_op,
// verbroken backlinks. Dat is geen bewerken maar dataverlies met een omweg.
describe('leesNotitieWijziging', () => {
  it('leest een tekstwijziging — dit ontbrak', () => {
    expect(leesNotitieWijziging({ tekst: '  Bijgewerkte tekst ' })).toEqual({
      ok: true,
      waarde: { tekst: 'Bijgewerkte tekst' },
    })
  })

  it('weigert een lege tekst — dat is geen bewerking maar een verwijdering', () => {
    expect(leesNotitieWijziging({ tekst: '   ' }).ok).toBe(false)
  })

  it('leest een titelwijziging', () => {
    expect(leesNotitieWijziging({ titel: 'Marge-model' })).toEqual({
      ok: true,
      waarde: { titel: 'Marge-model' },
    })
  })

  it('laat een titel expliciet wissen met null', () => {
    // Assert — `null` is een waarde ("haal weg"), geen "niet meegestuurd".
    expect(leesNotitieWijziging({ titel: null })).toEqual({ ok: true, waarde: { titel: null } })
  })

  it('weigert een ongeldige titel', () => {
    expect(leesNotitieWijziging({ titel: '  ' }).ok).toBe(false)
    expect(leesNotitieWijziging({ titel: 42 }).ok).toBe(false)
  })

  it('leest tekst, titel, tags en categorie samen', () => {
    // Act
    const uitkomst = leesNotitieWijziging({
      tekst: 'Nieuw',
      titel: 'Titel',
      tags: ['Werk', 'werk'],
      categorie: 'Ideeën',
    })

    // Assert — tags blijven genormaliseerd en ontdubbeld.
    expect(uitkomst).toEqual({
      ok: true,
      waarde: { tekst: 'Nieuw', titel: 'Titel', tags: ['werk'], categorie: 'Ideeën' },
    })
  })

  it('weigert een lege wijziging', () => {
    expect(leesNotitieWijziging({}).ok).toBe(false)
    expect(leesNotitieWijziging(null).ok).toBe(false)
  })

  it('weigert een onbekende categorie', () => {
    expect(leesNotitieWijziging({ categorie: 'Onzin' }).ok).toBe(false)
  })
})

describe('leesNieuweNotitie — titel', () => {
  const BASIS = { tekst: 'Idee', soort: 'brain_dump', datum: '2026-07-16' }

  it('accepteert een capture zonder titel — dat is de norm', () => {
    // Act
    const uitkomst = leesNieuweNotitie(BASIS)

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.titel).toBeUndefined()
  })

  it('accepteert een titel bij het aanmaken (voor "wens wordt echt")', () => {
    // Act
    const uitkomst = leesNieuweNotitie({ ...BASIS, titel: ' Marge-model ' })

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.titel).toBe('Marge-model')
  })

  it('behandelt titel: null als "geen titel", niet als fout', () => {
    expect(leesNieuweNotitie({ ...BASIS, titel: null }).ok).toBe(true)
  })

  it('weigert een ongeldige titel', () => {
    expect(leesNieuweNotitie({ ...BASIS, titel: 'x'.repeat(121) }).ok).toBe(false)
  })
})

describe('leesNotitieJson / leesNotitieAntwoord', () => {
  it('leest het antwoord van POST /api/notities', () => {
    expect(leesNotitieAntwoord({ notitie: JSON_NOTITIE })?.notitie.id).toBe('n-1')
  })

  it('leest een waarschuwing als de server er een meestuurt', () => {
    // Arrange — de notitie is opgeslagen, maar de verwijzingen niet bijgewerkt.
    const ruw = { notitie: JSON_NOTITIE, waarschuwing: 'Verwijzingen niet bijgewerkt.' }

    // Act / Assert — je tekst is veilig; de kanttekening mag niet stil wegvallen.
    expect(leesNotitieAntwoord(ruw)?.waarschuwing).toBe('Verwijzingen niet bijgewerkt.')
  })

  it('heeft geen waarschuwing als er niets aan de hand is', () => {
    expect(leesNotitieAntwoord({ notitie: JSON_NOTITIE })?.waarschuwing).toBeNull()
  })

  it('faalt als de notitie ontbreekt of niet klopt', () => {
    expect(leesNotitieAntwoord({})).toBeNull()
    expect(leesNotitieAntwoord({ notitie: null })).toBeNull()
    expect(leesNotitieJson({ ...JSON_NOTITIE, soort: 'onzin' })).toBeNull()
  })
})
