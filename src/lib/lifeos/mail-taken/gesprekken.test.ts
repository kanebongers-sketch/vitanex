import { describe, expect, test } from 'vitest'
import { wachtOpJou } from './gesprekken'

const IK = 'kane@gmail.com'
function bericht(id: string, ms: number, labels: string[], from = 'Jan <jan@example.nl>', to = IK) {
  return { id, threadId: 't1', internalDate: String(ms), labelIds: labels, payload: { headers: [{ name: 'From', value: from }, { name: 'To', value: to }, { name: 'Subject', value: 'Vraag over rooster' }] } }
}

describe('wachtOpJou', () => {
  test('laatste bericht van een ander, in je inbox (ook al gelezen) → wacht op jou', () => {
    const m = wachtOpJou({ messages: [bericht('a', 1, ['INBOX']), bericht('b', 3, ['SENT'], IK, 'jan@example.nl'), bericht('c', 5, ['INBOX', 'IMPORTANT'])] }, IK)
    expect(m).toMatchObject({ id: 'c', threadId: 't1', afzenderNaam: 'Jan', aanMij: true, onderwerp: 'Vraag over rooster' })
  })
  test('jij reageerde als laatste → niets', () => {
    expect(wachtOpJou({ messages: [bericht('a', 1, ['INBOX']), bericht('b', 3, ['SENT'], IK)] }, IK)).toBeNull()
  })
  test('gearchiveerd (niet meer in inbox) → afgehandeld', () => {
    expect(wachtOpJou({ messages: [bericht('a', 1, [])] }, IK)).toBeNull()
  })
  test('concepten tellen niet mee; volgorde op tijd, niet op lijst', () => {
    const m = wachtOpJou({ messages: [bericht('c', 5, ['INBOX']), bericht('d', 9, ['DRAFT']), bericht('a', 1, ['SENT'], IK)] }, IK)
    expect(m?.id).toBe('c')
  })
  test('onzin → null', () => {
    expect(wachtOpJou(null, IK)).toBeNull()
    expect(wachtOpJou({ messages: [] }, IK)).toBeNull()
  })
})
