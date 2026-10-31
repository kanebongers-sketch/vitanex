// Bewijs dat kernfuncties van Club altijd het filter van de eigen sportschool zetten.
// Twee nep-sportscholen (A en B) en een nep-Supabase die elke vraag vastlegt: roept
// sportschool A een functie aan, dan moet elke vraag op user_id = A filteren (of bij
// invoegen user_id = A meegeven) en mag het id van B nergens voorkomen. De statische
// bewaker (tenant-filter.test.ts) leest de code; deze test draait hem echt.
import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { haalLedenRijen } from '@/lib/club/leden/data'
import { haalAlleLeden } from '@/lib/club/leden/import/opslag'
import { haalAlleMedewerkers } from '@/lib/club/afspraken/opslag'
import { actiefSchemaId, haalAlleOefeningen, haalDetail, haalKeuzes, haalSchemaVanLid, maakEigenSchema, telEigen } from '@/lib/club/training/lid-schemas/opslag'
import { haalSjablonen } from '@/lib/club/voeding/lezen'

const GYM_A = 'aaaaaaaa-0000-4000-8000-00000000000a'
const GYM_B = 'bbbbbbbb-0000-4000-8000-00000000000b'
const LID = '11111111-0000-4000-8000-000000000001'
const SCHEMA = '22222222-0000-4000-8000-000000000002'
const NU = new Date('2026-10-31T10:00:00Z')

interface Vraag {
  tabel: string
  actie: 'select' | 'insert' | 'update' | 'upsert' | 'delete' | 'rpc'
  waarde: unknown
  filters: { op: string; args: unknown[] }[]
}

/** Nep-Supabase: elke methode op de keten wordt vastgelegd, elk antwoord is leeg en zonder fout. */
function nepSupabase(): { admin: SupabaseClient; vragen: Vraag[] } {
  const vragen: Vraag[] = []
  const antwoord = (v: Vraag) => ({ data: v.actie === 'insert' ? [{ id: SCHEMA }] : [], error: null, count: 0 })
  const keten = (v: Vraag): unknown => new Proxy({}, {
    get(_doel, naam: string) {
      if (naam === 'then') return (ok: (a: unknown) => unknown, fout?: (e: unknown) => unknown) => Promise.resolve(antwoord(v)).then(ok, fout)
      if (naam === 'maybeSingle' || naam === 'single') return () => Promise.resolve({ data: v.actie === 'insert' ? { id: SCHEMA } : null, error: null })
      return (...args: unknown[]) => {
        if (naam === 'select' && v.actie !== 'select') return keten(v)
        if (naam === 'insert' || naam === 'update' || naam === 'upsert' || naam === 'delete') Object.assign(v, { actie: naam, waarde: args[0] ?? null })
        else if (naam !== 'select') v.filters.push({ op: naam, args })
        return keten(v)
      }
    },
  })
  const admin = {
    from(tabel: string) {
      const v: Vraag = { tabel, actie: 'select', waarde: null, filters: [] }
      vragen.push(v)
      return keten(v)
    },
    rpc(tabel: string, args: unknown) {
      const v: Vraag = { tabel, actie: 'rpc', waarde: args, filters: [] }
      vragen.push(v)
      return keten(v)
    },
  }
  return { admin: admin as unknown as SupabaseClient, vragen }
}

const TENANT = new Set(['user_id', 'organisatie_id'])

/** Filtert deze vraag op de sportschool, of geeft ze bij invoegen de sportschool mee? */
function opSportschool(v: Vraag, gym: string): boolean {
  if (v.actie === 'insert' || v.actie === 'upsert') {
    const rijen = Array.isArray(v.waarde) ? v.waarde : [v.waarde]
    return rijen.length > 0 && rijen.every((r) => typeof r === 'object' && r !== null && ((r as Record<string, unknown>).user_id === gym || (r as Record<string, unknown>).organisatie_id === gym))
  }
  if (v.actie === 'rpc') return Object.values((v.waarde ?? {}) as Record<string, unknown>).includes(gym)
  return v.filters.some((f) => f.op === 'eq' && TENANT.has(String(f.args[0])) && f.args[1] === gym)
}

type Aanroep = (admin: SupabaseClient, gym: string) => Promise<unknown>

const KERNFUNCTIES: readonly [string, Aanroep][] = [
  ['ledenlijst van een vestiging', (a, g) => haalLedenRijen(a, g, 'budel', NU)],
  ['alle leden (import)', (a, g) => haalAlleLeden(a, g)],
  ['medewerkers', (a, g) => haalAlleMedewerkers(a, g)],
  ['oefeningen', (a, g) => haalAlleOefeningen(a, g)],
  ["schema's van een lid", (a, g) => haalKeuzes(a, g, LID, false)],
  ['actief schema', (a, g) => actiefSchemaId(a, g, LID)],
  ["eigen schema's tellen", (a, g) => telEigen(a, g, LID)],
  ['een schema van een lid', (a, g) => haalSchemaVanLid(a, g, LID, SCHEMA)],
  ['schema met regels', (a, g) => haalDetail(a, g, { id: SCHEMA, naam: 'Kracht', maker: 'lid', doel: null, niveau: 1, dagTitels: ['Dag 1'] } as Parameters<typeof haalDetail>[2])],
  ['eigen schema maken', (a, g) => maakEigenSchema(a, g, LID, { naam: 'Thuis', doel: null, niveau: 1, weken: null, status: 'actief', medewerkerId: null, notitie: null, dagTitels: ['Dag 1'], regels: [] })],
  ['voedingssjablonen', (a, g) => haalSjablonen(a, g)],
]

describe('tenant-isolatie met twee sportscholen', () => {
  for (const [naam, roep] of KERNFUNCTIES) {
    it(`${naam}: elke vraag van A filtert op A en noemt B nergens`, async () => {
      for (const [eigen, ander] of [[GYM_A, GYM_B], [GYM_B, GYM_A]]) {
        const { admin, vragen } = nepSupabase()
        await roep(admin, eigen)
        expect(vragen.length, 'de functie stelt minstens een vraag').toBeGreaterThan(0)
        const zonder = vragen.filter((v) => !opSportschool(v, eigen)).map((v) => `${v.actie} op ${v.tabel}`)
        expect(zonder, `vraag zonder filter op de eigen sportschool (${naam})`).toEqual([])
        expect(JSON.stringify(vragen)).not.toContain(ander)
      }
    })
  }

  it('de nep-Supabase vangt een vraag zonder sportschoolfilter echt', async () => {
    const { admin, vragen } = nepSupabase()
    await admin.from('club_leden').select('id').eq('id', LID)
    await admin.from('club_leden').insert({ naam: 'x' })
    expect(vragen.map((v) => opSportschool(v, GYM_A))).toEqual([false, false])
  })
})
