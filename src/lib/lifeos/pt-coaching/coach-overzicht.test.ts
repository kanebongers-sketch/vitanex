import { describe, expect, test } from 'vitest'
import {
  coachFase, eerstOpTePakken, gesprekDezeWeek, gesprekGehad, laatsteContactOp, moetDoorplannen, nietDezeWeek, patroonLabel, patroonVan, patroonVoorstellen, weekBlokken, weekVan, opTePakkenLabel, opTePakkenTekst, sorteerCoachRijen, telCoach, verslagOpen,
  type CoachRij, type OpTePakken,
} from './coach-overzicht'
import type { EvaluatieJson } from './pt-coaching'
import type { Lead } from '@/lib/lifeos/leads/leads'

const NU = new Date('2026-10-09T10:00:00Z')

function verslag(op: string): EvaluatieJson {
  return { id: `v-${op}`, aangemaaktOp: op, scores: { algemeen: 4, energie: 4, voortgang: 4 }, notitie: null, aandachtspunt: null }
}

const LEEG: OpTePakken = { teLaat: [], vandaag: [], zonderPlan: [] }

function rij(over: Partial<CoachRij> & { naam: string }): CoachRij {
  return { id: over.naam.toLowerCase(), volgendeOp: null, laatsteGesprekOp: null, afspraken: [], verslagen: [], openPunten: [], opTePakken: LEEG, ...over }
}

function lead(naam: string, over: Partial<Lead> = {}): Lead {
  return {
    id: naam, naam, contact: null, club: null, bron: 'vloer', interesse: null, status: 'opvolgen', volgendeStap: 'bellen',
    opvolgdatum: null, opvolgtijd: null, reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null, geenKlantReden: null,
    gesprokenOp: '2026-10-01', aangemaaktOp: '2026-10-01T10:00:00Z', ...over,
  }
}

describe('laatste contact & gesprek gehad', () => {
  test('het laatste van agenda-gesprek en verslag telt', () => {
    expect(laatsteContactOp(rij({ naam: 'A' }))).toBeNull()
    expect(laatsteContactOp(rij({ naam: 'A', laatsteGesprekOp: '2026-10-01T09:00:00Z' }))).toBe('2026-10-01T09:00:00Z')
    expect(laatsteContactOp(rij({ naam: 'A', laatsteGesprekOp: '2026-10-01T09:00:00Z', verslagen: [verslag('2026-10-02T09:00:00Z')] }))).toBe('2026-10-02T09:00:00Z')
  })

  test('binnen twee weken = gehad, daarbuiten niet', () => {
    expect(gesprekGehad(rij({ naam: 'A', verslagen: [verslag('2026-09-30T09:00:00Z')] }), NU)).toBe(true)
    expect(gesprekGehad(rij({ naam: 'A', verslagen: [verslag('2026-09-20T09:00:00Z')] }), NU)).toBe(false)
    expect(gesprekGehad(rij({ naam: 'A' }), NU)).toBe(false)
  })
})

describe('verslag open & fase', () => {
  test('gesprek geweest zonder verslag erna → verslag invullen', () => {
    const r = rij({ naam: 'A', laatsteGesprekOp: '2026-10-08T09:00:00Z', verslagen: [verslag('2026-10-01T09:00:00Z')], volgendeOp: '2026-10-15T09:00:00Z' })
    expect(verslagOpen(r, NU)).toBe(true)
    expect(coachFase(r, NU)).toBe('verslag')
  })
  test('verslag ná het gesprek → geen verslag open; zonder volgende afspraak → inplannen', () => {
    const r = rij({ naam: 'A', laatsteGesprekOp: '2026-10-08T09:00:00Z', verslagen: [verslag('2026-10-08T10:00:00Z')] })
    expect(verslagOpen(r, NU)).toBe(false)
    // 8 okt (do) en NU 9 okt (vr) zitten in dezelfde week: meteen doorplannen.
    expect(coachFase(r, NU)).toBe('doorplannen')
    // Maandag 12 okt is een nieuwe week: dan gewoon inplannen.
    expect(coachFase(r, new Date('2026-10-12T10:00:00Z'))).toBe('inplannen')
    expect(coachFase({ ...r, volgendeOp: '2026-10-15T09:00:00Z' }, NU)).toBe('geregeld')
  })
})

describe('de week van maandag tot en met zondag (besluit Kane 11-11-2026)', () => {
  // woensdag 11 november 2026
  const WOE = new Date('2026-11-11T12:00:00Z')

  test('week loopt van maandag tot en met zondag, ook op zondagavond laat (Nederlandse tijd)', () => {
    expect(weekVan(WOE)).toEqual({ maandag: '2026-11-09', zondag: '2026-11-15' })
    expect(weekVan(new Date('2026-11-15T23:30:00Z'))).toEqual({ maandag: '2026-11-16', zondag: '2026-11-22' })
    expect(weekVan(new Date('2026-11-15T22:30:00Z'))).toEqual({ maandag: '2026-11-09', zondag: '2026-11-15' })
  })

  test('telt gesprekken deze week: geweest of nog gepland in deze week', () => {
    // Arrange
    const rijen = [
      rij({ naam: 'Geweest', laatsteGesprekOp: '2026-11-10T09:00:00Z', verslagen: [verslag('2026-11-10T10:00:00Z')] }),
      rij({ naam: 'Gepland', laatsteGesprekOp: '2026-11-03T09:00:00Z', verslagen: [verslag('2026-11-03T10:00:00Z')], volgendeOp: '2026-11-13T09:00:00Z' }),
      rij({ naam: 'Volgende week', laatsteGesprekOp: '2026-11-02T09:00:00Z', verslagen: [verslag('2026-11-02T10:00:00Z')], volgendeOp: '2026-11-17T09:00:00Z' }),
      rij({ naam: 'Niets' }),
    ]
    // Act
    const t = telCoach(rijen, WOE)
    // Assert
    expect(t.dezeWeek).toBe(2)
    expect(t.totaal).toBe(4)
    expect(gesprekDezeWeek(rijen[2], WOE)).toBe(false)
    // Wie deze week niets heeft, ook met een afspraak pas volgende week, staat bij "niet ingepland".
    expect(nietDezeWeek(rijen, WOE).map((r) => r.naam)).toEqual(['Volgende week', 'Niets'])
  })

  test('gesprek deze week zonder volgende afspraak: melding doorplannen, ook met open verslag', () => {
    const geweest = rij({ naam: 'Brandon', laatsteGesprekOp: '2026-11-10T09:00:00Z', verslagen: [verslag('2026-11-10T10:00:00Z')] })
    const openVerslag = rij({ naam: 'Peter', laatsteGesprekOp: '2026-11-11T09:00:00Z' })
    const doorgepland = { ...geweest, naam: 'Iris', volgendeOp: '2026-11-17T09:00:00Z' }
    const vorigeWeek = rij({ naam: 'Joey', laatsteGesprekOp: '2026-11-04T09:00:00Z', verslagen: [verslag('2026-11-04T10:00:00Z')] })
    expect(moetDoorplannen([geweest, openVerslag, doorgepland, vorigeWeek], WOE).map((r) => r.naam)).toEqual(['Brandon', 'Peter'])
    expect(coachFase(geweest, WOE)).toBe('doorplannen')
    expect(coachFase(openVerslag, WOE)).toBe('verslag')
    expect(coachFase(vorigeWeek, WOE)).toBe('inplannen')
  })

  test('blokjes: deze week geweest of ingepland, volgende week leeg met voorstel dezelfde dag', () => {
    // Arrange: gesprek dinsdag 10 nov geweest, niets volgende week
    const r = rij({ naam: 'Joey', afspraken: ['2026-11-10T09:00:00Z'] })
    // Act
    const w = weekBlokken(r, WOE)
    // Assert
    expect(w.deze).toMatchObject({ soort: 'geweest', op: '2026-11-10T09:00:00Z', voorstel: '2026-11-12' })
    expect(w.volgende).toMatchObject({ soort: 'leeg', op: null, voorstel: '2026-11-17' })
  })

  test('blokjes: gepland deze en volgende week, of niets met voorstel morgen en maandag', () => {
    const gepland = weekBlokken(rij({ naam: 'A', afspraken: ['2026-11-13T09:00:00Z', '2026-11-20T09:00:00Z'] }), WOE)
    expect(gepland.deze.soort).toBe('gepland')
    expect(gepland.volgende).toMatchObject({ soort: 'gepland', op: '2026-11-20T09:00:00Z' })
    const niets = weekBlokken(rij({ naam: 'B' }), WOE)
    expect(niets.deze).toMatchObject({ soort: 'leeg', op: null, voorstel: '2026-11-12' })
    expect(niets.volgende).toMatchObject({ soort: 'leeg', op: null, voorstel: '2026-11-16' })
    // Op zondag is het voorstel voor deze week vandaag.
    expect(weekBlokken(rij({ naam: 'C' }), new Date('2026-11-15T10:00:00Z')).deze.voorstel).toBe('2026-11-15')
    // Alleen een verslag deze week (geen agenda): telt als geweest.
    expect(weekBlokken(rij({ naam: 'D', verslagen: [verslag('2026-11-09T10:00:00Z')] }), WOE).deze.soort).toBe('geweest')
  })

  test('blokjes: afspraken over 2 en 3 weken zijn zichtbaar, ook met een lege week ertussen', () => {
    // Arrange: woensdag 11 nov; niets volgende week, wel di 24 nov en di 1 dec
    const r = rij({ naam: 'Joey', afspraken: ['2026-11-24T09:00:00Z', '2026-12-01T09:00:00Z'] })
    // Act
    const w = weekBlokken(r, WOE)
    // Assert
    expect(w.volgende).toMatchObject({ soort: 'leeg', voorstel: '2026-11-16' })
    expect(w.verder).toHaveLength(2)
    expect(w.verder[0]).toMatchObject({ soort: 'gepland', op: '2026-11-24T09:00:00Z' })
    expect(w.verder[1]).toMatchObject({ soort: 'gepland', op: '2026-12-01T09:00:00Z' })
    // Lege latere weken: voorstel een week na het vorige.
    const leeg = weekBlokken(rij({ naam: 'B', afspraken: ['2026-11-10T09:00:00Z'] }), WOE)
    expect(leeg.verder.map((b) => [b.soort, b.voorstel])).toEqual([['leeg', '2026-11-24'], ['leeg', '2026-12-01']])
    // De knop volgens patroon blijft bij deze en volgende week.
    const vast = rij({ naam: 'Vast', afspraken: ['2026-10-29T09:00:00Z', '2026-11-05T09:00:00Z'] })
    expect(patroonVoorstellen([vast], WOE).map((v) => v.week)).toEqual(['deze', 'volgende'])
  })

  test('patroon: vaste dag en tijd uit de laatste gesprekken (Nederlandse tijd)', () => {
    // Arrange: drie dinsdagen om 10:00 NL (20 okt nog zomertijd: 08:00 UTC), een keer donderdag
    const afspraken = ['2026-10-20T08:00:00Z', '2026-10-27T09:00:00Z', '2026-10-29T14:00:00Z', '2026-11-03T09:00:00Z']
    // Act
    const p = patroonVan(afspraken, WOE)
    // Assert
    expect(p).toEqual({ weekdag: 1, tijd: '10:00', keer: 3, van: 4 })
    expect(patroonLabel(p!)).toBe('di 10:00 (3 van de laatste 4)')
  })

  test('patroon: alleen de dag vast neemt de tijd van het laatste gesprek op die dag; te weinig = geen patroon', () => {
    expect(patroonVan(['2026-10-27T09:00:00Z', '2026-11-03T13:30:00Z'], WOE)).toEqual({ weekdag: 1, tijd: '14:30', keer: 2, van: 2 })
    expect(patroonVan(['2026-11-03T09:00:00Z'], WOE)).toBeNull()
    expect(patroonVan(['2026-11-02T09:00:00Z', '2026-11-04T09:00:00Z'], WOE)).toBeNull()
    // Toekomstige afspraken tellen niet mee voor het patroon.
    expect(patroonVan(['2026-11-17T09:00:00Z', '2026-11-24T09:00:00Z'], WOE)).toBeNull()
  })

  test('voorstel volgens patroon: deze week alleen als het moment nog komt, anders terugval', () => {
    // Patroon donderdag 10:00; woensdag 11 nov: deze week do 12 nov, volgende week do 19 nov
    const r = rij({ naam: 'Joey', afspraken: ['2026-10-29T09:00:00Z', '2026-11-05T09:00:00Z'] })
    const w = weekBlokken(r, WOE)
    expect(w.deze).toMatchObject({ soort: 'leeg', voorstel: '2026-11-12', tijd: '10:00', volgensPatroon: true })
    expect(w.volgende).toMatchObject({ soort: 'leeg', voorstel: '2026-11-19', tijd: '10:00', volgensPatroon: true })
    expect(patroonVoorstellen([r], WOE)).toEqual([
      { ptId: 'joey', naam: 'Joey', week: 'deze', datum: '2026-11-12', tijd: '10:00' },
      { ptId: 'joey', naam: 'Joey', week: 'volgende', datum: '2026-11-19', tijd: '10:00' },
    ])
    // Patroon maandag: deze week al voorbij, dan geen patroonvoorstel voor deze week.
    const ma = weekBlokken(rij({ naam: 'Ma', afspraken: ['2026-10-26T09:00:00Z', '2026-11-02T09:00:00Z'] }), WOE)
    expect(ma.deze.volgensPatroon).toBe(false)
    expect(ma.volgende).toMatchObject({ voorstel: '2026-11-16', volgensPatroon: true })
  })

  test('doorplannen staat na verslag en voor inplannen', () => {
    const rijen = [
      rij({ naam: 'Inplannen' }),
      rij({ naam: 'Door', laatsteGesprekOp: '2026-11-10T09:00:00Z', verslagen: [verslag('2026-11-10T10:00:00Z')] }),
      rij({ naam: 'Verslag', laatsteGesprekOp: '2026-11-11T09:00:00Z' }),
    ]
    expect(sorteerCoachRijen(rijen, WOE).map((r) => r.naam)).toEqual(['Verslag', 'Door', 'Inplannen'])
  })
  test('een gesprek van meer dan drie weken geleden vraagt geen verslag meer', () => {
    expect(verslagOpen(rij({ naam: 'A', laatsteGesprekOp: '2026-09-01T09:00:00Z' }), NU)).toBe(false)
  })
})

describe('sorteren & tellen', () => {
  const verslagNodig = rij({ naam: 'Verslag', laatsteGesprekOp: '2026-10-08T09:00:00Z', volgendeOp: '2026-10-15T09:00:00Z' })
  const nooit = rij({ naam: 'Nooit' })
  const langGeleden = rij({ naam: 'Lang', verslagen: [verslag('2026-09-01T09:00:00Z')] })
  const laat = rij({ naam: 'Laat', verslagen: [verslag('2026-10-05T09:00:00Z')], volgendeOp: '2026-10-20T09:00:00Z' })
  const vroeg = rij({ naam: 'Vroeg', verslagen: [verslag('2026-10-06T09:00:00Z')], volgendeOp: '2026-10-12T09:00:00Z' })

  test('verslag eerst, dan inplannen (nooit → langst geleden), dan geregeld op datum', () => {
    const uit = sorteerCoachRijen([vroeg, laat, langGeleden, nooit, verslagNodig], NU).map((r) => r.naam)
    expect(uit).toEqual(['Verslag', 'Nooit', 'Lang', 'Vroeg', 'Laat'])
  })

  test('telling', () => {
    expect(telCoach([vroeg, laat, langGeleden, nooit, verslagNodig], NU)).toMatchObject({ totaal: 5, gehad: 3, ingepland: 3, teVerslaan: 1 })
  })
})

describe('eerst op te pakken', () => {
  const o: OpTePakken = {
    teLaat: [lead('Anna', { opvolgdatum: '2026-10-03' }), lead('Bo', { opvolgdatum: '2026-10-07', status: 'proefles' })],
    vandaag: [lead('Cas', { opvolgdatum: '2026-10-09' })],
    zonderPlan: [lead('Dirk', { volgendeStap: null, status: 'nieuw' })],
  }

  test('volgorde en maximum', () => {
    expect(eerstOpTePakken(o).map((i) => `${i.lead.naam}:${i.reden}`)).toEqual(['Anna:te_laat', 'Bo:te_laat', 'Cas:vandaag', 'Dirk:zonder_plan'])
    expect(eerstOpTePakken(o, 2).map((i) => i.lead.naam)).toEqual(['Anna', 'Bo'])
  })

  test('labels', () => {
    const [a, , c, d] = eerstOpTePakken(o)
    expect(opTePakkenLabel(a)).toBe('te laat sinds 3 okt')
    expect(opTePakkenLabel(c)).toBe('vandaag opvolgen')
    expect(opTePakkenLabel(d)).toBe('geen opvolgdatum of volgende stap')
  })

  test('tekst voor het verslag, met "en nog …" boven het maximum', () => {
    expect(opTePakkenTekst(LEEG)).toMatch(/^Eerst op te pakken: niets/)
    const t = opTePakkenTekst(o, 3)
    expect(t).toContain('Eerst op te pakken (4):')
    expect(t).toContain('• Anna — Opvolgen, te laat sinds 3 okt')
    expect(t).toContain('• Bo — Proefles ingepland, te laat sinds 7 okt')
    expect(t).toContain('… en nog 1')
    expect(t).not.toContain('Dirk')
  })
})
