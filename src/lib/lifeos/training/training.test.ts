import { describe, it, expect } from 'vitest'
import {
  leesNieuweTraining,
  leesTrainingWijziging,
  trainingVanRij,
  trainingenVanRijen,
  leesTrainingenAntwoord,
  leesTrainingAntwoord,
  gedaan,
  gepland,
  trainingLabel,
  isRpe,
  type Training,
} from './training'

const DATUM = '2026-07-15'

function rij(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'a1',
    datum: DATUM,
    soort: 'kracht',
    omschrijving: null,
    duur_minuten: null,
    rpe: null,
    actieve_minuten: null,
    gepland: false,
    aangemaakt_op: '2026-07-15T18:00:00.000Z',
    ...over,
  }
}

function training(over: Partial<Training> = {}): Training {
  return {
    id: 'a1',
    datum: DATUM,
    soort: 'kracht',
    omschrijving: null,
    duurMinuten: null,
    rpe: null,
    actieveMinuten: null,
    gepland: false,
    aangemaaktOp: '2026-07-15T18:00:00.000Z',
    ...over,
  }
}

describe('leesNieuweTraining — het minimum', () => {
  it('accepteert een training met alleen een dag en een soort', () => {
    // Arrange — soms log je alleen dát je trainde. Dat moet kunnen.
    const body = { datum: DATUM, soort: 'kracht' }

    // Act
    const uitkomst = leesNieuweTraining(body)

    // Assert — een verzonnen RPE is erger dan geen RPE.
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.waarde.rpe).toBeNull()
    expect(uitkomst.waarde.duurMinuten).toBeNull()
    expect(uitkomst.waarde.actieveMinuten).toBeNull()
    expect(uitkomst.waarde.gepland).toBe(false)
  })

  it('accepteert een volledige log', () => {
    // Arrange
    const body = {
      datum: DATUM,
      soort: 'cardio',
      omschrijving: '  Tempoloop  ',
      duurMinuten: 45,
      rpe: 7,
      actieveMinuten: 41,
    }

    // Act
    const uitkomst = leesNieuweTraining(body)

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.waarde.omschrijving).toBe('Tempoloop')
    expect(uitkomst.waarde.rpe).toBe(7)
    expect(uitkomst.waarde.actieveMinuten).toBe(41)
  })

  it('accepteert een gemeten nul actieve minuten', () => {
    // Arrange — 0 is een meting, geen ontbrekende waarde. Dit is de enige weg
    // waarlangs Vita's beweging-regel ooit iets te zien krijgt.
    const body = { datum: DATUM, soort: 'mobiliteit', actieveMinuten: 0 }

    // Act
    const uitkomst = leesNieuweTraining(body)

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.waarde.actieveMinuten).toBe(0)
  })

  it('weigert een duur van 0 — dat is geen training', () => {
    // Arrange
    const uitkomst = leesNieuweTraining({ datum: DATUM, soort: 'kracht', duurMinuten: 0 })

    // Act + Assert
    expect(uitkomst.ok).toBe(false)
  })
})

describe('leesNieuweTraining — afwijzen', () => {
  it('weigert een onbekende soort', () => {
    expect(leesNieuweTraining({ datum: DATUM, soort: 'zwemmen' }).ok).toBe(false)
  })

  it('weigert een ontbrekende of onmogelijke datum', () => {
    expect(leesNieuweTraining({ soort: 'kracht' }).ok).toBe(false)
    expect(leesNieuweTraining({ datum: '15-07-2026', soort: 'kracht' }).ok).toBe(false)
    expect(leesNieuweTraining({ datum: '2026-02-31', soort: 'kracht' }).ok).toBe(false)
  })

  it('weigert een RPE buiten 1–10 en een gebroken RPE', () => {
    expect(leesNieuweTraining({ datum: DATUM, soort: 'kracht', rpe: 0 }).ok).toBe(false)
    expect(leesNieuweTraining({ datum: DATUM, soort: 'kracht', rpe: 11 }).ok).toBe(false)
    expect(leesNieuweTraining({ datum: DATUM, soort: 'kracht', rpe: 7.5 }).ok).toBe(false)
    expect(leesNieuweTraining({ datum: DATUM, soort: 'kracht', rpe: '7' }).ok).toBe(false)
  })

  it('weigert negatieve actieve minuten', () => {
    expect(leesNieuweTraining({ datum: DATUM, soort: 'kracht', actieveMinuten: -1 }).ok).toBe(false)
  })

  it('weigert onzin als body', () => {
    expect(leesNieuweTraining(null).ok).toBe(false)
    expect(leesNieuweTraining('kracht').ok).toBe(false)
    expect(leesNieuweTraining([{ datum: DATUM }]).ok).toBe(false)
  })
})

describe('leesNieuweTraining — gepland draagt geen meting', () => {
  it('accepteert een kaal voornemen', () => {
    // Arrange
    const uitkomst = leesNieuweTraining({
      datum: DATUM,
      soort: 'kracht',
      omschrijving: 'Push A',
      gepland: true,
    })

    // Act + Assert
    expect(uitkomst.ok).toBe(true)
  })

  it('weigert een voornemen met een RPE — die voel je pas achteraf', () => {
    // Arrange
    const uitkomst = leesNieuweTraining({ datum: DATUM, soort: 'kracht', gepland: true, rpe: 7 })

    // Assert — dit is de hele gepland/gedaan-grens in één test. Een RPE op een
    // plan is een cijfer dat op een meting lijkt maar er geen is.
    expect(uitkomst.ok).toBe(false)
    if (uitkomst.ok) return
    expect(uitkomst.fout).toContain('achteraf')
  })

  it('weigert een voornemen met actieve minuten', () => {
    const uitkomst = leesNieuweTraining({
      datum: DATUM,
      soort: 'cardio',
      gepland: true,
      actieveMinuten: 30,
    })
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert een voornemen met een duur', () => {
    const uitkomst = leesNieuweTraining({
      datum: DATUM,
      soort: 'cardio',
      gepland: true,
      duurMinuten: 45,
    })
    expect(uitkomst.ok).toBe(false)
  })
})

describe('leesTrainingWijziging', () => {
  it('wijzigt alleen wat je meestuurt', () => {
    // Arrange — een geplande training afronden: dit is de kernflow van de kaart.
    const uitkomst = leesTrainingWijziging({ gepland: false, rpe: 8 })

    // Act + Assert
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.waarde).toEqual({ gepland: false, rpe: 8 })
    expect('datum' in uitkomst.waarde).toBe(false)
  })

  it('kan een RPE weer wissen', () => {
    // Arrange — je vulde 8 in en weet het eigenlijk niet meer. Wissen moet kunnen;
    // een verkeerde RPE is erger dan geen RPE.
    const uitkomst = leesTrainingWijziging({ rpe: null })

    // Act + Assert
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.waarde.rpe).toBeNull()
    expect('rpe' in uitkomst.waarde).toBe(true)
  })

  it('weigert een lege wijziging', () => {
    expect(leesTrainingWijziging({}).ok).toBe(false)
  })

  it('weigert een wijziging die zichzelf tegenspreekt', () => {
    // Arrange — terug naar "gepland" mét een RPE erbij.
    const uitkomst = leesTrainingWijziging({ gepland: true, rpe: 6 })

    // Act + Assert
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert een onbekende soort', () => {
    expect(leesTrainingWijziging({ soort: 'zwemmen' }).ok).toBe(false)
  })
})

describe('trainingVanRij — systeemgrens database', () => {
  it('leest een normale rij', () => {
    // Arrange + Act
    const t = trainingVanRij(rij({ rpe: 7, duur_minuten: 60, actieve_minuten: 22 }))

    // Assert
    expect(t).not.toBeNull()
    expect(t?.rpe).toBe(7)
    expect(t?.duurMinuten).toBe(60)
    expect(t?.actieveMinuten).toBe(22)
    expect(t?.gepland).toBe(false)
  })

  it('houdt een gemeten nul heel', () => {
    // Arrange + Act
    const t = trainingVanRij(rij({ actieve_minuten: 0 }))

    // Assert — een narrower die 0 naar null gooit, sloopt de beweging-bron.
    expect(t?.actieveMinuten).toBe(0)
  })

  it('leest een onmogelijke RPE als niet ingevuld', () => {
    // Arrange — de DB verbiedt dit, maar de grens vertrouwt de DB niet.
    expect(trainingVanRij(rij({ rpe: 14 }))?.rpe).toBeNull()
    expect(trainingVanRij(rij({ rpe: 'zwaar' }))?.rpe).toBeNull()
  })

  it('weigert een rij met een onbekende soort', () => {
    // Arrange + Act + Assert — geen stille terugval op 'anders': dan zou een
    // schema-wijziging als geldige training binnenkomen.
    expect(trainingVanRij(rij({ soort: 'zwemmen' }))).toBeNull()
  })

  it('weigert een rij zonder id of datum', () => {
    expect(trainingVanRij(rij({ id: null }))).toBeNull()
    expect(trainingVanRij(rij({ datum: null }))).toBeNull()
  })

  it('snijdt een tijdcomponent van de datum', () => {
    expect(trainingVanRij(rij({ datum: `${DATUM}T00:00:00+02:00` }))?.datum).toBe(DATUM)
  })

  it('laat onleesbare rijen uit een lijst vallen', () => {
    // Arrange
    const rijen = [rij(), rij({ soort: 'zwemmen' }), rij({ id: 'b2' })]

    // Act
    const trainingen = trainingenVanRijen(rijen)

    // Assert
    expect(trainingen).toHaveLength(2)
  })
})

describe('leesTrainingenAntwoord — systeemgrens API', () => {
  it('leest een lijst', () => {
    // Arrange
    const ruw = {
      trainingen: [
        {
          id: 'a1',
          datum: DATUM,
          soort: 'cardio',
          omschrijving: 'Duurloop',
          duurMinuten: 50,
          rpe: 5,
          actieveMinuten: 48,
          gepland: false,
          aangemaaktOp: '2026-07-15T18:00:00.000Z',
        },
      ],
    }

    // Act
    const trainingen = leesTrainingenAntwoord(ruw)

    // Assert
    expect(trainingen).toHaveLength(1)
    expect(trainingen?.[0]?.omschrijving).toBe('Duurloop')
  })

  it('geeft een lege lijst terug bij een lege dag', () => {
    // Arrange + Act + Assert — leeg is een geldig antwoord, geen fout.
    expect(leesTrainingenAntwoord({ trainingen: [] })).toEqual([])
  })

  it('weigert een antwoord met een kapotte rij erin', () => {
    // Arrange — één onleesbare rij maakt het hele antwoord verdacht: liever een
    // nette fout dan een lijst die stilletjes korter is dan wat de server stuurde.
    const ruw = { trainingen: [{ id: 'a1' }] }

    // Act + Assert
    expect(leesTrainingenAntwoord(ruw)).toBeNull()
  })

  it('weigert een antwoord zonder trainingen-veld', () => {
    expect(leesTrainingenAntwoord({})).toBeNull()
    expect(leesTrainingenAntwoord(null)).toBeNull()
  })

  it('leest het antwoord van POST en PATCH', () => {
    // Arrange
    const ruw = {
      training: {
        id: 'a1',
        datum: DATUM,
        soort: 'kracht',
        gepland: false,
        aangemaaktOp: '2026-07-15T18:00:00.000Z',
      },
    }

    // Act + Assert
    expect(leesTrainingAntwoord(ruw)?.id).toBe('a1')
    expect(leesTrainingAntwoord({})).toBeNull()
  })
})

describe('afgeleide weergave', () => {
  it('scheidt voornemens van metingen', () => {
    // Arrange
    const lijst = [training({ id: 'a', gepland: true }), training({ id: 'b', gepland: false })]

    // Act + Assert
    expect(gedaan(lijst).map((t) => t.id)).toEqual(['b'])
    expect(gepland(lijst).map((t) => t.id)).toEqual(['a'])
  })

  it('schrijft een label met en zonder omschrijving', () => {
    expect(trainingLabel(training())).toBe('Kracht')
    expect(trainingLabel(training({ omschrijving: 'Push A' }))).toBe('Kracht — Push A')
  })
})

describe('isRpe', () => {
  it('accepteert 1 tot en met 10', () => {
    expect(isRpe(1)).toBe(true)
    expect(isRpe(10)).toBe(true)
  })

  it('weigert alles daarbuiten', () => {
    expect(isRpe(0)).toBe(false)
    expect(isRpe(11)).toBe(false)
    expect(isRpe(7.5)).toBe(false)
    expect(isRpe('7')).toBe(false)
    expect(isRpe(null)).toBe(false)
  })
})
