import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { HttpAntwoord, HttpVerzoek, Tokens } from './adapter'
import { withings } from './adapters/withings'
import { strava } from './adapters/strava'
import { synchroniseer, tokensNaarTekst, trekIn, wachtTijd, type Koppeling, type KoppelingWijziging, type SyncContext, type SyncLogRegel, type SyncOpslag } from './sync'
import { GEEN_TOESTEMMING, type Toestemming } from './toestemming'
import { ontsleutelTokens, versleutelTokens } from './versleutelen'
import type { Meting } from './typen'

const SLEUTEL = Buffer.alloc(32, 7)
const NU = new Date('2026-10-23T12:00:00Z')
const fixture = (naam: string): unknown => JSON.parse(readFileSync(join(__dirname, 'fixtures', naam), 'utf8')) as unknown

function koppeling(tokens: Tokens, bron: Koppeling['bron'] = 'withings'): Koppeling {
  return { id: 'k1', userId: 'org', lidId: 'lid', bron, status: 'actief', tokensVersleuteld: versleutelTokens(tokensNaarTekst(tokens), SLEUTEL, { userId: 'org', lidId: 'lid', bron }), cursor: null, foutPogingen: 0 }
}

const TOKENS: Tokens = { accessToken: 'oud', refreshToken: 'ref', verlooptOp: new Date(NU.getTime() + 3600_000).toISOString(), externGebruikerId: '363', scope: null }

interface Nep {
  opslag: SyncOpslag
  bewaard: Meting[]
  wijzigingen: KoppelingWijziging[]
  log: SyncLogRegel[]
}

function nepOpslag(toestemming: Toestemming | null): Nep {
  const bewaard: Meting[] = []
  const wijzigingen: KoppelingWijziging[] = []
  const log: SyncLogRegel[] = []
  return {
    bewaard, wijzigingen, log,
    opslag: {
      haalToestemming: async () => toestemming,
      bewaarMetingen: async (_u, _l, m) => {
        // Zoals de database: uniek op bron en extern id.
        for (const x of m) if (!bewaard.some((b) => b.bron === x.bron && b.externId === x.externId)) bewaard.push(x)
        return m.length
      },
      werkKoppelingBij: async (_k, w) => {
        wijzigingen.push(w)
        return true
      },
      logSync: async (r) => {
        log.push(r)
      },
    },
  }
}

function http(antwoorden: HttpAntwoord[], verzoeken: HttpVerzoek[] = []): SyncContext['http'] {
  return async (v) => {
    verzoeken.push(v)
    const a = antwoorden.shift()
    if (!a) throw new Error('geen antwoord meer')
    return a
  }
}

const ok = (json: unknown, headers: Record<string, string> = {}): HttpAntwoord => ({ status: 200, headers, json })
const TOESTEMMING_ALLES: Toestemming = { ...GEEN_TOESTEMMING, delen: ['gewicht_kg', 'vetpercentage', 'spiermassa_kg', 'training'], gegevenOp: NU.toISOString() }

function ctx(nep: Nep, h: SyncContext['http'], adapter = withings): SyncContext {
  return { adapter, sleutels: { clientId: 'id', secret: 's' }, hoofdsleutel: SLEUTEL, opslag: nep.opslag, http: h, nu: NU }
}

describe('sync-engine', () => {
  it('haalt alle pagina\'s op, bewaart en schuift de cursor pas op het eind op', async () => {
    const nep = nepOpslag(TOESTEMMING_ALLES)
    const laatste = { status: 0, body: { updatetime: 1761300000, measuregrps: [], more: 0 } }
    const verzoeken: HttpVerzoek[] = []
    const u = await synchroniseer(ctx(nep, http([ok(fixture('withings-getmeas.json')), ok(laatste)], verzoeken)), koppeling(TOKENS))
    expect(u).toEqual({ status: 'ok', nieuw: 3 })
    expect(new URLSearchParams(verzoeken[1].body).get('offset')).toBe('3')
    expect(nep.wijzigingen.at(-1)).toMatchObject({ status: 'actief', cursor: '1761300000', foutPogingen: 0 })
    expect(nep.log[0]).toMatchObject({ status: 'ok', nieuw: 3, foutCode: null })
  })

  it('is idempotent: twee keer hetzelfde geeft geen dubbele metingen', async () => {
    const nep = nepOpslag(TOESTEMMING_ALLES)
    const meet = (): unknown => ({ ...(fixture('withings-getmeas.json') as Record<string, unknown>), body: { ...((fixture('withings-getmeas.json') as { body: Record<string, unknown> }).body), more: 0 } })
    await synchroniseer(ctx(nep, http([ok(meet())])), koppeling(TOKENS))
    await synchroniseer(ctx(nep, http([ok(meet())])), koppeling(TOKENS))
    expect(nep.bewaard).toHaveLength(3)
  })

  it('bewaart alleen soorten met toestemming', async () => {
    const nep = nepOpslag({ ...TOESTEMMING_ALLES, delen: ['gewicht_kg'] })
    const meet = { status: 0, body: { ...(fixture('withings-getmeas.json') as { body: Record<string, unknown> }).body, more: 0 } }
    await synchroniseer(ctx(nep, http([ok(meet)])), koppeling(TOKENS))
    expect(nep.bewaard.map((m) => m.soort)).toEqual(['gewicht_kg'])
  })

  it('haalt niets op zonder toestemming voor deze bron', async () => {
    const nep = nepOpslag({ ...TOESTEMMING_ALLES, delen: ['stappen'] })
    const verzoeken: HttpVerzoek[] = []
    const u = await synchroniseer(ctx(nep, http([], verzoeken)), koppeling(TOKENS))
    expect(u.status).toBe('geen_toestemming')
    expect(verzoeken).toHaveLength(0)
  })

  it('ververst een bijna verlopen token eerst en bewaart het nieuwe versleuteld', async () => {
    const nep = nepOpslag(TOESTEMMING_ALLES)
    const verzoeken: HttpVerzoek[] = []
    const bijnaWeg = { ...TOKENS, verlooptOp: new Date(NU.getTime() + 60_000).toISOString() }
    const nieuwToken = { status: 0, body: { access_token: 'nieuw', refresh_token: 'ref2', expires_in: 10800 } }
    await synchroniseer(ctx(nep, http([ok(nieuwToken), ok({ status: 0, body: { updatetime: 1, measuregrps: [], more: 0 } })], verzoeken)), koppeling(bijnaWeg))
    expect(new URLSearchParams(verzoeken[0].body).get('grant_type')).toBe('refresh_token')
    expect(verzoeken[1].headers.Authorization).toBe('Bearer nieuw')
    const opgeslagen = nep.wijzigingen.find((w) => w.tokensVersleuteld)?.tokensVersleuteld ?? ''
    expect(opgeslagen).not.toContain('nieuw')
    expect(ontsleutelTokens(opgeslagen, SLEUTEL, { userId: 'org', lidId: 'lid', bron: 'withings' })).toContain('"externGebruikerId":"363"')
  })

  it('probeert na een ongeldig token een keer te verversen, anders opnieuw koppelen', async () => {
    const nep = nepOpslag(TOESTEMMING_ALLES)
    const u = await synchroniseer(ctx(nep, http([ok({ status: 401 }), ok({ status: 503 })])), koppeling(TOKENS))
    expect(u.status).toBe('opnieuw_koppelen')
    expect(nep.wijzigingen.at(-1)).toMatchObject({ status: 'opnieuw_koppelen' })
  })

  it('wacht bij een rem en verhoogt de pogingen', async () => {
    const nep = nepOpslag(TOESTEMMING_ALLES)
    const u = await synchroniseer(ctx(nep, http([{ status: 429, headers: { 'retry-after': '120' }, json: null }])), koppeling(TOKENS))
    expect(u.status).toBe('rem')
    const w = nep.wijzigingen.at(-1)
    expect(w).toMatchObject({ status: 'fout', foutPogingen: 1, laatsteFout: 'rem' })
    expect(Date.parse(w?.volgendeSyncOp ?? '')).toBe(NU.getTime() + 120_000)
  })

  it('gebruikt de eigen remregel van de leverancier (Strava: volgend kwartier)', async () => {
    const nep = nepOpslag(TOESTEMMING_ALLES)
    await synchroniseer(ctx(nep, http([{ status: 429, headers: {}, json: null }]), strava), koppeling(TOKENS, 'strava'))
    expect(Date.parse(nep.wijzigingen.at(-1)?.volgendeSyncOp ?? '')).toBe(Date.parse('2026-10-23T12:15:05Z'))
  })

  it('loopt oplopend op bij fouten, tot hooguit een dag', () => {
    expect(wachtTijd(1, null)).toBe(15 * 60_000)
    expect(wachtTijd(3, null)).toBe(60 * 60_000)
    expect(wachtTijd(30, null)).toBe(24 * 3600_000)
  })

  it('trekt de toegang in bij de leverancier als dat kan', async () => {
    const verzoeken: HttpVerzoek[] = []
    const u = await trekIn({ adapter: strava, sleutels: { clientId: 'id', secret: 's' }, hoofdsleutel: SLEUTEL, http: http([ok({})], verzoeken) }, koppeling(TOKENS, 'strava'))
    expect(u.bijLeverancier).toBe('ingetrokken')
    expect(verzoeken[0].url).toBe('https://www.strava.com/oauth/deauthorize')
    const w = await trekIn({ adapter: withings, sleutels: { clientId: 'id', secret: 's' }, hoofdsleutel: SLEUTEL, http: http([]) }, koppeling(TOKENS))
    expect(w.bijLeverancier).toBe('niet_mogelijk')
  })
})
