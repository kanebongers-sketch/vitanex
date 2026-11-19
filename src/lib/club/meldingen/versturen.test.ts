// verwerkWachtrij: naar welk adres een mail met een link naar de ledenapp gaat.
// Heeft het lid al een eigen login, dan gaat de link naar het inlogadres en
// nooit naar het contactadres uit de ledenlijst (dat kan de sportschool
// wijzigen; een link daarheen kan het account overnemen). Zonder login: het
// contactadres, zoals altijd.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

const stand = vi.hoisted(() => ({ soort: 'app_link' as string, inlog: null as string | null | undefined, contact: 'contact@nieuw.nl' as string | null }))

const GYM = 'de000000-0000-4000-8000-0000000000c3'
const LID = '11111111-1111-4111-8111-111111111111'

vi.mock('./context', () => ({
  haalWachtrij: async () => [
    { id: 'm1', userId: GYM, lidId: LID, soort: stand.soort, kanaal: 'email', onderwerp: 'Je link', inhoud: 'Hallo', bronSoort: null, bronId: null, bronStart: null, geplandOp: new Date().toISOString(), pogingen: 0, demo: false },
  ],
  haalContext: async () => ({
    orgs: new Map([[GYM, { naam: 'Kernhal', logo: null, accent: '#B58E5C', donker: true, demo: false }]]),
    leden: new Map([[LID, { userId: GYM, email: stand.contact, demo: false }]]),
    voorkeuren: new Map(),
    bronnen: new Map(),
  }),
  logoVoorMail: async () => null,
  zorgVoorToken: async () => 'token',
  afmeldUrl: (t: string) => `https://aiyourgym.com/api/club-afmelden/${t}`,
}))
vi.mock('@/lib/club/app-uitnodigen/link-voor-mail', () => ({ ledenappLinkVoorMail: async () => ({ ok: true, url: 'https://aiyourgym.com/mijn/start/abc' }) }))
vi.mock('@/lib/club/ledenlogin/opslag', () => ({ inlogAdresVanLid: async () => stand.inlog }))
vi.mock('@/lib/club/push/opslag', () => ({ abonnementenVan: async () => new Map(), markeerGebruikt: async () => undefined, wisAbonnement: async () => undefined }))
vi.mock('@/lib/club/push/versturen', () => ({ standaardPushDeps: () => ({}), stuurNaarToestellen: async () => ({}) }))

import { verwerkWachtrij, type Mail, type VerstuurDeps } from './versturen'

function admin(): { admin: SupabaseClient; updates: unknown[] } {
  const updates: unknown[] = []
  const keten: Record<string, unknown> = {}
  for (const naam of ['eq', 'lt', 'select']) keten[naam] = () => keten
  keten.update = (w: unknown) => {
    updates.push(w)
    return keten
  }
  keten.then = (ok: (a: unknown) => unknown) => Promise.resolve({ data: [{ id: 'm1' }], error: null }).then(ok)
  return { admin: { from: () => keten } as unknown as SupabaseClient, updates }
}

function deps(verstuurd: Mail[]): VerstuurDeps {
  return {
    omgeving: { actief: true, ingesteld: true },
    stuur: async (m) => {
      verstuurd.push(m)
      return { ok: true }
    },
    pauze: async () => undefined,
    push: { omgeving: { actief: false, ingesteld: false } } as unknown as VerstuurDeps['push'],
  }
}

beforeEach(() => {
  stand.soort = 'app_link'
  stand.inlog = null
  stand.contact = 'contact@nieuw.nl'
})

describe('mail met een link naar de ledenapp', () => {
  it('lid met login en een gewijzigd contactadres: de link gaat naar het inlogadres', async () => {
    stand.inlog = 'login@sanne.nl'
    const verstuurd: Mail[] = []
    await verwerkWachtrij(admin().admin, new Date(), deps(verstuurd))
    expect(verstuurd.map((m) => m.aan)).toEqual(['login@sanne.nl'])
  })

  it('geldt ook voor de uitnodiging van de sportschool', async () => {
    stand.soort = 'app_uitnodiging'
    stand.inlog = 'login@sanne.nl'
    const verstuurd: Mail[] = []
    await verwerkWachtrij(admin().admin, new Date(), deps(verstuurd))
    expect(verstuurd.map((m) => m.aan)).toEqual(['login@sanne.nl'])
  })

  it('lid zonder login: naar het contactadres, zoals altijd', async () => {
    const verstuurd: Mail[] = []
    await verwerkWachtrij(admin().admin, new Date(), deps(verstuurd))
    expect(verstuurd.map((m) => m.aan)).toEqual(['contact@nieuw.nl'])
  })

  it('lid met login zonder contactadres: toch naar het inlogadres', async () => {
    stand.inlog = 'login@sanne.nl'
    stand.contact = null
    const verstuurd: Mail[] = []
    await verwerkWachtrij(admin().admin, new Date(), deps(verstuurd))
    expect(verstuurd.map((m) => m.aan)).toEqual(['login@sanne.nl'])
  })

  it('kan het inlogadres niet gelezen worden: geen mail', async () => {
    stand.inlog = undefined
    const verstuurd: Mail[] = []
    const { admin: a, updates } = admin()
    await verwerkWachtrij(a, new Date(), deps(verstuurd))
    expect(verstuurd).toEqual([])
    expect(updates).toContainEqual(expect.objectContaining({ status: 'overgeslagen' }))
  })
})
