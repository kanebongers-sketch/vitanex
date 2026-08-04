import { describe, it, expect } from 'vitest'
import {
  bepaalAdvies,
  rondAfOpStap,
  voorgesteldGewicht,
  type GelogdeSet,
  type OefeningDoel,
} from './progressie'

// De kop van progressie.ts belooft twee dingen, en dit bestand houdt ze tegen
// het licht:
//
//   1. Een advies bevat nooit een verzonnen getal. Zonder geschiedenis is het
//      antwoord `onbekend` — geen gegokt startgewicht.
//   2. Double progression: eerst reps binnen de bandbreedte, dan pas gewicht.
//
// Alles komt als argument binnen (geen klok, geen database), dus elke test hier
// is een pure invoer→uitvoer-vergelijking.

/** Een compound-doel: 3×8-10, stappen van 2,5 kg, RIR-band 1-3. */
function doel(over: Partial<OefeningDoel> = {}): OefeningDoel {
  return { sets: 3, repMin: 8, repMax: 10, stap: 2.5, rirDoel: [1, 3], ...over }
}

/** Een gemaakte set op de bovengrens met marge, tenzij je het anders zegt. */
function set(over: Partial<GelogdeSet> = {}): GelogdeSet {
  return { herhalingen: 10, gewichtKg: 120, rir: 2, ...over }
}

/** `aantal` identieke sets. Handig om een hele sessie in één regel te zetten. */
function sets(aantal: number, over: Partial<GelogdeSet> = {}): GelogdeSet[] {
  return Array.from({ length: aantal }, () => set(over))
}

describe('bepaalAdvies — geen bruikbare geschiedenis blijft onbekend', () => {
  it('geeft onbekend bij een lege lijst', () => {
    // Arrange — de eerste keer dat deze oefening in het blok staat.
    const vorige: GelogdeSet[] = []

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — DE regel van dit bestand. Een gegokte 40 kg zou een plausibel
    // cijfer zonder bron zijn, en dat is precies wat dit project nergens doet.
    expect(advies.soort).toBe('onbekend')
    expect(voorgesteldGewicht(advies)).toBeNull()
  })

  it('noemt in de uitleg de bandbreedte, maar nóóit een gewicht', () => {
    // Arrange + Act
    const advies = bepaalAdvies(doel({ repMin: 6, repMax: 8 }), [])

    // Assert — de rep-bandbreedte komt uit het programma en is dus echt; een
    // kilo-getal zou hier verzonnen zijn.
    expect(advies.uitleg).toContain('6-8')
    expect(advies.uitleg).not.toMatch(/\d+(,\d+)?\s*kg/)
  })

  it('geeft onbekend als geen enkele set een gewicht heeft', () => {
    // Arrange — reps ingevuld, gewicht vergeten.
    const vorige = sets(3, { gewichtKg: null })

    // Act + Assert — een halve meting is geen meting.
    expect(bepaalAdvies(doel(), vorige).soort).toBe('onbekend')
  })

  it('geeft onbekend als geen enkele set reps heeft', () => {
    // Arrange — gewicht ingevuld, reps vergeten.
    const vorige = sets(3, { herhalingen: null })

    // Act + Assert
    expect(bepaalAdvies(doel(), vorige).soort).toBe('onbekend')
  })

  it('geeft onbekend bij nul herhalingen — een niet getild gewicht is geen werkgewicht', () => {
    // Arrange — de stang geladen op 140 en er geen rep uit gekregen.
    const vorige = [set({ herhalingen: 0, gewichtKg: 140 })]

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — 140 als werkgewicht overnemen zou een mislukte poging tot
    // prestatie promoveren.
    expect(advies.soort).toBe('onbekend')
    expect(voorgesteldGewicht(advies)).toBeNull()
  })

  it('geeft onbekend bij kapotte getallen', () => {
    // Arrange — NaN/Infinity uit een stukke bron. Een kapotte bron weet niets.
    expect(bepaalAdvies(doel(), [set({ herhalingen: Number.NaN })]).soort).toBe('onbekend')
    expect(bepaalAdvies(doel(), [set({ gewichtKg: Number.POSITIVE_INFINITY })]).soort).toBe(
      'onbekend',
    )
    expect(bepaalAdvies(doel(), [set({ gewichtKg: -20 })]).soort).toBe('onbekend')
  })
})

describe('bepaalAdvies — verhoog: alle sets op de bovengrens', () => {
  it('verhoogt met exact één stap als alle sets repMax halen binnen het RIR-doel', () => {
    // Arrange — 3×10 op 120 kg met RIR 2: bovengrens gehaald, marge over.
    const vorige = sets(3, { herhalingen: 10, gewichtKg: 120, rir: 2 })

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — exact één stap, niet twee en geen percentage.
    expect(advies.soort).toBe('verhoog')
    expect(voorgesteldGewicht(advies)).toBe(122.5)
    expect((voorgesteldGewicht(advies) ?? 0) - 120).toBe(2.5)
  })

  it('schrijft de uitleg in de taal van de gebruiker', () => {
    // Arrange
    const vorige = sets(3)

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — NL-notatie met komma, geen jargon, en het gewicht dat hij zelf
    // tilde staat erin zodat hij het advies kan controleren.
    expect(advies.uitleg).toBe('3×10 gehaald op 120 kg — ga naar 122,5 kg.')
  })

  it('gebruikt de stap van de oefening, niet een vaste 2,5', () => {
    // Arrange — kleine isolatie (1.25) en een been-machine (5).
    const vorige = sets(3, { gewichtKg: 20 })

    // Act + Assert
    expect(voorgesteldGewicht(bepaalAdvies(doel({ stap: 1.25 }), vorige))).toBe(21.25)
    expect(voorgesteldGewicht(bepaalAdvies(doel({ stap: 5 }), vorige))).toBe(25)
  })

  it('verhoogt ook als er méér dan repMax gehaald is', () => {
    // Arrange — 11/10/12 met repMax 10: de bandbreedte is ruim voorbij.
    const vorige = [
      set({ herhalingen: 11 }),
      set({ herhalingen: 10 }),
      set({ herhalingen: 12 }),
    ]

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — de reps staan als losse getallen in de uitleg; "3×10" zou hier
    // onwaar zijn.
    expect(advies.soort).toBe('verhoog')
    expect(advies.uitleg).toBe('11/10/12 gehaald op 120 kg — ga naar 122,5 kg.')
  })

  it('landt op het grid als het vorige gewicht ernaast zat', () => {
    // Arrange — 121 kg (rare plaatjes, of een machine met eigen stappen).
    const vorige = sets(3, { gewichtKg: 121 })

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — 121 + 2,5 = 123,5 → naar het naaste veelvoud: 122,5. Nog steeds
    // een échte verhoging, want afronden kost maximaal een halve stap.
    expect(voorgesteldGewicht(advies)).toBe(122.5)
    expect(voorgesteldGewicht(advies) as number).toBeGreaterThan(121)
  })

  it('verhoogt vanaf een gemeten 0 kg — lichaamsgewicht is een echte waarde', () => {
    // Arrange — 3×10 pull-ups zonder extra gewicht.
    const vorige = sets(3, { gewichtKg: 0 })

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — tijd voor de gewichtsbelt. Alleen `null` betekent "niet ingevuld".
    expect(advies.soort).toBe('verhoog')
    expect(voorgesteldGewicht(advies)).toBe(2.5)
  })

  it('verhoogt niet bij een kapotte stap in plaats van een neplogica-stijging', () => {
    // Arrange — stap 0 (programmeerfout of een leeg veld in het programma).
    const vorige = sets(3)

    // Act
    const advies = bepaalAdvies(doel({ stap: 0 }), vorige)

    // Assert — "ga naar 120 kg" terwijl je op 120 kg staat is een leugen. Dan
    // liever behoud.
    expect(advies.soort).toBe('behoud')
    expect(voorgesteldGewicht(advies)).toBe(120)
  })
})

describe('bepaalAdvies — RIR mag tegenspreken, nooit gokken', () => {
  it('verhoogt niet bij RIR 0 terwijl het doel [1,3] is', () => {
    // Arrange — 3×10 gehaald, maar de laatste rep kwam er met een schreeuw uit.
    const vorige = sets(3, { rir: 0 })

    // Act
    const advies = bepaalAdvies(doel({ rirDoel: [1, 3] }), vorige)

    // Assert — reps gehaald, maar geen marge: er 2,5 kg bovenop leggen levert
    // volgende week 3×5 op.
    expect(advies.soort).toBe('behoud')
    expect(voorgesteldGewicht(advies)).toBe(120)
    expect(advies.uitleg).toBe(
      '3×10 op 120 kg, maar met RIR 0 — blijf op 120 kg tot het lichter voelt.',
    )
  })

  it('verhoogt wél bij RIR 0 als het doel [0,2] is', () => {
    // Arrange — isolatie mag tot het einde: 0 valt binnen de band.
    const vorige = sets(3, { rir: 0 })

    // Act + Assert — de ondergrens doet mee, hij is geen exclusieve grens.
    expect(bepaalAdvies(doel({ rirDoel: [0, 2] }), vorige).soort).toBe('verhoog')
  })

  it('verhoogt op de exacte ondergrens van de band', () => {
    // Arrange — RIR 1 bij doel [1,3].
    const vorige = sets(3, { rir: 1 })

    // Act + Assert
    expect(bepaalAdvies(doel(), vorige).soort).toBe('verhoog')
  })

  it('verhoogt als RIR nergens gelogd is — niet gokken, wel doorgaan', () => {
    // Arrange — Kane logt RIR niet altijd. Dat mag de progressie niet stilzetten.
    const vorige = sets(3, { rir: null })

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — geen bewijs is geen bezwaar. Er hier stilletjes een 2 van maken
    // zou een zware sessie als makkelijk boeken; hem blokkeren zou het blok
    // laten vastlopen op een leeg veld.
    expect(advies.soort).toBe('verhoog')
    expect(voorgesteldGewicht(advies)).toBe(122.5)
  })

  it('kijkt naar de laagste gelogde RIR en negeert de lege velden', () => {
    // Arrange — twee sets zonder RIR, en één met een 0.
    const vorige = [set({ rir: null }), set({ rir: null }), set({ rir: 0 })]

    // Act + Assert — die ene 0 is een echte meting en spreekt de marge tegen.
    expect(bepaalAdvies(doel(), vorige).soort).toBe('behoud')
  })

  it('negeert onzin in het RIR-veld in plaats van hem als 0 te lezen', () => {
    // Arrange — NaN uit een stuk formulier.
    const vorige = sets(3, { rir: Number.NaN })

    // Act + Assert — een kapot veld is "niet gelogd", geen "geen marge".
    expect(bepaalAdvies(doel(), vorige).soort).toBe('verhoog')
  })
})

describe('bepaalAdvies — behoud: eerst reps erbij', () => {
  it('houdt het gewicht vast bij 10/9/7', () => {
    // Arrange — de klassieke halve sessie: alleen de eerste set haalde de top.
    const vorige = [
      set({ herhalingen: 10 }),
      set({ herhalingen: 9 }),
      set({ herhalingen: 7 }),
    ]

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — double progression: reps eerst. En de uitleg zegt precies wat de
    // voorwaarde is om wél te verhogen.
    expect(advies.soort).toBe('behoud')
    expect(voorgesteldGewicht(advies)).toBe(120)
    expect(advies.uitleg).toBe('10/9/7 — blijf op 120 kg tot alle 3 sets 10 halen.')
  })

  it('houdt vast als één enkele set de bovengrens mist', () => {
    // Arrange — 10/10/9. Bijna is niet gehaald.
    const vorige = [set(), set(), set({ herhalingen: 9 })]

    // Act + Assert
    expect(bepaalAdvies(doel(), vorige).soort).toBe('behoud')
  })

  it('verhoogt niet als er minder sets gelogd zijn dan het doel', () => {
    // Arrange — 2×10 op 120 terwijl het programma 3 sets vraagt.
    const vorige = sets(2)

    // Act
    const advies = bepaalAdvies(doel({ sets: 3 }), vorige)

    // Assert — twee sets op de bovengrens is geen bewijs dat de derde ook lukt.
    expect(advies.soort).toBe('behoud')
    expect(voorgesteldGewicht(advies)).toBe(120)
    expect(advies.uitleg).toBe('2×10 op 120 kg — doe alle 3 sets voor je verhoudt.'.replace('verhoudt', 'verhoogt'))
  })

  it('verhoogt wel bij méér sets dan het doel', () => {
    // Arrange — een vierde set erbij, allemaal op de bovengrens.
    const vorige = sets(4)

    // Act + Assert — het doel is een minimum, geen plafond.
    expect(bepaalAdvies(doel({ sets: 3 }), vorige).soort).toBe('verhoog')
  })
})

describe('bepaalAdvies — werkgewicht: warm-ups en afvallende sets', () => {
  it('laat een warm-up met lager gewicht het werkgewicht niet verlagen', () => {
    // Arrange — 60 kg warm-up, daarna 3×10 op 120.
    const vorige = [set({ gewichtKg: 60, herhalingen: 10 }), ...sets(3)]

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — het werkgewicht is het HOOGSTE gemaakte gewicht. Een gemiddelde
    // of de eerste set nemen zou het voorstel naar 60 kg trekken.
    expect(advies.soort).toBe('verhoog')
    expect(voorgesteldGewicht(advies)).toBe(122.5)
    expect(advies.uitleg).toContain('op 120 kg')
  })

  it('laat een lichte warm-up met weinig reps de verhoging niet blokkeren', () => {
    // Arrange — 60×5 als opwarmer; op 120 kg drie keer de bovengrens.
    const vorige = [set({ gewichtKg: 60, herhalingen: 5, rir: 5 }), ...sets(3)]

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — vijf reps op 60 kg zegt niets over je 120 kg. Alleen de sets óp
    // het werkgewicht worden beoordeeld.
    expect(advies.soort).toBe('verhoog')
  })

  it('laat een afvallende set tot uitputting de verhoging niet blokkeren', () => {
    // Arrange — 3×10 op 120, daarna een drop-set van 12 op 100 met RIR 0.
    const vorige = [...sets(3), set({ gewichtKg: 100, herhalingen: 12, rir: 0 })]

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — die RIR 0 hoort bij 100 kg, niet bij het werkgewicht.
    expect(advies.soort).toBe('verhoog')
    expect(voorgesteldGewicht(advies)).toBe(122.5)
  })

  it('houdt bij een behoud ook het hoogste gewicht vast, niet dat van de warm-up', () => {
    // Arrange — warm-up plus een sessie die de bovengrens niet haalt.
    const vorige = [
      set({ gewichtKg: 60, herhalingen: 10 }),
      set({ herhalingen: 9 }),
      set({ herhalingen: 8 }),
      set({ herhalingen: 8 }),
    ]

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert
    expect(advies.soort).toBe('behoud')
    expect(voorgesteldGewicht(advies)).toBe(120)
  })
})

describe('bepaalAdvies — sets zonder reps of gewicht worden genegeerd', () => {
  it('laat een set zonder reps het werkgewicht niet bepalen', () => {
    // Arrange — een rij van 200 kg waar de reps nooit zijn ingevuld. Dit is het
    // gevaarlijkste geval: hij zou het werkgewicht vervierdubbelen.
    const vorige = [...sets(3), set({ herhalingen: null, gewichtKg: 200, rir: null })]

    // Act
    const advies = bepaalAdvies(doel(), vorige)

    // Assert — 200 kg is niet getild, dus bestaat het niet.
    expect(advies.soort).toBe('verhoog')
    expect(voorgesteldGewicht(advies)).toBe(122.5)
  })

  it('laat een set zonder gewicht de reps-beoordeling niet verstoren', () => {
    // Arrange — een losse rij met 4 reps en geen gewicht.
    const vorige = [...sets(3), set({ herhalingen: 4, gewichtKg: null, rir: 0 })]

    // Act + Assert — hij telt niet mee, dus hij blokkeert de verhoging niet.
    expect(bepaalAdvies(doel(), vorige).soort).toBe('verhoog')
  })

  it('telt een genegeerde set niet mee voor het aantal sets', () => {
    // Arrange — twee echte sets plus twee lege rijen; het doel is 3 sets.
    const vorige = [
      ...sets(2),
      set({ herhalingen: null, gewichtKg: null, rir: null }),
      set({ herhalingen: null, gewichtKg: 120, rir: null }),
    ]

    // Act
    const advies = bepaalAdvies(doel({ sets: 3 }), vorige)

    // Assert — lege rijen mogen geen sets "vullen"; dan zou een half ingevulde
    // sessie een verhoging opleveren.
    expect(advies.soort).toBe('behoud')
    expect(advies.uitleg).toContain('doe alle 3 sets')
  })
})

describe('bepaalAdvies — let op: een echte inzinking', () => {
  it('waarschuwt bij meer dan 15% minder reps op hetzelfde gewicht', () => {
    // Arrange — vorige week 3×10 op 120 (30 reps), nu 3×8 (24 reps).
    const eerder = sets(3, { herhalingen: 10 })
    const vorige = sets(3, { herhalingen: 8 })

    // Act
    const advies = bepaalAdvies(doel(), vorige, eerder)

    // Assert — 24/30 = 80%: een echte terugval, geen dagvorm.
    expect(advies.soort).toBe('let_op')
    expect(voorgesteldGewicht(advies)).toBe(120)
    expect(advies.uitleg).toBe(
      'Volume gedaald (30 → 24 reps op 120 kg) — blijf op 120 kg en let op je herstel.',
    )
  })

  it('noemt herstel en volume in de uitleg', () => {
    // Arrange
    const advies = bepaalAdvies(doel(), sets(3, { herhalingen: 6 }), sets(3))

    // Assert — de gebruiker moet weten wát hij ermee moet: rust, of minder
    // volume. Niet alleen "let op".
    expect(advies.uitleg).toContain('herstel')
    expect(advies.uitleg).toContain('Volume')
  })

  it('waarschuwt op de grens van exact 15%', () => {
    // Arrange — 20 reps → 17 reps is precies 85%.
    const eerder = sets(2, { herhalingen: 10 })
    const vorige = [set({ herhalingen: 9 }), set({ herhalingen: 8 })]

    // Act + Assert — "minstens 15% lager" telt de grens mee.
    expect(bepaalAdvies(doel(), vorige, eerder).soort).toBe('let_op')
  })

  it('waarschuwt niet bij een kleine dip', () => {
    // Arrange — 30 reps → 28 reps (7% minder). Dat is een matige nacht.
    const eerder = sets(3, { herhalingen: 10 })
    const vorige = [set({ herhalingen: 10 }), set({ herhalingen: 9 }), set({ herhalingen: 9 })]

    // Act
    const advies = bepaalAdvies(doel(), vorige, eerder)

    // Assert — een engine die bij elke rimpel alarm slaat wordt weggeklikt.
    expect(advies.soort).toBe('behoud')
  })

  it('waarschuwt ook bij een daling op een lager gewicht', () => {
    // Arrange — teruggezakt van 3×10 op 120 naar 3×6 op 110.
    const eerder = sets(3, { herhalingen: 10, gewichtKg: 120 })
    const vorige = sets(3, { herhalingen: 6, gewichtKg: 110 })

    // Act
    const advies = bepaalAdvies(doel(), vorige, eerder)

    // Assert — minder gewicht én minder reps: dat is de duidelijkste inzinking
    // die er is. Het voorstel blijft op het laatst getilde gewicht.
    expect(advies.soort).toBe('let_op')
    expect(voorgesteldGewicht(advies)).toBe(110)
  })

  it('waarschuwt niet als het gewicht hoger was — minder reps horen daarbij', () => {
    // Arrange — 3×10 op 120 (30 reps) → 3×6 op 130 (18 reps).
    const eerder = sets(3, { herhalingen: 10, gewichtKg: 120 })
    const vorige = sets(3, { herhalingen: 6, gewichtKg: 130 })

    // Act
    const advies = bepaalAdvies(doel(), vorige, eerder)

    // Assert — dit is precies wat het programma wil na een verhoging. Hier
    // "let op je herstel" zeggen zou de gebruiker afstraffen voor progressie.
    expect(advies.soort).toBe('behoud')
    expect(voorgesteldGewicht(advies)).toBe(130)
  })

  it('laat verhoog voorgaan op let op — een stijging is nooit een waarschuwing', () => {
    // Arrange — vorige keer 5×10 (50 reps), nu 3×10 (30 reps): minder volume,
    // maar wel het volledige programma op de bovengrens.
    const eerder = sets(5)
    const vorige = sets(3)

    // Act
    const advies = bepaalAdvies(doel({ sets: 3 }), vorige, eerder)

    // Assert — de reps-voorwaarde is gehaald; dat weegt zwaarder dan het
    // volumeverschil met een extra-lange sessie.
    expect(advies.soort).toBe('verhoog')
  })

  it('waarschuwt niet zonder vergelijkingsmateriaal', () => {
    // Arrange — één zwakke sessie zonder voorgeschiedenis.
    const vorige = sets(3, { herhalingen: 3 })

    // Act + Assert — zonder tweede punt is er geen daling te meten, alleen een
    // lage sessie. Dat is geen bewijs van iets.
    expect(bepaalAdvies(doel(), vorige).soort).toBe('behoud')
    expect(bepaalAdvies(doel(), vorige, []).soort).toBe('behoud')
  })

  it('waarschuwt niet als de eerdere sessie onbruikbaar is', () => {
    // Arrange — de sessie daarvóór staat vol lege rijen.
    const eerder = sets(3, { herhalingen: null, gewichtKg: null })
    const vorige = sets(3, { herhalingen: 4 })

    // Act + Assert — je kunt niet dalen ten opzichte van niets.
    expect(bepaalAdvies(doel(), vorige, eerder).soort).toBe('behoud')
  })
})

describe('rondAfOpStap', () => {
  it('rondt naar het naaste veelvoud van 2,5', () => {
    // Arrange + Act + Assert
    expect(rondAfOpStap(121, 2.5)).toBe(120)
    expect(rondAfOpStap(121.5, 2.5)).toBe(122.5)
    expect(rondAfOpStap(124, 2.5)).toBe(125)
    expect(rondAfOpStap(2.5, 2.5)).toBe(2.5)
  })

  it('rondt naar het naaste veelvoud van 1,25', () => {
    // Arrange + Act + Assert — kleine isolatie heeft een fijner grid.
    expect(rondAfOpStap(61.25, 1.25)).toBe(61.25)
    expect(rondAfOpStap(61.9, 1.25)).toBe(62.5)
    expect(rondAfOpStap(61.4, 1.25)).toBe(61.25)
  })

  it('rondt naar het naaste veelvoud van 5', () => {
    // Arrange + Act + Assert — been-machines gaan met vijven.
    expect(rondAfOpStap(122, 5)).toBe(120)
    expect(rondAfOpStap(123, 5)).toBe(125)
  })

  it('houdt 122,5 exact 122,5', () => {
    // Arrange + Act + Assert — geen 122,50000000000001 op het scherm van iemand
    // met een barbell in zijn handen.
    expect(rondAfOpStap(122.5, 2.5)).toBe(122.5)
    expect(rondAfOpStap(120 + 2.5, 2.5)).toBe(122.5)
    expect(String(rondAfOpStap(122.5, 2.5))).toBe('122.5')
  })

  it('overleeft de klassieke floating-point-val', () => {
    // Arrange — 0.1 + 0.2 is in binaire floats 0.30000000000000004.
    const kapot = 0.1 + 0.2

    // Act + Assert
    expect(rondAfOpStap(kapot, 0.1)).toBe(0.3)
    expect(rondAfOpStap(kapot, 1.25)).toBe(0)
  })

  it('blijft op het grid als je stapelt', () => {
    // Arrange — drie blokweken achter elkaar verhogen.
    const week2 = rondAfOpStap(120 + 2.5, 2.5)
    const week3 = rondAfOpStap(week2 + 2.5, 2.5)
    const week4 = rondAfOpStap(week3 + 2.5, 2.5)

    // Assert — geen drift, ook niet na herhaald optellen.
    expect([week2, week3, week4]).toEqual([122.5, 125, 127.5])
  })

  it('gaat nooit onder 0', () => {
    // Arrange + Act + Assert — een voorstel onder de lege stang bestaat niet.
    expect(rondAfOpStap(-5, 2.5)).toBe(0)
    expect(rondAfOpStap(-0.4, 2.5)).toBe(0)
    expect(rondAfOpStap(0, 2.5)).toBe(0)
  })

  it('geeft 0 bij een kapot gewicht', () => {
    // Arrange + Act + Assert
    expect(rondAfOpStap(Number.NaN, 2.5)).toBe(0)
    expect(rondAfOpStap(Number.POSITIVE_INFINITY, 2.5)).toBe(0)
  })

  it('laat het gewicht staan als er geen bruikbare stap is', () => {
    // Arrange + Act + Assert — zonder grid is er niets om op te vallen, en een
    // deling door 0 mag nooit een NaN op het scherm worden.
    expect(rondAfOpStap(121.234, 0)).toBe(121.23)
    expect(rondAfOpStap(121.234, Number.NaN)).toBe(121.23)
    expect(rondAfOpStap(121.234, -2.5)).toBe(121.23)
  })
})

describe('voorgesteldGewicht — per advies-soort', () => {
  it('geeft het nieuwe gewicht bij verhoog', () => {
    // Arrange
    const advies = bepaalAdvies(doel(), sets(3))

    // Act + Assert
    expect(advies.soort).toBe('verhoog')
    expect(voorgesteldGewicht(advies)).toBe(122.5)
  })

  it('geeft het huidige gewicht bij behoud', () => {
    // Arrange
    const advies = bepaalAdvies(doel(), sets(3, { herhalingen: 8 }))

    // Act + Assert
    expect(advies.soort).toBe('behoud')
    expect(voorgesteldGewicht(advies)).toBe(120)
  })

  it('geeft het huidige gewicht bij let op', () => {
    // Arrange
    const advies = bepaalAdvies(doel(), sets(3, { herhalingen: 6 }), sets(3))

    // Act + Assert — een waarschuwing is geen deload-berekening: het gewicht
    // blijft staan, de gebruiker beslist.
    expect(advies.soort).toBe('let_op')
    expect(voorgesteldGewicht(advies)).toBe(120)
  })

  it('geeft null bij onbekend — nooit een 0 en nooit een gok', () => {
    // Arrange
    const advies = bepaalAdvies(doel(), [])

    // Act
    const kg = voorgesteldGewicht(advies)

    // Assert — dit is dezelfde regel als null-vs-0 in actieve-minuten.ts: een
    // 0 hier zou "begin met een lege stang" betekenen, en dat weten we niet.
    expect(kg).toBeNull()
    expect(kg).not.toBe(0)
  })

  it('geeft een gemeten 0 kg terug als 0, niet als null', () => {
    // Arrange — lichaamsgewicht-werk dat de bovengrens nog niet haalt.
    const advies = bepaalAdvies(doel(), sets(3, { herhalingen: 8, gewichtKg: 0 }))

    // Act + Assert — hier is 0 een echte meting; het onderscheid met onbekend
    // moet overeind blijven.
    expect(voorgesteldGewicht(advies)).toBe(0)
    expect(voorgesteldGewicht(advies)).not.toBeNull()
  })
})

describe('puurheid — de invoer blijft heel', () => {
  it('muteert of sorteert de sets van de vorige sessie niet', () => {
    // Arrange — bewust in een rare volgorde: warm-up in het midden.
    const vorige: GelogdeSet[] = [
      set({ herhalingen: 10 }),
      set({ gewichtKg: 60, herhalingen: 12 }),
      set({ herhalingen: 10 }),
      set({ herhalingen: 10 }),
    ]
    const voor = JSON.stringify(vorige)

    // Act
    bepaalAdvies(doel(), vorige)

    // Assert — geen in-place sort om het werkgewicht te vinden, geen genormali-
    // seerde waarden teruggeschreven. De aanroeper mag dezelfde array hergebruiken.
    expect(JSON.stringify(vorige)).toBe(voor)
  })

  it('muteert de eerdere sessie en het doel niet', () => {
    // Arrange
    const eerder = sets(3, { herhalingen: 10 })
    const vorige = sets(3, { herhalingen: 6 })
    const programma = doel()
    const voorEerder = JSON.stringify(eerder)
    const voorDoel = JSON.stringify(programma)

    // Act
    bepaalAdvies(programma, vorige, eerder)

    // Assert
    expect(JSON.stringify(eerder)).toBe(voorEerder)
    expect(JSON.stringify(programma)).toBe(voorDoel)
  })

  it('geeft bij dezelfde invoer altijd hetzelfde advies', () => {
    // Arrange — geen Date.now(), geen random, geen cache met geheugen.
    const vorige = sets(3)
    const eerder = sets(3, { herhalingen: 9 })

    // Act
    const eerste = bepaalAdvies(doel(), vorige, eerder)
    const tweede = bepaalAdvies(doel(), vorige, eerder)

    // Assert
    expect(eerste).toEqual(tweede)
  })
})
