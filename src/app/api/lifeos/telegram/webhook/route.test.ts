import { describe, it, expect, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, chatIdToegestaan } from './route'

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
// Het secret bewijst "van Telegram", de allowlist bewijst "van jou". We testen
// de pure beslissing rechtstreeks — geen netwerk, geen model.
describe('chatIdToegestaan', () => {
  it('laat alles door als er geen allowlist staat (secret is de gate)', () => {
    delete process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID
    expect(chatIdToegestaan(123)).toBe(true)
  })

  it('laat alles door bij een lege/witruimte-allowlist', () => {
    process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID = '   '
    expect(chatIdToegestaan(123)).toBe(true)
  })

  it('laat alleen de toegestane chat door', () => {
    process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID = '42'
    expect(chatIdToegestaan(42)).toBe(true)
    expect(chatIdToegestaan(43)).toBe(false)
  })

  it('ondersteunt meerdere chats (komma-gescheiden, met witruimte)', () => {
    process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID = '42, 99 , 7'
    expect(chatIdToegestaan(99)).toBe(true)
    expect(chatIdToegestaan(7)).toBe(true)
    expect(chatIdToegestaan(8)).toBe(false)
  })
})

describe('POST /api/lifeos/telegram/webhook — chat-id-allowlist', () => {
  it('ackt (200) zonder te verwerken als de chat niet op de allowlist staat', async () => {
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET = SECRET
    process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID = '42'
    // Een echt tekstbericht van een VREEMDE chat (99). Zou de allowlist ontbreken,
    // dan raakte dit het model/de bot; nu wordt het vóór verwerking stil geackt —
    // en dus zonder netwerk. Dat de test zonder model-env slaagt, bewíjst dat.
    const res = await POST(
      post({ [SECRET_HEADER]: SECRET }, { message: { chat: { id: 99 }, text: 'maak een taak' } }),
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })
})
