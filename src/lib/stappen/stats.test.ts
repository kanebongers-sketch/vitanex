import { describe, it, expect } from 'vitest'
import { afstandKm, doelHitDatums, doelStreak, gemiddeldePerDag, kiesStappenViering, type DagStap } from './stats'

// Deterministische "dagen terug" vanaf een vaste vandaag (2026-08-11).
function dagTerug(n: number): string {
  const d = new Date(Date.UTC(2026, 7, 11) - n * 86_400_000)
  return d.toISOString().slice(0, 10)
}

describe('afstandKm', () => {
  it('leidt km af uit stappen (schatting)', () => {
    expect(afstandKm(10000)).toBeCloseTo(7.62, 2)
    expect(afstandKm(0)).toBe(0)
    expect(afstandKm(-5)).toBe(0)
  })
})

describe('doelHitDatums', () => {
  it('geeft alleen dagen ≥ doel', () => {
    const dagen: DagStap[] = [
      { datum: '2026-08-09', stappen: 12000 },
      { datum: '2026-08-10', stappen: 5000 },
      { datum: '2026-08-11', stappen: 8000 },
    ]
    expect(doelHitDatums(dagen, 8000)).toEqual(['2026-08-09', '2026-08-11'])
  })
  it('doel 0 telt nooit als gehaald', () => {
    expect(doelHitDatums([{ datum: '2026-08-11', stappen: 100 }], 0)).toEqual([])
  })
})

describe('doelStreak', () => {
  it('telt vergevend door als vandaag nog niet gehaald is', () => {
    const dagen: DagStap[] = [
      { datum: dagTerug(2), stappen: 9000 },
      { datum: dagTerug(1), stappen: 9000 },
      { datum: dagTerug(0), stappen: 2000 }, // vandaag nog niet gehaald → open dag
    ]
    expect(doelStreak(dagen, 8000, dagTerug)).toBe(2)
  })
  it('telt vandaag mee als het doel wél gehaald is', () => {
    const dagen: DagStap[] = [
      { datum: dagTerug(1), stappen: 9000 },
      { datum: dagTerug(0), stappen: 9000 },
    ]
    expect(doelStreak(dagen, 8000, dagTerug)).toBe(2)
  })
  it('breekt bij een gemiste dag', () => {
    const dagen: DagStap[] = [
      { datum: dagTerug(2), stappen: 9000 },
      { datum: dagTerug(1), stappen: 1000 },
      { datum: dagTerug(0), stappen: 9000 },
    ]
    expect(doelStreak(dagen, 8000, dagTerug)).toBe(1)
  })
})

describe('gemiddeldePerDag', () => {
  it('negeert lege dagen', () => {
    const dagen: DagStap[] = [
      { datum: dagTerug(2), stappen: 10000 },
      { datum: dagTerug(1), stappen: null },
      { datum: dagTerug(0), stappen: 6000 },
    ]
    expect(gemiddeldePerDag(dagen)).toBe(8000)
  })
  it('is null zonder data', () => {
    expect(gemiddeldePerDag([{ datum: dagTerug(0), stappen: 0 }])).toBeNull()
  })
})

describe('kiesStappenViering', () => {
  it('is null zonder stappen vandaag', () => {
    expect(kiesStappenViering([{ datum: dagTerug(0), stappen: 0 }], 8000, dagTerug)).toBeNull()
  })
  it('viert een streak-mijlpaal', () => {
    const dagen: DagStap[] = [0, 1, 2].map((n) => ({ datum: dagTerug(n), stappen: 9000 }))
    const v = kiesStappenViering(dagen, 8000, dagTerug)
    expect(v?.tekst).toContain('3 dagen op rij')
  })
  it('viert een nieuw dagrecord', () => {
    const dagen: DagStap[] = [
      { datum: dagTerug(1), stappen: 7000 },
      { datum: dagTerug(0), stappen: 9000 },
    ]
    const v = kiesStappenViering(dagen, 12000, dagTerug) // doel niet gehaald → geen streak
    expect(v?.tekst).toContain('dagrecord')
  })
  it('viert de eerste 10k', () => {
    const dagen: DagStap[] = [
      { datum: dagTerug(1), stappen: 12000 }, // eerdere 10k+ dag maar ook record-kandidaat
      { datum: dagTerug(0), stappen: 10500 },
    ]
    // vandaag < eerdere max (12000) → geen record; eerder al 10k → geen "eerste 10k"
    expect(kiesStappenViering(dagen, 20000, dagTerug)).toBeNull()
    const verse: DagStap[] = [
      { datum: dagTerug(1), stappen: 6000 },
      { datum: dagTerug(0), stappen: 10500 },
    ]
    // vandaag is record (record-tekst heeft voorrang op 10k)
    expect(kiesStappenViering(verse, 20000, dagTerug)?.tekst).toContain('dagrecord')
  })
})
