// Tests voor de WhatsApp Cloud API-client. We raken NOOIT het echte netwerk:
// `fetch` wordt gestubd en de omgeving via `vi.stubEnv`. De kern die telt en puur
// testbaar is: het veilig narrowen van het media-metadata-antwoord, de twee-staps
// media-download, de fout-paden, en de GEHEIMHOUDING (token/URL nooit in een fout).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { maakWhatsAppClient } from './client'

const TOKEN = 'geheime-bot-token'
const PHONE_ID = '109876543210987'

/** Zet beide vereiste env-vars; losse tests kunnen er daarna één weer weghalen. */
function stubGeldigeEnv(): void {
  vi.stubEnv('LIFEOS_WHATSAPP_TOKEN', TOKEN)
  vi.stubEnv('LIFEOS_WHATSAPP_PHONE_NUMBER_ID', PHONE_ID)
}

/** JSON-Response bouwen zoals Meta die zou teruggeven. */
function jsonRespons(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Binaire Response (de gedownloade audiobytes). */
function bytesRespons(bytes: number[], status = 200): Response {
  return new Response(new Uint8Array(bytes), { status })
}

/** Leest de options van de N-de fetch-aanroep type-veilig uit, zonder `any`. */
function fetchOpties(mock: ReturnType<typeof vi.fn>, index: number): RequestInit {
  const call = mock.mock.calls[index]
  return (call?.[1] ?? {}) as RequestInit
}

beforeEach(() => {
  stubGeldigeEnv()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('maakWhatsAppClient — ontbrekende configuratie', () => {
  it('gooit een duidelijke NL-fout als de token ontbreekt', () => {
    vi.stubEnv('LIFEOS_WHATSAPP_TOKEN', '')
    expect(() => maakWhatsAppClient()).toThrowError(/LIFEOS_WHATSAPP_TOKEN ontbreekt/)
  })

  it('gooit een duidelijke NL-fout als het phone number id ontbreekt', () => {
    vi.stubEnv('LIFEOS_WHATSAPP_PHONE_NUMBER_ID', '')
    expect(() => maakWhatsAppClient()).toThrowError(/LIFEOS_WHATSAPP_PHONE_NUMBER_ID ontbreekt/)
  })

  it('leest de env pas bij de aanroep, niet bij import (config zit in de closure)', () => {
    // Beide gezet in beforeEach → bouwen mag niet gooien.
    expect(() => maakWhatsAppClient()).not.toThrow()
  })
})

describe('haalMedia — twee-staps download en narrowing', () => {
  it('geldig 2-staps antwoord → juiste AudioBestand, met Bearer op BEIDE calls', async () => {
    const mediaId = '77551234'
    const url = 'https://lookaside.fbsbx.com/whatsapp/attach?mid=abc&hash=ZWABC123'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonRespons({ url, mime_type: 'audio/ogg; codecs=opus', file_size: 3 }))
      .mockResolvedValueOnce(bytesRespons([1, 2, 3]))
    vi.stubGlobal('fetch', fetchMock)

    const bestand = await maakWhatsAppClient().haalMedia(mediaId)

    expect(new Uint8Array(bestand.data)).toEqual(new Uint8Array([1, 2, 3]))
    expect(bestand.bestandsnaam).toBe('77551234.ogg')
    expect(bestand.mimeType).toBe('audio/ogg; codecs=opus')

    // Stap 1 raakt de metadata-endpoint, stap 2 de ondertekende URL.
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe('https://graph.facebook.com/v21.0/77551234')
    expect(fetchMock.mock.calls[1][0]).toBe(url)

    // Cruciaal: de Bearer moet óók op de download-host mee (Meta eist dat).
    const headers0 = fetchOpties(fetchMock, 0).headers as Record<string, string>
    const headers1 = fetchOpties(fetchMock, 1).headers as Record<string, string>
    expect(headers0.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(headers1.Authorization).toBe(`Bearer ${TOKEN}`)
  })

  it('valt terug op audio/ogg als mime_type ontbreekt of leeg is', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonRespons({ url: 'https://host/x' })) // geen mime_type
      .mockResolvedValueOnce(bytesRespons([9]))
    vi.stubGlobal('fetch', fetchMock)

    const bestand = await maakWhatsAppClient().haalMedia('42')
    expect(bestand.mimeType).toBe('audio/ogg')
    expect(bestand.bestandsnaam).toBe('42.ogg')
  })

  it('media-antwoord ZONDER url → duidelijke fout, geen tweede fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonRespons({ mime_type: 'audio/ogg' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(maakWhatsAppClient().haalMedia('42')).rejects.toThrow(/geen bruikbare media-URL/)
    // De download mag niet starten als er geen URL is.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['lege url', { url: '', mime_type: 'audio/ogg' }],
    ['url is geen string', { url: 123, mime_type: 'audio/ogg' }],
    ['body is geen object', 'kapot'],
    ['body is null', null],
  ])('onbruikbaar media-antwoord (%s) → fout', async (_naam, body) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonRespons(body))
    vi.stubGlobal('fetch', fetchMock)
    await expect(maakWhatsAppClient().haalMedia('42')).rejects.toThrow(/geen bruikbare media-URL/)
  })

  it('metadata HTTP-fout → fout met status én Meta-fouttekst', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonRespons({ error: { message: 'Unsupported get request' } }, 400))
    vi.stubGlobal('fetch', fetchMock)

    await expect(maakWhatsAppClient().haalMedia('42')).rejects.toThrow(/HTTP 400/)
  })

  it('netwerkfout op stap 1 → schone fout zonder de mediaId-URL', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('ECONNRESET'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(maakWhatsAppClient().haalMedia('42')).rejects.toThrow(/media-metadata ophalen mislukte/)
  })
})

describe('haalMedia — GEHEIMHOUDING', () => {
  it('lekt de ondertekende download-URL en token NIET in de fout bij een mislukte download', async () => {
    const geheimeUrl = 'https://lookaside.fbsbx.com/whatsapp/attach?mid=abc&hash=SUPERGEHEIM_TOKEN'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonRespons({ url: geheimeUrl, mime_type: 'audio/ogg' }))
      .mockResolvedValueOnce(bytesRespons([], 403)) // download geweigerd
    vi.stubGlobal('fetch', fetchMock)

    const fout = await maakWhatsAppClient()
      .haalMedia('42')
      .catch((e: unknown) => (e instanceof Error ? e.message : String(e)))

    expect(fout).toMatch(/HTTP 403/)
    expect(fout).not.toContain('SUPERGEHEIM_TOKEN')
    expect(fout).not.toContain('lookaside.fbsbx.com')
    expect(fout).not.toContain(TOKEN)
  })
})

describe('stuurBericht', () => {
  it('POST naar {basis}/{phoneId}/messages met de juiste envelop en headers', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await maakWhatsAppClient().stuurBericht('31612345678', 'Hoi vanuit LifeOS')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`)

    const opties = fetchOpties(fetchMock, 0)
    expect(opties.method).toBe('POST')
    const headers = opties.headers as Record<string, string>
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(headers['Content-Type']).toBe('application/json')

    expect(JSON.parse(String(opties.body))).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '31612345678',
      type: 'text',
      text: { body: 'Hoi vanuit LifeOS' },
    })
  })

  it('!ok → fout met HTTP-status en Meta-fouttekst', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonRespons({ error: { message: 'Invalid OAuth access token' } }, 401))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      maakWhatsAppClient().stuurBericht('31612345678', 'test'),
    ).rejects.toThrow(/HTTP 401.*Invalid OAuth access token/)
  })

  it('netwerkfout/time-out → schone fout', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('AbortError'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      maakWhatsAppClient().stuurBericht('31612345678', 'test'),
    ).rejects.toThrow(/WhatsApp-bericht versturen mislukte/)
  })

  it('lekt de token niet in de foutmelding', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('geweigerd', { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    const fout = await maakWhatsAppClient()
      .stuurBericht('31612345678', 'test')
      .catch((e: unknown) => (e instanceof Error ? e.message : String(e)))

    expect(fout).toMatch(/HTTP 500/)
    expect(fout).not.toContain(TOKEN)
  })
})
