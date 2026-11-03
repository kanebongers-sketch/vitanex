import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isVerlopen, ledenOpVolgorde, openSinds } from './belijst'
import { planRonde } from './signalen'
import { TAAK_KOLOMMEN, TAAK_KOLOMMEN_OUD, taakKolommen, taakUitRij, type Taak } from './taken'
import { haalRecentAfgehandeld, heeftHeropendKolom, vergeetHeropendKolom, werkTaakBij } from './opslag'

// Heropenen van een opvolgtaak (review 04-11-2026, migratie 492): de 14 dagen
// tellen vanaf greatest(aangemaakt_op, heropend_op), en zonder de kolom valt de
// code terug op aangemaakt_op.

const VANDAAG = '2026-11-03'

function taak(id: string, lidId: string, aangemaaktOp: string, heropendOp: string | null = null): Taak {
  return { id, lidId, vestiging: 'budel', regel: 'welkom', periode: 'p', waarde: null, reden: '', status: 'open', wie: { soort: 'iedereen' }, notitie: null, uitkomst: null, afgehandeldDoor: null, afgehandeldOp: null, aangemaaktOp, heropendOp, lid: null }
}

describe('openSinds en isVerlopen met heropend_op', () => {
  it('het laatste van aanmaken en heropenen telt', () => {
    expect(openSinds({ aangemaaktOp: '2026-09-01T08:00:00Z', heropendOp: '2026-11-02T10:00:00Z' })).toBe('2026-11-02')
    expect(openSinds({ aangemaaktOp: '2026-11-01T08:00:00Z', heropendOp: '2026-10-01T10:00:00Z' })).toBe('2026-11-01')
    expect(openSinds({ aangemaaktOp: '2026-11-01T08:00:00Z', heropendOp: null })).toBe('2026-11-01')
    expect(openSinds({ aangemaaktOp: '', heropendOp: 'x' })).toBe('')
  })

  it('een oude taak die net is heropend, is niet verlopen', () => {
    expect(isVerlopen({ status: 'open', aangemaaktOp: '2026-09-01T08:00:00Z' }, VANDAAG)).toBe(true)
    expect(isVerlopen({ status: 'open', aangemaaktOp: '2026-09-01T08:00:00Z', heropendOp: '2026-11-03T09:00:00Z' }, VANDAAG)).toBe(false)
  })

  it('heropend maar daarna weer 15 dagen open: verlopen', () => {
    expect(isVerlopen({ status: 'open', aangemaaktOp: '2026-08-01T08:00:00Z', heropendOp: '2026-10-19T09:00:00Z' }, VANDAAG)).toBe(true)
  })

  it('de belijst houdt een heropende oude taak, de ronde laat hem niet opnieuw verlopen', () => {
    const heropend = taak('t1', 'a', '2026-09-01T08:00:00Z', '2026-11-03T08:00:00Z')
    const oud = taak('t2', 'b', '2026-09-01T08:00:00Z')
    expect(ledenOpVolgorde([heropend, oud], VANDAAG).map((t) => t.id)).toEqual(['t1'])
    const ronde = planRonde([], [heropend, oud].map((t) => ({ id: t.id, lidId: t.lidId, regel: t.regel, periode: t.periode, aangemaaktOp: t.aangemaaktOp, heropendOp: t.heropendOp })), new Set(['a', 'b']), VANDAAG)
    expect(ronde.verlopen).toEqual(['t2'])
  })
})

describe('kolommen en rij', () => {
  it('met en zonder heropend_op', () => {
    expect(TAAK_KOLOMMEN).toContain('heropend_op')
    expect(TAAK_KOLOMMEN_OUD).not.toContain('heropend_op')
    expect(taakKolommen(false)).toBe(TAAK_KOLOMMEN_OUD)
    expect(taakKolommen(true)).toBe(TAAK_KOLOMMEN)
  })

  it('taakUitRij leest heropend_op', () => {
    const rij = { id: 't', lid_id: 'l', vestiging: 'budel', regel: 'welkom', aangemaakt_op: '2026-09-01T08:00:00Z', heropend_op: '2026-11-02T08:00:00Z' }
    expect(taakUitRij(rij)?.heropendOp).toBe('2026-11-02T08:00:00Z')
    expect(taakUitRij({ ...rij, heropend_op: null })?.heropendOp).toBeNull()
  })
})

// ── Opslag met een nep-database ─────────────────────────────────────────────

interface Verzoek {
  select?: string
  update?: Record<string, unknown>
  in?: [string, unknown[]]
}

/** Een nep-admin: `kolomBestaat` bepaalt of de proef op heropend_op lukt. */
function nepAdmin(kolomBestaat: boolean) {
  const verzoeken: Verzoek[] = []
  const admin = {
    from: () => {
      const v: Verzoek = {}
      verzoeken.push(v)
      const q: Record<string, unknown> = {}
      const zelf = () => q
      Object.assign(q, {
        select: (k: string) => ((v.select = k), q),
        update: (w: Record<string, unknown>) => ((v.update = w), q),
        eq: zelf,
        gte: zelf,
        order: zelf,
        in: (k: string, w: unknown[]) => ((v.in = [k, w]), q),
        limit: async () => (v.select === 'heropend_op' && !kolomBestaat ? { data: null, error: { code: '42703', message: 'column heropend_op does not exist' } } : { data: [], error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
      })
      return q
    },
  } as unknown as SupabaseClient
  return { admin, verzoeken }
}

describe('opslag zonder en met migratie 492', () => {
  beforeEach(() => {
    vergeetHeropendKolom()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => vi.restoreAllMocks())

  it('zonder de kolom: terugval, de fout gelogd, en een minuut later opnieuw kijken', async () => {
    const { admin } = nepAdmin(false)
    expect(await heeftHeropendKolom(admin, 'org', 1_000)).toBe(false)
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(await heeftHeropendKolom(admin, 'org', 2_000)).toBe(false)
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(await heeftHeropendKolom(nepAdmin(true).admin, 'org', 70_000)).toBe(true)
  })

  it('heropenen zonder de kolom slaat de rest op, zonder heropend_op', async () => {
    const { admin, verzoeken } = nepAdmin(false)
    await werkTaakBij(admin, 'org', 't1', { status: 'open', heropend_op: '2026-11-03T10:00:00.000Z' })
    const update = verzoeken.find((v) => v.update)
    expect(update?.update).toEqual({ status: 'open' })
    expect(update?.select).toBe(TAAK_KOLOMMEN_OUD)
  })

  it('met de kolom gaat heropend_op mee', async () => {
    const { admin, verzoeken } = nepAdmin(true)
    await werkTaakBij(admin, 'org', 't1', { status: 'open', heropend_op: '2026-11-03T10:00:00.000Z' })
    const update = verzoeken.find((v) => v.update)
    expect(update?.update).toEqual({ status: 'open', heropend_op: '2026-11-03T10:00:00.000Z' })
    expect(update?.select).toBe(TAAK_KOLOMMEN)
  })

  it('recent afgehandeld toont ook verlopen taken, zodat Heropen bereikbaar is', async () => {
    const { admin, verzoeken } = nepAdmin(true)
    await haalRecentAfgehandeld(admin, 'org', 'budel', new Date('2026-11-03T10:00:00Z'))
    expect(verzoeken.find((v) => v.in)?.in).toEqual(['status', ['gedaan', 'overgeslagen', 'verlopen']])
  })
})
