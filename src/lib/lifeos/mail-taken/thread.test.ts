import { describe, expect, test } from 'vitest'
import { eersteAntwoordNa } from './thread'

const NA = new Date('2026-10-01T08:00:00Z')

describe('eersteAntwoordNa', () => {
  test('een verstuurd bericht na de mail telt', () => {
    const ruw = {
      messages: [
        { labelIds: ['INBOX'], internalDate: String(NA.getTime()) },
        { labelIds: ['SENT'], internalDate: String(NA.getTime() + 3_600_000) },
      ],
    }
    expect(eersteAntwoordNa(ruw, NA)?.toISOString()).toBe('2026-10-01T09:00:00.000Z')
  })
  test('alleen eerder verstuurd (jij begon het gesprek) → nog niet gereageerd', () => {
    expect(eersteAntwoordNa({ messages: [{ labelIds: ['SENT'], internalDate: String(NA.getTime() - 1) }] }, NA)).toBeNull()
  })
  test('onzin → null', () => {
    expect(eersteAntwoordNa(null, NA)).toBeNull()
    expect(eersteAntwoordNa({ messages: 'x' }, NA)).toBeNull()
  })
})
