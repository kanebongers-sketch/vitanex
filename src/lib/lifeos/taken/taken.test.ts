import { describe, it, expect } from 'vitest'
import {
  leesNieuweTaak,
  leesTaakJson,
  leesTaakWijziging,
  taakVanRij,
  takenVanRijen,
  top3Van,
  eersteVrijePositie,
  groepeerTaken,
  isTop3Positie,
  takenVanDag,
  MAX_TITEL_LENGTE,
  type Taak,
} from './taken'

/** Een geldig uuid — `projectId` wordt aan de grens op vorm gecontroleerd. */
const PROJECT_ID = '3f1a2b7c-9d4e-4a10-8b22-5c6d7e8f9a0b'

function taak(overschrijf: Partial<Taak> = {}): Taak {
  return {
    id: 'id-1',
    titel: 'Iets doen',
    notitie: null,
    klaar: false,
    klaarOp: null,
    datum: '2026-07-15',
    top3Positie: null,
    impact: null,
    inspanningMinuten: null,
    energie: null,
    deadline: null,
    projectId: null,
    aangemaaktOp: '2026-07-15T08:00:00.000Z',
    ...overschrijf,
  }
}

describe('leesNieuweTaak', () => {
  it('leest een volledige taak', () => {
    // Arrange
    const body = {
      titel: '  Offerte sturen  ',
      notitie: ' voor donderdag ',
      datum: '2026-07-15',
      top3Positie: 2,
    }

    // Act
    const uitkomst = leesNieuweTaak(body)

    // Assert — titel en notitie getrimd, geen verrassingen. De vier feiten staan
    // expliciet op null: je stuurde ze niet mee, dus er is geen oordeel — en dat
    // schrijft deze laag ook zo op, in plaats van de velden weg te laten.
    expect(uitkomst).toEqual({
      ok: true,
      waarde: {
        titel: 'Offerte sturen',
        notitie: 'voor donderdag',
        datum: '2026-07-15',
        top3Positie: 2,
        impact: null,
        inspanningMinuten: null,
        energie: null,
        deadline: null,
        projectId: null,
      },
    })
  })

  it('accepteert een taak zonder dag: dat is de "ooit"-bak', () => {
    const uitkomst = leesNieuweTaak({ titel: 'Ooit die boekenkast' })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) {
      expect(uitkomst.waarde.datum).toBeNull()
      expect(uitkomst.waarde.top3Positie).toBeNull()
      expect(uitkomst.waarde.notitie).toBeNull()
    }
  })

  it('weigert een lege titel — een taak zonder titel is geen taak', () => {
    expect(leesNieuweTaak({ titel: '   ' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: '' }).ok).toBe(false)
    expect(leesNieuweTaak({}).ok).toBe(false)
  })

  it('weigert een titel over de limiet', () => {
    const uitkomst = leesNieuweTaak({ titel: 'a'.repeat(MAX_TITEL_LENGTE + 1) })

    expect(uitkomst.ok).toBe(false)
  })

  it('laat een titel op precies de limiet door', () => {
    expect(leesNieuweTaak({ titel: 'a'.repeat(MAX_TITEL_LENGTE) }).ok).toBe(true)
  })

  it('weigert een top-3-positie zonder dag — een top-3 hoort bij een dag', () => {
    // Arrange/Act
    const uitkomst = leesNieuweTaak({ titel: 'Trainen', top3Positie: 1 })

    // Assert — dezelfde regel als de check-constraint in migratie 020.
    expect(uitkomst.ok).toBe(false)
    if (!uitkomst.ok) expect(uitkomst.fout).toContain('datum')
  })

  it('weigert een positie buiten 1-3', () => {
    expect(leesNieuweTaak({ titel: 'x', datum: '2026-07-15', top3Positie: 0 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', datum: '2026-07-15', top3Positie: 4 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', datum: '2026-07-15', top3Positie: '1' }).ok).toBe(false)
  })

  it('weigert een datum die geen datum is', () => {
    expect(leesNieuweTaak({ titel: 'x', datum: '15-07-2026' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', datum: '2026-02-31' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', datum: 'morgen' }).ok).toBe(false)
  })

  it('weigert onzin in plaats van te struikelen', () => {
    expect(leesNieuweTaak(null).ok).toBe(false)
    expect(leesNieuweTaak('titel').ok).toBe(false)
    expect(leesNieuweTaak([]).ok).toBe(false)
  })
})

describe('leesNieuweTaak — de vier feiten', () => {
  it('leest impact, inspanning, energie, deadline en project', () => {
    // Arrange
    const body = {
      titel: 'Offerte sturen',
      datum: '2026-07-15',
      impact: 4,
      inspanningMinuten: 45,
      energie: 'hoog',
      deadline: '2026-07-17',
      projectId: PROJECT_ID,
    }

    // Act
    const uitkomst = leesNieuweTaak(body)

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) {
      expect(uitkomst.waarde.impact).toBe(4)
      expect(uitkomst.waarde.inspanningMinuten).toBe(45)
      expect(uitkomst.waarde.energie).toBe('hoog')
      expect(uitkomst.waarde.deadline).toBe('2026-07-17')
      expect(uitkomst.waarde.projectId).toBe(PROJECT_ID)
    }
  })

  // De kern: een taak die je snel dumpt heeft nog geen oordeel, en dat is een
  // geldige staat. Hier een 3 invullen zou een oordeel verzinnen dat niemand gaf.
  it('laat de feiten op null als je ze niet meestuurt — null is geen 3', () => {
    const uitkomst = leesNieuweTaak({ titel: 'Snel gedumpt' })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) {
      expect(uitkomst.waarde.impact).toBeNull()
      expect(uitkomst.waarde.inspanningMinuten).toBeNull()
      expect(uitkomst.waarde.energie).toBeNull()
      expect(uitkomst.waarde.deadline).toBeNull()
      expect(uitkomst.waarde.projectId).toBeNull()
    }
  })

  it('weigert een impact buiten 1-5', () => {
    expect(leesNieuweTaak({ titel: 'x', impact: 0 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', impact: 6 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', impact: 2.5 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', impact: '4' }).ok).toBe(false)
  })

  it('weigert een inspanning buiten 1-480 — 8 uur is geen taak maar een project', () => {
    expect(leesNieuweTaak({ titel: 'x', inspanningMinuten: 0 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', inspanningMinuten: 481 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', inspanningMinuten: 480 }).ok).toBe(true)
  })

  it('weigert een energie buiten de allowlist — een typfout faalt hier, niet stil', () => {
    expect(leesNieuweTaak({ titel: 'x', energie: 'hoogg' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', energie: 'HOOG' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', energie: 2 }).ok).toBe(false)
  })

  it('weigert een deadline die geen datum is, en zegt dat het om de deadline gaat', () => {
    const uitkomst = leesNieuweTaak({ titel: 'x', deadline: 'vrijdag' })

    expect(uitkomst.ok).toBe(false)
    if (!uitkomst.ok) expect(uitkomst.fout).toContain('Deadline')
  })

  it('weigert een project-id dat geen id is — geen 502 op een typfout', () => {
    expect(leesNieuweTaak({ titel: 'x', projectId: 'mentaforce' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', projectId: 123 }).ok).toBe(false)
  })

  // Deadline en datum zijn twee verschillende dingen: het voornemen en de
  // verplichting. Een deadline zonder geplande dag is dus geldig.
  it('accepteert een deadline zonder geplande dag', () => {
    const uitkomst = leesNieuweTaak({ titel: 'Belasting', deadline: '2026-09-01' })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) {
      expect(uitkomst.waarde.datum).toBeNull()
      expect(uitkomst.waarde.deadline).toBe('2026-09-01')
    }
  })
})

describe('leesTaakWijziging — de vier feiten', () => {
  it('wijzigt één feit zonder de rest mee te sturen', () => {
    const uitkomst = leesTaakWijziging({ impact: 5 })

    expect(uitkomst).toEqual({ ok: true, waarde: { impact: 5 } })
  })

  it('kan een feit wissen met null — dat is "ik weet het niet meer", geen fout', () => {
    const uitkomst = leesTaakWijziging({ inspanningMinuten: null, energie: null })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) {
      expect(uitkomst.waarde.inspanningMinuten).toBeNull()
      expect(uitkomst.waarde.energie).toBeNull()
    }
  })

  it('onderscheidt "feit weggelaten" van "feit op null"', () => {
    const zonder = leesTaakWijziging({ titel: 'Nieuw' })
    const metNull = leesTaakWijziging({ titel: 'Nieuw', impact: null })

    expect(zonder.ok && 'impact' in zonder.waarde).toBe(false)
    expect(metNull.ok && 'impact' in metNull.waarde).toBe(true)
  })

  it('kan een taak uit een project halen', () => {
    const uitkomst = leesTaakWijziging({ projectId: null })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.projectId).toBeNull()
  })

  it('weigert ongeldige feiten', () => {
    expect(leesTaakWijziging({ impact: 9 }).ok).toBe(false)
    expect(leesTaakWijziging({ inspanningMinuten: -5 }).ok).toBe(false)
    expect(leesTaakWijziging({ energie: 'gemiddeld' }).ok).toBe(false)
    expect(leesTaakWijziging({ deadline: '2026-13-01' }).ok).toBe(false)
    expect(leesTaakWijziging({ projectId: 'niet-een-uuid' }).ok).toBe(false)
  })
})

describe('leesTaakWijziging', () => {
  it('leest alleen wat je meestuurt — afvinken hoeft niet de hele taak mee te sturen', () => {
    // Arrange/Act
    const uitkomst = leesTaakWijziging({ klaar: true })

    // Assert
    expect(uitkomst).toEqual({ ok: true, waarde: { klaar: true } })
  })

  it('kan een taak uit de top-3 halen met null', () => {
    const uitkomst = leesTaakWijziging({ top3Positie: null })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.top3Positie).toBeNull()
  })

  it('onderscheidt "veld weggelaten" van "veld op null"', () => {
    const zonder = leesTaakWijziging({ klaar: true })
    const metNull = leesTaakWijziging({ klaar: true, notitie: null })

    expect(zonder.ok && 'notitie' in zonder.waarde).toBe(false)
    expect(metNull.ok && 'notitie' in metNull.waarde).toBe(true)
  })

  it('weigert een lege wijziging', () => {
    expect(leesTaakWijziging({}).ok).toBe(false)
  })

  it('weigert een klaar die geen boolean is', () => {
    expect(leesTaakWijziging({ klaar: 'ja' }).ok).toBe(false)
    expect(leesTaakWijziging({ klaar: 1 }).ok).toBe(false)
  })
})

describe('taakVanRij', () => {
  it('leest een rij uit de database', () => {
    // Arrange
    const rij = {
      id: 'abc',
      titel: 'Offerte',
      notitie: null,
      klaar: true,
      klaar_op: '2026-07-15T10:00:00.000Z',
      datum: '2026-07-15',
      top3_positie: 1,
      aangemaakt_op: '2026-07-15T08:00:00.000Z',
    }

    // Act
    const uit = taakVanRij(rij)

    // Assert
    expect(uit?.klaar).toBe(true)
    expect(uit?.top3Positie).toBe(1)
    expect(uit?.klaarOp).toBe('2026-07-15T10:00:00.000Z')
  })

  it('geeft null bij een onbruikbare rij in plaats van een halve taak', () => {
    expect(taakVanRij(null)).toBeNull()
    expect(taakVanRij({ titel: 'geen id' })).toBeNull()
    expect(taakVanRij({ id: 'x', aangemaakt_op: '2026-07-15T08:00:00.000Z' })).toBeNull()
  })

  it('negeert een positie buiten 1-3 uit de database', () => {
    const uit = taakVanRij({
      id: 'x',
      titel: 'x',
      aangemaakt_op: '2026-07-15T08:00:00.000Z',
      top3_positie: 7,
    })

    expect(uit?.top3Positie).toBeNull()
  })

  it('slaat kapotte rijen over zonder de rest te verliezen', () => {
    const rijen = [
      { id: 'a', titel: 'Goed', aangemaakt_op: '2026-07-15T08:00:00.000Z' },
      null,
      { titel: 'Kapot' },
    ]

    expect(takenVanRijen(rijen)).toHaveLength(1)
  })

  it('leest de vier feiten uit de snake_case-kolommen', () => {
    // Arrange
    const rij = {
      id: 'abc',
      titel: 'Offerte',
      aangemaakt_op: '2026-07-15T08:00:00.000Z',
      impact: 4,
      inspanning_minuten: 45,
      energie: 'hoog',
      deadline: '2026-07-17',
      project_id: PROJECT_ID,
    }

    // Act
    const uit = taakVanRij(rij)

    // Assert
    expect(uit?.impact).toBe(4)
    expect(uit?.inspanningMinuten).toBe(45)
    expect(uit?.energie).toBe('hoog')
    expect(uit?.deadline).toBe('2026-07-17')
    expect(uit?.projectId).toBe(PROJECT_ID)
  })

  it('leest ontbrekende feiten als null, niet als nul', () => {
    const uit = taakVanRij({ id: 'x', titel: 'x', aangemaakt_op: '2026-07-15T08:00:00.000Z' })

    expect(uit?.impact).toBeNull()
    expect(uit?.inspanningMinuten).toBeNull()
    expect(uit?.energie).toBeNull()
    expect(uit?.deadline).toBeNull()
    expect(uit?.projectId).toBeNull()
  })

  // Zelfde keuze als bij top3_positie: een waarde die de database nooit had
  // mogen doorlaten lezen we als "onbekend", niet als een half oordeel.
  it('negeert kapotte feiten uit de database in plaats van ze te geloven', () => {
    const uit = taakVanRij({
      id: 'x',
      titel: 'x',
      aangemaakt_op: '2026-07-15T08:00:00.000Z',
      impact: 9,
      inspanning_minuten: 99999,
      energie: 'gemiddeld',
      deadline: 'ooit',
      project_id: 'geen-uuid',
    })

    expect(uit?.impact).toBeNull()
    expect(uit?.inspanningMinuten).toBeNull()
    expect(uit?.energie).toBeNull()
    expect(uit?.deadline).toBeNull()
    expect(uit?.projectId).toBeNull()
  })
})

describe('leesTaakJson', () => {
  it('leest de feiten uit het camelCase-antwoord van onze eigen API', () => {
    const uit = leesTaakJson({
      id: 'abc',
      titel: 'Offerte',
      aangemaaktOp: '2026-07-15T08:00:00.000Z',
      impact: 2,
      inspanningMinuten: 30,
      energie: 'laag',
      deadline: '2026-07-20',
      projectId: PROJECT_ID,
    })

    expect(uit?.impact).toBe(2)
    expect(uit?.inspanningMinuten).toBe(30)
    expect(uit?.energie).toBe('laag')
    expect(uit?.deadline).toBe('2026-07-20')
    expect(uit?.projectId).toBe(PROJECT_ID)
  })

  it('geeft null bij een onbruikbaar antwoord in plaats van een halve taak', () => {
    expect(leesTaakJson(null)).toBeNull()
    expect(leesTaakJson({ titel: 'geen id' })).toBeNull()
  })
})

describe('top3Van', () => {
  it('zet de taken op hun eigen plek', () => {
    // Arrange
    const taken = [
      taak({ id: 'c', top3Positie: 3, titel: 'Derde' }),
      taak({ id: 'a', top3Positie: 1, titel: 'Eerste' }),
    ]

    // Act
    const drie = top3Van(taken)

    // Assert — positie 2 blijft leeg; nummer 3 schuift niet op.
    expect(drie).toHaveLength(3)
    expect(drie[0]?.titel).toBe('Eerste')
    expect(drie[1]).toBeNull()
    expect(drie[2]?.titel).toBe('Derde')
  })

  it('geeft drie lege plekken bij geen taken', () => {
    expect(top3Van([])).toEqual([null, null, null])
  })

  it('negeert taken zonder positie', () => {
    const drie = top3Van([taak({ top3Positie: null })])

    expect(drie).toEqual([null, null, null])
  })
})

describe('eersteVrijePositie', () => {
  it('geeft de laagste vrije plek', () => {
    expect(eersteVrijePositie([])).toBe(1)
    expect(eersteVrijePositie([taak({ id: 'a', top3Positie: 1 })])).toBe(2)
    expect(
      eersteVrijePositie([taak({ id: 'a', top3Positie: 1 }), taak({ id: 'c', top3Positie: 3 })]),
    ).toBe(2)
  })

  it('geeft null als de top-3 vol is — drie is drie', () => {
    const vol = [
      taak({ id: 'a', top3Positie: 1 }),
      taak({ id: 'b', top3Positie: 2 }),
      taak({ id: 'c', top3Positie: 3 }),
    ]

    expect(eersteVrijePositie(vol)).toBeNull()
  })

  // Een afgevinkte top-3-taak houdt zijn plek: de unieke index uit migratie 020
  // kijkt niet naar `klaar`. Zag deze functie 'm over het hoofd, dan bood de UI
  // plek 1 opnieuw aan en gaf de database een 409 — omdat je je belangrijkste
  // taak had afgemaakt.
  it('telt een afgevinkte top-3-taak mee: die plek is bezet', () => {
    const af = taak({ id: 'a', top3Positie: 1, klaar: true, klaarOp: '2026-07-15T10:00:00.000Z' })

    expect(eersteVrijePositie([af])).toBe(2)
  })
})

describe('takenVanDag', () => {
  const vandaag = '2026-07-15'

  it('geeft de taken van die dag, open én afgevinkt', () => {
    // Arrange
    const taken = [
      taak({ id: 'open', datum: vandaag }),
      taak({ id: 'af', datum: vandaag, klaar: true, klaarOp: '2026-07-15T10:00:00.000Z' }),
      taak({ id: 'morgen', datum: '2026-07-16' }),
      taak({ id: 'ooit', datum: null }),
    ]

    // Act
    const vanDeDag = takenVanDag(taken, vandaag)

    // Assert — 'af' hoort erbij: je koos 'm vanochtend, en dat hij af is maakt
    // die keuze niet ongedaan.
    expect(vanDeDag.map((t) => t.id)).toEqual(['open', 'af'])
  })

  it('geeft een lege lijst als er die dag niets staat', () => {
    expect(takenVanDag([taak({ datum: '2026-07-20' })], vandaag)).toEqual([])
  })

  it('muteert de invoer niet', () => {
    const taken = Object.freeze([taak({ id: 'a', datum: vandaag })])

    expect(() => takenVanDag(taken, vandaag)).not.toThrow()
  })
})

describe('groepeerTaken', () => {
  const vandaag = '2026-07-15'

  it('verdeelt taken over vandaag, te laat, later, ooit en gedaan', () => {
    // Arrange
    const taken = [
      taak({ id: 'v', datum: vandaag, titel: 'Vandaag' }),
      taak({ id: 'oud', datum: '2026-07-10', titel: 'Gisteren' }),
      taak({ id: 'later', datum: '2026-07-20', titel: 'Volgende week' }),
      taak({ id: 'ooit', datum: null, titel: 'Ooit' }),
      taak({ id: 'af', datum: vandaag, klaar: true, titel: 'Klaar' }),
    ]

    // Act
    const groepen = groepeerTaken(taken, vandaag)

    // Assert — elke taak in precies één bak.
    expect(groepen.vandaag.map((t) => t.id)).toEqual(['v'])
    expect(groepen.teLaat.map((t) => t.id)).toEqual(['oud'])
    expect(groepen.later.map((t) => t.id)).toEqual(['later'])
    expect(groepen.ooit.map((t) => t.id)).toEqual(['ooit'])
    expect(groepen.gedaan.map((t) => t.id)).toEqual(['af'])
  })

  // Dit is waarom de splitsing bestaat: in één 'backlog'-bak zag een taak van
  // drie weken over datum er identiek uit als een taak voor volgende maand.
  it('houdt verleden en toekomst uit elkaar', () => {
    const groepen = groepeerTaken(
      [
        taak({ id: 'ver-over', datum: '2026-06-24' }),
        taak({ id: 'gisteren', datum: '2026-07-14' }),
        taak({ id: 'morgen', datum: '2026-07-16' }),
        taak({ id: 'volgende-maand', datum: '2026-08-15' }),
      ],
      vandaag,
    )

    expect(groepen.teLaat.map((t) => t.id)).toEqual(['ver-over', 'gisteren'])
    expect(groepen.later.map((t) => t.id)).toEqual(['morgen', 'volgende-maand'])
  })

  it('rekent een verstreken deadline als te laat, ook zonder geplande dag', () => {
    // Een taak zonder dag maar met een verlopen deadline stond vroeger in 'ooit'
    // — en dat is precies verkeerd om.
    const groepen = groepeerTaken([taak({ id: 'belasting', datum: null, deadline: '2026-07-01' })], vandaag)

    expect(groepen.teLaat.map((t) => t.id)).toEqual(['belasting'])
    expect(groepen.ooit).toEqual([])
  })

  // De deadline is de verplichting, de datum het voornemen. Loopt het voornemen
  // uit maar staat de verplichting nog open, dan ben je niet te laat — je hebt
  // optimistisch gepland. Anders krijg je een rood alarm dat nergens op slaat.
  it('laat de deadline winnen van een verlopen geplande dag', () => {
    const groepen = groepeerTaken(
      [taak({ id: 'nog-tijd', datum: '2026-07-10', deadline: '2026-08-01' })],
      vandaag,
    )

    expect(groepen.teLaat).toEqual([])
    expect(groepen.later.map((t) => t.id)).toEqual(['nog-tijd'])
  })

  it('noemt een taak zonder dag maar mét een toekomstige deadline geen "ooit"', () => {
    const groepen = groepeerTaken([taak({ id: 'aangifte', datum: null, deadline: '2026-09-01' })], vandaag)

    expect(groepen.ooit).toEqual([])
    expect(groepen.later.map((t) => t.id)).toEqual(['aangifte'])
  })

  // De bak is de kalender, de score is de urgentie. Een taak die je op vandaag
  // zette hoort op de lijst van vandaag; dát hij te laat is, hoor je van zijn
  // score ("Deadline was gisteren"), niet van een tweede plek in de lijst.
  it('houdt een taak van vandaag met een verlopen deadline bij vandaag', () => {
    const groepen = groepeerTaken(
      [taak({ id: 'vandaag-te-laat', datum: vandaag, deadline: '2026-07-14' })],
      vandaag,
    )

    expect(groepen.vandaag.map((t) => t.id)).toEqual(['vandaag-te-laat'])
    expect(groepen.teLaat).toEqual([])
  })

  it('zet een afgevinkte taak in "gedaan", niet in zijn dagbak', () => {
    const groepen = groepeerTaken([taak({ id: 'x', datum: vandaag, klaar: true })], vandaag)

    expect(groepen.vandaag).toEqual([])
    expect(groepen.gedaan.map((t) => t.id)).toEqual(['x'])
  })

  it('toont de nieuwste afvinking eerst in "gedaan"', () => {
    // Arrange — bewust in verkeerde volgorde aangeleverd.
    const taken = [
      taak({ id: 'oud', klaar: true, klaarOp: '2026-07-14T09:00:00.000Z' }),
      taak({ id: 'nieuw', klaar: true, klaarOp: '2026-07-15T09:00:00.000Z' }),
    ]

    // Act
    const groepen = groepeerTaken(taken, vandaag)

    // Assert
    expect(groepen.gedaan.map((t) => t.id)).toEqual(['nieuw', 'oud'])
  })

  it('behandelt een dagloze bot-taak als "ooit"', () => {
    // Bot-taken komen positie-loos en soms zonder dag binnen (zie telegram/uitvoeren).
    const groepen = groepeerTaken([taak({ id: 'bot', datum: null, top3Positie: null })], vandaag)

    expect(groepen.ooit.map((t) => t.id)).toEqual(['bot'])
  })

  it('muteert de invoer niet', () => {
    const taken = [
      taak({ id: 'b', klaar: true, klaarOp: '2026-07-14T09:00:00.000Z' }),
      taak({ id: 'a', klaar: true, klaarOp: '2026-07-15T09:00:00.000Z' }),
    ]
    const kopie = [...taken]

    groepeerTaken(taken, vandaag)

    expect(taken).toEqual(kopie)
  })

  it('geeft vijf lege bakken bij geen taken', () => {
    expect(groepeerTaken([], vandaag)).toEqual({
      vandaag: [],
      teLaat: [],
      later: [],
      ooit: [],
      gedaan: [],
    })
  })
})

describe('isTop3Positie', () => {
  it('herkent alleen 1, 2 en 3', () => {
    expect(isTop3Positie(1)).toBe(true)
    expect(isTop3Positie(3)).toBe(true)
    expect(isTop3Positie(0)).toBe(false)
    expect(isTop3Positie(4)).toBe(false)
    expect(isTop3Positie('2')).toBe(false)
    expect(isTop3Positie(null)).toBe(false)
  })
})
