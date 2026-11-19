// planAanvraag: wie een inloglink krijgt via het openbare aanvraagformulier.
// Een lid met een eigen login wordt alleen op het inlogadres gevonden, nooit
// op het contactadres uit de ledenlijst: dat adres kan de sportschool wijzigen,
// en een link daarheen zou het account kunnen overnemen.

import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planAanvraag } from './opslag'

const GYM = 'de000000-0000-4000-8000-0000000000c2'
const SANNE = '11111111-1111-4111-8111-111111111111'
const MARK = '22222222-2222-4222-8222-222222222222'
const NU = new Date('2026-11-19T10:00:00Z')
const NIEUW = 'nieuw@adres.nl'

interface Vraag {
  tabel: string
  actie: string
  waarde: unknown
  filters: [string, string, unknown][]
}

type Rij = Record<string, unknown>

const lid = (id: string, email: string): Rij => ({ id, vestiging: 'centrum', voornaam: 'Sanne', achternaam: 'Jansen', email, status: 'actief', tags: [], demo: false })

interface Stand {
  /** Leden met dit contactadres (club_leden.email). */
  opContact: Rij[]
  /** Leden met dit inlogadres (club_lid_toegang.email). */
  opInlog: string[]
  /** Leden met een eigen login (actief, met wachtwoord). */
  metLogin: string[]
  /** Alle leden, voor het ophalen op id. */
  leden: Rij[]
  fout?: boolean
}

function nep(stand: Stand): { admin: SupabaseClient; vragen: Vraag[] } {
  const vragen: Vraag[] = []
  const antwoord = (v: Vraag): { data: unknown; error: { message: string } | null } => {
    if (v.tabel === 'club_vestigingen') return { data: [{ vestiging: 'centrum', naam: 'Centrum', standaard: true }], error: null }
    if (v.tabel === 'club_meldingen') return { data: null, error: null }
    if (v.tabel === 'club_leden') {
      const ids = v.filters.find(([op, k]) => op === 'in' && k === 'id')?.[2] as string[] | undefined
      return { data: ids ? stand.leden.filter((l) => ids.includes(String(l.id))) : stand.opContact, error: null }
    }
    if (stand.fout) return { data: null, error: { message: 'stuk' } }
    const ids = v.filters.find(([op, k]) => op === 'in' && k === 'lid_id')?.[2] as string[] | undefined
    const lijst = ids ? stand.metLogin.filter((id) => ids.includes(id)) : stand.opInlog
    return { data: lijst.map((id) => ({ lid_id: id })), error: null }
  }
  const admin = {
    from(tabel: string) {
      const v: Vraag = { tabel, actie: 'select', waarde: null, filters: [] }
      vragen.push(v)
      const keten: Record<string, unknown> = {}
      for (const op of ['eq', 'in', 'ilike', 'not', 'is']) {
        keten[op] = (k: string, w: unknown) => {
          v.filters.push([op, k, w])
          return keten
        }
      }
      for (const naam of ['select', 'order', 'limit', 'range']) keten[naam] = () => keten
      keten.upsert = (w: unknown) => Object.assign(v, { actie: 'upsert', waarde: w }) && keten
      keten.then = (ok: (a: unknown) => unknown, fout?: (e: unknown) => unknown) => Promise.resolve(antwoord(v)).then(ok, fout)
      return keten
    },
  }
  return { admin: admin as unknown as SupabaseClient, vragen }
}

const gepland = (vragen: Vraag[]) => (vragen.find((v) => v.tabel === 'club_meldingen')?.waarde as Rij[] | undefined) ?? []
const org = { id: GYM, naam: 'Kernhal' }

describe('planAanvraag: een inloglink aanvragen', () => {
  it('lid zonder login: gevonden op het contactadres, zoals altijd', async () => {
    const { admin, vragen } = nep({ opContact: [lid(SANNE, NIEUW)], opInlog: [], metLogin: [], leden: [] })
    await planAanvraag(admin, org, NIEUW, 'aanvraag-1', NU)
    expect(gepland(vragen)).toEqual([expect.objectContaining({ lid_id: SANNE, soort: 'app_link', user_id: GYM })])
  })

  it('lid met login en een gewijzigd contactadres: niets op het nieuwe contactadres', async () => {
    const { admin, vragen } = nep({ opContact: [lid(SANNE, NIEUW)], opInlog: [], metLogin: [SANNE], leden: [lid(SANNE, NIEUW)] })
    await planAanvraag(admin, org, NIEUW, 'aanvraag-1', NU)
    expect(gepland(vragen)).toEqual([])
  })

  it('lid met login: gevonden op het inlogadres, ook als het contactadres anders is', async () => {
    const { admin, vragen } = nep({ opContact: [], opInlog: [SANNE], metLogin: [SANNE], leden: [lid(SANNE, 'contact@ergens.nl')] })
    await planAanvraag(admin, org, 'login@sanne.nl', 'aanvraag-1', NU)
    expect(gepland(vragen)).toEqual([expect.objectContaining({ lid_id: SANNE })])
  })

  it('gedeeld contactadres: alleen het lid zonder login krijgt een link', async () => {
    const { admin, vragen } = nep({ opContact: [lid(SANNE, NIEUW), lid(MARK, NIEUW)], opInlog: [], metLogin: [SANNE], leden: [] })
    await planAanvraag(admin, org, NIEUW, 'aanvraag-1', NU)
    expect(gepland(vragen).map((r) => r.lid_id)).toEqual([MARK])
  })

  it('kan de login niet gelezen worden: niets (liever geen mail dan een open deur)', async () => {
    const { admin, vragen } = nep({ opContact: [lid(SANNE, NIEUW)], opInlog: [], metLogin: [], leden: [], fout: true })
    await planAanvraag(admin, org, NIEUW, 'aanvraag-1', NU)
    expect(gepland(vragen)).toEqual([])
  })

  it('elke vraag filtert op de sportschool', async () => {
    const { admin, vragen } = nep({ opContact: [lid(SANNE, NIEUW)], opInlog: [MARK], metLogin: [MARK], leden: [lid(MARK, 'mark@ergens.nl')] })
    await planAanvraag(admin, org, NIEUW, 'aanvraag-1', NU)
    for (const v of vragen.filter((x) => x.actie === 'select')) expect(v.filters).toContainEqual(['eq', 'user_id', GYM])
  })
})
