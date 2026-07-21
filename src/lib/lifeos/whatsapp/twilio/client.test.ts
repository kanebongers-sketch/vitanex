// Tests voor de Twilio-media-client. We raken NOOIT het echte netwerk: `fetch` wordt
// gestubd en de omgeving via `vi.stubEnv`. De kern die telt: de env-controle, de
// Basic-auth-header, de extensie-afleiding per Content-Type, de fout-paden, en de
// GEHEIMHOUDING (credentials/URL nooit in een fout).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { maakTwilioClient } from './client'

const SID = 'ACtestsid1234567890'
const TOKEN = 'geheim-auth-token'
// Twilio's Basic-auth is base64("SID:TOKEN"); zo hoort de header eruit te zien.
const VERWACHTE_AUTH = `Basic ${Buffer.from(`${SID}:${TOKEN}`).toString('base64')}`
const MEDIA_URL =
  'https://api.twilio.com/2010-04-01/Accounts/ACtestsid1234567890/Messages/MM123/Media/ME_GEHEIM_456'

/** Zet beide vereiste env-vars; losse tests kunnen er daarna één weer weghalen. */
function stubGeldigeEnv(): void {
  vi.stubEnv('TWILIO_ACCOUNT_SID', SID)
  vi.stubEnv('TWILIO_AUTH_TOKEN', TOKEN)
}

/** Binaire Response (de gedownloade audiobytes) met een gekozen Content-Type. */
function audioRespons(bytes: number[], contentType: string | null, status = 200): Response {
  const headers = contentType !== null ? { 'Content-Type': contentType } : undefined
  return new Response(new Uint8Array(bytes), { status, headers })
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

describe('maakTwilioClient — ontbrekende configuratie', () => {
  it('gooit een duidelijke NL-fout als de Account SID ontbreekt', () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', '')
    expect(() => maakTwilioClient()).toThrowError(/TWILIO_ACCOUNT_SID ontbreekt/)
  })

  it('gooit een duidelijke NL-fout als het Auth Token ontbreekt', () => {
    vi.stubEnv('TWILIO_AUTH_TOKEN', '')
    expect(() => maakTwilioClient()).toThrowError(/TWILIO_AUTH_TOKEN ontbreekt/)
  })

  it('leest de env pas bij de aanroep, niet bij import (config zit in de closure)', () => {
    // Beide gezet in beforeEach → bouwen mag niet gooien.
    expect(() => maakTwilioClient()).not.toThrow()
  })
})

describe('haalMedia — download en Basic-auth', () => {
  it('geldige download (audio/ogg) → AudioBestand met .ogg en de Basic-auth-header', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(audioRespons([1, 2, 3], 'audio/ogg'))
    vi.stubGlobal('fetch', fetchMock)

    const bestand = await maakTwilioClient().haalMedia(MEDIA_URL)

    expect(new Uint8Array(bestand.data)).toEqual(new Uint8Array([1, 2, 3]))
    expect(bestand.bestandsnaam).toBe('spraak.ogg')
    expect(bestand.mimeType).toBe('audio/ogg')

    // Precies één GET naar de meegegeven MediaUrl.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(MEDIA_URL)

    // Cruciaal: HTTP Basic auth = base64("SID:TOKEN").
    const headers = fetchOpties(fetchMock, 0).headers as Record<string, string>
    expect(headers.Authorization).toBe(VERWACHTE_AUTH)
  })

  it('Content-Type audio/mpeg → .mp3-extensie', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(audioRespons([9], 'audio/mpeg'))
    vi.stubGlobal('fetch', fetchMock)

    const bestand = await maakTwilioClient().haalMedia(MEDIA_URL)
    expect(bestand.bestandsnaam).toBe('spraak.mp3')
    expect(bestand.mimeType).toBe('audio/mpeg')
  })

  it.each([
    ['audio/mp4', 'spraak.m4a'],
    ['audio/m4a', 'spraak.m4a'],
    ['audio/amr', 'spraak.amr'],
    ['audio/ogg; codecs=opus', 'spraak.ogg'],
    ['iets/onbekends', 'spraak.ogg'],
  ])('Content-Type %s → bestandsnaam %s', async (contentType, verwacht) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(audioRespons([7], contentType))
    vi.stubGlobal('fetch', fetchMock)

    const bestand = await maakTwilioClient().haalMedia(MEDIA_URL)
    expect(bestand.bestandsnaam).toBe(verwacht)
  })

  it('valt terug op audio/ogg als Content-Type ontbreekt', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(audioRespons([5], null))
    vi.stubGlobal('fetch', fetchMock)

    const bestand = await maakTwilioClient().haalMedia(MEDIA_URL)
    expect(bestand.mimeType).toBe('audio/ogg')
    expect(bestand.bestandsnaam).toBe('spraak.ogg')
  })

  it('geeft een AbortSignal mee aan de fetch (time-out-bescherming)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(audioRespons([1], 'audio/ogg'))
    vi.stubGlobal('fetch', fetchMock)

    await maakTwilioClient().haalMedia(MEDIA_URL)
    expect(fetchOpties(fetchMock, 0).signal).toBeInstanceOf(AbortSignal)
  })
})

describe('haalMedia — fout-paden', () => {
  it('!ok → fout met de HTTP-status', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(audioRespons([], 'text/html', 404))
    vi.stubGlobal('fetch', fetchMock)

    await expect(maakTwilioClient().haalMedia(MEDIA_URL)).rejects.toThrow(/HTTP 404/)
  })

  it('netwerkfout/time-out → schone NL-fout', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('ECONNRESET'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(maakTwilioClient().haalMedia(MEDIA_URL)).rejects.toThrow(
      /Twilio media downloaden mislukte \(netwerkfout of time-out\)/,
    )
  })
})

describe('haalMedia — GEHEIMHOUDING', () => {
  it('lekt de media-URL en credentials NIET in de fout bij een mislukte download', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(audioRespons([], 'text/html', 403))
    vi.stubGlobal('fetch', fetchMock)

    const fout = await maakTwilioClient()
      .haalMedia(MEDIA_URL)
      .catch((e: unknown) => (e instanceof Error ? e.message : String(e)))

    expect(fout).toMatch(/HTTP 403/)
    expect(fout).not.toContain('ME_GEHEIM_456')
    expect(fout).not.toContain(MEDIA_URL)
    expect(fout).not.toContain(TOKEN)
    expect(fout).not.toContain(SID)
  })

  it('lekt de credentials NIET in de fout bij een netwerkfout', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error(`boom ${TOKEN}`))
    vi.stubGlobal('fetch', fetchMock)

    const fout = await maakTwilioClient()
      .haalMedia(MEDIA_URL)
      .catch((e: unknown) => (e instanceof Error ? e.message : String(e)))

    // De onderliggende fout-tekst (die de token zou kunnen bevatten) wordt niet doorgegeven.
    expect(fout).not.toContain(TOKEN)
    expect(fout).not.toContain(MEDIA_URL)
  })
})
