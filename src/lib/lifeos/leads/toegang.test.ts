// Tests voor het slot op de PT-API: wie mag wat. De invarianten die tellen:
//   - een PT'er bewerkt alleen zijn eigen klanten (zijn link blijft ongewijzigd);
//   - een eigenaar (Ruben) kijkt alleen mee — elke schrijfactie is 403;
//   - de beheerder (Kane) werkt namens de trainer van de klant, maar alleen
//     binnen het team (actieve PT'er of hijzelf), en verplaatst alleen naar
//     een geldige trainer.
// We mocken de link/sessie-laag en de database, zodat alleen de beslislogica telt.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { LeadLink } from './links'

const links = vi.hoisted(() => ({ vindLink: vi.fn(), sessieGeldig: vi.fn() }))
vi.mock('./links', async (importOriginal) => ({ ...(await importOriginal<typeof import('./links')>()), ...links }))

type Rij = Record<string, unknown>
const db = vi.hoisted(() => ({ tabellen: {} as Record<string, Rij[]> }))

/** Minimale nabootsing van de supabase-querybuilder: select/eq/maybeSingle. */
function nepAdmin() {
  return {
    from(tabel: string) {
      const filters: [string, unknown][] = []
      const bouwer = {
        select: () => bouwer,
        eq: (kolom: string, waarde: unknown) => {
          filters.push([kolom, waarde])
          return bouwer
        },
        maybeSingle: async () => ({
          data: (db.tabellen[tabel] ?? []).find((r) => filters.every(([k, w]) => r[k] === w)) ?? null,
          error: null,
        }),
      }
      return bouwer
    },
  }
}
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => nepAdmin() }))

import { ingelogdeLink, ipVan, isZelfdeOorsprong, klantToegang, leadToegang, nieuwToegang, verplaatsNaar } from './toegang'

const USER = 'u-1'
const KANE = '11111111-1111-4111-8111-111111111111'
const JOEY = '22222222-2222-4222-8222-222222222222'
const OUD = '33333333-3333-4333-8333-333333333333'
const RUBEN = '44444444-4444-4444-8444-444444444444'
const KLANT_JOEY = '55555555-5555-4555-8555-555555555555'
const KLANT_OUD = '66666666-6666-4666-8666-666666666666'

const link = (rol: LeadLink['rol'], persoonId: string, code: string): LeadLink => ({
  rol, userId: USER, persoonId, code, naam: code, pinStatus: 'actief', pinHash: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0,
})
const LINKS: Record<string, LeadLink> = {
  joey: link('pt', JOEY, 'joey'),
  ruben: link('eigenaar', RUBEN, 'ruben'),
  kane: link('beheerder', KANE, 'kane'),
}
const req = () => new NextRequest('https://mentaforce.nl/api/pt/x', { method: 'PUT' })
const status = (r: unknown) => (r instanceof NextResponse ? r.status : 200)

beforeEach(() => {
  links.vindLink.mockImplementation(async (_admin: unknown, code: string) => LINKS[code] ?? null)
  links.sessieGeldig.mockResolvedValue(true)
  db.tabellen = {
    crm_personen: [
      { id: JOEY, user_id: USER, groep: 'pt_team', status: 'actief' },
      { id: OUD, user_id: USER, groep: 'pt_team', status: 'inactief' },
      { id: RUBEN, user_id: USER, groep: 'management', status: 'actief' },
    ],
    pt_leads: [{ id: KLANT_JOEY, user_id: USER, persoon_id: JOEY }],
    pt_klanten: [
      { id: KLANT_JOEY, user_id: USER, persoon_id: JOEY },
      { id: KLANT_OUD, user_id: USER, persoon_id: OUD },
    ],
  }
})

describe('ingelogdeLink', () => {
  it('laat een ingelogde PT\'er door', async () => {
    expect(status(await ingelogdeLink(req(), 'joey'))).toBe(200)
  })
  it('weigert zonder geldige sessie (401)', async () => {
    links.sessieGeldig.mockResolvedValue(false)
    expect(status(await ingelogdeLink(req(), 'joey'))).toBe(401)
  })
  it('weigert eigenaar en beheerder standaard (403), ook met sessie', async () => {
    expect(status(await ingelogdeLink(req(), 'ruben'))).toBe(403)
    expect(status(await ingelogdeLink(req(), 'kane'))).toBe(403)
  })
  it('laat een meekijker door waar dat expliciet mag (document openen)', async () => {
    expect(status(await ingelogdeLink(req(), 'ruben', { eigenaarMag: true }))).toBe(200)
  })
  it('onbekende link → 404', async () => {
    expect(status(await ingelogdeLink(req(), 'niemand'))).toBe(404)
  })
})

describe('klantToegang', () => {
  it('PT\'er: eigen link ongewijzigd (de opslag filtert op zijn persoon_id)', async () => {
    const r = await klantToegang(req(), 'joey', KLANT_OUD)
    expect(r).not.toBeInstanceOf(NextResponse)
    if (!(r instanceof NextResponse)) {
      expect(r.link.persoonId).toBe(JOEY)
      expect(r.beheerderId).toBeUndefined()
    }
  })
  it('eigenaar: 403', async () => {
    expect(status(await klantToegang(req(), 'ruben', KLANT_JOEY))).toBe(403)
  })
  it('beheerder: werkt namens de trainer van de klant', async () => {
    const r = await klantToegang(req(), 'kane', KLANT_JOEY)
    expect(r).not.toBeInstanceOf(NextResponse)
    if (!(r instanceof NextResponse)) {
      expect(r.link.persoonId).toBe(JOEY)
      expect(r.beheerderId).toBe(KANE)
    }
  })
  it('beheerder: klant van een inactieve trainer of onbekende klant → 404', async () => {
    expect(status(await klantToegang(req(), 'kane', KLANT_OUD))).toBe(404)
    expect(status(await klantToegang(req(), 'kane', '77777777-7777-4777-8777-777777777777'))).toBe(404)
  })
})

describe('nieuwToegang', () => {
  it('PT\'er: altijd op eigen naam, een meegestuurde trainer telt niet', async () => {
    const r = await nieuwToegang(req(), 'joey', KANE)
    expect(r instanceof NextResponse ? null : r.link.persoonId).toBe(JOEY)
  })
  it('beheerder: bij de gekozen trainer, anders bij zichzelf', async () => {
    const naarJoey = await nieuwToegang(req(), 'kane', JOEY)
    expect(naarJoey instanceof NextResponse ? null : naarJoey.link.persoonId).toBe(JOEY)
    const zelf = await nieuwToegang(req(), 'kane', undefined)
    expect(zelf instanceof NextResponse ? null : zelf.link.persoonId).toBe(KANE)
  })
  it('beheerder: geen trainer uit het team (inactief, eigenaar, rommel) → 400', async () => {
    expect(status(await nieuwToegang(req(), 'kane', OUD))).toBe(400)
    expect(status(await nieuwToegang(req(), 'kane', RUBEN))).toBe(400)
    expect(status(await nieuwToegang(req(), 'kane', 'geen-uuid'))).toBe(400)
  })
  it('eigenaar: 403', async () => {
    expect(status(await nieuwToegang(req(), 'ruben', JOEY))).toBe(403)
  })
})

describe('verplaatsNaar', () => {
  it('alleen de beheerder, naar een andere geldige trainer', async () => {
    const r = await klantToegang(req(), 'kane', KLANT_JOEY)
    if (r instanceof NextResponse) throw new Error('verwacht toegang')
    expect(await verplaatsNaar(r, KANE)).toBe(KANE)
    expect(await verplaatsNaar(r, JOEY)).toBeNull() // dezelfde trainer
    expect(await verplaatsNaar(r, OUD)).toBeNull() // inactief
    expect(await verplaatsNaar(r, undefined)).toBeNull()
  })
  it('een PT\'er kan niets verplaatsen', async () => {
    const r = await klantToegang(req(), 'joey', KLANT_JOEY)
    if (r instanceof NextResponse) throw new Error('verwacht toegang')
    expect(await verplaatsNaar(r, KANE)).toBeNull()
  })
})

describe('isZelfdeOorsprong (CSRF)', () => {
  const koppen = (h: Record<string, string>) => new Headers(h)
  it('moderne browser: Sec-Fetch-Site beslist', () => {
    expect(isZelfdeOorsprong(koppen({ 'sec-fetch-site': 'same-origin', origin: 'https://kwaad.nl', host: 'mentaforce.nl' }))).toBe(true)
    expect(isZelfdeOorsprong(koppen({ 'sec-fetch-site': 'cross-site', origin: 'https://mentaforce.nl', host: 'mentaforce.nl' }))).toBe(false)
    expect(isZelfdeOorsprong(koppen({ 'sec-fetch-site': 'same-site', host: 'mentaforce.nl' }))).toBe(false)
    expect(isZelfdeOorsprong(koppen({ 'sec-fetch-site': 'none', host: 'mentaforce.nl' }))).toBe(false)
  })
  it('oudere browser (geen Sec-Fetch-Site): Origin moet onze host zijn, ook achter een proxy', () => {
    expect(isZelfdeOorsprong(koppen({ origin: 'https://mentaforce.nl', host: 'mentaforce.nl' }))).toBe(true)
    expect(isZelfdeOorsprong(koppen({ origin: 'https://MentaForce.nl', host: 'mentaforce.nl' }))).toBe(true)
    expect(isZelfdeOorsprong(koppen({ origin: 'https://mentaforce.nl', host: 'intern:3000', 'x-forwarded-host': 'mentaforce.nl, proxy' }))).toBe(true)
    expect(isZelfdeOorsprong(koppen({ origin: 'http://localhost:3000', host: 'localhost:3000' }))).toBe(true)
    expect(isZelfdeOorsprong(koppen({ origin: 'https://kwaad.nl', host: 'mentaforce.nl' }))).toBe(false)
    expect(isZelfdeOorsprong(koppen({ origin: 'https://mentaforce.nl.kwaad.nl', host: 'mentaforce.nl' }))).toBe(false)
    expect(isZelfdeOorsprong(koppen({ origin: 'null', host: 'mentaforce.nl' }))).toBe(false)
  })
  it('zonder enige oorsprong-kop (geen browser): weigeren', () => {
    expect(isZelfdeOorsprong(koppen({ host: 'mentaforce.nl' }))).toBe(false)
    expect(isZelfdeOorsprong(koppen({}))).toBe(false)
  })
})

describe('ipVan', () => {
  const verzoek = (h: Record<string, string>) => new NextRequest('https://mentaforce.nl/api/pt/x', { method: 'POST', headers: h })
  it('eerste uit X-Forwarded-For, anders X-Real-IP, anders onbekend', () => {
    expect(ipVan(verzoek({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
    expect(ipVan(verzoek({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9')
    expect(ipVan(verzoek({}))).toBe('onbekend')
  })
})

describe('leadToegang', () => {
  it('volgt dezelfde regels als klanten: beheerder namens de trainer, eigenaar 403', async () => {
    const r = await leadToegang(req(), 'kane', KLANT_JOEY)
    expect(r instanceof NextResponse ? null : r.link.persoonId).toBe(JOEY)
    expect(status(await leadToegang(req(), 'ruben', KLANT_JOEY))).toBe(403)
    expect(status(await leadToegang(req(), 'kane', KLANT_OUD))).toBe(404) // geen lead met dit id
  })
})
