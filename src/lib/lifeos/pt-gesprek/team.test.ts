import { describe, expect, test } from 'vitest'
import { teamExtra, voorstelNa, type AgendaBlok, type VorigeEvaluatie } from './team'

function blok(titel: string, j: number, m: number, d: number, u: number, min = 0, duur = 30): AgendaBlok {
  const startOp = new Date(j, m - 1, d, u, min)
  return { titel, startOp, eindOp: new Date(startOp.getTime() + duur * 60_000), heleDag: false }
}
const gesprek = (naam: string, d: number, u: number, min = 0) => blok(`Coachgesprek PT - Kane (${naam})`, 2026, 9, d, u, min)
const evaluatie = (op: Date): VorigeEvaluatie => ({ op: op.toISOString(), scores: { algemeen: 4, energie: 3, voortgang: 4 }, notitie: 'Goed gesprek', aandachtspunt: 'Planning' })

describe('teamExtra', () => {
  test('tijdens het gesprek: nuBezig + teVerslaan, voorstel twee weken later zelfde tijd', () => {
    const nu = new Date(2026, 8, 28, 20, 10) // ma 28 sep 20:10, gesprek 20:00–20:30
    const x = teamExtra('Michael', [gesprek('Michael', 28, 20)], null, nu)
    expect(x.nuBezigOp).toBe(new Date(2026, 8, 28, 20, 0).toISOString())
    expect(x.teVerslaan).toBe(true)
    expect(x.voorstelVolgende).toBe(new Date(2026, 9, 12, 20, 0).toISOString()) // ma 12 okt 20:00
  })

  test('verslag al opgeslagen → geen popup en niets meer te verslaan', () => {
    const nu = new Date(2026, 8, 28, 20, 40)
    const x = teamExtra('Michael', [gesprek('Michael', 28, 20)], evaluatie(new Date(2026, 8, 28, 20, 35)), nu)
    expect(x.nuBezigOp).toBeNull()
    expect(x.teVerslaan).toBe(false)
    expect(x.vorige?.aandachtspunt).toBe('Planning')
  })

  test('ruim na afloop: geen popup meer, wél "verslag invullen"', () => {
    const nu = new Date(2026, 8, 29, 9, 0)
    const x = teamExtra('Michael', [gesprek('Michael', 28, 20)], null, nu)
    expect(x.nuBezigOp).toBeNull()
    expect(x.teVerslaan).toBe(true)
  })

  test('volgend gesprek al gepland → geen voorstel', () => {
    const nu = new Date(2026, 8, 29, 9, 0)
    const x = teamExtra('Michael', [gesprek('Michael', 28, 20), blok('Coachgesprek PT - Kane (Michael)', 2026, 10, 12, 20)], null, nu)
    expect(x.voorstelVolgende).toBeNull()
  })

  test('nooit een gesprek → niets te verslaan, geen voorstel', () => {
    const x = teamExtra('Tristan', [blok('Tristan PT - Kane', 2026, 9, 17, 15)], null, new Date(2026, 8, 30, 12))
    expect(x).toMatchObject({ laatsteGesprekOp: null, teVerslaan: false, nuBezigOp: null, voorstelVolgende: null })
  })
})

describe('voorstelNa', () => {
  test('botst het tijdstip → de dichtstbijzijnde vrije dag, zelfde tijd', () => {
    const agenda = [blok('Werken in Budel', 2026, 10, 12, 18, 0, 180)] // ma 12 okt 18:00–21:00
    const s = voorstelNa(new Date(2026, 8, 28, 20, 0), agenda, new Date(2026, 8, 29, 9))
    expect(s.toISOString()).toBe(new Date(2026, 9, 13, 20, 0).toISOString()) // di 13 okt 20:00
  })

  test('twee weken is al voorbij → eerstvolgende zelfde weekdag', () => {
    const s = voorstelNa(new Date(2026, 8, 7, 10, 0), [], new Date(2026, 8, 30, 12))
    expect(s.toISOString()).toBe(new Date(2026, 9, 5, 10, 0).toISOString()) // ma 5 okt 10:00
  })
})
