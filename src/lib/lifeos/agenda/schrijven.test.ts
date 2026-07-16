import { describe, it, expect } from 'vitest'
import {
  AgendaSchrijfFout,
  leesEventPatch,
  leesNieuwEvent,
  naarGoogleAanmaakBody,
  naarGooglePatchBody,
  schrijfFoutHttp,
} from './schrijven'

// De pure delen: de mapping naar Google's payload, de validatie op de
// systeemgrens, en de fout→HTTP-vertaling. Geen netwerk, geen database — precies
// de stukken die kapot mogen gaan zonder dat iemand het merkt, dus die testen we.

describe('naarGoogleAanmaakBody', () => {
  it('mapt titel→summary en start/end naar UTC-dateTime', () => {
    // Arrange
    const invoer = {
      titel: 'Standup',
      startOp: '2026-07-16T09:00:00+02:00',
      eindOp: '2026-07-16T09:30:00+02:00',
    }

    // Act
    const body = naarGoogleAanmaakBody(invoer)

    // Assert — de offset is genormaliseerd naar Z.
    expect(body.summary).toBe('Standup')
    expect(body.start).toEqual({ dateTime: '2026-07-16T07:00:00.000Z' })
    expect(body.end).toEqual({ dateTime: '2026-07-16T07:30:00.000Z' })
  })

  it('laat locatie en beschrijving weg als ze er niet zijn', () => {
    // Arrange
    const invoer = {
      titel: 'Focusblok',
      startOp: '2026-07-16T10:00:00.000Z',
      eindOp: '2026-07-16T11:00:00.000Z',
    }

    // Act
    const body = naarGoogleAanmaakBody(invoer)

    // Assert — geen lege velden meesturen; Google hoeft geen "" te krijgen.
    expect('location' in body).toBe(false)
    expect('description' in body).toBe(false)
  })

  it('neemt locatie en beschrijving mee als ze er zijn', () => {
    // Arrange
    const invoer = {
      titel: 'Lunch',
      startOp: '2026-07-16T12:00:00.000Z',
      eindOp: '2026-07-16T13:00:00.000Z',
      locatie: 'Eersel',
      beschrijving: 'Met het team',
    }

    // Act
    const body = naarGoogleAanmaakBody(invoer)

    // Assert
    expect(body.location).toBe('Eersel')
    expect(body.description).toBe('Met het team')
  })
})

describe('naarGooglePatchBody', () => {
  it('zet alleen de meegegeven velden', () => {
    // Arrange
    const patch = { titel: 'Nieuwe titel' }

    // Act
    const body = naarGooglePatchBody(patch)

    // Assert — een patch die alleen de titel verzet, raakt start/end niet.
    expect(body).toEqual({ summary: 'Nieuwe titel' })
    expect('start' in body).toBe(false)
  })

  it('wist een locatie met een lege string bij null', () => {
    // Arrange — null betekent bewust wissen, niet "laat staan".
    const patch = { locatie: null }

    // Act
    const body = naarGooglePatchBody(patch)

    // Assert
    expect(body.location).toBe('')
  })
})

describe('leesNieuwEvent', () => {
  const geldig = {
    titel: 'Overleg',
    startOp: '2026-07-16T09:00:00.000Z',
    eindOp: '2026-07-16T10:00:00.000Z',
  }

  it('accepteert een geldige afspraak en normaliseert de tijden', () => {
    // Act
    const uitkomst = leesNieuwEvent({ ...geldig, startOp: '2026-07-16T11:00:00+02:00' })

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) {
      expect(uitkomst.waarde.titel).toBe('Overleg')
      expect(uitkomst.waarde.startOp).toBe('2026-07-16T09:00:00.000Z')
    }
  })

  it('weigert een lege titel', () => {
    // Act
    const uitkomst = leesNieuwEvent({ ...geldig, titel: '   ' })

    // Assert — een afspraak zonder titel is geen afspraak.
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert een ontbrekende eindtijd — die verzinnen we niet', () => {
    // Act
    const uitkomst = leesNieuwEvent({ titel: geldig.titel, startOp: geldig.startOp })

    // Assert
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert een eindtijd vóór de begintijd', () => {
    // Act
    const uitkomst = leesNieuwEvent({
      ...geldig,
      startOp: '2026-07-16T10:00:00.000Z',
      eindOp: '2026-07-16T09:00:00.000Z',
    })

    // Assert
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert een onleesbare begintijd', () => {
    // Act
    const uitkomst = leesNieuwEvent({ ...geldig, startOp: 'morgenvroeg' })

    // Assert — onzin faalt op de grens, wordt geen Invalid Date verderop.
    expect(uitkomst.ok).toBe(false)
  })

  it('laat een lege locatie weg in plaats van een lege string door te geven', () => {
    // Act
    const uitkomst = leesNieuwEvent({ ...geldig, locatie: '  ' })

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect('locatie' in uitkomst.waarde).toBe(false)
  })

  it('weigert niet-object-invoer', () => {
    // Act + Assert
    expect(leesNieuwEvent(null).ok).toBe(false)
    expect(leesNieuwEvent('afspraak').ok).toBe(false)
  })
})

describe('leesEventPatch', () => {
  it('accepteert een deelwijziging met één veld', () => {
    // Act
    const uitkomst = leesEventPatch({ titel: 'Verzet' })

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde).toEqual({ titel: 'Verzet' })
  })

  it('weigert een lege wijziging — er valt dan niets te doen', () => {
    // Act
    const uitkomst = leesEventPatch({})

    // Assert
    expect(uitkomst.ok).toBe(false)
  })

  it('controleert de volgorde als begin én eind meekomen', () => {
    // Act
    const uitkomst = leesEventPatch({
      startOp: '2026-07-16T12:00:00.000Z',
      eindOp: '2026-07-16T11:00:00.000Z',
    })

    // Assert
    expect(uitkomst.ok).toBe(false)
  })

  it('leest null-locatie als een expliciete wis-opdracht', () => {
    // Act
    const uitkomst = leesEventPatch({ locatie: null })

    // Assert
    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.locatie).toBeNull()
  })
})

describe('schrijfFoutHttp', () => {
  it('vertaalt niet-gekoppeld naar 409', () => {
    // Act
    const http = schrijfFoutHttp(new AgendaSchrijfFout('niet_gekoppeld'))

    // Assert
    expect(http).toEqual({ status: 409, bericht: expect.any(String) })
  })

  it('vertaalt niet-gevonden naar 404 en google naar 502', () => {
    // Act + Assert
    expect(schrijfFoutHttp(new AgendaSchrijfFout('niet_gevonden'))?.status).toBe(404)
    expect(schrijfFoutHttp(new AgendaSchrijfFout('google'))?.status).toBe(502)
  })

  it('geeft bij ongeldig de leesbare melding door', () => {
    // Act
    const http = schrijfFoutHttp(new AgendaSchrijfFout('ongeldig', 'Titel ontbreekt.'))

    // Assert
    expect(http).toEqual({ status: 400, bericht: 'Titel ontbreekt.' })
  })

  it('geeft null bij een gewone fout — die hoort een 500 te worden', () => {
    // Act + Assert — alleen AgendaSchrijfFout mag naar een nette status; de rest
    // is een echte bug en moet niet als "verwachte" fout verkleed worden.
    expect(schrijfFoutHttp(new Error('kapot'))).toBeNull()
    expect(schrijfFoutHttp(null)).toBeNull()
  })
})
