import { describe, expect, test } from 'vitest'
import {
  bedtijdSchaal, getal, klokTekstNaarMinuten, leesWorkouts, lokaleKlokMinuten, voegBronnenSamen,
  type RuweBronnen,
} from './samenvoegen'

function bronnen(deel: Partial<RuweBronnen>): RuweBronnen {
  return { native: [], slaapLogs: [], dagmetingen: [], lichaamsmetingen: [], workouts: [], ...deel }
}

describe('getal', () => {
  test('accepteert getallen en numeric-strings van Postgres', () => {
    expect(getal(58)).toBe(58)
    expect(getal('78.40')).toBe(78.4)
  })

  test('weigert alles wat geen eindig getal is', () => {
    expect(getal(null)).toBeNull()
    expect(getal('')).toBeNull()
    expect(getal('abc')).toBeNull()
    expect(getal(Number.NaN)).toBeNull()
  })
})

describe('klokken', () => {
  test('tijdstip wordt lokale Amsterdamse kloktijd (zomertijd)', () => {
    // 21:30 UTC in juli = 23:30 in Amsterdam
    expect(lokaleKlokMinuten('2026-07-01T21:30:00Z')).toBe(23 * 60 + 30)
  })

  test('kloktekst uit slaap_logs', () => {
    expect(klokTekstNaarMinuten('07:05:00')).toBe(425)
    expect(klokTekstNaarMinuten('25:00')).toBeNull()
    expect(klokTekstNaarMinuten(null)).toBeNull()
  })

  test('bedtijd-schaal zet 23:30 en 00:30 naast elkaar', () => {
    expect(bedtijdSchaal(23 * 60 + 30)).toBe(690)
    expect(bedtijdSchaal(30)).toBe(750)
  })
})

describe('voegBronnenSamen', () => {
  test('native bron wint van handmatige invoer, handmatig vult gaten', () => {
    // Arrange
    const invoer = bronnen({
      native: [{ datum: '2026-10-08', bron: 'health_connect', stappen: 9000, slaap_minuten: null }],
      dagmetingen: [{ datum: '2026-10-08', stappen: 4000 }],
      slaapLogs: [{ datum: '2026-10-08', uren_slaap: 7.5 }],
    })
    // Act
    const { dagen } = voegBronnenSamen(invoer)
    // Assert
    expect(dagen).toHaveLength(1)
    expect(dagen[0].waarden.stappen).toBe(9000)
    expect(dagen[0].waarden.slaap).toBe(450)
    expect(dagen[0].herkomst).toEqual({ stappen: 'health_connect', slaap: 'handmatig' })
  })

  test('Apple Health heeft voorrang op Google Fit, per veld', () => {
    const invoer = bronnen({
      native: [
        { datum: '2026-10-08', bron: 'google_fit', stappen: 5000, rusthartslag: 61 },
        { datum: '2026-10-08', bron: 'apple_health', stappen: 8000, rusthartslag: null },
      ],
    })
    const [dag] = voegBronnenSamen(invoer).dagen
    expect(dag.waarden.stappen).toBe(8000)
    expect(dag.waarden.rusthartslag).toBe(61)
  })

  test('oude kolom calorieen vult actieve energie als actieve_kcal ontbreekt', () => {
    const [dag] = voegBronnenSamen(bronnen({
      native: [{ datum: '2026-10-08', bron: 'health_connect', calorieen: 420 }],
    })).dagen
    expect(dag.waarden['actieve-kcal']).toBe(420)
  })

  test('slaapfases komen uit één bron, met slaap_logs als terugval', () => {
    const { dagen } = voegBronnenSamen(bronnen({
      native: [{ datum: '2026-10-08', bron: 'health_connect', slaap_diep_min: 80, slaap_rem_min: 95 }],
      slaapLogs: [{ datum: '2026-10-07', uren_slaap: 7, slaap_diep_min: 60 }],
    }))
    expect(dagen[0].fases).toEqual({ diep: 60, licht: null, rem: null, wakker: null })
    expect(dagen[1].fases).toEqual({ diep: 80, licht: null, rem: 95, wakker: null })
  })

  test('dagen zonder enige meting en ongeldige datums vallen weg', () => {
    const { dagen } = voegBronnenSamen(bronnen({
      native: [
        { datum: '2026-10-08', bron: 'health_connect', stappen: null },
        { datum: 'gisteren', bron: 'health_connect', stappen: 100 },
      ],
    }))
    expect(dagen).toEqual([])
  })

  test('trainingen tellen per lokale dag op', () => {
    const { dagen, workouts } = voegBronnenSamen(bronnen({
      workouts: [
        { id: 'a', bron: 'health_connect', soort: 'running', start: '2026-10-08T06:00:00Z', eind: '2026-10-08T06:30:00Z' },
        { id: 'b', bron: 'health_connect', soort: 'walking', start: '2026-10-08T16:00:00Z', eind: '2026-10-08T16:45:00Z' },
      ],
    }))
    expect(dagen[0].waarden.workouts).toBe(75)
    expect(workouts.map((w) => w.id)).toEqual(['b', 'a'])
  })
})

describe('leesWorkouts', () => {
  test('weigert trainingen zonder geldige duur', () => {
    const resultaat = leesWorkouts([
      { id: 'x', start: '2026-10-08T10:00:00Z', eind: '2026-10-08T09:00:00Z' },
      { id: 'y', start: 'onzin', eind: '2026-10-08T09:00:00Z' },
      { start: '2026-10-08T08:00:00Z', eind: '2026-10-08T09:00:00Z' },
    ])
    expect(resultaat).toEqual([])
  })
})
