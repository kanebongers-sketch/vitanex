// Annuleren in de ledenapp: alleen een geplande afspraak, en de melding moet
// weten dat het lid zelf afmeldde (niet de club).

import { describe, expect, it, vi } from 'vitest'

const opslag = vi.hoisted(() => ({
  haalAfspraak: vi.fn(),
  haalType: vi.fn(),
  werkAfspraakBij: vi.fn(),
}))
vi.mock('@/lib/club/afspraken/opslag', () => opslag)
vi.mock('@/lib/club/afspraken/regels', () => ({ magLidAnnuleren: () => ({ ok: true }) }))
vi.mock('@/lib/club/afspraken/sloten-opslag', () => ({}))
vi.mock('@/lib/club/afspraken/api', () => ({}))
vi.mock('@/lib/club/kern/medewerker', () => ({}))
vi.mock('@/lib/club/toegang', () => ({
  clubFout: (fout: string, status: number) => ({ fout, status }),
  clubJson: (data: unknown) => ({ data, status: 200 }),
  logActie: async () => undefined,
}))

import { annuleerAfspraakVoorLid } from './acties-afspraken'
import type { ClubSchrijver } from '@/lib/club/toegang'
import type { Lid } from '@/lib/club/kern/lid'

const ID = '11111111-1111-4111-8111-111111111111'
const LID = { id: 'lid-1', voornaam: 'Sam', achternaam: 'Jansen', vestiging: 'budel' } as unknown as Lid
const S = { admin: {}, userId: 'org' } as unknown as ClubSchrijver

describe('annuleerAfspraakVoorLid', () => {
  it('annuleert alleen een geplande afspraak, als afmelding door het lid', async () => {
    opslag.haalAfspraak.mockResolvedValue({ id: ID, lidId: 'lid-1', typeId: 't' })
    opslag.haalType.mockResolvedValue({ id: 't', naam: 'Intake' })
    opslag.werkAfspraakBij.mockResolvedValue({ ok: true, waarde: { id: ID } })
    await annuleerAfspraakVoorLid(S, LID, ID)
    const args = opslag.werkAfspraakBij.mock.calls[0]
    expect(args[4]).toBe('gepland')
    expect(args[5]).toBe('lid')
  })
})
