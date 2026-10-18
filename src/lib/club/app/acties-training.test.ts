// Een training versturen is veilig te herhalen: viel het antwoord weg en stuurt
// de wachtrij hem opnieuw, dan staat hij er maar een keer (ook de sets en de
// logboekregel). De datum is het moment van afronden op de telefoon.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const logboek = vi.hoisted(() => ({ regels: [] as string[] }))
vi.mock('@/lib/club/toegang', () => ({
  clubFout: (fout: string, status: number) => ({ fout, status }),
  clubJson: (data: unknown, status = 200) => ({ data, status }),
  logActie: async (_s: unknown, actie: string) => {
    logboek.regels.push(actie)
  },
}))
vi.mock('@/lib/club/training/alternatieven-opslag', () => ({ oefeningNamen: async () => [], toegestaanOpDag: async () => new Set() }))
vi.mock('@/lib/club/rooster/api', () => ({}))
vi.mock('@/lib/club/rooster/reserveren-opslag', () => ({}))
vi.mock('@/lib/club/kern/lid', () => ({ volledigeNaam: (l: { voornaam: string }) => l.voornaam }))

import { vinkTrainingAf, type TrainingVraag } from './acties-training'
import type { ClubSchrijver } from '@/lib/club/toegang'
import type { Lid } from '@/lib/club/kern/lid'

const ORG = 'org-1'
const SCHEMA = '22222222-2222-4222-8222-222222222222'
const OEF = '33333333-3333-4333-8333-333333333333'
const TRAINING = '44444444-4444-4444-8444-444444444444'
const LID = { id: 'lid-1', voornaam: 'Sam', vestiging: 'budel', demo: false } as unknown as Lid

type Rij = Record<string, unknown>
interface Antwoord {
  data?: unknown
  error?: { code?: string; message: string } | null
  count?: number
}
interface Db {
  logs: Rij[]
  sets: Rij[]
  /** Vlak voor de insert van de trainingslog: zo komt een gelijktijdig verzoek er net tussen. */
  voorInsert?: () => void
}

function voegLogIn(db: Db, rij: Rij, volg: number): Antwoord {
  db.voorInsert?.()
  const dubbel = rij.client_id && db.logs.some((l) => l.user_id === rij.user_id && l.lid_id === rij.lid_id && l.client_id === rij.client_id)
  if (dubbel) return { data: null, error: { code: '23505', message: 'duplicate key' } }
  const nieuw: Rij = { ...rij, id: `log-${volg}` }
  db.logs.push(nieuw)
  return { data: { id: nieuw.id, op: nieuw.op }, error: null }
}

/** Net genoeg van de Supabase-querybouwer voor deze actie, met de unieke index op client_id. */
function maakAdmin(db: Db) {
  let volg = 0
  return {
    from(tabel: string) {
      let soort = 'select'
      let rijen: Rij[] = []
      const filters: Rij = {}
      const past = (r: Rij) => Object.entries(filters).every(([k, v]) => r[k] === v)
      const voer = (): Antwoord => {
        if (tabel === 'club_schemas') return { data: { id: SCHEMA }, error: null }
        if (tabel === 'club_schema_oefeningen') return { data: [{ oefening_id: OEF }], error: null }
        if (tabel === 'club_set_logs' && soort === 'insert') {
          db.sets.push(...rijen)
          return { error: null }
        }
        if (tabel === 'club_set_logs') return { count: db.sets.filter(past).length, error: null }
        if (soort === 'insert') return voegLogIn(db, rijen[0], ++volg)
        const gevonden = db.logs.find(past)
        return { data: gevonden ? { id: gevonden.id, op: gevonden.op } : null, error: null }
      }
      const bouwer = {
        select: () => bouwer,
        insert: (r: Rij | Rij[]) => {
          soort = 'insert'
          rijen = Array.isArray(r) ? r : [r]
          return bouwer
        },
        eq: (k: string, v: unknown) => {
          filters[k] = v
          return bouwer
        },
        single: () => bouwer,
        maybeSingle: () => bouwer,
        then: (ok: (w: Antwoord) => unknown, nee?: (e: unknown) => unknown) => Promise.resolve().then(voer).then(ok, nee),
      }
      return bouwer
    },
  }
}

const NU = new Date('2026-10-18T10:00:00Z')
const vraag = (deel: Partial<TrainingVraag> = {}): TrainingVraag => ({
  schemaId: SCHEMA,
  dag: 1,
  sets: [
    { oefeningId: OEF, setNr: 1, herhalingen: 10, gewichtKg: 40 },
    { oefeningId: OEF, setNr: 2, herhalingen: 8, gewichtKg: 40 },
  ],
  duurSec: 1800,
  clientId: TRAINING,
  // 23:30 Nederlandse tijd op 17 oktober; ontvangen op 18 oktober.
  afgerondOp: new Date('2026-10-17T21:30:00Z').getTime(),
  ...deel,
})

type Resultaat = { data: Rij; status: number }
let db: Db
let s: ClubSchrijver
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NU)
  db = { logs: [], sets: [] }
  s = { admin: maakAdmin(db), userId: ORG, naam: 'Sam' } as unknown as ClubSchrijver
  logboek.regels = []
})

describe('training versturen, veilig te herhalen', () => {
  it('slaat op met het afrondmoment van de telefoon als datum', async () => {
    const r = (await vinkTrainingAf(s, LID, vraag())) as unknown as Resultaat
    expect(r.status).toBe(201)
    expect(r.data).toMatchObject({ id: 'log-1', op: '2026-10-17T21:30:00.000Z', datum: '2026-10-17', sets: 2 })
    expect(db.logs[0]).toMatchObject({ client_id: TRAINING, op: '2026-10-17T21:30:00.000Z' })
    expect(db.sets.every((x) => x.op === '2026-10-17T21:30:00.000Z')).toBe(true)
  })

  it('dubbel versturen (antwoord viel weg): hetzelfde antwoord, niets dubbel', async () => {
    const eerste = await vinkTrainingAf(s, LID, vraag())
    const tweede = await vinkTrainingAf(s, LID, vraag())
    expect(tweede).toEqual(eerste)
    expect(db.logs).toHaveLength(1)
    expect(db.sets).toHaveLength(2)
    expect(logboek.regels).toHaveLength(1)
  })

  it('gelijktijdig versturen: bij de unieke index (23505) ook succes, zonder eigen sets of logboekregel', async () => {
    db.voorInsert = () => {
      db.voorInsert = undefined
      db.logs.push({ id: 'log-ander', user_id: ORG, lid_id: LID.id, client_id: TRAINING, op: '2026-10-17T21:30:00.000Z' })
      db.sets.push({ user_id: ORG, trainingslog_id: 'log-ander' })
    }
    const r = await vinkTrainingAf(s, LID, vraag())
    expect(r).toEqual({ status: 201, data: { id: 'log-ander', op: '2026-10-17T21:30:00.000Z', datum: '2026-10-17', sets: 1 } })
    expect(db.logs).toHaveLength(1)
    expect(db.sets).toHaveLength(1)
    expect(logboek.regels).toHaveLength(0)
  })

  it('twee verzoeken echt tegelijk: een training', async () => {
    const [a, b] = await Promise.all([vinkTrainingAf(s, LID, vraag()), vinkTrainingAf(s, LID, vraag())])
    expect(a).toEqual(b)
    expect(db.logs).toHaveLength(1)
    expect(db.sets).toHaveLength(2)
  })

  it('hetzelfde id bij een ander lid telt niet als dezelfde training', async () => {
    await vinkTrainingAf(s, LID, vraag())
    await vinkTrainingAf(s, { ...LID, id: 'lid-2' } as Lid, vraag())
    expect(db.logs).toHaveLength(2)
  })

  it('weigert een ongeldig id; zonder id (oudere app) opslaan met de servertijd', async () => {
    expect(await vinkTrainingAf(s, LID, vraag({ clientId: 'abc' }))).toEqual({ fout: 'Ongeldige training.', status: 400 })
    const r = (await vinkTrainingAf(s, LID, vraag({ clientId: undefined, afgerondOp: undefined }))) as unknown as Resultaat
    expect(r.data.op).toBe(NU.toISOString())
    expect(db.logs[0].client_id).toBeNull()
  })

  it('een afrondmoment in de toekomst of van meer dan 7 dagen terug: de servertijd', async () => {
    await vinkTrainingAf(s, LID, vraag({ clientId: '55555555-5555-4555-8555-555555555555', afgerondOp: NU.getTime() + 60_000 }))
    await vinkTrainingAf(s, LID, vraag({ clientId: '66666666-6666-4666-8666-666666666666', afgerondOp: NU.getTime() - 8 * 86_400_000 }))
    expect(db.logs.map((l) => l.op)).toEqual([NU.toISOString(), NU.toISOString()])
  })
})
