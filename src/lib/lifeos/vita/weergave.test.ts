import { describe, it, expect } from 'vitest'
import { kiesWeergave, type SignalenAntwoord } from './weergave'
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
