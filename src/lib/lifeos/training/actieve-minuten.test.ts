import { describe, it, expect } from 'vitest'
import {
  actieveMinutenOpDag,
  actieveMinutenPerDag,
  leesTrainingLogRij,
  type TrainingLog,
} from './actieve-minuten'

// De dagen komen erín — nooit een verborgen Date.now(). Zie focus.test.ts.
const MAANDAG = '2026-07-13'
const DINSDAG = '2026-07-14'
const WOENSDAG = '2026-07-15'

/** Een gedane training met gemeten actieve minuten, tenzij je het anders zegt. */
function log(over: Partial<TrainingLog> = {}): TrainingLog {
  return { datum: MAANDAG, gepland: false, actieveMinuten: 30, ...over }
}

describe('actieveMinutenOpDag — het verschil tussen null en 0', () => {
  it('geeft null bij geen enkele log — dat is niet "niet bewogen"', () => {
    // Arrange — een dag waarop Kane niets logde. Misschien trainde hij, misschien
    // niet. Wij weten het niet, en dat is het antwoord.
    const trainingen: TrainingLog[] = []

    // Act
    const uitkomst = actieveMinutenOpDag(trainingen, MAANDAG)

    // Assert — DE regel van dit bestand. Een 0 hier laat Vita Kane beschuldigen
    // van luiheid op een dag dat hij gewoon niets logde.
    expect(uitkomst).toBeNull()
    expect(uitkomst).not.toBe(0)
  })

  it('geeft 0 bij een écht gemeten nul', () => {
    // Arrange — er staat een meting, en die meting zegt nul.
    const trainingen = [log({ actieveMinuten: 0 })]

    // Act
    const uitkomst = actieveMinutenOpDag(trainingen, MAANDAG)

    // Assert — dit is de enige weg naar een 0. Alleen hierop mag Vita's
    // beweging-regel vuren.
    expect(uitkomst).toBe(0)
    expect(uitkomst).not.toBeNull()
  })

  it('geeft de gemeten minuten van één training', () => {
    // Arrange
    const trainingen = [log({ actieveMinuten: 42 })]

    // Act + Assert
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBe(42)
  })

  it('telt meerdere gedane trainingen op één dag op', () => {
    // Arrange — ochtendloop en avondsessie.
    const trainingen = [log({ actieveMinuten: 25 }), log({ actieveMinuten: 35 })]

    // Act + Assert
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBe(60)
  })

  it('telt twee gemeten nullen op tot 0, niet tot null', () => {
    // Arrange — twee metingen die allebei nul zeggen. We weten het dus dubbel.
    const trainingen = [log({ actieveMinuten: 0 }), log({ actieveMinuten: 0 })]

    // Act + Assert
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBe(0)
  })
})

describe('actieveMinutenOpDag — onvolledige metingen', () => {
  it('geeft null als de enige log geen actieve minuten heeft', () => {
    // Arrange — "ik trainde vandaag" zonder minuten. Dat is een echte log: je
    // wéét dat er bewogen is, alleen niet hoeveel.
    const trainingen = [log({ actieveMinuten: null })]

    // Act
    const uitkomst = actieveMinutenOpDag(trainingen, MAANDAG)

    // Assert — beslist geen 0: er is juist wél getraind.
    expect(uitkomst).toBeNull()
  })

  it('geeft null als één van de trainingen zijn minuten mist — geen deeltotaal', () => {
    // Arrange — 45 gemeten, plus een wandeling zonder minuten.
    const trainingen = [log({ actieveMinuten: 45 }), log({ actieveMinuten: null })]

    // Act
    const uitkomst = actieveMinutenOpDag(trainingen, MAANDAG)

    // Assert — 45 teruggeven zou een DEELtotaal als DAGtotaal presenteren.
    // Het echte antwoord is "meer dan 45, hoeveel weten we niet" — en dat is
    // geen getal. Twijfel levert stilte op, geen advies.
    expect(uitkomst).toBeNull()
    expect(uitkomst).not.toBe(45)
  })

  it('laat een gemeten 0 náást een onbekende niet als dagnul gelden', () => {
    // Arrange — dit is het gevaarlijkste geval van allemaal: de mobiliteit-sessie
    // mat 0 actieve minuten, de sportwedstrijd mat niets.
    const trainingen = [log({ actieveMinuten: 0 }), log({ actieveMinuten: null })]

    // Act
    const uitkomst = actieveMinutenOpDag(trainingen, MAANDAG)

    // Assert — 0 zou hier de beweging-regel laten vuren op een dag met een
    // ongemeten wedstrijd erin. Precies de valse beschuldiging.
    expect(uitkomst).toBeNull()
  })
})

describe('actieveMinutenOpDag — gepland telt niet mee', () => {
  it('geeft null als er alleen een voornemen staat', () => {
    // Arrange — je bent van plan te trainen. Dat is geen meting.
    const trainingen = [log({ gepland: true, actieveMinuten: null })]

    // Act
    const uitkomst = actieveMinutenOpDag(trainingen, MAANDAG)

    // Assert — een agenda is geen logboek.
    expect(uitkomst).toBeNull()
  })

  it('negeert minuten die op een geplande rij zouden staan', () => {
    // Arrange — migratie 070 verbiedt dit met een check-constraint, maar deze
    // functie mag daar niet op vertrouwen: een tweede sluiting van dezelfde deur.
    const trainingen = [log({ gepland: true, actieveMinuten: 90 })]

    // Act
    const uitkomst = actieveMinutenOpDag(trainingen, MAANDAG)

    // Assert — een voornemen van 90 minuten is nul bewijs van beweging.
    expect(uitkomst).toBeNull()
    expect(uitkomst).not.toBe(90)
  })

  it('telt alleen de gedane training als er ook een plan staat', () => {
    // Arrange — je plande cardio en dééd kracht.
    const trainingen = [
      log({ gepland: true, actieveMinuten: null }),
      log({ gepland: false, actieveMinuten: 20 }),
    ]

    // Act + Assert
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBe(20)
  })
})

describe('actieveMinutenOpDag — dagen uit elkaar houden', () => {
  it('kijkt alleen naar de gevraagde dag', () => {
    // Arrange
    const trainingen = [
      log({ datum: MAANDAG, actieveMinuten: 30 }),
      log({ datum: DINSDAG, actieveMinuten: 60 }),
    ]

    // Act + Assert
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBe(30)
    expect(actieveMinutenOpDag(trainingen, DINSDAG)).toBe(60)
  })

  it('geeft null voor een dag zonder logs, ook al zijn er andere dagen mét', () => {
    // Arrange — dinsdag getraind, woensdag niets gelogd.
    const trainingen = [log({ datum: DINSDAG, actieveMinuten: 60 })]

    // Act
    const uitkomst = actieveMinutenOpDag(trainingen, WOENSDAG)

    // Assert — de ene dag zegt niets over de andere. Geen interpolatie, geen
    // "hij traint meestal, dus vast weer" en geen 0.
    expect(uitkomst).toBeNull()
  })

  it('leest een datum met tijdcomponent als dezelfde dag', () => {
    // Arrange — vangnet voor het geval de kolom ooit een timestamp wordt.
    const trainingen = [log({ datum: `${MAANDAG}T00:00:00.000Z`, actieveMinuten: 15 })]

    // Act + Assert — een stille mismatch zou alles op null zetten en de bron
    // onzichtbaar breken.
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBe(15)
  })
})

describe('actieveMinutenOpDag — kapotte invoer', () => {
  it('behandelt een negatief aantal minuten als niet gemeten', () => {
    // Arrange — de database verbiedt dit (check >= 0), dus dit is een bron die
    // stuk is. Een kapotte bron weet niets.
    const trainingen = [log({ actieveMinuten: -10 })]

    // Act + Assert — géén 0: dat zou van een bug een verwijt maken.
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBeNull()
  })

  it('behandelt NaN als niet gemeten', () => {
    // Arrange
    const trainingen = [log({ actieveMinuten: Number.NaN })]

    // Act + Assert
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBeNull()
  })

  it('behandelt Infinity als niet gemeten', () => {
    // Arrange
    const trainingen = [log({ actieveMinuten: Number.POSITIVE_INFINITY })]

    // Act + Assert
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBeNull()
  })

  it('laat een kapotte log de rest van de dag niet redden', () => {
    // Arrange — 30 gemeten, en één rij met onzin.
    const trainingen = [log({ actieveMinuten: 30 }), log({ actieveMinuten: Number.NaN })]

    // Act + Assert — zelfde regel als bij een ontbrekende meting: het dagtotaal
    // is onbekend.
    expect(actieveMinutenOpDag(trainingen, MAANDAG)).toBeNull()
  })
})

describe('actieveMinutenPerDag', () => {
  it('geeft elke gevraagde dag terug, ook de dagen zonder logs', () => {
    // Arrange
    const trainingen = [log({ datum: DINSDAG, actieveMinuten: 60 })]

    // Act
    const perDag = actieveMinutenPerDag(trainingen, [MAANDAG, DINSDAG, WOENSDAG])

    // Assert — een ontbrekende sleutel zou de aanroeper dwingen zelf te bedenken
    // wat afwezigheid betekent. Die beslissing hoort hier.
    expect(perDag.size).toBe(3)
    expect(perDag.has(MAANDAG)).toBe(true)
    expect(perDag.get(MAANDAG)).toBeNull()
    expect(perDag.get(DINSDAG)).toBe(60)
    expect(perDag.get(WOENSDAG)).toBeNull()
  })

  it('geeft een lege map bij nul gevraagde dagen', () => {
    // Arrange + Act
    const perDag = actieveMinutenPerDag([log()], [])

    // Assert
    expect(perDag.size).toBe(0)
  })

  it('geeft overal null bij een lege logboek — geen enkele 0', () => {
    // Arrange — de realistische stand van vandaag: Kane logt nog niets.
    const dagen = [MAANDAG, DINSDAG, WOENSDAG]

    // Act
    const perDag = actieveMinutenPerDag([], dagen)

    // Assert — Vita's beweging-regel eist vijf gemeten nullen. Met een leeg
    // logboek komt hij er dus per constructie nooit. Dat is het eerlijke gedrag.
    expect([...perDag.values()].every((v) => v === null)).toBe(true)
    expect([...perDag.values()].some((v) => v === 0)).toBe(false)
  })

  it('houdt een gemeten nul en een lege dag uit elkaar in dezelfde map', () => {
    // Arrange — dit is de hele module in één test.
    const trainingen = [log({ datum: MAANDAG, actieveMinuten: 0 })]

    // Act
    const perDag = actieveMinutenPerDag(trainingen, [MAANDAG, DINSDAG])

    // Assert
    expect(perDag.get(MAANDAG)).toBe(0) // gemeten: het was niets
    expect(perDag.get(DINSDAG)).toBeNull() // onbekend: we weten het niet
  })

  it('normaliseert de gevraagde dagsleutel', () => {
    // Arrange
    const trainingen = [log({ datum: MAANDAG, actieveMinuten: 12 })]

    // Act
    const perDag = actieveMinutenPerDag(trainingen, [`${MAANDAG}T12:00:00Z`])

    // Assert — de sleutel in de map is de genormaliseerde dag, zodat
    // `perDag.get(dag.datum)` in context.ts raak is.
    expect(perDag.get(MAANDAG)).toBe(12)
  })
})

describe('leesTrainingLogRij — systeemgrens', () => {
  it('leest een normale rij uit de database', () => {
    // Arrange — zoals PostgREST 'm teruggeeft.
    const rij = { datum: '2026-07-13', gepland: false, actieve_minuten: 45 }

    // Act
    const log = leesTrainingLogRij(rij)

    // Assert
    expect(log).toEqual({ datum: MAANDAG, gepland: false, actieveMinuten: 45 })
  })

  it('leest een gemeten nul als 0, niet als null', () => {
    // Arrange
    const rij = { datum: '2026-07-13', gepland: false, actieve_minuten: 0 }

    // Act
    const log = leesTrainingLogRij(rij)

    // Assert — de narrower mag de meting niet weggooien; 0 is een antwoord.
    expect(log?.actieveMinuten).toBe(0)
  })

  it('leest een ontbrekende meting als null', () => {
    // Arrange
    const rij = { datum: '2026-07-13', gepland: false, actieve_minuten: null }

    // Act + Assert
    expect(leesTrainingLogRij(rij)?.actieveMinuten).toBeNull()
  })

  it('leest onzin in de minuten-kolom als null, niet als 0', () => {
    // Arrange — kolom van type veranderd, of een bug bovenstrooms.
    const rij = { datum: '2026-07-13', gepland: false, actieve_minuten: 'veel' }

    // Act + Assert
    expect(leesTrainingLogRij(rij)?.actieveMinuten).toBeNull()
  })

  it('behandelt een onleesbare gepland-vlag als voornemen', () => {
    // Arrange — de kolom is niet meegeselecteerd, of geeft onzin.
    const rij = { datum: '2026-07-13', actieve_minuten: 90 }

    // Act
    const log = leesTrainingLogRij(rij)

    // Assert — dit valt de veilige kant op: een onleesbare vlag mag nooit als
    // meting binnenkomen, want dan telt een plan mee als beweging.
    expect(log?.gepland).toBe(true)
    expect(actieveMinutenOpDag(log ? [log] : [], MAANDAG)).toBeNull()
  })

  it('weigert een rij zonder bruikbare datum', () => {
    // Arrange + Act + Assert — zonder dag kan de meting nergens bij horen.
    expect(leesTrainingLogRij({ gepland: false, actieve_minuten: 30 })).toBeNull()
    expect(leesTrainingLogRij({ datum: 42, gepland: false })).toBeNull()
    expect(leesTrainingLogRij({ datum: '2026-07', gepland: false })).toBeNull()
  })

  it('weigert alles wat geen object is', () => {
    // Arrange + Act + Assert
    expect(leesTrainingLogRij(null)).toBeNull()
    expect(leesTrainingLogRij('training')).toBeNull()
    expect(leesTrainingLogRij([{ datum: '2026-07-13' }])).toBeNull()
  })
})

describe('de keten naar Vita — rijen in, dagwaarden uit', () => {
  it('levert een gemeten nul door tot in de map', () => {
    // Arrange — de volledige weg die `vita/context.ts` straks aflegt.
    const rijen: unknown[] = [
      { datum: '2026-07-13', gepland: false, actieve_minuten: 0 },
      { datum: '2026-07-14', gepland: true, actieve_minuten: null },
    ]

    // Act
    const logs = rijen
      .map(leesTrainingLogRij)
      .filter((l): l is TrainingLog => l !== null)
    const perDag = actieveMinutenPerDag(logs, [MAANDAG, DINSDAG])

    // Assert — maandag: gemeten nul. Dinsdag: alleen een plan, dus onbekend.
    expect(perDag.get(MAANDAG)).toBe(0)
    expect(perDag.get(DINSDAG)).toBeNull()
  })

  it('geeft null voor elke dag als de tabel leeg is', () => {
    // Arrange
    const dagen = [MAANDAG, DINSDAG, WOENSDAG]

    // Act
    const perDag = actieveMinutenPerDag([], dagen)

    // Assert — een lege tabel is geen bewijs van stilzitten.
    expect(dagen.every((d) => perDag.get(d) === null)).toBe(true)
  })
})
