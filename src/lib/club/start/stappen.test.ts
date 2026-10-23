import { describe, expect, it } from 'vitest'
import {
  AANTAL_STAPPEN,
  NIEUWE_START,
  STAPPEN,
  STAP_SLEUTELS,
  aantalAf,
  instellingenMetStart,
  isHervatten,
  leesStart,
  minutenOver,
  minutenTekst,
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
  stapAf,
  nogOpen,
  klaarVoorLive,
  nogOpenTekst,
  type StartFeiten,
} from './stappen'
import { STANDAARD_OPENINGSTIJDEN } from '@/lib/club/instellingen/vestigingen-invoer'

const LEEG: StartFeiten = { heeftLogo: false, heeftAdres: false, vestigingen: 1, vestigingenMetAdres: 0, vestigingenIngericht: 0, lestypen: 0, vasteLessen: 0, medewerkers: 0, leden: 0, uit: [] }
/** Alles echt ingevuld. */
const VOL: StartFeiten = { heeftLogo: true, heeftAdres: true, vestigingen: 1, vestigingenMetAdres: 1, vestigingenIngericht: 1, lestypen: 3, vasteLessen: 5, medewerkers: 2, leden: 40, uit: [] }
const NU = new Date('2026-10-18T10:00:00.000Z')

describe('stappen', () => {
  it('heeft acht stappen in vaste volgorde, met de soort eerst en klaar laatst', () => {
    expect(AANTAL_STAPPEN).toBe(8)
    expect(STAPPEN.map((s) => s.sleutel)).toEqual([...STAP_SLEUTELS])
    expect(stapNummer('soort')).toBe(1)
    expect(stapNummer('klaar')).toBe(8)
  })

  it('past binnen een kwartier', () => {
    const totaal = STAPPEN.reduce((som, s) => som + s.minuten, 0)
    expect(totaal).toBeGreaterThanOrEqual(10)
    expect(totaal).toBeLessThanOrEqual(15)
  })

  it('maakt het adres van een stap', () => {
    expect(startPad(3, null)).toBe('/club/start?stap=3')
    expect(startPad(5, 'budel')).toBe('/club/start?v=budel&stap=5')
  })

  it('vindt de eerste open stap', () => {
    expect(volgendeOpen(stappenStand({ ...NIEUWE_START, soort: 'gym' }, { ...LEEG, heeftLogo: true, heeftAdres: true }))).toBe(3)
    expect(volgendeOpen([{ af: true, nummer: 1 }])).toBe(8)
  })

  it('leest een stapnummer uit de URL', () => {
    expect(stapUitParam('3')).toBe(3)
    expect(stapUitParam(['5', '6'])).toBe(5)
    expect(stapUitParam('0')).toBeNull()
    expect(stapUitParam('9')).toBeNull()
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
    expect(leesStart({ start: { stap: 4, klaar: ['huisstijl', 'soort'], afgerond_op: null, soort: 'yoga' } })).toEqual({ stap: 4, klaar: ['soort', 'huisstijl'], afgerondOp: null, soort: 'yoga', streefdatum: null, bevestigd: [] })
  })

  it('maakt kapotte velden de standaard en laat onbekende stappen weg', () => {
    expect(leesStart({ start: { stap: 42, klaar: ['onzin', 'team', 'team', 7], afgerond_op: 'geen datum', soort: 'zwembad' } })).toEqual({ stap: 1, klaar: ['team'], afgerondOp: null, soort: null, streefdatum: null, bevestigd: [] })
  })

  it('leest oude voortgang zonder soort en met stappen die niet meer bestaan', () => {
    expect(leesStart({ start: { stap: 9, klaar: ['welkom', 'ledenapp', 'team'], afgerond_op: null } })).toEqual({ stap: 1, klaar: ['team'], afgerondOp: null, soort: null, streefdatum: null, bevestigd: [] })
  })

  it('heen en terug geeft hetzelfde', () => {
    const v = { stap: 8, klaar: ['soort' as const, 'klaar' as const], afgerondOp: NU.toISOString(), soort: 'boutique' as const, streefdatum: '2026-11-01', bevestigd: ['alleen' as const] }
    expect(leesStart({ start: startNaarJson(v) })).toEqual(v)
  })

  it('laat andere instellingen staan bij opslaan', () => {
    const uit = instellingenMetStart({ ledenapp: { qr: false }, rechten: { trainer: [] } }, NIEUWE_START)
    expect(uit).toEqual({ ledenapp: { qr: false }, rechten: { trainer: [] }, start: { stap: 1, klaar: [], afgerond_op: null, soort: null, streefdatum: null, bevestigd: [] } })
    expect(instellingenMetStart(null, NIEUWE_START)).toEqual({ start: { stap: 1, klaar: [], afgerond_op: null, soort: null, streefdatum: null, bevestigd: [] } })
  })
})

describe('leesStartInvoer', () => {
  it('accepteert bekende velden', () => {
    expect(leesStartInvoer({ stap: 3, klaar: 'huisstijl' })).toEqual({ ok: true, waarde: { stap: 3, klaar: 'huisstijl' } })
    expect(leesStartInvoer({ afronden: true })).toEqual({ ok: true, waarde: { afronden: true } })
    expect(leesStartInvoer({ open: 'team' })).toEqual({ ok: true, waarde: { open: 'team' } })
    expect(leesStartInvoer({ soort: 'pt', klaar: 'soort' })).toEqual({ ok: true, waarde: { klaar: 'soort', soort: 'pt' } })
  })

  it('weigert onbekende of foute invoer', () => {
    expect(leesStartInvoer(null).ok).toBe(false)
    expect(leesStartInvoer([]).ok).toBe(false)
    expect(leesStartInvoer({}).ok).toBe(false)
    expect(leesStartInvoer({ stap: 0 }).ok).toBe(false)
    expect(leesStartInvoer({ stap: 9 }).ok).toBe(false)
    expect(leesStartInvoer({ stap: 2.5 }).ok).toBe(false)
    expect(leesStartInvoer({ klaar: 'alles' }).ok).toBe(false)
    expect(leesStartInvoer({ klaar: 'welkom' }).ok).toBe(false)
    expect(leesStartInvoer({ soort: 'zwembad' }).ok).toBe(false)
    expect(leesStartInvoer({ afronden: 'ja' }).ok).toBe(false)
    expect(leesStartInvoer({ stap: 2, extra: 1 }).ok).toBe(false)
  })
})

describe('pasToe', () => {
  it('gaat naar een stap en zet een stap op klaar, zonder dubbelen', () => {
    const een = pasToe(NIEUWE_START, { stap: 2, klaar: 'soort' }, NU)
    expect(een).toEqual({ stap: 2, klaar: ['soort'], afgerondOp: null, soort: null, streefdatum: null, bevestigd: [] })
    expect(pasToe(een, { klaar: 'soort' }, NU)).toEqual(een)
    expect(NIEUWE_START.klaar).toEqual([])
  })

  it('bewaart de gekozen soort en houdt hem bij volgende stappen', () => {
    const gekozen = pasToe(NIEUWE_START, { soort: 'vechtsport', klaar: 'soort', stap: 2 }, NU)
    expect(gekozen.soort).toBe('vechtsport')
    expect(pasToe(gekozen, { stap: 3 }, NU).soort).toBe('vechtsport')
  })

  it('zet een stap weer open', () => {
    expect(pasToe({ ...NIEUWE_START, stap: 5, klaar: ['soort', 'team'] }, { open: 'team' }, NU).klaar).toEqual(['soort'])
  })

  it('rondt af en opent weer', () => {
    const af = pasToe({ ...NIEUWE_START, stap: 8, klaar: ['soort'] }, { afronden: true }, NU)
    expect(af).toEqual({ stap: 8, klaar: ['soort', 'klaar'], afgerondOp: NU.toISOString(), soort: null, streefdatum: null, bevestigd: [] })
    // Nog een keer afronden houdt de eerste datum.
    expect(pasToe(af, { afronden: true }, new Date('2027-01-01')).afgerondOp).toBe(NU.toISOString())
    expect(pasToe(af, { afronden: false }, NU)).toEqual({ stap: 8, klaar: ['soort'], afgerondOp: null, soort: null, streefdatum: null, bevestigd: [] })
  })
})

describe('vestigingIngericht', () => {
  it('telt een vestiging met adres of openingstijden als ingericht', () => {
    expect(vestigingIngericht({ adres: 'Markt 1, Budel', openingstijden: {} })).toBe(true)
    expect(vestigingIngericht({ adres: null, openingstijden: { 1: ['06:00', '23:00'] } })).toBe(true)
    expect(vestigingIngericht({ adres: '  ', openingstijden: {} })).toBe(false)
    expect(vestigingIngericht({ adres: null, openingstijden: null })).toBe(false)
  })

  it('telt de plaatshouder-tijden van een nieuwe vestiging niet als ingericht', () => {
    expect(vestigingIngericht({ adres: null, openingstijden: STANDAARD_OPENINGSTIJDEN })).toBe(false)
    expect(vestigingIngericht({ adres: 'Dorpsstraat 1, Ergens', openingstijden: STANDAARD_OPENINGSTIJDEN })).toBe(true)
    expect(vestigingIngericht({ adres: null, openingstijden: { ...STANDAARD_OPENINGSTIJDEN, 7: ['10:00', '14:00'] } })).toBe(true)
  })
})

describe('stapAf: een stap is pas af als de inhoud er staat', () => {
  const zelf = (klaar: (typeof STAP_SLEUTELS)[number][]) => ({ ...NIEUWE_START, klaar })

  it('soort: alleen met een gekozen soort', () => {
    expect(stapAf('soort', null, VOL)).toBe(false)
    expect(stapAf('soort', zelf(['soort']), VOL)).toBe(false)
    expect(stapAf('soort', { ...NIEUWE_START, soort: 'pt' }, LEEG)).toBe(true)
  })

  it('huisstijl: eigen adres, plus een logo of zelf op klaar', () => {
    expect(stapAf('huisstijl', null, { ...LEEG, heeftLogo: true })).toBe(false)
    expect(stapAf('huisstijl', null, { ...LEEG, heeftLogo: true, heeftAdres: true })).toBe(true)
    expect(stapAf('huisstijl', null, { ...LEEG, heeftAdres: true })).toBe(false)
    expect(stapAf('huisstijl', zelf(['huisstijl']), { ...LEEG, heeftAdres: true })).toBe(true)
    expect(stapAf('huisstijl', zelf(['huisstijl']), LEEG)).toBe(false)
  })

  it('vestigingen: elke vestiging heeft een adres', () => {
    expect(stapAf('vestigingen', zelf(['vestigingen']), LEEG)).toBe(false)
    expect(stapAf('vestigingen', null, { ...LEEG, vestigingenMetAdres: 1 })).toBe(true)
    expect(stapAf('vestigingen', null, { ...LEEG, vestigingen: 2, vestigingenMetAdres: 1 })).toBe(false)
    expect(stapAf('vestigingen', null, { ...LEEG, vestigingen: 0, vestigingenMetAdres: 0 })).toBe(false)
  })

  it('onderdelen: zelf bevestigd met verder', () => {
    expect(stapAf('onderdelen', null, VOL)).toBe(false)
    expect(stapAf('onderdelen', zelf(['onderdelen']), LEEG)).toBe(true)
  })

  it('lessen: een lestype en vaste lessen, of bewust geen vaste lessen', () => {
    expect(stapAf('lessen', zelf(['lessen']), LEEG)).toBe(false)
    expect(stapAf('lessen', null, { ...LEEG, lestypen: 2 })).toBe(false)
    expect(stapAf('lessen', null, { ...LEEG, lestypen: 2, vasteLessen: 3 })).toBe(true)
    expect(stapAf('lessen', { ...NIEUWE_START, bevestigd: ['geen_vaste_lessen'] }, { ...LEEG, lestypen: 1 })).toBe(true)
    expect(stapAf('lessen', { ...NIEUWE_START, bevestigd: ['geen_vaste_lessen'] }, LEEG)).toBe(false)
    expect(stapAf('lessen', null, { ...LEEG, uit: ['rooster'] })).toBe(true)
  })

  it('team: een medewerker, of bewust alleen', () => {
    expect(stapAf('team', zelf(['team']), LEEG)).toBe(false)
    expect(stapAf('team', null, { ...LEEG, medewerkers: 1 })).toBe(true)
    expect(stapAf('team', { ...NIEUWE_START, bevestigd: ['alleen'] }, LEEG)).toBe(true)
  })

  it('leden: een lid, bewust zonder leden, of leden uit', () => {
    expect(stapAf('leden', zelf(['leden']), LEEG)).toBe(false)
    expect(stapAf('leden', null, { ...LEEG, leden: 1 })).toBe(true)
    expect(stapAf('leden', { ...NIEUWE_START, bevestigd: ['zonder_leden'] }, LEEG)).toBe(true)
    expect(stapAf('leden', null, { ...LEEG, uit: ['leden'] })).toBe(true)
  })
})

describe('stappenStand', () => {
  const alles = { ...NIEUWE_START, soort: 'pt' as const, klaar: ['onderdelen' as const] }

  it('nummert de stappen en telt wat af is', () => {
    const stand = stappenStand({ ...NIEUWE_START, soort: 'gym' }, { ...LEEG, heeftLogo: true, heeftAdres: true })
    expect(stand.filter((s) => s.af).map((s) => s.sleutel)).toEqual(['soort', 'huisstijl'])
    expect(stand.map((s) => s.nummer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(aantalAf(stand)).toBe(2)
  })

  it('telt klaar alleen als de wizard is afgerond en alles ervoor staat', () => {
    expect(stappenStand({ ...NIEUWE_START, stap: 8, klaar: ['klaar'] }, LEEG).find((s) => s.sleutel === 'klaar')?.af).toBe(false)
    // Afgerond maar nog niet alles: geen "8 van 8".
    const half = stappenStand({ ...alles, afgerondOp: NU.toISOString() }, { ...VOL, vasteLessen: 0, medewerkers: 0, leden: 0 })
    expect(half.find((s) => s.sleutel === 'klaar')?.af).toBe(false)
    expect(nogOpen(half).map((s) => s.sleutel)).toEqual(['lessen', 'team', 'leden'])
    expect(klaarVoorLive(half)).toBe(false)
    const heel = stappenStand({ ...alles, afgerondOp: NU.toISOString() }, VOL)
    expect(aantalAf(heel)).toBe(8)
    expect(klaarVoorLive(heel)).toBe(true)
  })

  it('maakt optionele stappen af met een bevestiging', () => {
    const stand = stappenStand({ ...alles, bevestigd: ['alleen', 'zonder_leden', 'geen_vaste_lessen'] }, { ...VOL, vasteLessen: 0, medewerkers: 0, leden: 0 })
    expect(klaarVoorLive(stand)).toBe(true)
  })

  it('werkt zonder voortgang', () => {
    expect(aantalAf(stappenStand(null, LEEG))).toBe(0)
  })

  it('noemt wat nog open staat in gewone taal', () => {
    expect(nogOpenTekst([{ titel: 'Lessen' }])).toBe('Nog niet alles staat: Lessen. Maak die stappen eerst af.')
    expect(nogOpenTekst([{ titel: 'Lessen' }, { titel: 'Team' }, { titel: 'Leden' }])).toBe('Nog niet alles staat: Lessen, Team en Leden. Maak die stappen eerst af.')
  })
})

describe('bevestigingen', () => {
  it('leest en schrijft bevestigingen, en laat onbekende weg', () => {
    expect(leesStart({ start: { stap: 6, klaar: [], bevestigd: ['alleen', 'onzin', 'alleen'] } })?.bevestigd).toEqual(['alleen'])
    expect(leesStartInvoer({ bevestig: { alleen: true } })).toEqual({ ok: true, waarde: { bevestig: { alleen: true } } })
    expect(leesStartInvoer({ bevestig: { onzin: true } }).ok).toBe(false)
    expect(leesStartInvoer({ bevestig: { alleen: 'ja' } }).ok).toBe(false)
    expect(leesStartInvoer({ bevestig: {} }).ok).toBe(false)
  })

  it('zet een bevestiging aan en weer uit, zonder de rest te raken', () => {
    const aan = pasToe(NIEUWE_START, { bevestig: { alleen: true, zonder_leden: true } }, NU)
    expect(aan.bevestigd).toEqual(['alleen', 'zonder_leden'])
    expect(pasToe(aan, { bevestig: { alleen: false } }, NU).bevestigd).toEqual(['zonder_leden'])
    expect(pasToe(aan, { stap: 3 }, NU).bevestigd).toEqual(['alleen', 'zonder_leden'])
  })
})

describe('tijd en hervatten', () => {
  it('telt de minuten van de open stappen', () => {
    const totaal = STAPPEN.reduce((som, s) => som + s.minuten, 0)
    expect(minutenOver(stappenStand(null, LEEG))).toBe(totaal)
    const stand = stappenStand({ ...NIEUWE_START, soort: 'gym' }, { ...LEEG, heeftLogo: true, heeftAdres: true })
    expect(minutenOver(stand)).toBe(totaal - STAPPEN[0].minuten - STAPPEN[1].minuten)
    expect(minutenOver(stappenStand({ ...NIEUWE_START, soort: 'gym', afgerondOp: NU.toISOString(), klaar: [...STAP_SLEUTELS] }, VOL))).toBe(0)
  })

  it('zegt de tijd in gewone taal', () => {
    expect(minutenTekst(0)).toBe('Alles staat')
    expect(minutenTekst(1)).toBe('Nog ongeveer een minuut')
    expect(minutenTekst(9)).toBe('Nog ongeveer 9 minuten')
  })

  it('heet alleen welkom terug halverwege en zonder stap in de URL', () => {
    expect(isHervatten({ ...NIEUWE_START, stap: 4 }, null)).toBe(true)
    expect(isHervatten({ ...NIEUWE_START, stap: 4 }, 4)).toBe(false)
    expect(isHervatten({ ...NIEUWE_START, stap: 1 }, null)).toBe(false)
    expect(isHervatten({ ...NIEUWE_START, stap: 4, afgerondOp: NU.toISOString() }, null)).toBe(false)
    expect(isHervatten(null, null)).toBe(false)
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
