import { describe, it, expect, afterEach, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { GET, POST, verwerkBericht, type VerwerkDeps } from './route'
import type { WhatsAppBericht } from '@/lib/lifeos/whatsapp/update'
import type { AudioBestand } from '@/lib/lifeos/telegram/transcribe'
import type { UitvoerDeps } from '@/lib/lifeos/telegram/uitvoeren'

// ─── De handtekening + allowlist zijn de ENIGE beveiliging van deze publieke route ─
// Meta pusht server-to-server, er is geen sessie. Dus die twee testen we het
// strengst: een fout/ontbrekende handtekening mag nooit voorbij 401 komen, en een
// nummer buiten de allowlist mag NIETS uitvoeren. Dat de allowlist-tests slagen
// zónder LIFEOS_WHATSAPP_TOKEN / ANTHROPIC_API_KEY / LifeOS-env is het bewijs zelf:
// kwam de gate ooit voorbij, dan zou `maakWhatsAppClient()`/`maakAnthropicModel()`
// gooien.

const APP_SECRET = 'test-whatsapp-app-secret-1234567890'
const VERIFY_TOKEN = 'test-verify-token-abcdef123'

const oud = {
  secret: process.env.LIFEOS_WHATSAPP_APP_SECRET,
  verify: process.env.LIFEOS_WHATSAPP_VERIFY_TOKEN,
  allow: process.env.LIFEOS_WHATSAPP_ALLOWED_FROM,
}
afterEach(() => {
  for (const [k, v] of [
    ['LIFEOS_WHATSAPP_APP_SECRET', oud.secret],
    ['LIFEOS_WHATSAPP_VERIFY_TOKEN', oud.verify],
    ['LIFEOS_WHATSAPP_ALLOWED_FROM', oud.allow],
  ] as const) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

function teken(body: string, secret = APP_SECRET): string {
  return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`
}

function post(body: unknown, handtekening?: string): NextRequest {
  const rauw = JSON.stringify(body)
  const sig = handtekening ?? teken(rauw)
  return new NextRequest('https://mentaforce.test/api/lifeos/whatsapp/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
    body: rauw,
  })
}

/** Een geldige WhatsApp Cloud API-tekstpayload van `from`. */
function tekstPayload(from: string, tekst: string): unknown {
  return {
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              messages: [{ from, id: 'wamid.x', type: 'text', text: { body: tekst } }],
            },
          },
        ],
      },
    ],
  }
}

describe('POST /api/lifeos/whatsapp/webhook — handtekening', () => {
  it('wijst af (401) zonder app-secret geconfigureerd', async () => {
    delete process.env.LIFEOS_WHATSAPP_APP_SECRET
    const res = await POST(post(tekstPayload('31611111111', 'hoi')))
    expect(res.status).toBe(401)
  })

  it('wijst af (401) bij een verkeerde handtekening', async () => {
    process.env.LIFEOS_WHATSAPP_APP_SECRET = APP_SECRET
    const res = await POST(post(tekstPayload('31611111111', 'hoi'), teken('iets anders', 'verkeerd-secret')))
    expect(res.status).toBe(401)
  })

  it('wijst af (401) zonder handtekening-header', async () => {
    process.env.LIFEOS_WHATSAPP_APP_SECRET = APP_SECRET
    const req = new NextRequest('https://mentaforce.test/api/lifeos/whatsapp/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(tekstPayload('31611111111', 'hoi')),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/lifeos/whatsapp/webhook — allowlist (fail-closed)', () => {
  it('ackt (200) zonder te verwerken als het nummer niet op de allowlist staat', async () => {
    process.env.LIFEOS_WHATSAPP_APP_SECRET = APP_SECRET
    process.env.LIFEOS_WHATSAPP_ALLOWED_FROM = '31600000000'
    const res = await POST(post(tekstPayload('31699999999', 'maak een taak')))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('verwerkt NIETS als de allowlist ontbreekt — fail-closed', async () => {
    process.env.LIFEOS_WHATSAPP_APP_SECRET = APP_SECRET
    delete process.env.LIFEOS_WHATSAPP_ALLOWED_FROM
    const res = await POST(post(tekstPayload('31612345678', 'zet morgen 9 uur een afspraak')))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('ackt (200) een status-callback (geen bericht) met geldige handtekening', async () => {
    process.env.LIFEOS_WHATSAPP_APP_SECRET = APP_SECRET
    const payload = { entry: [{ changes: [{ field: 'messages', value: { statuses: [{ status: 'delivered' }] } }] }] }
    const res = await POST(post(payload))
    expect(res.status).toBe(200)
  })
})

describe('GET /api/lifeos/whatsapp/webhook — Meta-verificatie', () => {
  function get(params: Record<string, string>): NextRequest {
    const url = new URL('https://mentaforce.test/api/lifeos/whatsapp/webhook')
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    return new NextRequest(url, { method: 'GET' })
  }

  it('echoot de challenge (200) bij het juiste verify-token', async () => {
    process.env.LIFEOS_WHATSAPP_VERIFY_TOKEN = VERIFY_TOKEN
    const res = await GET(
      get({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '31415' }),
    )
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toBe('31415')
  })

  it('wijst af (403) bij een verkeerd verify-token', async () => {
    process.env.LIFEOS_WHATSAPP_VERIFY_TOKEN = VERIFY_TOKEN
    const res = await GET(
      get({ 'hub.mode': 'subscribe', 'hub.verify_token': 'fout', 'hub.challenge': '31415' }),
    )
    expect(res.status).toBe(403)
  })
})

// ─── De compositie: verwerkBericht (met nep-injecties, geen netwerk) ─────────
// De pure onderdelen zijn elders getest; hier bewijzen we dat de glue klopt:
// tekst → intentie → actie → uitvoeren → antwoord terug via de client.

function nepClient() {
  const verzonden: { naar: string; tekst: string }[] = []
  const media: string[] = []
  return {
    verzonden,
    media,
    async stuurBericht(naar: string, tekst: string) {
      verzonden.push({ naar, tekst })
    },
    async haalMedia(mediaId: string): Promise<AudioBestand> {
      media.push(mediaId)
      return { data: new ArrayBuffer(8), bestandsnaam: `${mediaId}.ogg`, mimeType: 'audio/ogg' }
    },
  }
}

function nepOpslag() {
  const taken: unknown[] = []
  const deps: UitvoerDeps = {
    maakTaak: async (_u, nieuw) => {
      taken.push(nieuw)
      return { ok: true }
    },
    maakNotitie: async () => ({ ok: true }),
    maakAgenda: async () => ({ ok: true }),
  }
  return { deps, taken }
}

/** Een model dat altijd dezelfde intentie teruggeeft — zonder Anthropic aan te raken. */
function nepModel(soort: string, titel: string) {
  return {
    classificeer: async () => ({
      soort,
      titel,
      wanneer: null,
      categorie: 'onbekend',
      vertrouwen: 0.9,
      toelichting: 'test',
    }),
  }
}

const nepTranscriber = { transcribeer: vi.fn(async () => 'niet vergeten de vuilnis buiten te zetten') }

function deps(over: Partial<VerwerkDeps> = {}): VerwerkDeps {
  const opslag = nepOpslag()
  return {
    userId: 'user-1',
    client: nepClient(),
    transcriber: nepTranscriber,
    model: nepModel('taak', 'Vuilnis buiten zetten'),
    nu: new Date('2026-07-21T10:00:00Z'),
    opslag: opslag.deps,
    ...over,
  }
}

function bericht(over: Partial<WhatsAppBericht> = {}): WhatsAppBericht {
  return { soort: 'tekst', from: '31612345678', tekst: 'vuilnis buiten zetten', ...over } as WhatsAppBericht
}

describe('verwerkBericht', () => {
  it('maakt van een tekstbericht een taak en bevestigt via de client', async () => {
    const client = nepClient()
    const opslag = nepOpslag()
    await verwerkBericht(
      bericht(),
      deps({ client, opslag: opslag.deps, model: nepModel('taak', 'Vuilnis buiten zetten') }),
    )
    expect(opslag.taken).toHaveLength(1)
    expect(client.verzonden).toHaveLength(1)
    expect(client.verzonden[0]?.naar).toBe('31612345678')
    expect(client.verzonden[0]?.tekst).toContain('Vuilnis buiten zetten')
  })

  it('transcribeert een spraakmemo eerst en verwerkt die tekst', async () => {
    const client = nepClient()
    nepTranscriber.transcribeer.mockClear()
    await verwerkBericht(
      bericht({ soort: 'spraak', mediaId: 'media-42', tekst: undefined } as unknown as Partial<WhatsAppBericht>),
      deps({ client }),
    )
    expect(client.media).toEqual(['media-42']) // media gedownload
    expect(nepTranscriber.transcribeer).toHaveBeenCalledOnce()
    expect(client.verzonden).toHaveLength(1) // en beantwoord
  })

  it('meldt bij een genegeerd type dat alleen tekst/spraak werkt — zonder te verwerken', async () => {
    const client = nepClient()
    const opslag = nepOpslag()
    await verwerkBericht(bericht({ soort: 'genegeerd', tekst: undefined } as unknown as Partial<WhatsAppBericht>), deps({ client, opslag: opslag.deps }))
    expect(opslag.taken).toHaveLength(0)
    expect(client.verzonden[0]?.tekst).toContain('tekstberichten en spraakmemo')
  })
})
