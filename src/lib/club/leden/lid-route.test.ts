// PATCH /api/club/leden/[id]: de status van een lid wijzigen vanaf de ledenkaart
// (een proeflid wordt lid). Tijdens een verzoek tot verwijderen (AVG) blijft de
// status vast, anders zou een wijziging het verzoek stil ongedaan maken.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const stand = vi.hoisted(() => ({ updates: [] as unknown[], verzoek: null as unknown, t: null as unknown }))

vi.mock('@/lib/club/toegang', () => ({
  vereisClubToegang: async () => stand.t,
  clubFout: (fout: string, status: number) => NextResponse.json({ fout }, { status }),
  clubJson: (data: unknown) => NextResponse.json(data),
  logActie: vi.fn(),
}))
vi.mock('@/lib/club/kern/vestiging-toegang', () => ({ eisVestigingVanRecord: async () => null }))
vi.mock('@/lib/club/kern/medewerker', () => ({ haalMedewerkers: async () => [] }))
vi.mock('@/lib/club/leden/avg/opslag', () => ({ haalVerwijderverzoek: async () => stand.verzoek }))
vi.mock('@/lib/club/kern/lid', async (orig) => ({
  ...(await orig<typeof import('@/lib/club/kern/lid')>()),
  haalLid: async () => ({ id: LID, vestiging: 'centrum', voornaam: 'Sanne', achternaam: 'Jansen', status: 'proef', tags: [], coachId: null }),
}))

import { PATCH } from '@/app/(aiyourgym)/api/club/leden/[id]/route'

const LID = '22222222-2222-4222-8222-222222222222'

function admin() {
  return {
    from: () => ({
      update: (w: unknown) => {
        stand.updates.push(w)
        const q = { eq: () => q, then: (ok: (a: unknown) => unknown) => Promise.resolve({ error: null }).then(ok) }
        return q
      },
    }),
  }
}

const patch = (body: unknown) =>
  PATCH(new NextRequest(`https://x.aiyourgym.com/api/club/leden/${LID}`, { method: 'PATCH', body: JSON.stringify(body) }), { params: Promise.resolve({ id: LID }) })

beforeEach(() => {
  stand.updates = []
  stand.verzoek = null
  stand.t = { admin: admin(), userId: 'org', vestigingen: [{ sleutel: 'centrum', naam: 'Centrum', standaard: true }], naam: 'Lisa' }
})

describe('status wijzigen op de ledenkaart', () => {
  it('zet een proeflid op actief', async () => {
    const r = await patch({ status: 'actief' })
    expect(r.status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ status: 'actief' })])
  })

  it('weigert tijdens een verzoek tot verwijderen en schrijft niets', async () => {
    stand.verzoek = { aangevraagdOp: '2026-10-20T10:00:00Z', definitiefOp: '2026-11-19T10:00:00Z', aangevraagdDoor: 'Mark' }
    const r = await patch({ status: 'actief' })
    expect(r.status).toBe(409)
    expect(stand.updates).toEqual([])
  })

  it('geeft een fout als het verzoek niet te lezen is (liever niets dan stil terugdraaien)', async () => {
    stand.verzoek = undefined
    expect((await patch({ status: 'actief' })).status).toBe(500)
    expect(stand.updates).toEqual([])
  })
})
