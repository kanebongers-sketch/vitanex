// De openbare routes van aanmelden via een link: geen verraad (zelfde antwoord
// voor een bekend en een onbekend adres, mail pas na het antwoord), 404 bij een
// onbekende link, CSRF, honingpot, en afronden zet de sessiecookie. Plus de
// intake van het lid: het lid komt uit de sessie, nooit uit de body.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const db = vi.hoisted(() => ({ admin: null as unknown, na: [] as (() => unknown)[], mails: [] as { naar: string; onderwerp: string; tekst: string }[] }))

vi.mock('@/lib/club/ledenlogin/schakelaar', () => ({ CLUB_LEDEN_LOGIN: true }))
vi.mock('@/lib/club/kern/database', () => ({ clubDatabase: () => db.admin }))
vi.mock('@/lib/utils/rate-limit', () => ({ isRateLimited: () => false }))
vi.mock('@/lib/aiyourgym/taal/server', () => ({ getTaal: async () => 'nl' }))
vi.mock('next/server', async (orig) => ({ ...(await orig<typeof import('next/server')>()), after: (f: () => unknown) => void db.na.push(f) }))
vi.mock('./mail', async (orig) => ({
  ...(await orig<typeof import('./mail')>()),
  aanmeldMailKlaar: () => true,
  stuurViaResend: async (m: { naar: string; onderwerp: string; tekst: string }) => { db.mails.push(m); return true },
}))
vi.mock('@/lib/club/toegang', async (orig) => ({
  ...(await orig<typeof import('@/lib/club/toegang')>()),
  haalEigenOrganisatie: async (_a: unknown, id: string) => ({ organisatie: id === GYM ? { id: GYM, naam: 'Kernhal', slug: 'kernhal', uit: [], demo: false } : null, eigenaarId: null }),
}))
vi.mock('@/lib/club/lidmaatschappen/lezen', () => ({ haalVormen: async () => [] }))

import { geheugenDb } from './geheugen-db.testhulp'
import { maakLink } from './links-opslag'
import { POST as start } from '@/app/(aiyourgym)/api/club/lid/aanmelden/route'
import { POST as afronden } from '@/app/(aiyourgym)/api/club/lid/aanmelden/afronden/route'
import { lidCookie } from '@/lib/club/ledenlogin/regels'

function verzoek(pad: string, body: unknown, eigen = true): NextRequest {
  const koppen: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' }
  if (eigen) koppen['sec-fetch-site'] = 'same-origin'
  return new NextRequest(`https://aiyourgym.com${pad}`, { method: 'POST', body: JSON.stringify(body), headers: koppen })
}

async function draaiNa(): Promise<void> {
  while (db.na.length) await db.na.shift()?.()
}

let code = ''
beforeEach(async () => {
  db.na = []
  db.mails = []
  const g = geheugenDb(
    {
      club_vestigingen: [{ user_id: GYM, vestiging: 'centrum' }],
      club_leden: [{ id: '11111111-1111-4111-8111-111111111111', user_id: GYM, vestiging: 'centrum', voornaam: 'Bestaand', achternaam: 'Lid', email: 'al.lid@voorbeeld.nl', status: 'actief' }],
    },
    { club_lid_toegang: [['user_id', 'email']] },
  )
  db.admin = g.admin
  const link = await maakLink(g.admin, GYM, { vestiging: 'centrum', vormId: null, soort: 'herbruikbaar', geldig: 90, naam: null }, 'Sanne', new Date())
  code = link!.code
})

const gegevens = (email: string) => ({ code, voornaam: 'Noor', achternaam: 'de Vries', email, akkoord: true })

describe('POST /api/club/lid/aanmelden', () => {
  it('bekend en onbekend adres: hetzelfde antwoord, de mail pas na het antwoord', async () => {
    const a = await start(verzoek('/api/club/lid/aanmelden', gegevens('nieuw@voorbeeld.nl')))
    const b = await start(verzoek('/api/club/lid/aanmelden', gegevens('al.lid@voorbeeld.nl')))
    expect([a.status, b.status]).toEqual([200, 200])
    const [ja, jb] = [await a.json(), await b.json()]
    expect(Object.keys(ja)).toEqual(Object.keys(jb))
    expect(db.mails).toHaveLength(0)
    await draaiNa()
    expect(db.mails.map((m) => m.naar).sort()).toEqual(['al.lid@voorbeeld.nl', 'nieuw@voorbeeld.nl'])
  })

  it('een onbekende link: 404 zonder iets van de sportschool', async () => {
    const r = await start(verzoek('/api/club/lid/aanmelden', { ...gegevens('x@voorbeeld.nl'), code: 'zzzzzzzzzzzzzzzzzzzzzzzz' }))
    expect(r.status).toBe(404)
    expect(JSON.stringify(await r.json())).not.toContain('Kernhal')
  })

  it('niet van onze eigen pagina: 403; honingpot: een gewoon antwoord zonder mail', async () => {
    expect((await start(verzoek('/api/club/lid/aanmelden', gegevens('x@voorbeeld.nl'), false))).status).toBe(403)
    const robot = await start(verzoek('/api/club/lid/aanmelden', { ...gegevens('x@voorbeeld.nl'), website: 'spam' }))
    expect(robot.status).toBe(200)
    await draaiNa()
    expect(db.mails).toHaveLength(0)
  })

  it('afronden met de code uit de mail zet de sessiecookie; een foute code niet', async () => {
    const r = await start(verzoek('/api/club/lid/aanmelden', gegevens('nieuw@voorbeeld.nl')))
    const { token } = (await r.json()) as { token: string }
    await draaiNa()
    const mailCode = /\n(\d{6})\n/.exec(db.mails[0].tekst)?.[1] ?? ''
    const fout = await afronden(verzoek('/api/club/lid/aanmelden/afronden', { token, mailCode: mailCode === '999999' ? '111111' : '999999', wachtwoord: 'Ochtendtraining op dinsdag 7' }))
    expect(fout.status).toBe(400)
    expect(fout.headers.get('set-cookie')).toBeNull()
    const zwak = await afronden(verzoek('/api/club/lid/aanmelden/afronden', { token, mailCode, wachtwoord: 'kort' }))
    expect(zwak.status).toBe(400)
    const goed = await afronden(verzoek('/api/club/lid/aanmelden/afronden', { token, mailCode, wachtwoord: 'Ochtendtraining op dinsdag 7' }))
    expect(goed.status).toBe(200)
    expect(goed.headers.get('set-cookie')).toContain(`${lidCookie()}=`)
  })
})
