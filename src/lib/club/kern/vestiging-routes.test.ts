// Routes waar een medewerker met een id uit de body iets doet in een vestiging:
// boeken in een les, een taak afvinken, een taak aan een lijst toevoegen. Een
// les of lijst van een andere vestiging geeft 404, zoals een onbekend record.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const stand = vi.hoisted(() => ({ rijen: {} as Record<string, Record<string, unknown> | null>, t: null as unknown }))

vi.mock('@/lib/club/toegang', () => ({
  vereisClubToegang: async () => stand.t,
  clubFout: (fout: string, status: number) => NextResponse.json({ fout }, { status }),
}))
const acties = vi.hoisted(() => ({ reserveer: vi.fn(), vinkAf: vi.fn(), vinkUit: vi.fn(), maakTaak: vi.fn() }))
vi.mock('@/lib/club/rooster/opslag', () => ({ reserveer: acties.reserveer }))
vi.mock('@/lib/club/taken/afvink-opslag', () => ({ vinkAf: acties.vinkAf, vinkUit: acties.vinkUit }))
vi.mock('@/lib/club/taken/beheer-opslag', () => ({ maakTaak: acties.maakTaak }))
vi.mock('@/lib/club/rooster/api', () => ({ alsAntwoord: () => NextResponse.json({ ok: true }), leesJson: (req: NextRequest) => req.json() }))
vi.mock('@/lib/club/taken/api', () => ({ alsAntwoord: () => NextResponse.json({ ok: true }), leesJson: (req: NextRequest) => req.json(), vandaagNl: () => '2026-10-23' }))

import { POST as boek } from '@/app/(aiyourgym)/api/club/rooster/reserveringen/route'
import { DELETE as vinkUitRoute, POST as vinkAfRoute } from '@/app/(aiyourgym)/api/club/taken/afvinken/route'
import { POST as nieuweTaak } from '@/app/(aiyourgym)/api/club/taken/taak/route'

const LES = '11111111-1111-4111-8111-111111111111'
const LID = '22222222-2222-4222-8222-222222222222'
const TAAK = '33333333-3333-4333-8333-333333333333'
const LIJST = '44444444-4444-4444-8444-444444444444'

function nepAdmin(): SupabaseClient {
  return {
    from: (tabel: string) => {
      const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: stand.rijen[tabel] ?? null, error: null }) }
      return q
    },
  } as unknown as SupabaseClient
}

const post = (pad: string, body: unknown) => new NextRequest(`https://x.aiyourgym.com${pad}`, { method: 'POST', body: JSON.stringify(body) })

beforeEach(() => {
  vi.clearAllMocks()
  // Lisa werkt alleen in vestiging centrum.
  stand.t = { admin: nepAdmin(), userId: 'org', vestigingen: [{ sleutel: 'centrum', naam: 'Centrum', standaard: true }], rol: 'medewerker' }
  stand.rijen = {}
})

describe('boeken in een les', () => {
  it('boekt in een les van de eigen vestiging', async () => {
    stand.rijen.club_lessen = { vestiging: 'centrum' }
    const r = await boek(post('/api/club/rooster/reserveringen', { lesId: LES, lidId: LID, bron: 'balie' }))
    expect(r.status).toBe(200)
    expect(acties.reserveer).toHaveBeenCalledOnce()
  })
  it('geeft 404 voor een les van een andere vestiging en boekt niets', async () => {
    stand.rijen.club_lessen = { vestiging: 'noord' }
    const r = await boek(post('/api/club/rooster/reserveringen', { lesId: LES, lidId: LID, bron: 'balie' }))
    expect(r.status).toBe(404)
    expect(acties.reserveer).not.toHaveBeenCalled()
  })
})

describe('taken afvinken en toevoegen', () => {
  it('vinkt een taak van de eigen vestiging af', async () => {
    stand.rijen = { club_taken: { lijst_id: LIJST }, club_takenlijsten: { vestiging: 'centrum' } }
    const r = await vinkAfRoute(post('/api/club/taken/afvinken', { taakId: TAAK, datum: '2026-10-23', wie: 'Lisa' }))
    expect(r.status).toBe(200)
    expect(acties.vinkAf).toHaveBeenCalledOnce()
  })
  it('weigert afvinken en weghalen bij een taak van een andere vestiging', async () => {
    stand.rijen = { club_taken: { lijst_id: LIJST }, club_takenlijsten: { vestiging: 'noord' } }
    expect((await vinkAfRoute(post('/api/club/taken/afvinken', { taakId: TAAK, datum: '2026-10-23', wie: 'Lisa' }))).status).toBe(404)
    const weg = new NextRequest(`https://x.aiyourgym.com/api/club/taken/afvinken?taak=${TAAK}&datum=2026-10-23`, { method: 'DELETE' })
    expect((await vinkUitRoute(weg)).status).toBe(404)
    expect(acties.vinkAf).not.toHaveBeenCalled()
    expect(acties.vinkUit).not.toHaveBeenCalled()
  })
  it('voegt geen taak toe aan een lijst van een andere vestiging', async () => {
    stand.rijen = { club_takenlijsten: { vestiging: 'noord' } }
    const r = await nieuweTaak(post('/api/club/taken/taak', { lijstId: LIJST, naam: 'Kleedkamer', frequentie: 'dagelijks', moment: 'ochtend' }))
    expect(r.status).toBe(404)
    expect(acties.maakTaak).not.toHaveBeenCalled()
  })
})
