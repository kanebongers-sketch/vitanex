import { describe, it, expect } from 'vitest'
import { leesWhatsAppBericht } from './update'

/**
 * Bouwt een minimale, geldige Cloud API-webhookenvelop rond één `messages[0]`.
 * Zo testen we de takken zonder telkens de volledige nesting te herhalen.
 */
function envelop(bericht: unknown): unknown {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { phone_number_id: '123' },
              messages: [bericht],
            },
          },
        ],
      },
    ],
  }
}

describe('leesWhatsAppBericht', () => {
  it('leest een tekstbericht met afzender en inhoud', () => {
    // Arrange
    const payload = envelop({ from: '31612345678', id: 'wamid.1', type: 'text', text: { body: 'hallo' } })
    // Act
    const b = leesWhatsAppBericht(payload)
    // Assert
    expect(b).toEqual({ soort: 'tekst', from: '31612345678', tekst: 'hallo' })
  })

  it('leest een spraakmemo (type audio) en pakt het media-id', () => {
    // Arrange
    const payload = envelop({ from: '31612345678', id: 'wamid.2', type: 'audio', audio: { id: 'MEDIA_9', voice: true } })
    // Act
    const b = leesWhatsAppBericht(payload)
    // Assert
    expect(b).toEqual({ soort: 'spraak', from: '31612345678', mediaId: 'MEDIA_9' })
  })

  it('markeert een niet-verwerkt type (image) als genegeerd, met behoud van afzender', () => {
    // Arrange
    const payload = envelop({ from: '31600000000', id: 'wamid.3', type: 'image', image: { id: 'IMG_1' } })
    // Act
    const b = leesWhatsAppBericht(payload)
    // Assert
    expect(b).toEqual({ soort: 'genegeerd', from: '31600000000' })
  })

  it('negeert een STATUS-callback (statuses, geen messages) → null', () => {
    // Arrange — bezorgd/gelezen-bevestiging: geen bericht om te verwerken.
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_ID',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '123' },
                statuses: [{ id: 'wamid.x', status: 'delivered', recipient_id: '31612345678' }],
              },
            },
          ],
        },
      ],
    }
    // Act & Assert
    expect(leesWhatsAppBericht(payload)).toBeNull()
  })

  it('geeft null bij ontbrekende entry / changes / value / messages', () => {
    // Arrange & Act & Assert
    expect(leesWhatsAppBericht({ object: 'whatsapp_business_account' })).toBeNull()
    expect(leesWhatsAppBericht({ entry: [{ id: 'x' }] })).toBeNull()
    expect(leesWhatsAppBericht({ entry: [{ changes: [{ field: 'messages' }] }] })).toBeNull()
  })

  it('geeft null bij een leeg messages-array', () => {
    // Arrange
    const payload = {
      entry: [{ changes: [{ value: { messaging_product: 'whatsapp', messages: [] } }] }],
    }
    // Act & Assert
    expect(leesWhatsAppBericht(payload)).toBeNull()
  })

  it('geeft null als de afzender ontbreekt', () => {
    // Arrange
    const payload = envelop({ id: 'wamid.4', type: 'text', text: { body: 'wie ben ik' } })
    // Act & Assert
    expect(leesWhatsAppBericht(payload)).toBeNull()
  })

  it('geeft null bij een tekstbericht zonder bruikbare body', () => {
    // Arrange — lege body en ontbrekende body: er valt niets te verwerken.
    const leeg = envelop({ from: '31612345678', id: 'wamid.5', type: 'text', text: { body: '   ' } })
    const zonder = envelop({ from: '31612345678', id: 'wamid.6', type: 'text', text: {} })
    // Act & Assert
    expect(leesWhatsAppBericht(leeg)).toBeNull()
    expect(leesWhatsAppBericht(zonder)).toBeNull()
  })

  it('geeft null bij een audiobericht zonder media-id', () => {
    // Arrange
    const payload = envelop({ from: '31612345678', id: 'wamid.7', type: 'audio', audio: { voice: true } })
    // Act & Assert
    expect(leesWhatsAppBericht(payload)).toBeNull()
  })

  it('geeft null bij null of garbage-input', () => {
    // Arrange & Act & Assert
    expect(leesWhatsAppBericht(null)).toBeNull()
    expect(leesWhatsAppBericht(undefined)).toBeNull()
    expect(leesWhatsAppBericht('kapot')).toBeNull()
    expect(leesWhatsAppBericht(42)).toBeNull()
    expect(leesWhatsAppBericht([])).toBeNull()
  })
})
