import { describe, expect, it } from 'vitest'
import { ALLEEN_EIGENAAR, NIVEAUS, RECHT_SLEUTELS, ROLLEN, WERKROLLEN, type Rol } from './typen'
import { START_OPTIES, STANDAARD_START, standaardRolrechten } from './standaard'
import { leesRolrechten, leesRolrechtenInvoer, niveau, niveausVoor, onderdelenVoor, rolNiveau, schoneKaart, startpagina, vanV1 } from './model'
import { beoordeelRollen, magRechtenWijzigen, magRolWijzigen } from './escalatie'
import { ALLE_PAKKETTEN, verborgenVoor } from '@/lib/club/kern/pakketten'

const ALLES = verborgenVoor([], ALLE_PAKKETTEN)
const R = standaardRolrechten()
const ctx = (rollen: Rol[], uit = ALLES) => ({ rollen, rechten: R, uit })

describe('niveaus optellen', () => {
  it('geen rol: overal geen', () => {
    expect(RECHT_SLEUTELS.every((s) => niveau(ctx([]), s) === 'geen')).toBe(true)
  })

  it('meerdere rollen: per onderdeel het hoogste niveau', () => {
    // Instructeur ziet Vandaag, trainer bewerkt het: samen bewerken.
    expect(niveau(ctx(['instructeur']), 'vandaag')).toBe('zien')
    expect(niveau(ctx(['instructeur', 'trainer']), 'vandaag')).toBe('bewerken')
    // Roosteraar beheert het rooster, instructeur bewerkt het: samen beheren.
    expect(niveau(ctx(['instructeur', 'roosteraar']), 'rooster')).toBe('beheren')
    // Optellen is nooit lager dan een losse rol.
    for (const s of RECHT_SLEUTELS) {
      for (const a of ROLLEN) for (const b of ROLLEN) {
        const samen = NIVEAUS.indexOf(niveau(ctx([a, b]), s))
        expect(samen).toBeGreaterThanOrEqual(NIVEAUS.indexOf(niveau(ctx([a]), s)))
        expect(samen).toBeGreaterThanOrEqual(NIVEAUS.indexOf(niveau(ctx([b]), s)))
      }
    }
  })

  it('niet afgenomen of uit: geen, wat de rol ook zegt', () => {
    const zonderLessen = verborgenVoor([], ALLE_PAKKETTEN.filter((p) => p !== 'lessen'))
    expect(niveau(ctx(['manager'], zonderLessen), 'rooster')).toBe('geen')
    expect(niveau(ctx(['eigenaar'], zonderLessen), 'widget')).toBe('geen')
    const leadsUit = verborgenVoor(['leads'], ALLE_PAKKETTEN)
    expect(niveau(ctx(['trainer'], leadsUit), 'leads')).toBe('geen')
    const zonderTeam = verborgenVoor([], ALLE_PAKKETTEN.filter((p) => p !== 'team'))
    expect(niveau(ctx(['administratie'], zonderTeam), 'uren')).toBe('geen')
  })

  it('het master account beheert alles wat afgenomen en aan is', () => {
    expect(niveau({ rollen: [], rechten: R, uit: ALLES, platform: true }, 'abonnement')).toBe('beheren')
  })

  it('hulp heeft iedereen met een rol', () => {
    for (const r of ROLLEN) expect(niveau(ctx([r]), 'hulp')).not.toBe('geen')
  })

  it('standaardtabel van Kane', () => {
    const e = niveausVoor(ctx(['eigenaar']))
    expect(e).toMatchObject({ cijfers: 'beheren', rapporten: 'beheren', team: 'beheren', financien: 'beheren', abonnement: 'beheren', instellingen: 'beheren', leden: 'zien', leads: 'zien' })
    expect(e.vandaag).toBe('geen')
    expect(e.schemas).toBe('geen')
    expect(e.checkin).toBe('geen')
    const tr = niveausVoor(ctx(['trainer']))
    expect(tr).toMatchObject({ vandaag: 'bewerken', leden: 'bewerken', schemas: 'bewerken', afspraken: 'bewerken' })
    expect(tr.cijfers).toBe('geen')
    expect(niveausVoor(ctx(['instructeur']))).toMatchObject({ rooster: 'bewerken', vandaag: 'zien', notities: 'zien', leden: 'geen' })
    expect(niveausVoor(ctx(['roosteraar']))).toMatchObject({ personeel: 'beheren', rooster: 'beheren', afspraken: 'bewerken' })
    expect(niveausVoor(ctx(['administratie']))).toMatchObject({ uren: 'beheren', rapporten: 'zien' })
    const m = niveausVoor(ctx(['manager']))
    expect(RECHT_SLEUTELS.filter((s) => !ALLEEN_EIGENAAR.has(s)).every((s) => m[s] === 'beheren')).toBe(true)
  })

  it('onderdelenVoor geeft alleen bekende sleutels met minstens zien', () => {
    const lijst = onderdelenVoor(niveausVoor(ctx(['instructeur'])))
    expect(lijst).toEqual(expect.arrayContaining(['vandaag', 'rooster', 'notities', 'hulp']))
    expect(lijst.every((s) => RECHT_SLEUTELS.includes(s))).toBe(true)
    expect(onderdelenVoor(niveausVoor(ctx(['manager'])))).toContain('team')
    expect(lijst).not.toContain('leden')
  })
})

describe('ALLEEN_EIGENAAR is niet open te zetten', () => {
  it('opgeslagen rechten die het proberen, worden genegeerd', () => {
    const vals = { rolrechten: { rollen: { manager: Object.fromEntries([...ALLEEN_EIGENAAR].map((s) => [s, 'beheren'])), trainer: { abonnement: 'beheren', rollen: 'beheren' } } } }
    const r = leesRolrechten(vals)
    for (const rol of ROLLEN.filter((x) => x !== 'eigenaar')) {
      for (const s of ALLEEN_EIGENAAR) expect(niveau({ rollen: [rol], rechten: r, uit: ALLES }, s)).toBe('geen')
    }
  })

  it('via de invoer van Rechten per rol ook niet', () => {
    const uit = leesRolrechtenInvoer({ rollen: { manager: { abonnement: 'beheren', privacy: 'beheren', start: 'zien' } } }, R)
    expect(uit.ok).toBe(true)
    if (uit.ok) for (const s of ALLEEN_EIGENAAR) expect(rolNiveau(uit.waarde, 'manager', s)).toBe('geen')
  })

  it('de eigenaar houdt ze altijd op beheren, ook als hij ze probeert uit te zetten', () => {
    const uit = leesRolrechtenInvoer({ rollen: { eigenaar: { abonnement: 'geen', rollen: 'zien' } } }, R)
    expect(uit.ok).toBe(true)
    if (uit.ok) for (const s of ALLEEN_EIGENAAR) expect(rolNiveau(uit.waarde, 'eigenaar', s)).toBe('beheren')
  })

  it('schoneKaart laat onbekende sleutels en niveaus weg', () => {
    expect(schoneKaart('trainer', { onzin: 'beheren', leden: 'alles', vandaag: 'zien' })).toEqual({ vandaag: 'zien' })
  })

  it('invoer met een onbekende rol, sleutel of startpagina wordt geweigerd', () => {
    expect(leesRolrechtenInvoer({ rollen: { baas: {} } }, R).ok).toBe(false)
    expect(leesRolrechtenInvoer({ rollen: { trainer: { onzin: 'zien' } } }, R).ok).toBe(false)
    expect(leesRolrechtenInvoer({ rollen: { trainer: { leden: 'alles' } } }, R).ok).toBe(false)
    expect(leesRolrechtenInvoer({ start: { trainer: 'nergens' } }, R).ok).toBe(false)
    expect(leesRolrechtenInvoer(null, R).ok).toBe(false)
  })
})

describe('rechten v1 naar v2', () => {
  it('elke oude sleutel wordt bewerken, eigenaar en roosteraar krijgen de nieuwe standaard', () => {
    const r = vanV1({ trainer: ['vandaag', 'leden'], manager: ['instellingen', 'huisstijl'], administratie: ['personeel'] })
    expect(r.rollen.trainer).toMatchObject({ vandaag: 'bewerken', leden: 'bewerken' })
    expect(r.rollen.trainer.schemas).toBeUndefined()
    expect(r.rollen.manager.instellingen).toBe('bewerken')
    expect(r.rollen.manager.huisstijl).toBeUndefined()
    // Nieuwe sleutels krijgen de standaard: de administratie houdt de uren.
    expect(r.rollen.administratie).toMatchObject({ personeel: 'bewerken', uren: 'beheren' })
    expect(r.rollen.eigenaar).toEqual(R.rollen.eigenaar)
    expect(r.rollen.roosteraar).toEqual(R.rollen.roosteraar)
    // Een rol die in v1 ontbrak: de standaard.
    expect(r.rollen.instructeur).toEqual(R.rollen.instructeur)
  })

  it('leesRolrechten: v2 wint van v1, kapot wordt de standaard', () => {
    expect(leesRolrechten({ rechten: { trainer: ['leden'] }, rolrechten: { rollen: { trainer: { voeding: 'zien' } } } }).rollen.trainer).toEqual({ voeding: 'zien' })
    expect(leesRolrechten({ rechten: { trainer: ['leden'] } }).rollen.trainer).toMatchObject({ leden: 'bewerken' })
    expect(leesRolrechten(null)).toEqual(R)
    expect(leesRolrechten({ rolrechten: 'kapot' })).toEqual(R)
  })
})

describe('startpagina', () => {
  it('per rol de standaard van Kane, en die is bereikbaar', () => {
    const verwacht: Record<Rol, string> = { eigenaar: '/club/cijfers', manager: '/club', trainer: '/club', instructeur: '/club/rooster', roosteraar: '/club/personeel', administratie: '/club/personeel?tab=uren' }
    for (const rol of ROLLEN) {
      const n = niveausVoor(ctx([rol]))
      expect(startpagina([rol], R, n)).toBe(verwacht[rol])
      expect(n[STANDAARD_START[rol]]).not.toBe('geen')
    }
  })

  it('meerdere rollen: de eerste in de vaste volgorde', () => {
    const rollen: Rol[] = ['eigenaar', 'trainer']
    expect(startpagina(rollen, R, niveausVoor(ctx(rollen)))).toBe('/club')
    const r2: Rol[] = ['administratie', 'instructeur']
    expect(startpagina(r2, R, niveausVoor(ctx(r2)))).toBe('/club/rooster')
  })

  it('valt de startpagina weg, dan het eerste zichtbare onderdeel', () => {
    const zonderAdmin = verborgenVoor([], ALLE_PAKKETTEN.filter((p) => p !== 'administratie'))
    const pad = startpagina(['eigenaar'], R, niveausVoor(ctx(['eigenaar'], zonderAdmin)))
    expect(pad).not.toBe('/club/cijfers')
    expect(pad).toBe('/club/leden')
  })

  it('elke startoptie heeft een pad', () => {
    expect(START_OPTIES.every((o) => typeof o.pad === 'string')).toBe(true)
  })
})

describe('geen escalatie', () => {
  const eigenaar = { platform: false, rollen: ['eigenaar'] as Rol[], teamBeheer: true }
  const manager = { platform: false, rollen: ['manager'] as Rol[], teamBeheer: true }
  const trainer = { platform: false, rollen: ['trainer'] as Rol[], teamBeheer: false }

  it('de eigenaar geeft elke rol', () => {
    for (const r of ROLLEN) expect(magRolWijzigen(eigenaar, r)).toBe(true)
  })

  it('een clubmanager geeft alleen werkrollen, nooit eigenaar of clubmanager', () => {
    for (const r of WERKROLLEN) expect(magRolWijzigen(manager, r)).toBe(true)
    expect(magRolWijzigen(manager, 'eigenaar')).toBe(false)
    expect(magRolWijzigen(manager, 'manager')).toBe(false)
    expect(beoordeelRollen(manager, ['trainer'], ['trainer', 'manager'], 1)).toEqual({ ok: false, reden: 'escalatie' })
    // Ook niet wegnemen.
    expect(beoordeelRollen(manager, ['eigenaar'], [], 0)).toEqual({ ok: false, reden: 'escalatie' })
    expect(beoordeelRollen(manager, ['manager', 'trainer'], ['trainer'], 1)).toEqual({ ok: false, reden: 'escalatie' })
    expect(beoordeelRollen(manager, ['trainer'], ['trainer', 'roosteraar'], 1)).toEqual({ ok: true })
  })

  it('een clubmanager zonder teambeheer en een trainer veranderen niets', () => {
    expect(magRolWijzigen({ ...manager, teamBeheer: false }, 'trainer')).toBe(false)
    for (const r of ROLLEN) expect(magRolWijzigen(trainer, r)).toBe(false)
  })

  it('Rechten per rol: alleen Kane en de eigenaar', () => {
    expect(magRechtenWijzigen(eigenaar)).toBe(true)
    expect(magRechtenWijzigen({ platform: true, rollen: [] })).toBe(true)
    expect(magRechtenWijzigen(manager)).toBe(false)
  })
})

describe('de laatste eigenaar', () => {
  const eigenaar = { platform: false, rollen: ['eigenaar'] as Rol[], teamBeheer: true }
  it('verliest de rol niet als er dan geen eigenaar meer is', () => {
    expect(beoordeelRollen(eigenaar, ['eigenaar'], ['trainer'], 0)).toEqual({ ok: false, reden: 'laatste_eigenaar' })
    expect(beoordeelRollen({ platform: true, rollen: [], teamBeheer: true }, ['eigenaar'], [], 0)).toEqual({ ok: false, reden: 'laatste_eigenaar' })
  })
  it('wel als er nog een eigenaar overblijft', () => {
    expect(beoordeelRollen(eigenaar, ['eigenaar'], ['trainer'], 1)).toEqual({ ok: true })
  })
})
