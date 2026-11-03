import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { leesWerkwijze, leesWerkwijzeWijziging, notitieMagWerkwijze, vestigingenVan, vestigingenVanNotitie } from './invoer'
import { meldingOpnieuw, nieuweVersie } from './model'
import { IDS_PER_VERZOEK, bewaarNieuweVersie, haalGelezen, inStukken, lopendOfRecentFilter, markeerGelezen } from './opslag'
import type { Werkwijze } from './typen'

// Punten uit de codereview van 04-11-2026 (migratie 492): vestigingen bij
// "alle", notitie naar werkwijze, gelezen zonder lange URL, bevestigen zonder
// race en een nieuwe versie met mededeling in een keer.

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const PROFIEL = ID(999)
const TITEL = (naam: string, versie: number) => `${naam} gewijzigd (${versie})`

function werkwijze(deel: Partial<Werkwijze> = {}): Werkwijze {
  return {
    id: ID(1), titel: 'Sluiten', soort: 'sluiten', vestigingen: ['budel'], rollen: ['trainer'], versie: 3, takenlijstId: null, bronNotitieId: null,
    gearchiveerd: false, bijgewerktOp: '2026-11-01T08:00:00Z', stappen: [{ tekst: 'Licht uit', uitleg: null }], watAnders: 'Licht als laatste uit', ...deel,
  }
}

describe('vestigingen: leeg (= alle) alleen voor wie alle vestigingen heeft', () => {
  const alle = { vestigingen: ['budel', 'eersel'], alleVestigingen: true }
  const deel = { vestigingen: ['budel'], alleVestigingen: false }

  it('met alle vestigingen blijft leeg leeg', () => {
    expect(vestigingenVan(undefined, alle)).toEqual([])
    expect(vestigingenVan([], alle)).toEqual([])
  })

  it('met een deel wordt leeg aangevuld met de eigen vestigingen', () => {
    expect(vestigingenVan(undefined, deel)).toEqual(['budel'])
    expect(vestigingenVan([], deel)).toEqual(['budel'])
    expect(vestigingenVan(['budel', 'budel'], deel)).toEqual(['budel'])
  })

  it('een vreemde vestiging of geen eigen vestiging: geweigerd', () => {
    expect(vestigingenVan(['eersel'], deel)).toBeNull()
    expect(vestigingenVan('budel', deel)).toBeNull()
    expect(vestigingenVan(undefined, { vestigingen: [], alleVestigingen: false })).toBeNull()
  })

  it('een werkwijze van een medewerker met een deel gaat naar de eigen vestigingen', () => {
    const uit = leesWerkwijze({ voorbeeld: 'sluiten' }, { eigenaar: false, ...deel })
    expect(uit).toEqual({ ok: true, waarde: { soort: 'voorbeeld', voorbeeld: 'sluiten', vestigingen: ['budel'], rollen: [] } })
  })
})

describe('notitie naar werkwijze', () => {
  const s = { vestigingen: ['budel'], alleVestigingen: false }

  it('alleen uit Kennis, niet gearchiveerd en van een eigen vestiging of voor alle vestigingen', () => {
    expect(notitieMagWerkwijze({ map: 'kennis', gearchiveerd: false, vestiging: 'budel' }, s)).toBe(true)
    expect(notitieMagWerkwijze({ map: 'kennis', gearchiveerd: false, vestiging: null }, s)).toBe(true)
    expect(notitieMagWerkwijze({ map: 'algemeen', gearchiveerd: false, vestiging: 'budel' }, s)).toBe(false)
    expect(notitieMagWerkwijze({ map: 'kennis', gearchiveerd: true, vestiging: 'budel' }, s)).toBe(false)
    expect(notitieMagWerkwijze({ map: 'kennis', gearchiveerd: false, vestiging: 'eersel' }, s)).toBe(false)
  })

  it('voor wie: de vestiging van de notitie, anders alle of de eigen', () => {
    expect(vestigingenVanNotitie({ vestiging: 'budel' }, s)).toEqual(['budel'])
    expect(vestigingenVanNotitie({ vestiging: null }, s)).toEqual(['budel'])
    expect(vestigingenVanNotitie({ vestiging: null }, { vestigingen: ['budel'], alleVestigingen: true })).toEqual([])
  })
})

describe('melding opnieuw plaatsen', () => {
  it('de invoer { meldingOpnieuw: true }', () => {
    const s = { eigenaar: true, vestigingen: ['budel'], alleVestigingen: true }
    expect(leesWerkwijzeWijziging({ meldingOpnieuw: true }, s)).toEqual({ ok: true, waarde: { soort: 'melding' } })
    expect(leesWerkwijzeWijziging({ meldingOpnieuw: 'ja' }, s)).toEqual({ ok: false, fout: 'ongeldig' })
  })

  it('dezelfde mededeling als bij de nieuwe versie; zonder zin wat er anders is geen melding', () => {
    const v = nieuweVersie(werkwijze({ versie: 2 }), { stappen: [{ tekst: 'x', uitleg: null }], watAnders: 'Licht als laatste uit', belangrijk: true }, TITEL)
    expect(meldingOpnieuw(werkwijze(), TITEL)).toEqual(v?.mededeling)
    expect(meldingOpnieuw(werkwijze({ watAnders: null }), TITEL)).toBeNull()
  })
})

describe('kleine hulpen', () => {
  it('ids in stukken van 50', () => {
    const ids = Array.from({ length: 123 }, (_, i) => ID(i))
    expect(inStukken(ids).map((s) => s.length)).toEqual([IDS_PER_VERZOEK, IDS_PER_VERZOEK, 23])
    expect(inStukken([])).toEqual([])
  })

  it('lopend of recent: niet gearchiveerd en niet lang verlopen, of recent geplaatst', () => {
    expect(lopendOfRecentFilter(new Date('2026-11-03T00:00:00Z'), 90)).toBe(
      'and(gearchiveerd.eq.false,or(verloopt_op.is.null,verloopt_op.gte."2026-08-05T00:00:00.000Z")),geplaatst_op.gte."2026-08-05T00:00:00.000Z"',
    )
  })
})

// ── Opslag met een nep-database ─────────────────────────────────────────────

interface Verzoek {
  tabel: string
  filters: [string, string, unknown][]
  upsert?: { rij: unknown; opties: unknown }
  update?: unknown
  insert?: unknown
}

interface Nep {
  rpc?: { data: unknown; error: { code?: string; message: string } | null }
  /** Antwoord op een select per tabel. */
  rijen?: unknown[]
  fout?: string
}

function nepAdmin(nep: Nep = {}) {
  const verzoeken: Verzoek[] = []
  const rpcs: [string, unknown][] = []
  const antwoord = () => ({ data: nep.fout ? null : nep.rijen ?? [], error: nep.fout ? { message: nep.fout } : null })
  const admin = {
    rpc: async (naam: string, args: unknown) => (rpcs.push([naam, args]), nep.rpc ?? { data: 'ok', error: null }),
    from: (tabel: string) => {
      const v: Verzoek = { tabel, filters: [] }
      verzoeken.push(v)
      const q: Record<string, unknown> = {}
      const filter = (soort: string) => (k: string, w: unknown) => (v.filters.push([soort, k, w]), q)
      Object.assign(q, {
        select: () => q,
        eq: filter('eq'),
        in: filter('in'),
        is: filter('is'),
        upsert: (rij: unknown, opties: unknown) => ((v.upsert = { rij, opties }), q),
        update: (w: unknown) => ((v.update = w), q),
        insert: (w: unknown) => ((v.insert = w), q),
        limit: async () => antwoord(),
        single: async () => ({ data: { id: ID(77) }, error: null }),
        then: (ok: (x: unknown) => unknown) => Promise.resolve({ data: [{ id: ID(1) }], error: null }).then(ok),
      })
      return q
    },
  } as unknown as SupabaseClient
  return { admin, verzoeken, rpcs }
}

describe('haalGelezen: geen honderden ids in de URL', () => {
  const ids = Array.from({ length: 120 }, (_, i) => ID(i + 1))

  it('met een profiel: filter op profiel_id, geen .in()', async () => {
    const rij = { mededeling_id: ID(1), profiel_id: PROFIEL, gelezen_op: '2026-11-02T08:00:00Z', bevestigd_op: null }
    const vreemd = { ...rij, mededeling_id: ID(500) }
    const { admin, verzoeken } = nepAdmin({ rijen: [rij, vreemd] })
    const uit = await haalGelezen(admin, 'org', ids, PROFIEL)
    expect(uit?.map((g) => g.mededelingId)).toEqual([ID(1)])
    expect(verzoeken).toHaveLength(1)
    expect(verzoeken[0].filters.some(([soort]) => soort === 'in')).toBe(false)
    expect(verzoeken[0].filters).toContainEqual(['eq', 'profiel_id', PROFIEL])
  })

  it('zonder profiel (de leiding): in stukken van 50', async () => {
    const { admin, verzoeken } = nepAdmin()
    await haalGelezen(admin, 'org', ids)
    const lengtes = verzoeken.map((v) => (v.filters.find(([soort]) => soort === 'in')?.[2] as unknown[]).length)
    expect(lengtes).toEqual([50, 50, 20])
  })

  it('een leesfout geeft null', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { admin } = nepAdmin({ fout: 'kapot' })
    expect(await haalGelezen(admin, 'org', ids)).toBeNull()
    vi.restoreAllMocks()
  })
})

describe('markeerGelezen: geen race die een bevestiging wist', () => {
  it('eerst invoegen als hij er nog niet is, nooit overschrijven', async () => {
    const { admin, verzoeken } = nepAdmin()
    expect(await markeerGelezen(admin, 'org', ID(1), PROFIEL, false)).toBe(true)
    expect(verzoeken).toHaveLength(1)
    expect(verzoeken[0].upsert?.opties).toEqual({ onConflict: 'mededeling_id,profiel_id', ignoreDuplicates: true })
  })

  it('bevestigen zet bevestigd_op alleen waar die nog leeg is', async () => {
    const { admin, verzoeken } = nepAdmin()
    expect(await markeerGelezen(admin, 'org', ID(1), PROFIEL, true)).toBe(true)
    const bijwerken = verzoeken.find((v) => v.update)
    expect(bijwerken?.filters).toContainEqual(['is', 'bevestigd_op', null])
    expect(bijwerken?.filters).toContainEqual(['eq', 'profiel_id', PROFIEL])
  })
})

describe('bewaarNieuweVersie: versie en mededeling in een keer', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined))
  afterEach(() => vi.restoreAllMocks())

  const v = nieuweVersie(werkwijze(), { stappen: [{ tekst: 'Licht uit', uitleg: null }], watAnders: 'Licht als laatste uit', belangrijk: true }, TITEL)
  if (!v) throw new Error('versie verwacht')

  it('via de database-functie, met de mededeling erbij', async () => {
    const { admin, rpcs, verzoeken } = nepAdmin()
    expect(await bewaarNieuweVersie(admin, 'org', werkwijze(), v, PROFIEL)).toBe('ok')
    expect(rpcs[0][0]).toBe('club_werkwijze_nieuwe_versie')
    expect(rpcs[0][1]).toMatchObject({ p_user: 'org', p_oude_versie: 3, p_versie: 4, p_mededeling: { titel: 'Sluiten gewijzigd (4)', vestigingen: ['budel'], rollen: ['trainer'] } })
    expect(verzoeken).toHaveLength(0)
  })

  it('de functie meldt oud: iemand anders was eerder', async () => {
    const { admin } = nepAdmin({ rpc: { data: 'oud', error: null } })
    expect(await bewaarNieuweVersie(admin, 'org', werkwijze(), v, PROFIEL)).toBe('oud')
  })

  it('een andere databasefout: fout, geen halve stappen', async () => {
    const { admin, verzoeken } = nepAdmin({ rpc: { data: null, error: { code: '23514', message: 'check' } } })
    expect(await bewaarNieuweVersie(admin, 'org', werkwijze(), v, PROFIEL)).toBe('fout')
    expect(verzoeken).toHaveLength(0)
  })

  it('zonder migratie 492: in stappen; lukt de mededeling niet, dan de aparte uitkomst melding', async () => {
    const { admin, verzoeken } = nepAdmin({ rpc: { data: null, error: { code: 'PGRST202', message: 'functie ontbreekt' } } })
    // De mededeling (insert in club_mededelingen) mislukt: single geeft geen id.
    const echtFrom = admin.from.bind(admin)
    ;(admin as unknown as { from: (t: string) => unknown }).from = (tabel: string) => {
      const q = echtFrom(tabel) as unknown as Record<string, unknown>
      if (tabel === 'club_mededelingen') q.single = async () => ({ data: null, error: { message: 'kapot' } })
      return q
    }
    expect(await bewaarNieuweVersie(admin, 'org', werkwijze(), v, PROFIEL)).toBe('melding')
    expect(verzoeken.map((x) => x.tabel)).toEqual(['club_werkwijze_versies', 'club_werkwijzen', 'club_mededelingen'])
  })
})
