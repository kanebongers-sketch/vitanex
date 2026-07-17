// Tests voor de dagplanner. Wat hier bewaakt wordt is niet "vult hij de blokken
// vol" maar "verzint hij niets en verzwijgt hij niets" — een taak die zonder
// uitleg uit je plan verdwijnt is de fout die dit bestand moet voorkomen.

import { describe, expect, it } from 'vitest'
import type { VrijBlok } from '@/lib/lifeos/agenda/vrije-blokken'
import type { Taak } from '@/lib/lifeos/taken/taken'
import {
  kandidatenVoorVandaag,
  leesDagplanAntwoord,
  maakDagplan,
  naarInplanningJson,
  type NietGeplaatstReden,
} from './dagplan'

const VANDAAG = '2026-07-15'

function taak(overschrijf: Partial<Taak> = {}): Taak {
  return {
    id: 'id-1',
    titel: 'Een taak',
    notitie: null,
    klaar: false,
    klaarOp: null,
    datum: VANDAAG,
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

/** Een blok op de kalenderdag zelf, in lokale tijd — zoals `vrijeBlokken` ze levert. */
function blok(vanUur: number, totUur: number): VrijBlok {
  const startOp = new Date(2026, 6, 15, vanUur, 0, 0, 0)
  const eindOp = new Date(2026, 6, 15, totUur, 0, 0, 0)
  return {
    startOp,
    eindOp,
    minuten: Math.round((eindOp.getTime() - startOp.getTime()) / 60_000),
  }
}

function redenVan(plan: ReturnType<typeof maakDagplan>, id: string): NietGeplaatstReden | undefined {
  return plan.nietGeplaatst.find((n) => n.oordeel.taak.id === id)?.reden
}

describe('maakDagplan — nooit gokken', () => {
  // De belangrijkste test van dit bestand.
  it('plant een taak zonder tijdsinschatting NIET in, en zegt waarom', () => {
    // Arrange — impact 5, dus hij zou bovenaan staan. Maar we weten niet hoe lang.
    const taken = [taak({ id: 'onbekend', impact: 5 })]

    // Act
    const plan = maakDagplan(taken, [blok(9, 12)], { vandaagSleutel: VANDAAG })

    // Assert — geen verzonnen half uurtje.
    expect(plan.inplanningen).toEqual([])
    expect(redenVan(plan, 'onbekend')).toBe('geen-inspanning')
    expect(plan.nietGeplaatst[0]?.uitleg).toContain('tijdsinschatting')
  })

  it('laat geen taak stil verdwijnen: alles is óf ingepland óf verklaard', () => {
    // Arrange
    const taken = [
      taak({ id: 'past', impact: 5, inspanningMinuten: 60 }),
      taak({ id: 'geen-schatting', impact: 4 }),
      taak({ id: 'te-groot', impact: 3, inspanningMinuten: 240 }),
    ]

    // Act
    const plan = maakDagplan(taken, [blok(9, 11)], { vandaagSleutel: VANDAAG })

    // Assert
    const gezien = [
      ...plan.inplanningen.map((i) => i.oordeel.taak.id),
      ...plan.nietGeplaatst.map((n) => n.oordeel.taak.id),
    ]
    expect(gezien.sort()).toEqual(['geen-schatting', 'past', 'te-groot'])
  })

  it('meldt een volle dag als "geen ruimte", niet als "geen inschatting"', () => {
    const plan = maakDagplan(
      [
        taak({ id: 'eerste', impact: 5, inspanningMinuten: 60 }),
        taak({ id: 'tweede', impact: 4, inspanningMinuten: 60 }),
      ],
      [blok(9, 10)],
      { vandaagSleutel: VANDAAG },
    )

    expect(plan.inplanningen.map((i) => i.oordeel.taak.id)).toEqual(['eerste'])
    expect(redenVan(plan, 'tweede')).toBe('geen-ruimte')
  })

  it('plant niets in zonder vrije blokken, en verklaart alles', () => {
    const plan = maakDagplan([taak({ impact: 5, inspanningMinuten: 30 })], [], {
      vandaagSleutel: VANDAAG,
    })

    expect(plan.inplanningen).toEqual([])
    expect(plan.nietGeplaatst).toHaveLength(1)
    expect(plan.restMinuten).toBe(0)
  })
})

describe('maakDagplan — de volgorde', () => {
  it('geeft de top-3 het eerste blok, ook als de formule iets anders wil', () => {
    // Arrange — 'scoort-hoog' haalt 100 (impact 5 + verlopen deadline).
    const taken = [
      taak({ id: 'scoort-hoog', impact: 5, deadline: '2026-07-14', inspanningMinuten: 60 }),
      taak({ id: 'mijn-wil', top3Positie: 1, datum: VANDAAG, inspanningMinuten: 60 }),
    ]

    // Act — één blok van een uur: er kan er maar één in.
    const plan = maakDagplan(taken, [blok(9, 10)], { vandaagSleutel: VANDAAG })

    // Assert — de wil wint van het advies.
    expect(plan.inplanningen.map((i) => i.oordeel.taak.id)).toEqual(['mijn-wil'])
    expect(redenVan(plan, 'scoort-hoog')).toBe('geen-ruimte')
  })

  it('plaatst taken achter elkaar in hetzelfde blok', () => {
    const plan = maakDagplan(
      [
        taak({ id: 'a', impact: 5, inspanningMinuten: 60 }),
        taak({ id: 'b', impact: 4, inspanningMinuten: 30 }),
      ],
      [blok(9, 12)],
      { vandaagSleutel: VANDAAG },
    )

    expect(plan.inplanningen.map((i) => i.oordeel.taak.id)).toEqual(['a', 'b'])
    expect(plan.inplanningen[0]?.startOp.getHours()).toBe(9)
    expect(plan.inplanningen[1]?.startOp.getHours()).toBe(10)
    // 180 vrij - 90 gepland = 90 over.
    expect(plan.restMinuten).toBe(90)
  })

  it('vult het volgende blok als het eerste vol is', () => {
    const plan = maakDagplan(
      [
        taak({ id: 'a', impact: 5, inspanningMinuten: 60 }),
        taak({ id: 'b', impact: 4, inspanningMinuten: 60 }),
      ],
      [blok(9, 10), blok(14, 15)],
      { vandaagSleutel: VANDAAG },
    )

    expect(plan.inplanningen[0]?.startOp.getHours()).toBe(9)
    expect(plan.inplanningen[1]?.startOp.getHours()).toBe(14)
  })

  it('slaat afgevinkte taken over — die hoeven geen plek', () => {
    const plan = maakDagplan(
      [taak({ id: 'af', klaar: true, klaarOp: '2026-07-15T09:00:00.000Z', impact: 5, inspanningMinuten: 30 })],
      [blok(9, 12)],
      { vandaagSleutel: VANDAAG },
    )

    expect(plan.inplanningen).toEqual([])
    expect(plan.nietGeplaatst).toEqual([])
  })
})

describe('maakDagplan — energie', () => {
  it('weigert een zware taak bij lage energie en zegt dat ook', () => {
    // De klassieke planningsfout: diep werk inplannen als je leeg bent.
    const plan = maakDagplan(
      [taak({ id: 'diep-werk', impact: 5, inspanningMinuten: 60, energie: 'hoog' })],
      [blok(9, 12)],
      { vandaagSleutel: VANDAAG, energieNu: 'laag' },
    )

    expect(plan.inplanningen).toEqual([])
    expect(redenVan(plan, 'diep-werk')).toBe('energie')
    expect(plan.nietGeplaatst[0]?.uitleg).toContain('hoog')
  })

  it('plant zonder opgegeven energie gewoon door — niet filteren op een onbekend feit', () => {
    const plan = maakDagplan(
      [taak({ id: 'diep-werk', impact: 5, inspanningMinuten: 60, energie: 'hoog' })],
      [blok(9, 12)],
      { vandaagSleutel: VANDAAG },
    )

    expect(plan.inplanningen.map((i) => i.oordeel.taak.id)).toEqual(['diep-werk'])
  })

  it('laat een taak zonder energie-label door bij lage energie', () => {
    const plan = maakDagplan(
      [taak({ id: 'geen-label', impact: 5, inspanningMinuten: 60 })],
      [blok(9, 12)],
      { vandaagSleutel: VANDAAG, energieNu: 'laag' },
    )

    expect(plan.inplanningen.map((i) => i.oordeel.taak.id)).toEqual(['geen-label'])
  })

  it('meldt "geen inschatting" vóór "verkeerde energie" — dat weten we eerder', () => {
    const plan = maakDagplan(
      [taak({ id: 'x', impact: 5, energie: 'hoog' })],
      [blok(9, 12)],
      { vandaagSleutel: VANDAAG, energieNu: 'laag' },
    )

    expect(redenVan(plan, 'x')).toBe('geen-inspanning')
  })
})

describe('kandidatenVoorVandaag', () => {
  it('neemt vandaag, te laat en ooit mee — maar niet wat je voor later plande', () => {
    // Arrange
    const taken = [
      taak({ id: 'vandaag', datum: VANDAAG }),
      taak({ id: 'te-laat', datum: '2026-07-10' }),
      taak({ id: 'ooit', datum: null }),
      taak({ id: 'volgende-week', datum: '2026-07-22' }),
    ]

    // Act
    const kandidaten = kandidatenVoorVandaag(taken, VANDAAG)

    // Assert — 'volgende-week' is een beslissing die je al nam; die draait de
    // planner niet stilletjes terug.
    expect(kandidaten.map((t) => t.id).sort()).toEqual(['ooit', 'te-laat', 'vandaag'])
  })

  it('laat afgevinkte taken buiten beschouwing', () => {
    const kandidaten = kandidatenVoorVandaag(
      [taak({ id: 'af', klaar: true, klaarOp: '2026-07-15T09:00:00.000Z' })],
      VANDAAG,
    )

    expect(kandidaten).toEqual([])
  })
})

describe('leesDagplanAntwoord — systeemgrens', () => {
  it('leest een geldig plan', () => {
    // Arrange
    const plan = maakDagplan(
      [taak({ id: 'a', impact: 5, inspanningMinuten: 60 })],
      [blok(9, 12)],
      { vandaagSleutel: VANDAAG },
    )
    const antwoord = {
      gekoppeld: true,
      dag: VANDAAG,
      inplanningen: plan.inplanningen.map(naarInplanningJson),
      nietGeplaatst: [],
      restMinuten: plan.restMinuten,
    }

    // Act
    const gelezen = leesDagplanAntwoord(antwoord)

    // Assert
    expect(gelezen).not.toBeNull()
    if (gelezen && gelezen.gekoppeld) {
      expect(gelezen.inplanningen[0]?.taak.id).toBe('a')
      expect(gelezen.restMinuten).toBe(120)
    }
  })

  // Zonder agenda weten we niet welke tijd je vrij hebt. "Geen ruimte" zou een
  // leugen zijn en "de hele dag vrij" ook — dus een eigen tak.
  it('leest "niet gekoppeld" als eigen tak, niet als leeg plan', () => {
    expect(leesDagplanAntwoord({ gekoppeld: false })).toEqual({ gekoppeld: false })
  })

  it('weigert een antwoord dat niet klopt in plaats van het half te geloven', () => {
    expect(leesDagplanAntwoord(null)).toBeNull()
    expect(leesDagplanAntwoord({ gekoppeld: true })).toBeNull()
    expect(
      leesDagplanAntwoord({
        gekoppeld: true,
        dag: VANDAAG,
        inplanningen: [{ taak: { titel: 'kapot' } }],
        nietGeplaatst: [],
        restMinuten: 0,
      }),
    ).toBeNull()
    expect(
      leesDagplanAntwoord({
        gekoppeld: true,
        dag: VANDAAG,
        inplanningen: [],
        nietGeplaatst: [],
        restMinuten: 'veel',
      }),
    ).toBeNull()
  })

  it('accepteert een score van null — dat is een geldig "ik weet het niet"', () => {
    const plan = maakDagplan(
      [taak({ id: 'zonder-oordeel', inspanningMinuten: 30 })],
      [blok(9, 12)],
      { vandaagSleutel: VANDAAG },
    )
    const gelezen = leesDagplanAntwoord({
      gekoppeld: true,
      dag: VANDAAG,
      inplanningen: plan.inplanningen.map(naarInplanningJson),
      nietGeplaatst: [],
      restMinuten: plan.restMinuten,
    })

    expect(gelezen).not.toBeNull()
    if (gelezen && gelezen.gekoppeld) expect(gelezen.inplanningen[0]?.score).toBeNull()
  })
})
