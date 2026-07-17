import { describe, it, expect, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

// ─── De secret-verificatie is de ENIGE beveiliging van deze publieke route ──
// Dus die testen we het strengst: een fout of ontbrekend secret mag nooit
// verder komen dan een 401. Een geldig secret + een lege update (geen bericht)
// bewijst dat de gate opengaat zonder dat we het echte netwerk (Telegram/model)
// hoeven te raken.

const SECRET_HEADER = 'x-telegram-bot-api-secret-token'
const SECRET = 'super-geheim-telegram-token-1234567890'

const oud = process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET
const oudeAllowlist = process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID
afterEach(() => {
  if (oud === undefined) delete process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET
  else process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = oud
  if (oudeAllowlist === undefined) delete process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID
  else process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID = oudeAllowlist
})

function post(headers: Record<string, string>, body: unknown = {}): NextRequest {
  return new NextRequest('https://mentaforce.test/api/lifeos/telegram/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/lifeos/telegram/webhook — secret-verificatie', () => {
  it('wijst af (401) als er server-side geen secret is geconfigureerd', async () => {
    delete process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET
    const res = await POST(post({ [SECRET_HEADER]: SECRET }))
    expect(res.status).toBe(401)
  })

  it('wijst af (401) zonder de secret-header', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    const res = await POST(post({}))
    expect(res.status).toBe(401)
  })

  it('wijst af (401) bij een verkeerd secret', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    const res = await POST(post({ [SECRET_HEADER]: 'het-verkeerde-geheim' }))
    expect(res.status).toBe(401)
  })

  it('wijst af (401) bij een secret dat alleen een prefix deelt', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    const res = await POST(post({ [SECRET_HEADER]: SECRET.slice(0, -1) }))
    expect(res.status).toBe(401)
  })

  it('laat een geldig secret door (200) en ackt een update zonder bericht', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    // Lege update: geen `message`, dus de route ackt zonder model/bot aan te raken.
    const res = await POST(post({ [SECRET_HEADER]: SECRET }, {}))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('ackt (200) een geldig secret met een niet-verwerkbaar berichttype', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    // Een edited_message negeren we (leesTelegramBericht → null) → nette 200.
    const res = await POST(post({ [SECRET_HEADER]: SECRET }, { edited_message: { text: 'hoi' } }))
    expect(res.status).toBe(200)
  })
})

// ─── Chat-id-allowlist (defense-in-depth naast het secret) ──────────────────
// Het secret bewijst "van Telegram", de allowlist bewijst "van jou". De pure
// beslissing staat in `lib/lifeos/telegram/toegang.ts` en wordt daar getest;
// hier testen we alleen dat de ROUTE 'm respecteert en niets uitvoert.
//
// Dat deze tests slagen zónder LIFEOS_TELEGRAM_BOT_TOKEN, ANTHROPIC_API_KEY of
// LifeOS-database-env is het bewijs zelf: kwam de gate ooit voorbij, dan zou
// `maakTelegramBot()` / `maakAnthropicModel()` gooien en zou de test dat merken.
describe('POST /api/lifeos/telegram/webhook — chat-id-allowlist', () => {
  it('ackt (200) zonder te verwerken als de chat niet op de allowlist staat', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID = '42'
    const res = await POST(
      post({ [SECRET_HEADER]: SECRET }, { message: { chat: { id: 99 }, text: 'maak een taak' } }),
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('verwerkt NIETS als de allowlist ontbreekt — fail-closed', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    delete process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID
    // Dit is de regressie die ertoe doet. Vóór de fix liet een ontbrekende
    // allowlist ÁLLES door, en was het secret genoeg om autonoom een afspraak in
    // Kane's echte Google-agenda te laten zetten. Nu: stil acken, niets doen.
    const res = await POST(
      post(
        { [SECRET_HEADER]: SECRET },
        { message: { chat: { id: 12345 }, text: 'zet morgen om 9 uur een afspraak' } },
      ),
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('verwerkt NIETS bij een lege/witruimte-allowlist', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID = '   '
    const res = await POST(
      post({ [SECRET_HEADER]: SECRET }, { message: { chat: { id: 12345 }, text: 'maak een taak' } }),
    )
    expect(res.status).toBe(200)
  })
})
