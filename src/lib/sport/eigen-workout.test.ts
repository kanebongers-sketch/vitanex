import { describe, it, expect } from 'vitest'
import { bouwTrainingsdag } from './eigen-workout'

describe('bouwTrainingsdag', () => {
  it('is null zonder bruikbare oefening', () => {
    expect(bouwTrainingsdag('Push', [])).toBeNull()
    expect(bouwTrainingsdag('Push', [{ naam: '  ', sets: 3, herhalingen: '8' }])).toBeNull()
    expect(bouwTrainingsdag('Push', [{ naam: 'Bench', sets: 0, herhalingen: '8' }])).toBeNull()
  })

  it('bouwt een trainingsdag met defaults en klemt sets', () => {
    const dag = bouwTrainingsdag('Push A', [
      { naam: 'Bankdrukken', spiergroep: 'Borst', sets: 99, herhalingen: '' },
      { naam: 'Triceps', spiergroep: 'Armen', sets: 3, herhalingen: '12-15', heeft_gewicht: false },
    ])
    expect(dag).not.toBeNull()
    expect(dag?.naam).toBe('Push A')
    expect(dag?.oefeningen).toHaveLength(2)
    expect(dag?.oefeningen[0].sets).toBe(10) // geklemd op 10
    expect(dag?.oefeningen[0].herhalingen).toBe('8-12') // default
    expect(dag?.oefeningen[0].rusttijd_sec).toBe(90) // default
    expect(dag?.oefeningen[1].heeft_gewicht).toBe(false)
    expect(dag?.spiergroepen).toEqual(['Borst', 'Armen'])
  })

  it('valt terug op een standaardnaam', () => {
    expect(bouwTrainingsdag('   ', [{ naam: 'Squat', sets: 3, herhalingen: '5' }])?.naam).toBe('Mijn workout')
  })

  it('schat een duur van minstens 15 minuten', () => {
    const dag = bouwTrainingsdag('X', [{ naam: 'Squat', sets: 1, herhalingen: '5' }])
    expect(dag?.geschatte_duur).toBeGreaterThanOrEqual(15)
  })

  it('dedupliceert spiergroepen en negeert lege', () => {
    const dag = bouwTrainingsdag('X', [
      { naam: 'A', spiergroep: 'Borst', sets: 3, herhalingen: '8' },
      { naam: 'B', spiergroep: 'Borst', sets: 3, herhalingen: '8' },
      { naam: 'C', spiergroep: null, sets: 3, herhalingen: '8' },
    ])
    expect(dag?.spiergroepen).toEqual(['Borst'])
  })
})
