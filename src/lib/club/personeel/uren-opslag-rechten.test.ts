// De opslag zelf weigert uren die iemand niet mag goedkeuren of wijzigen,
// ook als de knop in de app al verborgen is.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const stand = vi.hoisted(() => ({ dienst: null as unknown, updates: 0 }))
vi.mock('@/lib/club/toegang', () => ({ logActie: vi.fn() }))
vi.mock('./opslag', () => ({ haalDienst: async () => stand.dienst, haalDiensten: async () => [] }))

import { registreerUren, urenInBulk } from './uren-opslag'
import type { ClubToegang } from '@/lib/club/toegang'

const LISA = '11111111-1111-4111-8111-111111111111'
const COLLEGA = '22222222-2222-4222-8222-222222222222'

function toegang(extra: Partial<ClubToegang>): ClubToegang {
  const keten = { eq: () => keten, then: (ok: (a: unknown) => unknown) => Promise.resolve({ error: null }).then(ok) }
  const admin = { from: () => ({ update: () => (stand.updates++, keten) }) }
  return { admin, userId: 'org', rol: 'medewerker', persoonId: LISA, medewerkerRollen: ['trainer'], naam: 'Lisa', vestigingen: [], ...extra } as unknown as ClubToegang
}

const invoer = { actie: 'goedkeuren' as const, gewerktBegin: null, gewerktEind: null, pauzeMin: 0, opmerking: null }

beforeEach(() => {
  stand.updates = 0
  stand.dienst = { id: 'd1', medewerkerId: COLLEGA, uurStatus: 'gewerkt', begin: '07:00', eind: '12:00', datum: '2026-10-22', vestiging: 'centrum' }
})

describe('uren in de opslag', () => {
  it('een trainer keurt geen uren goed en bevestigt geen uren van een collega', async () => {
    expect(await registreerUren(toegang({}), 'd1', invoer)).toMatchObject({ ok: false, status: 403 })
    expect(await registreerUren(toegang({}), 'd1', { ...invoer, actie: 'bevestig' })).toMatchObject({ ok: false, status: 403 })
    expect(stand.updates).toBe(0)
  })

  it('een trainer bevestigt de eigen dienst', async () => {
    stand.dienst = { ...(stand.dienst as object), medewerkerId: LISA }
    expect(await registreerUren(toegang({}), 'd1', { ...invoer, actie: 'bevestig' })).toMatchObject({ ok: true })
    expect(stand.updates).toBe(1)
  })

  it('de eigenaar keurt goed', async () => {
    expect(await registreerUren(toegang({ rol: 'eigenaar', medewerkerRollen: [] }), 'd1', invoer)).toMatchObject({ ok: true })
  })

  it('in bulk goedkeuren of verwerken is dicht voor een trainer', async () => {
    const nu = { datum: '2026-10-23', minuten: 600 }
    expect(await urenInBulk(toegang({}), 'centrum', 'verwerken', '2026-10-01', '2026-10-31', nu)).toMatchObject({ ok: false, status: 403 })
    // De administratie komt erdoor (hier geen goedgekeurde uren: 409, geen 403).
    expect(await urenInBulk(toegang({ medewerkerRollen: ['administratie'] }), 'centrum', 'verwerken', '2026-10-01', '2026-10-31', nu)).toMatchObject({ ok: false, status: 409 })
  })
})
