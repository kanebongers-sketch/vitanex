import { describe, expect, test } from 'vitest'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from './abonnementen'
import { csvCel, datumNl, exportBestandsnaam, isExportSoort, klantenCsv, leadsCsv } from './export'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l', naam: 'Sanne', contact: '0612345678', club: 'eersel', bron: 'vloer', interesse: 'warm', status: 'opvolgen',
  volgendeStap: 'bellen', opvolgdatum: '2026-10-10', reviewGevraagd: true, referralGevraagd: false, kentIemand: null,
  notitie: null, gesprokenOp: '2026-10-07', aangemaaktOp: '2026-10-07T10:00:00Z', ...over,
})
const klant = (over: Partial<PtKlant> = {}): PtKlant => ({
  id: 'k', naam: 'Tom', contact: null, duoPartner: null, club: 'eersel', abonnement: '2x', startdatum: '2026-09-01',
  status: 'actief', opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, ...over,
})

const regels = (csv: string): string[] => csv.slice(1).split('\r\n')

describe('csvCel', () => {
  test('gewone tekst blijft gewoon', () => {
    expect(csvCel('Sanne de Vries')).toBe('Sanne de Vries')
    expect(csvCel('')).toBe('')
  })
  test('puntkomma, quote en regeleinde worden gequote en quotes verdubbeld', () => {
    expect(csvCel('a;b')).toBe('"a;b"')
    expect(csvCel('zei "ja"')).toBe('"zei ""ja"""')
    expect(csvCel('regel 1\nregel 2')).toBe('"regel 1\nregel 2"')
    expect(csvCel(' spatie')).toBe('" spatie"')
  })
  test('formule-injectie: = + - @ tab krijgen een apostrof', () => {
    expect(csvCel('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCel('+31 6 12345678')).toBe("'+31 6 12345678")
    expect(csvCel('-1')).toBe("'-1")
    expect(csvCel('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(csvCel('\tx')).toBe("'\tx")
    expect(csvCel('a=b')).toBe('a=b')
  })
})

describe('leadsCsv', () => {
  test('BOM, kopregel zoals de Excel-tracker, labels en NL-datums', () => {
    const csv = leadsCsv([{ naam: 'Joey', items: [lead()] }])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.endsWith('\r\n')).toBe(true)
    const [kop, rij] = regels(csv)
    expect(kop).toBe(
      'Datum;Trainer;Naam lead;Telefoon / contact;Club;Bron;Interesse;Status;Volgende stap;Opvolgdatum;Google review gevraagd;Referral gevraagd;Kent iemand;Notities',
    )
    expect(rij).toBe('07-10-2026;Joey;Sanne;0612345678;Eersel;Vloer;Warm;Opvolgen;Bellen;10-10-2026;Ja;Nee;;')
  })
  test('per trainer in volgorde, nieuwste gesprek eerst; lege velden leeg', () => {
    const csv = leadsCsv([
      { naam: 'Joey', items: [lead({ naam: 'Oud', gesprokenOp: '2026-09-01' }), lead({ naam: 'Nieuw' })] },
      { naam: 'Luna', items: [lead({ naam: 'L', club: null, interesse: null, volgendeStap: null, opvolgdatum: null })] },
    ])
    const r = regels(csv)
    expect(r[1]).toContain(';Nieuw;')
    expect(r[2]).toContain(';Oud;')
    expect(r[3]).toBe('07-10-2026;Luna;L;0612345678;;Vloer;;Opvolgen;;;Ja;Nee;;')
  })
  test('alleen de kopregel zonder leads', () => {
    expect(regels(leadsCsv([]))).toHaveLength(2)
  })
})

describe('klantenCsv', () => {
  test('prijs, vaste periode en opzegging', () => {
    const csv = klantenCsv([
      { naam: 'Joey', items: [klant(), klant({ naam: 'Duo', abonnement: 'duo_1x', club: 'budel', duoPartner: 'Eva', status: 'opgezegd', opgezegdOp: '2026-12-10' })] },
    ])
    const [kop, a, b] = regels(csv)
    expect(kop).toBe('Trainer;Naam;Duo-partner;Contact;Club;Abonnement;Prijs p/m;Start;Vast t/m;Status;Opgezegd op;Loopt t/m;Notities')
    expect(a).toBe('Joey;Tom;;;Eersel;2x per week;519;01-09-2026;30-11-2026;Actief;;;')
    expect(b).toBe('Joey;Duo;Eva;;Budel;Duo · 1x per week;399;01-09-2026;30-11-2026;Opgezegd;10-12-2026;31-01-2027;')
  })
  test('een afwijkende prijs staat in de export zoals de klant écht betaalt', () => {
    const [, rij] = regels(klantenCsv([{ naam: 'Joey', items: [klant({ prijsAfwijkend: 450 })] }]))
    expect(rij.split(';')[6]).toBe('450')
  })
})

describe('hulpjes', () => {
  test('datum, bestandsnaam, soort', () => {
    expect(datumNl('2026-01-05')).toBe('05-01-2026')
    expect(datumNl(null)).toBe('')
    expect(exportBestandsnaam('leads', '2026-10-08')).toBe('pt-leads-2026-10-08.csv')
    expect(isExportSoort('klanten')).toBe(true)
    expect(isExportSoort('x')).toBe(false)
  })
})
