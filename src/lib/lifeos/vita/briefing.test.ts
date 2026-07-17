import { describe, it, expect } from 'vitest'
import { stelBriefingSamen } from './briefing'
import type { AgendaEvent, Signaal } from './signalen'
import type { SlimmeTaak } from '@/lib/lifeos/taken/prioriteit'

// nu: woensdag 15 juli 2026, 07:00 Amsterdamse tijd — het uur waarop de cron
// bedoeld is te draaien. Vast, want een briefing hangt volledig aan de klok.
const NU = new Date('2026-07-15T07:00:00+02:00')
const VANDAAG = '2026-07-15'

function taak(over: Partial<SlimmeTaak> = {}): SlimmeTaak {
  const basis: SlimmeTaak = {
    id: '11111111-1111-4111-8111-111111111111',
    titel: 'Offerte afmaken',
    notitie: null,
    klaar: false,
    klaarOp: null,
    datum: VANDAAG,
    top3Positie: null,
    aangemaaktOp: '2026-07-10T09:00:00.000Z',
    impact: null,
    deadline: null,
    inspanningMinuten: null,
    energie: null,
    projectId: null,
  }
  // Los van de spread hierboven: `Partial<T>` maakt elk veld `T | undefined`, en
  // een spread van een optioneel veld zet `undefined` er echt in. Dan klaagt
  // `exactOptionalPropertyTypes` — terecht: `undefined` is hier geen geldige waarde.
  return { ...basis, ...over }
}

function event(over: Partial<AgendaEvent> = {}): AgendaEvent {
  return {
    titel: 'Standup',
    startOp: new Date('2026-07-15T09:00:00+02:00'),
    eindOp: new Date('2026-07-15T09:30:00+02:00'),
    heleDag: false,
    ...over,
  }
}

const SIGNAAL: Signaal = {
  soort: 'korte-slaap-training',
  urgentie: 80,
  tekst: "Je sliep 5u12 en hebt Crossfit gepland. Overweeg 'm vandaag lichter te houden.",
}

function leeg(over: Partial<Parameters<typeof stelBriefingSamen>[0]> = {}) {
  return { signalen: [], agendaVandaag: [], taken: [], nu: NU, ...over }
}

describe('stilte — de belangrijkste tak', () => {
  it('stuurt niets als er niets te melden is', () => {
    // Arrange — geen signalen, geen agenda, geen taken.
    // Act
    const briefing = stelBriefingSamen(leeg())

    // Assert — null, dus de cron zwijgt. Een dagelijkse "goedemorgen, er is niets"
    // is precies de meldingsruis waardoor je over Vita heen gaat lezen.
    expect(briefing).toBeNull()
  })

  it('stuurt niets als alle taken al af zijn', () => {
    // Arrange — wél taken, maar allemaal afgevinkt.
    // Act
    const briefing = stelBriefingSamen(leeg({ taken: [taak({ klaar: true })] }))

    // Assert
    expect(briefing).toBeNull()
  })
})

describe('samenstelling', () => {
  it('zet wat opvalt bovenaan — je leest een briefing niet twee keer', () => {
    // Arrange
    const invoer = leeg({ signalen: [SIGNAAL], agendaVandaag: [event()] })

    // Act
    const briefing = stelBriefingSamen(invoer)

    // Assert
    if (!briefing) throw new Error('briefing hoort er te zijn')
    expect(briefing.datum).toBe(VANDAAG)
    expect(briefing.tekst).toContain('Goedemorgen. Woensdag 15 juli.')
    expect(briefing.tekst.indexOf('Wat opvalt')).toBeLessThan(briefing.tekst.indexOf('Vandaag:'))
    expect(briefing.tekst).toContain('Je sliep 5u12')
  })

  it('neemt de cijfers letterlijk over uit het signaal', () => {
    // Arrange — de motor zei 5u12. Niet "ruim 5 uur", niet afgerond.
    // Act
    const briefing = stelBriefingSamen(leeg({ signalen: [SIGNAAL] }))

    // Assert
    expect(briefing?.tekst).toContain('5u12')
  })

  it('toont een afspraak zonder eindtijd als onbekend in plaats van te gokken', () => {
    // Arrange — de bron gaf geen eindtijd.
    // Act
    const briefing = stelBriefingSamen(leeg({ agendaVandaag: [event({ eindOp: null })] }))

    // Assert — "duurt vast een uur" zou er precies zo uitzien als een gemeten feit.
    expect(briefing?.tekst).toContain('- 09:00 — Standup (eindtijd onbekend)')
  })

  it('zet de afspraken op tijd, ongeacht de volgorde van de bron', () => {
    // Arrange — omgekeerd aangeleverd.
    const laat = event({ titel: 'Klant', startOp: new Date('2026-07-15T14:00:00+02:00'), eindOp: null })
    const invoer = leeg({ agendaVandaag: [laat, event()] })

    // Act
    const briefing = stelBriefingSamen(invoer)

    // Assert
    if (!briefing) throw new Error('briefing hoort er te zijn')
    expect(briefing.tekst.indexOf('Standup')).toBeLessThan(briefing.tekst.indexOf('Klant'))
  })

  it('muteert de aangeleverde agenda niet', () => {
    // Arrange
    const agenda = [
      event({ titel: 'Klant', startOp: new Date('2026-07-15T14:00:00+02:00') }),
      event(),
    ]

    // Act
    stelBriefingSamen(leeg({ agendaVandaag: agenda }))

    // Assert — sorteren gebeurt op een kopie; de aanroeper geeft zijn lijst niet weg.
    expect(agenda[0]?.titel).toBe('Klant')
  })

  it('meldt eerlijk dat er meer afspraken volgen in plaats van stil af te kappen', () => {
    // Arrange — tien afspraken; het plafond is acht.
    const agenda = Array.from({ length: 10 }, (_, i) =>
      event({
        titel: `Blok ${i}`,
        startOp: new Date(`2026-07-15T${String(8 + i).padStart(2, '0')}:00:00+02:00`),
        eindOp: null,
      }),
    )

    // Act
    const briefing = stelBriefingSamen(leeg({ agendaVandaag: agenda }))

    // Assert — stil afkappen zou de afspraak van 17:00 laten verdwijnen en je laten
    // denken dat je vrij bent.
    expect(briefing?.tekst).toContain('en nog 2 afspraken daarna.')
  })
})

describe('taken — de wil wint van de formule', () => {
  it('noemt de top-3 als jouw keuze, zonder score-verantwoording', () => {
    // Arrange — een top-3-taak zonder feiten én een taak met een harde deadline.
    const invoer = leeg({
      taken: [
        taak({ id: 'a1111111-1111-4111-8111-111111111111', titel: 'Bellen met Jan', deadline: VANDAAG }),
        taak({ id: 'b1111111-1111-4111-8111-111111111111', titel: 'Offerte afmaken', top3Positie: 1 }),
      ],
    })

    // Act
    const briefing = stelBriefingSamen(invoer)

    // Assert — de top-3 staat vooraan (Kane's wil) en verantwoordt zich niet.
    if (!briefing) throw new Error('briefing hoort er te zijn')
    expect(briefing.tekst).toContain('1. Offerte afmaken — jouw top-3')
    expect(briefing.tekst).toContain('2. Bellen met Jan — Deadline is vandaag.')
  })

  it('verzint geen reden voor een taak die niet te wegen is', () => {
    // Arrange — geen impact, geen deadline. `prioriteit.ts` geeft dan score null.
    // Act
    const briefing = stelBriefingSamen(leeg({ taken: [taak({ titel: 'Iets vaags' })] }))

    // Assert — de taak staat er, kaal. Geen verzonnen onderbouwing voor een
    // volgorde die Vita zelf niet kan uitleggen.
    expect(briefing?.tekst).toContain('1. Iets vaags')
    expect(briefing?.tekst).not.toContain('Iets vaags —')
  })

  it('noemt hooguit drie taken', () => {
    // Arrange — vijf taken met een deadline (dus alle vijf beoordeeld).
    const taken = Array.from({ length: 5 }, (_, i) =>
      taak({
        id: `c111111${i}-1111-4111-8111-111111111111`,
        titel: `Taak ${i}`,
        deadline: VANDAAG,
      }),
    )

    // Act
    const briefing = stelBriefingSamen(leeg({ taken }))

    // Assert — een briefing is geen takenlijst.
    if (!briefing) throw new Error('briefing hoort er te zijn')
    expect(briefing.tekst).toContain('3. Taak 2')
    expect(briefing.tekst).not.toContain('4. Taak 3')
  })

  it('laat afgevinkte taken buiten de lijst', () => {
    // Arrange
    const invoer = leeg({
      taken: [
        taak({ titel: 'Al gedaan', klaar: true, top3Positie: 1 }),
        taak({ id: 'd1111111-1111-4111-8111-111111111111', titel: 'Nog open' }),
      ],
    })

    // Act
    const briefing = stelBriefingSamen(invoer)

    // Assert
    expect(briefing?.tekst).not.toContain('Al gedaan')
    expect(briefing?.tekst).toContain('Nog open')
  })
})

describe('de klok', () => {
  it('groet naar het uur waarop het bericht aankomt, niet naar de bedoeling', () => {
    // Arrange — een uitgestelde runner of een handmatige trigger om 13:00.
    const middag = new Date('2026-07-15T13:00:00+02:00')

    // Act
    const briefing = stelBriefingSamen(leeg({ signalen: [SIGNAAL], nu: middag }))

    // Assert — "goedemorgen" om 13:00 is een klein bewijs dat het ding niet weet
    // wanneer het praat.
    expect(briefing?.tekst).toContain('Goedemiddag.')
  })

  it('rekent in Amsterdamse tijd, niet in de tijdzone van het proces', () => {
    // Arrange — 23:30 UTC op 15 juli is in Amsterdam al 01:30 op 16 juli.
    const nacht = new Date('2026-07-15T23:30:00Z')

    // Act
    const briefing = stelBriefingSamen(leeg({ signalen: [SIGNAAL], nu: nacht }))

    // Assert — de briefing hoort bij de dag zoals Kane hem beleeft. Vercel/Render
    // draaien op UTC; `getHours()` zou hier de verkeerde dag geven.
    if (!briefing) throw new Error('briefing hoort er te zijn')
    expect(briefing.datum).toBe('2026-07-16')
    expect(briefing.tekst).toContain('Donderdag 16 juli')
  })
})
