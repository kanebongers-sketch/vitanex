import { describe, it, expect } from 'vitest'
import { kiesWeergave, looptDagbriefing, meekijkTekst, type SignalenAntwoord } from './weergave'
import type { Signaal } from './signalen'

const SIGNAAL: Signaal = {
  soort: 'afspraak-nabij',
  urgentie: 100,
  tekst: 'Standup begint over 10 minuten.',
}

function antwoord(over: Partial<SignalenAntwoord> = {}): SignalenAntwoord {
  return { signalen: [], gemeten: false, bronnenMetFout: [], ...over }
}

describe('kiesWeergave', () => {
  it('toont een storing als er niets gemeten is én een bron viel weg', () => {
    // Arrange — de agenda gaf een fout. Er staat dus nul data, maar dat komt
    // niet doordat er niets ís: we konden alleen niet kijken.
    const kapot = antwoord({ gemeten: false, bronnenMetFout: ['agenda'] })

    // Act
    const weergave = kiesWeergave(kapot)

    // Assert — dit is de kern van het hele bestand: een storing mag zich nooit
    // als "je hebt nog niets gemeten" voordoen.
    expect(weergave.soort).toBe('fout')
    expect(weergave).toEqual({ soort: 'fout', melding: 'Ik kon je agenda niet ophalen.' })
  })

  it('noemt alle gevallen bronnen', () => {
    // Arrange
    const kapot = antwoord({ gemeten: false, bronnenMetFout: ['herstel', 'agenda'] })

    // Act + Assert
    expect(kiesWeergave(kapot)).toEqual({
      soort: 'fout',
      melding: 'Ik kon je herstel en agenda niet ophalen.',
    })
  })

  it('zegt pas "nog niets gemeten" als álles opgehaald is', () => {
    // Arrange — alles werkte, er is echt niets. Verse installatie.
    const leeg = antwoord({ gemeten: false, bronnenMetFout: [] })

    // Act + Assert
    expect(kiesWeergave(leeg)).toEqual({ soort: 'niets-gemeten' })
  })

  it('onderscheidt "ik ken je niet" van "er is niets aan de hand"', () => {
    // Arrange — twee keer nul signalen, twee compleet andere betekenissen.
    const kentJeNiet = antwoord({ gemeten: false })
    const nietsAanDeHand = antwoord({ gemeten: true })

    // Act
    const a = kiesWeergave(kentJeNiet)
    const b = kiesWeergave(nietsAanDeHand)

    // Assert — zonder dit onderscheid rendert een gebruiker met een rustige dag
    // hetzelfde scherm als iemand die de app net geïnstalleerd heeft.
    expect(a.soort).toBe('niets-gemeten')
    expect(b.soort).toBe('rustig')
    expect(a.soort).not.toBe(b.soort)
  })

  it('toont signalen als ze er zijn', () => {
    // Arrange
    const metSignaal = antwoord({ gemeten: true, signalen: [SIGNAAL] })

    // Act + Assert
    expect(kiesWeergave(metSignaal)).toEqual({
      soort: 'signalen',
      signalen: [SIGNAAL],
      bronnenMetFout: [],
    })
  })

  it('geeft gevallen bronnen door bij een deels gevulde kaart', () => {
    // Arrange — er is data én er is een storing. Beide moeten zichtbaar zijn:
    // zwijgen zou suggereren dat dit alles is wat er speelt.
    const deels = antwoord({ gemeten: true, signalen: [SIGNAAL], bronnenMetFout: ['taken'] })
    const deelsRustig = antwoord({ gemeten: true, bronnenMetFout: ['taken'] })

    // Act + Assert
    expect(kiesWeergave(deels)).toMatchObject({ soort: 'signalen', bronnenMetFout: ['taken'] })
    expect(kiesWeergave(deelsRustig)).toMatchObject({ soort: 'rustig', bronnenMetFout: ['taken'] })
  })
})

// ─── De belofte ─────────────────────────────────────────────────────────────
// Dit is de regel die loog: "Ik blijf meekijken en tik je aan zodra er iets
// verandert", terwijl er geen cron, geen polling en geen push bestond. Deze
// tests bewaken dat de belofte alleen nog uitgesproken wordt op BEWIJS van een
// écht bezorgde briefing — niet op het bestaan van een cron-route.

const NU = new Date('2026-07-15T09:00:00+02:00')

describe('looptDagbriefing — alleen op bewijs', () => {
  it('erkent een briefing van vanochtend', () => {
    // Arrange — twee uur geleden echt bezorgd.
    const bezorgd = { laatstBezorgdOp: '2026-07-15T05:00:00.000Z' }

    // Act & Assert
    expect(looptDagbriefing(bezorgd, NU)).toBe(true)
  })

  it('erkent een gemiste ochtend, want GitHub-cron loopt soms uit', () => {
    // Arrange — gisterochtend bezorgd, vanochtend overgeslagen. Op een venster van
    // 24 uur zou de kaart nu zeggen dat de briefing niet loopt, terwijl hij morgen
    // gewoon weer komt.
    const bezorgd = { laatstBezorgdOp: '2026-07-14T05:00:00.000Z' }

    // Act & Assert
    expect(looptDagbriefing(bezorgd, NU)).toBe(true)
  })

  it('gelooft een briefing van vorige week niet meer', () => {
    // Arrange — er is al dagen niets gekomen; de cron staat kennelijk stil.
    const bezorgd = { laatstBezorgdOp: '2026-07-08T05:00:00.000Z' }

    // Act & Assert — anders blijft de belofte staan terwijl er niets komt.
    expect(looptDagbriefing(bezorgd, NU)).toBe(false)
  })

  it('belooft niets als er nog nooit een briefing bezorgd is', () => {
    // Arrange — de tabel is leeg: de cron is er wel, maar draait niet.
    // Act & Assert
    expect(looptDagbriefing({ laatstBezorgdOp: null }, NU)).toBe(false)
  })

  it.each([[null], [undefined]])('belooft niets als we het niet konden nagaan (%s)', (v) => {
    // Arrange — gevallen query of een oudere client. Twijfel → stilte.
    // Act & Assert
    expect(looptDagbriefing(v, NU)).toBe(false)
  })

  it('gelooft een onleesbare datum niet', () => {
    expect(looptDagbriefing({ laatstBezorgdOp: 'gisteren' }, NU)).toBe(false)
  })

  it('gelooft een tijdstempel uit de toekomst niet', () => {
    // Arrange — een kapotte klok is geen bewijs.
    const bezorgd = { laatstBezorgdOp: '2026-07-16T05:00:00.000Z' }

    // Act & Assert
    expect(looptDagbriefing(bezorgd, NU)).toBe(false)
  })
})

describe('meekijkTekst', () => {
  it('belooft de dagbriefing alleen als hij aantoonbaar loopt', () => {
    // Arrange
    const bezorgd = { laatstBezorgdOp: '2026-07-15T05:00:00.000Z' }

    // Act
    const tekst = meekijkTekst(bezorgd, NU)

    // Assert
    expect(tekst).toContain('dagbriefing')
  })

  it('zegt eerlijk dat hij je niet aantikt als er geen bewijs is', () => {
    // Act
    const tekst = meekijkTekst({ laatstBezorgdOp: null }, NU)

    // Assert — geen "ik tik je aan", want dat doet hij dan niet.
    expect(tekst).toBe('Ik kijk mee op het moment dat je LifeOS opent. Uit mezelf tik ik je nu nog niet aan.')
  })

  it('doet geen enkele belofte als de status onbekend is', () => {
    // Act & Assert — de veilige kant: liever te weinig beloven dan te veel.
    expect(meekijkTekst(undefined, NU)).toContain('Uit mezelf tik ik je nu nog niet aan')
  })
})
