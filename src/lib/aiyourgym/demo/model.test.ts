import { describe, expect, it } from 'vitest'
import { bouwApp, bouwCijfers, bouwLidKaart, bouwSchema, bouwVandaag, bouwWeek, korteNaam, korteNaamUit, wekenOpRij, type DemoRuw } from './model'

const PEILDAG = '2026-10-15' // donderdag

function ruw(over: Partial<DemoRuw> = {}): DemoRuw {
  return {
    organisatie: { naam: 'Voorbeeld Gym', kleur: '#E5484D', thema: 'donker' },
    vestigingen: [{ vestiging: 'centrum', naam: 'Centrum', standaard: true }],
    peildag: PEILDAG,
    lessen: [
      { id: 'l1', vestiging: 'centrum', start_op: '2026-10-15T16:30:00Z', eind_op: '2026-10-15T17:15:00Z', capaciteit: 2, lestype_id: 't1', zaal_id: 'z1' },
      { id: 'l2', vestiging: 'centrum', start_op: '2026-10-13T06:00:00Z', eind_op: '2026-10-13T07:00:00Z', capaciteit: 10, lestype_id: 'onbekend', zaal_id: null },
      { id: 'l3', vestiging: 'centrum', start_op: '2026-10-17T08:00:00Z', eind_op: '2026-10-17T09:00:00Z', capaciteit: 10, lestype_id: 't1', zaal_id: 'z1' },
    ],
    reserveringen: [
      { les_id: 'l1', lid_id: 'a', status: 'aanwezig' },
      { les_id: 'l1', lid_id: 'b', status: 'geboekt' },
      { les_id: 'l1', lid_id: 'c', status: 'wachtlijst' },
      { les_id: 'l2', lid_id: 'a', status: 'no_show' },
      { les_id: 'l3', lid_id: 'x', status: 'geboekt' },
    ],
    lestypen: [{ id: 't1', naam: 'Cycle' }],
    zalen: [{ id: 'z1', naam: 'Studio' }],
    medewerkers: [{ id: 'm1', naam: 'Anouk Peters' }],
    diensten: [
      { vestiging: 'centrum', datum: PEILDAG, begin: '17:00:00', eind: '22:00:00', medewerker_id: 'm1' },
      { vestiging: 'centrum', datum: PEILDAG, begin: '07:00:00', eind: '12:00:00', medewerker_id: null },
      { vestiging: 'noord', datum: PEILDAG, begin: '07:00:00', eind: '12:00:00', medewerker_id: 'm1' },
    ],
    leads: [
      { naam: 'Koen Visser', bron: 'balie', status: 'nieuw', vestiging: 'centrum' },
      { naam: 'Iris de Wit', bron: 'website', status: 'verloren', vestiging: 'centrum' },
    ],
    bezoekenPerDag: [
      { dag: PEILDAG, aantal: 41 },
      { dag: '2026-10-14', aantal: 37 },
    ],
    maand: { bezoeken: 600, nieuweLeden: 4, actieveLeden: 120, perBron: { qr: 300, bandje: 200, balie: 100 } },
    lid: {
      rij: { id: 'x', voornaam: 'Daan', achternaam: 'van Dijk', vestiging: 'centrum', status: 'actief', abonnement: 'Onbeperkt', lid_sinds: '2024-11-23' },
      bezoekDagen: ['2026-10-14', '2026-10-01', '2026-10-06', '2026-09-29', '2026-09-10', '2026-10-20'],
      schema: { naam: 'Full body', doel: 'afvallen', weken: 8, dag_titels: ['Full body A', 'Full body B'] },
      oefeningen: [
        { dag: 2, volgorde: 1, sets: 3, herhalingen: '10-12', rust_sec: 75, naam: 'Goblet squat' },
        { dag: 1, volgorde: 2, sets: 3, herhalingen: '30 sec', rust_sec: null, naam: 'Plank' },
        { dag: 1, volgorde: 1, sets: null, herhalingen: '10 min', rust_sec: 60, naam: 'Roeien' },
      ],
      metingen: [
        { datum: '2026-09-01', gewicht_kg: 84, buikomtrek_cm: 92 },
        { datum: '2026-10-01', gewicht_kg: 82.5, buikomtrek_cm: 90 },
      ],
      voeding: { doel: 'afvallen', kcal: 2100, eiwit_g: 150, koolhydraten_g: 200, vet_g: 70 },
      komendeLessen: [{ id: 'l9', vestiging: 'noord', start_op: '2026-10-22T08:00:00Z', eind_op: '2026-10-22T09:00:00Z', capaciteit: 10, lestype_id: 't1', zaal_id: 'z1' }],
    },
    challenges: [
      { titel: '12 keer trainen in oktober', soort: 'bezoeken', doel: 12, start_op: '2026-10-01', eind_op: '2026-10-31' },
      { titel: 'November', soort: 'bezoeken', doel: 8, start_op: '2026-11-01', eind_op: '2026-11-30' },
    ],
    ...over,
  }
}

describe('namen', () => {
  it('voornaam plus voorletter van het laatste deel', () => {
    expect(korteNaam('Daan', 'van Dijk')).toBe('Daan D.')
    expect(korteNaam('Sem', '')).toBe('Sem')
    expect(korteNaamUit('Iris de Wit')).toBe('Iris W.')
  })
})

describe('bouwVandaag', () => {
  it('lessen, diensten van de vestiging en open leads van de peildag', () => {
    const v = bouwVandaag(ruw(), 'centrum')
    expect(v.binnen).toBe(41)
    expect(v.lessen.map((l) => l.id)).toEqual(['l1'])
    expect(v.lessen[0]).toMatchObject({ naam: 'Cycle', zaal: 'Studio', bezet: 2, capaciteit: 2, wachtlijst: 1, tijd: '18:30' })
    expect(v.diensten).toEqual([
      { naam: 'Open dienst', tijd: '07:00 tot 12:00' },
      { naam: 'Anouk P.', tijd: '17:00 tot 22:00' },
    ])
    expect(v.leads).toEqual([{ naam: 'Koen V.', bron: 'balie', status: 'nieuw' }])
  })
})

describe('bouwWeek', () => {
  it('zeven dagen vanaf maandag, lessen op de juiste dag', () => {
    const w = bouwWeek(ruw())
    expect(w.maandag).toBe('2026-10-12')
    expect(w.dagen).toHaveLength(7)
    expect(w.dagen[1].lessen.map((l) => l.naam)).toEqual(['Les'])
    expect(w.dagen[3].lessen.map((l) => l.id)).toEqual(['l1'])
  })
})

describe('wekenOpRij', () => {
  it('telt terug vanaf de week van de peildag', () => {
    expect(wekenOpRij(['2026-10-14', '2026-10-06', '2026-09-29'], PEILDAG)).toBe(3)
    expect(wekenOpRij(['2026-10-06', '2026-09-29'], PEILDAG)).toBe(2)
    expect(wekenOpRij(['2026-09-01'], PEILDAG)).toBe(0)
  })
})

describe('bouwLidKaart', () => {
  it('bezoeken tot en met de peildag, laatste meting', () => {
    const k = bouwLidKaart(ruw())
    expect(k.naam).toBe('Daan D.')
    expect(k.vestiging).toBe('Centrum')
    expect(k.bezoeken30).toBe(4)
    expect(k.laatsteBezoek).toBe('2026-10-14')
    expect(k.bezoekenMaand).toBe(3)
    expect(k.meting).toEqual({ datum: '2026-10-01', gewicht: 82.5, buik: 90 })
  })
})

describe('bouwSchema', () => {
  it('dagen op volgorde met titels, zonder beelden uit de database', () => {
    const s = bouwSchema(ruw())
    expect(s?.dagen.map((d) => d.titel)).toEqual(['Full body A', 'Full body B'])
    expect(s?.dagen[0].oefeningen.map((o) => o.naam)).toEqual(['Roeien', 'Plank'])
    expect(s?.dagen[0].oefeningen[0].dosis).toBe('10 min')
    expect(s?.dagen[0].oefeningen[1]).toMatchObject({ dosis: '3 × 30 sec', rust: null })
    expect(s?.dagen[1].oefeningen[0]).toEqual({ naam: 'Goblet squat', dosis: '3 × 10-12', rust: '75 sec rust' })
  })
  it('geen schema, geen scherm', () => {
    const r = ruw()
    expect(bouwSchema({ ...r, lid: { ...r.lid, schema: null } })).toBeNull()
  })
})

describe('bouwCijfers', () => {
  it('bezetting en no-shows over de lessen van de maand tot de peildag', () => {
    const c = bouwCijfers(ruw())
    expect(c.maand).toBe('2026-10-01')
    // l1 (2 van 2) en l2 (0 van 10); l3 valt na de peildag
    expect(c.bezettingPct).toBe(17)
    expect(c.noShows).toBe(1)
    expect(c.perBron[0]).toEqual({ bron: 'QR-code', aantal: 300 })
    expect(c.perDag.map((d) => d.dag)).toEqual(['2026-10-14', PEILDAG])
  })
})

describe('bouwApp', () => {
  it('volgende les, lopende challenge en voeding', () => {
    const r = ruw()
    const a = bouwApp(r, bouwLidKaart(r), (dag) => `dag ${dag}`)
    expect(a.volgendeLes).toEqual({ naam: 'Cycle', wanneer: 'dag 2026-10-22 10:00', zaal: 'Studio' })
    expect(a.challenge).toEqual({ titel: '12 keer trainen in oktober', stand: 3, doel: 12 })
    expect(a.voeding).toEqual({ doel: 'afvallen', kcal: 2100, eiwit: 150, kh: 200, vet: 70 })
  })
})
