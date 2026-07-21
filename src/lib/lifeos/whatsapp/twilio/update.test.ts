import { describe, it, expect } from 'vitest'
import { leesTwilioBericht } from './update'

/**
 * Bouwt een Twilio-achtige `URLSearchParams` uit een platte veld-map. Zo testen
 * we de takken zoals Twilio ze echt POST: als form-urlencoded velden.
 */
function params(velden: Record<string, string>): URLSearchParams {
  return new URLSearchParams(velden)
}

describe('leesTwilioBericht', () => {
  it('leest een tekstbericht met afzender en inhoud', () => {
    // Arrange
    const p = params({ From: 'whatsapp:+31612345678', Body: 'hallo', NumMedia: '0' })
    // Act
    const b = leesTwilioBericht(p)
    // Assert
    expect(b).toEqual({ soort: 'tekst', from: 'whatsapp:+31612345678', tekst: 'hallo' })
  })

  it('leest een spraakmemo (audio/ogg) met media-URL en -type', () => {
    // Arrange
    const p = params({
      From: 'whatsapp:+31612345678',
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/media/ME123',
      MediaContentType0: 'audio/ogg',
    })
    // Act
    const b = leesTwilioBericht(p)
    // Assert
    expect(b).toEqual({
      soort: 'spraak',
      from: 'whatsapp:+31612345678',
      mediaUrl: 'https://api.twilio.com/media/ME123',
      mediaType: 'audio/ogg',
    })
  })

  it('markeert andere media (image/jpeg) als genegeerd, met behoud van afzender', () => {
    // Arrange
    const p = params({
      From: 'whatsapp:+31600000000',
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/media/IMG1',
      MediaContentType0: 'image/jpeg',
    })
    // Act
    const b = leesTwilioBericht(p)
    // Assert
    expect(b).toEqual({ soort: 'genegeerd', from: 'whatsapp:+31600000000' })
  })

  it('geeft null als de afzender (From) ontbreekt', () => {
    // Arrange
    const p = params({ Body: 'wie ben ik', NumMedia: '0' })
    // Act & Assert
    expect(leesTwilioBericht(p)).toBeNull()
  })

  it('geeft null zonder body en zonder media', () => {
    // Arrange
    const p = params({ From: 'whatsapp:+31612345678', NumMedia: '0' })
    // Act & Assert
    expect(leesTwilioBericht(p)).toBeNull()
  })

  it('trimt witruimte rond de body', () => {
    // Arrange
    const p = params({ From: 'whatsapp:+31612345678', Body: '   hallo daar   ', NumMedia: '0' })
    // Act
    const b = leesTwilioBericht(p)
    // Assert
    expect(b).toEqual({ soort: 'tekst', from: 'whatsapp:+31612345678', tekst: 'hallo daar' })
  })

  it('laat spraak winnen als er én body én audio is', () => {
    // Arrange — een spraakmemo met begeleidende tekst: audio wint.
    const p = params({
      From: 'whatsapp:+31612345678',
      Body: 'genegeerde bijschrifttekst',
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/media/ME999',
      MediaContentType0: 'audio/ogg',
    })
    // Act
    const b = leesTwilioBericht(p)
    // Assert
    expect(b).toEqual({
      soort: 'spraak',
      from: 'whatsapp:+31612345678',
      mediaUrl: 'https://api.twilio.com/media/ME999',
      mediaType: 'audio/ogg',
    })
  })
})
