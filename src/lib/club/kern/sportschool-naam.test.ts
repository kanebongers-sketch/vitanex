import { describe, expect, it } from 'vitest'
import type { ClubToegang } from '@/lib/club/toegang'
import { nepSupabase, heeftFilter, type Vraag } from '@/lib/club/beheerders/nep-supabase'
import { NOOIT_VOOR_CLUBMANAGER, magApi, toegestaneOnderdelen } from '@/lib/club/beheerders/rechten'
import { medewerkerOnderdelen } from '@/lib/club/medewerker-login/rechten'
import { zoekItems, filterZoek } from '@/components/club/shell/zoeken'
import { merkVersie } from '@/lib/club/ledenapp-pwa/manifest'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'
import { MAX_NAAM, bedrijfsnaamVoorstel, isNaamBezet, leesSportschoolNaam } from './sportschool-naam'
import { leesHuisstijl } from './organisatie-invoer'
import { bewaarHuisstijl } from './organisatie-opslag'

// De naam van de sportschool aanpassen (Kane 29-10-2026): validatie, rechten,
// tenant-scheiding bij opslaan, de slug verandert nooit mee, en de naam is te
// vinden met Ctrl K.

const PLATFORM = '11111111-1111-4111-8111-111111111111'
const ORG = '22222222-2222-4222-8222-222222222222'
const ANDER = '33333333-3333-4333-8333-333333333333'

function toegang(admin: ClubToegang['admin'], naam = 'Gym Noord'): ClubToegang {
  return {
    admin, userId: ORG, beheerderId: PLATFORM, organisatie: { id: ORG, naam, slug: 'gymnoord' }, organisaties: [],
    rol: 'eigenaar', isPlatformEigenaar: false, persoonId: 'p', onderdelen: null, vestigingen: [], naam: 'Eva',
  } as unknown as ClubToegang
}

const INVOER = { naam: 'Gym Zuid', slogan: null, kleurTweede: null, kleurTint: null, variant: 'donker' as const, kleurAccent: '#B58E5C', thema: 'donker' as const, uit: [] }

describe('leesSportschoolNaam', () => {
  it('maakt de naam netjes en accepteert 2 tot 60 tekens', () => {
    expect(leesSportschoolNaam('  Gym   Zuid ')).toEqual({ ok: true, naam: 'Gym Zuid' })
    expect(leesSportschoolNaam('GZ')).toEqual({ ok: true, naam: 'GZ' })
    expect(leesSportschoolNaam('x'.repeat(MAX_NAAM)).ok).toBe(true)
  })
  it('weigert leeg, te kort, te lang en vreemde tekens met een code', () => {
    expect(leesSportschoolNaam('   ')).toEqual({ ok: false, code: 'naamLeeg' })
    expect(leesSportschoolNaam(null)).toEqual({ ok: false, code: 'naamLeeg' })
    expect(leesSportschoolNaam('G')).toEqual({ ok: false, code: 'naamTeKort' })
    expect(leesSportschoolNaam('x'.repeat(MAX_NAAM + 1))).toEqual({ ok: false, code: 'naamTeLang' })
    expect(leesSportschoolNaam('Gym <b>')).toEqual({ ok: false, code: 'naamTekens' })
    expect(leesSportschoolNaam('Gym\u0000Zuid')).toEqual({ ok: false, code: 'naamTekens' })
  })
  it('leesHuisstijl geeft de code van de naamfout door', () => {
    expect(leesHuisstijl({ ...INVOER, naam: 'G' })).toMatchObject({ ok: false, code: 'naamTeKort' })
    expect(leesHuisstijl({ ...INVOER, naam: ' Gym  Zuid ' })).toMatchObject({ ok: true, waarde: { naam: 'Gym Zuid' } })
  })
  it('heeft voor elke fout een tekst in NL en EN', () => {
    for (const taal of ['nl', 'en'] as const) {
      const f = HUISSTIJL[taal].fouten
      for (const code of ['naamLeeg', 'naamTeKort', 'naamTekens', 'naamBezet', 'opslaan'] as const) expect(f[code].length).toBeGreaterThan(5)
      expect(f.naamTeLang(MAX_NAAM)).toContain(String(MAX_NAAM))
    }
  })
})

describe('isNaamBezet en bedrijfsnaamVoorstel', () => {
  const bestaande = [{ id: ORG, naam: 'Gym Noord' }, { id: ANDER, naam: 'Gym  Zuid' }]
  it('telt hoofdletters en spaties niet, en de eigen sportschool niet', () => {
    expect(isNaamBezet(bestaande, 'gym zuid', ORG)).toBe(true)
    expect(isNaamBezet(bestaande, 'GYM NOORD', ORG)).toBe(false)
    expect(isNaamBezet(bestaande, 'Gym West', ORG)).toBe(false)
  })
  it('stelt de naam van de sportschool voor als de bedrijfsnaam leeg is', () => {
    expect(bedrijfsnaamVoorstel(null, 'Gym Noord')).toBe('Gym Noord')
    expect(bedrijfsnaamVoorstel('  ', 'Gym Noord')).toBe('Gym Noord')
    expect(bedrijfsnaamVoorstel('Noord B.V.', 'Gym Noord')).toBe('Noord B.V.')
  })
})

describe('bewaarHuisstijl', () => {
  const update = (vragen: Vraag[]) => vragen.find((v) => v.tabel === 'club_organisaties' && v.actie === 'update')

  it('bewaart de nieuwe naam alleen bij de eigen sportschool en laat de slug staan', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? { data: [{ id: ORG, naam: 'Gym Noord' }], error: null } : { data: [{ id: ORG }], error: null }))
    expect(await bewaarHuisstijl(toegang(admin), INVOER)).toEqual({ ok: true, naamGewijzigd: true })
    const lezen = vragen.find((v) => v.tabel === 'club_organisaties' && v.actie === 'select')
    expect(lezen && heeftFilter(lezen, 'beheerder_id', PLATFORM)).toBe(true)
    const u = update(vragen)
    expect(u && heeftFilter(u, 'id', ORG) && heeftFilter(u, 'beheerder_id', PLATFORM)).toBe(true)
    expect(u?.waarde).toMatchObject({ naam: 'Gym Zuid' })
    expect(Object.keys(u?.waarde as object)).not.toContain('slug')
  })

  it('leest geen namen als de naam niet verandert', async () => {
    const { admin, vragen } = nepSupabase(() => ({ data: [{ id: ORG }], error: null }))
    expect(await bewaarHuisstijl(toegang(admin, 'Gym  Zuid'), INVOER)).toEqual({ ok: true, naamGewijzigd: false })
    expect(vragen.filter((v) => v.actie === 'select')).toHaveLength(0)
  })

  it('weigert een naam die een andere sportschool van dezelfde beheerder al heeft', async () => {
    const { admin, vragen } = nepSupabase(() => ({ data: [{ id: ANDER, naam: 'gym zuid' }], error: null }))
    expect(await bewaarHuisstijl(toegang(admin), INVOER)).toEqual({ ok: false, code: 'naamBezet' })
    expect(update(vragen)).toBeUndefined()
  })

  it('maakt van de unieke index ook naamBezet', async () => {
    const { admin } = nepSupabase((v) => (v.actie === 'select' ? { data: [], error: null } : { data: null, error: { message: 'dubbel', code: '23505' } }))
    expect(await bewaarHuisstijl(toegang(admin), INVOER)).toEqual({ ok: false, code: 'naamBezet' })
  })

  it('meldt nooit stil opgeslagen als er geen rij geraakt is', async () => {
    const { admin } = nepSupabase((v) => (v.actie === 'select' ? { data: [], error: null } : { data: [], error: null }))
    expect(await bewaarHuisstijl(toegang(admin), INVOER)).toEqual({ ok: false, code: 'opslaan' })
  })
})

describe('rechten: wie de naam mag aanpassen', () => {
  const rechten = { manager: ['leden', 'huisstijl', 'bedrijf'], trainer: ['huisstijl'], instructeur: [] } as never
  it('Kane en de eigenaar wel', () => {
    expect(toegestaneOnderdelen({ isPlatformEigenaar: true, rol: 'beheerder' }, rechten)).toBeNull()
    expect(toegestaneOnderdelen({ isPlatformEigenaar: false, rol: 'eigenaar' }, rechten)).toBeNull()
    expect(magApi(null, '/api/club/organisatie', 'PATCH')).toBe(true)
  })
  it('een clubmanager en medewerker nooit, ook niet als de rechten het aanvinken', () => {
    expect(NOOIT_VOOR_CLUBMANAGER.has('huisstijl')).toBe(true)
    const manager = toegestaneOnderdelen({ isPlatformEigenaar: false, rol: 'clubmanager' }, rechten)
    expect(manager).not.toContain('huisstijl')
    expect(magApi(manager, '/api/club/organisatie', 'PATCH')).toBe(false)
    expect(medewerkerOnderdelen(['trainer'] as never, rechten)).not.toContain('huisstijl')
  })
})

describe('vinden en doorwerken', () => {
  it('Ctrl K vindt de naam op naam, bedrijfsnaam en sportschool', () => {
    const items = zoekItems({ uit: [], toegestaan: null, medewerker: false, betalenAan: false }, true)
    for (const woord of ['naam', 'bedrijfsnaam', 'sportschool', 'sportschoolnaam']) {
      expect(filterZoek(items, woord).some((i) => i.id === 'instel-huisstijl')).toBe(true)
    }
  })
  it('het app-icoon en manifest krijgen een nieuwe versie bij een nieuwe naam', () => {
    const merk = { organisatieId: ORG, naam: 'Gym Noord', slug: 'gymnoord', kleurTweede: null, kleurTint: null, variant: 'donker' as const, kleurAccent: '#B58E5C', thema: 'donker' as const, logoUrl: null }
    expect(merkVersie(merk)).not.toBe(merkVersie({ ...merk, naam: 'Gym Zuid' }))
  })
})
