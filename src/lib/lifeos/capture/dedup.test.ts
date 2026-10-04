import { describe, expect, it } from 'vitest'
import { BerichtDedup, VENSTER_MS, telegramBerichtId, twilioBerichtId, whatsAppBerichtId } from './dedup'

describe('BerichtDedup', () => {
  it('verwerkt een nieuw id en slaat de herhaling over', () => {
    const dedup = new BerichtDedup()
    expect(dedup.eerste('a', 0)).toBe(true)
    expect(dedup.eerste('a', 1_000)).toBe(false)
  })

  it('verwerkt hetzelfde id weer na het venster', () => {
    const dedup = new BerichtDedup()
    dedup.eerste('a', 0)
    expect(dedup.eerste('a', VENSTER_MS)).toBe(true)
  })

  it('verwerkt altijd als er geen id is', () => {
    const dedup = new BerichtDedup()
    expect(dedup.eerste(null)).toBe(true)
    expect(dedup.eerste(null)).toBe(true)
  })
})

describe('bericht-id per kanaal', () => {
  it('telegram: chat + message_id', () => {
    expect(telegramBerichtId({ update_id: 9, message: { message_id: 42, chat: { id: 7 } } })).toBe('telegram:7:42')
    expect(telegramBerichtId({ message: { chat: { id: 7 } } })).toBeNull()
  })

  it('whatsapp: het wamid', () => {
    const payload = { entry: [{ changes: [{ value: { messages: [{ id: 'wamid.X', from: '31' }] } }] }] }
    expect(whatsAppBerichtId(payload)).toBe('whatsapp:wamid.X')
    expect(whatsAppBerichtId({ entry: [{ changes: [{ value: { statuses: [] } }] }] })).toBeNull()
  })

  it('twilio: de MessageSid', () => {
    expect(twilioBerichtId(new URLSearchParams('MessageSid=SM1&From=x'))).toBe('twilio:SM1')
    expect(twilioBerichtId(new URLSearchParams('From=x'))).toBeNull()
  })
})
