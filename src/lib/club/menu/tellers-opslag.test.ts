import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// De taken zelf worden elders getest (taken/voortgang); hier alleen of de tellers ze goed doorgeven.
const taken = vi.hoisted(() => ({ open: 2 as number | null }))
vi.mock('@/lib/club/taken/opslag', () => ({
  haalTaken: async () => (taken.open === null ? null : { lijsten: [], taken: [] }),
  haalAfvinkingen: async () => (taken.open === null ? null : []),
  alleenActief: (d: unknown) => d,
}))
vi.mock('@/lib/club/taken/voortgang', () => ({
  takenVanVandaag: () => [],
  nogOpen: () => taken.open ?? 0,
}))

import { haalTellers } from './tellers-opslag'
import type { TellerRechten } from './tellers'

interface Vraag {
  tabel: string
  filters: string[]
}

/** Een nep-Supabase die elke telling vastlegt en een aantal per tabel en status geeft. */
function nepAdmin(aantallen: Record<string, number | 'fout'>) {
  const vragen: Vraag[] = []
  const admin = {
    from(tabel: string) {
      const v: Vraag = { tabel, filters: [] }
      vragen.push(v)
      const sleutel = () => {
        const status = v.filters.find((f) => f.startsWith('eq:status=') || f.startsWith('in:status='))
        return `${tabel}${status ? `|${status.split(':')[1]}` : ''}`
      }
      const bouwer = {
        select: () => bouwer,
        eq: (k: string, w: unknown) => (v.filters.push(`eq:${k}=${String(w)}`), bouwer),
        in: (k: string, w: unknown[]) => (v.filters.push(`in:${k}=${w.join(',')}`), bouwer),
        is: (k: string, w: unknown) => (v.filters.push(`is:${k}=${String(w)}`), bouwer),
        lte: (k: string, w: unknown) => (v.filters.push(`lte:${k}=${String(w)}`), bouwer),
        then: (ok: (r: { count: number | null; error: { message: string } | null }) => unknown) => {
          const n = aantallen[sleutel()]
          return Promise.resolve(n === 'fout' ? { count: null, error: { message: 'kapot' } } : { count: n ?? 0, error: null }).then(ok)
        },
      }
      return bouwer
    },
  }
  return { admin: admin as unknown as SupabaseClient, vragen }
}

const ALLES: TellerRechten = { taken: true, opvolgenLeden: true, leads: true, vandaag: true }
const NU = new Date('2026-10-30T09:00:00Z')

let n = 0
/** Elke test een eigen sportschool, zodat de korte cache niet meespeelt. */
const nieuweSportschool = () => `org-${++n}`

beforeEach(() => {
  taken.open = 2
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('haalTellers', () => {
  it('telt open taken, te bellen (leden plus leads) en nieuwe leads', async () => {
    const { admin } = nepAdmin({ 'club_opvolgtaken|status=open': 3, 'club_leads|status=nieuw,contact,proefles_geweest': 2, 'club_leads|status=nieuw': 4 })
    const t = await haalTellers({ admin, userId: nieuweSportschool(), vestiging: 'budel', rechten: ALLES, nu: NU })
    expect(t).toEqual({ taken: 2, opvolgen: 5, leads: 4 })
  })

  it('filtert elke telling op de sportschool en de vestiging', async () => {
    const id = nieuweSportschool()
    const { admin, vragen } = nepAdmin({})
    await haalTellers({ admin, userId: id, vestiging: 'eersel', rechten: ALLES, nu: NU })
    expect(vragen.length).toBeGreaterThan(0)
    for (const v of vragen) {
      expect(v.filters, v.tabel).toContain(`eq:user_id=${id}`)
      expect(v.filters, v.tabel).toContain('eq:vestiging=eersel')
    }
    // Leads: nooit geanonimiseerde, en te bellen tot en met vandaag (Nederlandse datum).
    const teBellen = vragen.find((v) => v.tabel === 'club_leads' && v.filters.some((f) => f.startsWith('lte:')))
    expect(teBellen?.filters).toEqual(expect.arrayContaining(['is:geanonimiseerd_op=null', 'lte:opvolgen_op=2026-10-30']))
  })

  it('vraagt niets op wat deze persoon niet mag', async () => {
    const { admin, vragen } = nepAdmin({ 'club_opvolgtaken|status=open': 3 })
    const t = await haalTellers({ admin, userId: nieuweSportschool(), vestiging: 'budel', rechten: { taken: false, opvolgenLeden: true, leads: false, vandaag: true }, nu: NU })
    expect(t).toEqual({ opvolgen: 3 })
    expect(vragen.map((v) => v.tabel)).toEqual(['club_opvolgtaken'])
  })

  it('zonder enige teller: geen enkele vraag', async () => {
    const { admin, vragen } = nepAdmin({})
    const t = await haalTellers({ admin, userId: nieuweSportschool(), vestiging: 'budel', rechten: { taken: false, opvolgenLeden: false, leads: false, vandaag: true }, nu: NU })
    expect(t).toEqual({})
    expect(vragen).toEqual([])
  })

  it('bij 0 geen teller, bij een fout geen (verkeerd) getal', async () => {
    taken.open = null
    const { admin } = nepAdmin({ 'club_opvolgtaken|status=open': 'fout', 'club_leads|status=nieuw': 0 })
    const t = await haalTellers({ admin, userId: nieuweSportschool(), vestiging: 'budel', rechten: ALLES, nu: NU })
    expect(t).toEqual({})
  })

  it('onthoudt kort: een tweede vraag binnen enkele seconden raakt de database niet', async () => {
    const id = nieuweSportschool()
    const eerste = nepAdmin({ 'club_leads|status=nieuw': 1 })
    await haalTellers({ admin: eerste.admin, userId: id, vestiging: 'budel', rechten: ALLES, nu: NU })
    const tweede = nepAdmin({ 'club_leads|status=nieuw': 9 })
    const t = await haalTellers({ admin: tweede.admin, userId: id, vestiging: 'budel', rechten: ALLES, nu: new Date(NU.getTime() + 2000) })
    expect(tweede.vragen).toEqual([])
    expect(t.leads).toBe(1)
    const later = await haalTellers({ admin: tweede.admin, userId: id, vestiging: 'budel', rechten: ALLES, nu: new Date(NU.getTime() + 60_000) })
    expect(later.leads).toBe(9)
  })
})
