// PATCH /api/club/leden/[id]: de status van een lid wijzigen vanaf de ledenkaart
// (een proeflid wordt lid). Tijdens een verzoek tot verwijderen (AVG) blijft de
// status vast, anders zou een wijziging het verzoek stil ongedaan maken.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const stand = vi.hoisted(() => ({ updates: [] as unknown[], verzoek: null as unknown, t: null as unknown, opzeggingen: [] as unknown[], weg: [] as string[] }))

vi.mock('@/lib/club/toegang', () => ({
  vereisClubToegang: async () => stand.t,
  clubFout: (fout: string, status: number) => NextResponse.json({ fout }, { status }),
  clubJson: (data: unknown) => NextResponse.json(data),
  logActie: vi.fn(),
}))
vi.mock('@/lib/club/behoud/opslag', () => ({
  bewaarOpzegging: async (_a: unknown, _u: string, o: unknown) => {
    stand.opzeggingen.push(o)
    return { soort: 'ok', id: 'opz-1' }
  },
  verwijderOpzegging: async (_a: unknown, _u: string, id: string) => {
    stand.weg.push(id)
  },
}))
vi.mock('@/lib/club/kern/vestiging-toegang', () => ({ eisVestigingVanRecord: async () => null }))
vi.mock('@/lib/club/kern/medewerker', () => ({ haalMedewerkers: async () => [] }))
vi.mock('@/lib/club/leden/avg/opslag', () => ({ haalVerwijderverzoek: async () => stand.verzoek }))
vi.mock('@/lib/club/lidmaatschappen/lezen', () => ({
  haalVormen: async () => [{ id: 'v1', naam: 'All-in', omschrijving: '', vestigingen: null, groepslessen: true, maxLessenPerWeek: null, dalVan: null, dalTot: null, dalWeekendVrij: false, kleur: 'amber', actief: true, demo: false }],
}))
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
  stand.opzeggingen = []
  stand.weg = []
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

describe('lidmaatschap wijzigen op de ledenkaart', () => {
  it('zet een bestaande vorm en de datums', async () => {
    const r = await patch({ abonnement: 'all-in', lidSinds: '2026-01-05' })
    expect(r.status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ abonnement: 'All-in', lid_sinds: '2026-01-05' })])
  })

  it('weigert een vorm die de sportschool niet heeft', async () => {
    expect((await patch({ abonnement: 'Verzonnen' })).status).toBe(400)
    expect(stand.updates).toEqual([])
  })

  it('bewaart de pauzedatums apart van de status', async () => {
    const r = await patch({ status: 'gepauzeerd', pauzeVan: '2026-11-01', pauzeTot: '2026-11-30' })
    expect(r.status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ status: 'gepauzeerd' }), { pauze_van: '2026-11-01', pauze_tot: '2026-11-30' }])
    expect(await r.json()).toEqual({ ok: true, pauzeNietOpgeslagen: false, redenNietOpgeslagen: false })
  })
})

describe('opzeggen of stoppen vraagt een reden (migratie 482)', () => {
  it('weigert stoppen zonder reden en schrijft niets', async () => {
    // Arrange en Act
    const r = await patch({ status: 'gestopt', einddatum: '2026-10-31' })
    // Assert
    expect(r.status).toBe(400)
    expect(stand.updates).toEqual([])
    expect(stand.opzeggingen).toEqual([])
  })

  it('bewaart de reden en daarna de status', async () => {
    const r = await patch({ status: 'gestopt', einddatum: '2026-10-31', opzegReden: { reden: 'verhuizing', toelichting: 'Naar Utrecht' } })
    expect(r.status).toBe(200)
    expect(stand.opzeggingen).toEqual([expect.objectContaining({ reden: 'verhuizing', toelichting: 'Naar Utrecht', actie: 'stoppen', einddatum: '2026-10-31', lidId: LID, door: 'Lisa' })])
    expect(stand.updates).toEqual([expect.objectContaining({ status: 'gestopt' })])
  })

  it('bewaart bij gezondheid alleen de categorie', async () => {
    await patch({ status: 'gestopt', opzegReden: { reden: 'gezondheid', toelichting: 'Knie' } })
    expect(stand.opzeggingen).toEqual([expect.objectContaining({ reden: 'gezondheid', toelichting: null })])
  })
})
