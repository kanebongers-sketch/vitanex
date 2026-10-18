import { describe, expect, it } from 'vitest'
import {
  AANTAL_STAPPEN,
  NIEUWE_START,
  STAPPEN,
  STAP_SLEUTELS,
  aantalAf,
  afUitData,
  instellingenMetStart,
  leesStart,
  leesStartInvoer,
  moetNaarWizard,
  pasToe,
  stapNummer,
  stapUitParam,
  stappenStand,
  startNaarJson,
  startPad,
  volgendeOpen,
  toonStartKaart,
  vestigingIngericht,
  type StartFeiten,
} from './stappen'

const LEEG: StartFeiten = { heeftLogo: false, vestigingenIngericht: 0, lestypen: 0, vasteLessen: 0, medewerkers: 0, leden: 0, uit: [] }
const NU = new Date('2026-10-18T10:00:00.000Z')

describe('stappen', () => {
  it('heeft negen stappen in vaste volgorde, met welkom eerst en klaar laatst', () => {
    expect(AANTAL_STAPPEN).toBe(9)
    expect(STAPPEN.map((s) => s.sleutel)).toEqual([...STAP_SLEUTELS])
    expect(stapNummer('welkom')).toBe(1)
    expect(stapNummer('klaar')).toBe(9)
  })

  it('duurt samen ongeveer een kwartier', () => {
    const totaal = STAPPEN.reduce((som, s) => som + s.minuten, 0)
    expect(totaal).toBeGreaterThanOrEqual(10)
    expect(totaal).toBeLessThanOrEqual(15)
  })

  it('maakt het adres van een stap', () => {
    expect(startPad(3, null)).toBe('/clubkane/start?stap=3')
    expect(startPad(5, 'budel')).toBe('/clubkane/start?v=budel&stap=5')
  })

  it('vindt de eerste open stap', () => {
    expect(volgendeOpen(stappenStand({ stap: 1, klaar: ['welkom'], afgerondOp: null }, { ...LEEG, heeftLogo: true }))).toBe(3)
    expect(volgendeOpen([{ af: true, nummer: 1 }])).toBe(9)
  })

  it('leest een stapnummer uit de URL', () => {
    expect(stapUitParam('3')).toBe(3)
    expect(stapUitParam(['5', '6'])).toBe(5)
    expect(stapUitParam('0')).toBeNull()
    expect(stapUitParam('10')).toBeNull()
    expect(stapUitParam('2a')).toBeNull()
    expect(stapUitParam(undefined)).toBeNull()
  })
})

describe('leesStart', () => {
  it('geeft null zonder voortgang', () => {
    expect(leesStart(null)).toBeNull()
    expect(leesStart({})).toBeNull()
    expect(leesStart({ ledenapp: {} })).toBeNull()
    expect(leesStart({ start: 'kapot' })).toBeNull()
  })

  it('leest een geldige voortgang', () => {
    expect(leesStart({ start: { stap: 4, klaar: ['huisstijl', 'welkom'], afgerond_op: null } })).toEqual({ stap: 4, klaar: ['welkom', 'huisstijl'], afgerondOp: null })
  })

  it('maakt kapotte velden de standaard en laat onbekende stappen weg', () => {
    expect(leesStart({ start: { stap: 42, klaar: ['onzin', 'team', 'team', 7], afgerond_op: 'geen datum' } })).toEqual({ stap: 1, klaar: ['team'], afgerondOp: null })
  })

  it('heen en terug geeft hetzelfde', () => {
    const v = { stap: 9, klaar: ['welkom' as const, 'klaar' as const], afgerondOp: NU.toISOString() }
    expect(leesStart({ start: startNaarJson(v) })).toEqual(v)
  })

  it('laat andere instellingen staan bij opslaan', () => {
    const uit = instellingenMetStart({ ledenapp: { qr: false }, rechten: { trainer: [] } }, NIEUWE_START)
    expect(uit).toEqual({ ledenapp: { qr: false }, rechten: { trainer: [] }, start: { stap: 1, klaar: [], afgerond_op: null } })
    expect(instellingenMetStart(null, NIEUWE_START)).toEqual({ start: { stap: 1, klaar: [], afgerond_op: null } })
  })
})

describe('leesStartInvoer', () => {
  it('accepteert bekende velden', () => {
    expect(leesStartInvoer({ stap: 3, klaar: 'huisstijl' })).toEqual({ ok: true, waarde: { stap: 3, klaar: 'huisstijl' } })
    expect(leesStartInvoer({ afronden: true })).toEqual({ ok: true, waarde: { afronden: true } })
    expect(leesStartInvoer({ open: 'team' })).toEqual({ ok: true, waarde: { open: 'team' } })
  })

  it('weigert onbekende of foute invoer', () => {
    expect(leesStartInvoer(null).ok).toBe(false)
    expect(leesStartInvoer([]).ok).toBe(false)
    expect(leesStartInvoer({}).ok).toBe(false)
    expect(leesStartInvoer({ stap: 0 }).ok).toBe(false)
    expect(leesStartInvoer({ stap: 10 }).ok).toBe(false)
    expect(leesStartInvoer({ stap: 2.5 }).ok).toBe(false)
    expect(leesStartInvoer({ klaar: 'alles' }).ok).toBe(false)
    expect(leesStartInvoer({ afronden: 'ja' }).ok).toBe(false)
    expect(leesStartInvoer({ stap: 2, extra: 1 }).ok).toBe(false)
  })
})

describe('pasToe', () => {
  it('gaat naar een stap en zet een stap op klaar, zonder dubbelen', () => {
    const een = pasToe(NIEUWE_START, { stap: 2, klaar: 'welkom' }, NU)
    expect(een).toEqual({ stap: 2, klaar: ['welkom'], afgerondOp: null })
    expect(pasToe(een, { klaar: 'welkom' }, NU)).toEqual(een)
    expect(NIEUWE_START.klaar).toEqual([])
  })

  it('zet een stap weer open', () => {
    expect(pasToe({ stap: 5, klaar: ['welkom', 'team'], afgerondOp: null }, { open: 'team' }, NU).klaar).toEqual(['welkom'])
  })

  it('rondt af en opent weer', () => {
    const af = pasToe({ stap: 9, klaar: ['welkom'], afgerondOp: null }, { afronden: true }, NU)
    expect(af).toEqual({ stap: 9, klaar: ['welkom', 'klaar'], afgerondOp: NU.toISOString() })
    // Nog een keer afronden houdt de eerste datum.
    expect(pasToe(af, { afronden: true }, new Date('2027-01-01')).afgerondOp).toBe(NU.toISOString())
    expect(pasToe(af, { afronden: false }, NU)).toEqual({ stap: 9, klaar: ['welkom'], afgerondOp: null })
  })
})

describe('afUitData', () => {
  it('is leeg voor een lege sportschool', () => {
    expect(afUitData(LEEG)).toEqual([])
  })

  it('ziet logo, vestigingen, lestypen, medewerkers en leden', () => {
    expect(afUitData({ ...LEEG, heeftLogo: true, vestigingenIngericht: 1, lestypen: 2, medewerkers: 1, leden: 30 })).toEqual(['huisstijl', 'vestigingen', 'lessen', 'team', 'leden'])
  })

  it('maakt de stap van een onderdeel dat uit staat af', () => {
    expect(afUitData({ ...LEEG, uit: ['rooster', 'leden'] })).toEqual(['lessen', 'leden'])
    expect(afUitData({ ...LEEG, uit: ['app'] })).toEqual([])
    expect(afUitData({ ...LEEG, uit: ['app', 'checkin'] })).toEqual(['ledenapp'])
  })

  it('telt een vestiging met adres of openingstijden als ingericht', () => {
    expect(vestigingIngericht({ adres: 'Markt 1, Budel', openingstijden: {} })).toBe(true)
    expect(vestigingIngericht({ adres: null, openingstijden: { 1: ['06:00', '23:00'] } })).toBe(true)
    expect(vestigingIngericht({ adres: '  ', openingstijden: {} })).toBe(false)
    expect(vestigingIngericht({ adres: null, openingstijden: null })).toBe(false)
  })
})

describe('stappenStand', () => {
  it('combineert zelf aangevinkt en af door de data', () => {
    const stand = stappenStand({ stap: 3, klaar: ['welkom'], afgerondOp: null }, { ...LEEG, heeftLogo: true })
    expect(stand.filter((s) => s.af).map((s) => s.sleutel)).toEqual(['welkom', 'huisstijl'])
    expect(stand.find((s) => s.sleutel === 'huisstijl')?.vanzelf).toBe(true)
    expect(stand.find((s) => s.sleutel === 'welkom')?.vanzelf).toBe(false)
    expect(stand.map((s) => s.nummer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(aantalAf(stand)).toBe(2)
  })

  it('telt klaar alleen als de wizard is afgerond', () => {
    expect(stappenStand({ stap: 9, klaar: ['klaar'], afgerondOp: null }, LEEG).find((s) => s.sleutel === 'klaar')?.af).toBe(false)
    expect(stappenStand({ stap: 9, klaar: [], afgerondOp: NU.toISOString() }, LEEG).find((s) => s.sleutel === 'klaar')?.af).toBe(true)
  })

  it('werkt zonder voortgang', () => {
    expect(aantalAf(stappenStand(null, LEEG))).toBe(0)
  })
})

describe('wie de wizard krijgt', () => {
  const beheerder = '00000000-0000-4000-8000-000000000001'
  const nieuw = { id: '00000000-0000-4000-8000-0000000000aa', demo: false }

  it('stuurt een nieuwe sportschool zonder voortgang naar de wizard', () => {
    expect(moetNaarWizard(nieuw, beheerder, null)).toBe(true)
    expect(moetNaarWizard(nieuw, beheerder, NIEUWE_START)).toBe(false)
  })

  it('stuurt Fit Factory en een demo nooit automatisch', () => {
    expect(moetNaarWizard({ id: beheerder, demo: false }, beheerder, null)).toBe(false)
    expect(moetNaarWizard({ ...nieuw, demo: true }, beheerder, null)).toBe(false)
  })

  it('toont de kaart op Vandaag zolang de wizard loopt', () => {
    expect(toonStartKaart(null)).toBe(false)
    expect(toonStartKaart(NIEUWE_START)).toBe(true)
    expect(toonStartKaart({ ...NIEUWE_START, afgerondOp: NU.toISOString() })).toBe(false)
  })
})
