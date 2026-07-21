import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { narrowWebhookStatus, webhookUrl } from './webhook-beheer'

// De narrowing is de systeemgrens: Telegram's getWebhookInfo-antwoord → onze
// `WebhookStatus`. Een hernoemd of ontbrekend veld mag "onbekend" worden, nooit
// een crash. Puur, dus zonder netwerk.
describe('narrowWebhookStatus', () => {
  test('volledige body → alle velden', () => {
    const body = {
      ok: true,
      result: {
        url: 'https://mentaforce.nl/api/lifeos/telegram/webhook',
        pending_update_count: 3,
        last_error_message: 'Wrong response from the webhook: 401 Unauthorized',
      },
    }
    expect(narrowWebhookStatus(body)).toEqual({
      url: 'https://mentaforce.nl/api/lifeos/telegram/webhook',
      wachtrij: 3,
      laatsteFout: 'Wrong response from the webhook: 401 Unauthorized',
    })
  })

  test('geen webhook geregistreerd (lege url, geen fout) → nette leegstand', () => {
    const body = { ok: true, result: { url: '', pending_update_count: 0 } }
    expect(narrowWebhookStatus(body)).toEqual({ url: '', wachtrij: 0, laatsteFout: null })
  })

  test('lege last_error_message telt als geen fout', () => {
    const body = { ok: true, result: { url: 'https://x', pending_update_count: 0, last_error_message: '   ' } }
    expect(narrowWebhookStatus(body)?.laatsteFout).toBeNull()
  })

  test.each([null, undefined, {}, { result: null }, { result: 'kapot' }, 'tekst'])(
    'onbegrijpelijke body (%s) → null',
    (body) => {
      expect(narrowWebhookStatus(body)).toBeNull()
    },
  )
})

describe('webhookUrl', () => {
  const oud = { app: process.env.APP_URL, pub: process.env.NEXT_PUBLIC_APP_URL }

  beforeEach(() => {
    delete process.env.APP_URL
    delete process.env.NEXT_PUBLIC_APP_URL
  })
  afterEach(() => {
    if (oud.app === undefined) delete process.env.APP_URL
    else process.env.APP_URL = oud.app
    if (oud.pub === undefined) delete process.env.NEXT_PUBLIC_APP_URL
    else process.env.NEXT_PUBLIC_APP_URL = oud.pub
  })

  test('APP_URL wint en de trailing slash verdwijnt', () => {
    process.env.APP_URL = 'https://mentaforce.nl/'
    expect(webhookUrl()).toBe('https://mentaforce.nl/api/lifeos/telegram/webhook')
  })

  test('valt terug op NEXT_PUBLIC_APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://mentaforce.nl'
    expect(webhookUrl()).toBe('https://mentaforce.nl/api/lifeos/telegram/webhook')
  })

  test('geen van beide gezet → null', () => {
    expect(webhookUrl()).toBeNull()
  })
})
