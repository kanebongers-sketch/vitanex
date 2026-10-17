import { describe, expect, it } from 'vitest'
import { beschikbareReeksen, laatsteBloeddruk, puntUitIntake, reeksVoor, toonVerschilGetal, verschillen, type MeetPunt } from './tijdlijn'

const intake = puntUitIntake({ id: 'i1', datum: '2026-07-01', metingen: { gewicht_kg: 90, lengte_cm: 180, bloeddruk: '130/85' } })
const punten: MeetPunt[] = [
  { id: 'm2', bron: 'meting', datum: '2026-08-01', waarden: { gewicht_kg: 87.5, buikomtrek_cm: 98 } },
  intake,
  { id: 'm3', bron: 'meting', datum: '2026-09-01', waarden: { gewicht_kg: 86, buikomtrek_cm: 95.5, bloeddruk: '124/80' } },
]

describe('reeksVoor', () => {
  it('zet intakes en losse metingen op datum, oudste eerst', () => {
    // Act
    const reeks = reeksVoor(punten, 'gewicht_kg')
    // Assert
    expect(reeks.map((p) => [p.datum, p.waarde, p.bron])).toEqual([
      ['2026-07-01', 90, 'intake'],
      ['2026-08-01', 87.5, 'meting'],
      ['2026-09-01', 86, 'meting'],
    ])
  })

  it('rekent BMI uit met de laatst bekende lengte', () => {
    const reeks = reeksVoor(punten, 'bmi')
    expect(reeks.map((p) => p.waarde)).toEqual([27.8, 27, 26.5])
  })

  it('gebruikt de eerste bekende lengte voor metingen van voor de lengte', () => {
    const vroeg: MeetPunt = { id: 'm0', bron: 'meting', datum: '2026-06-01', waarden: { gewicht_kg: 92 } }
    expect(reeksVoor([vroeg, intake], 'bmi')[0]).toEqual({ datum: '2026-06-01', waarde: 28.4, bron: 'meting' })
  })

  it('geeft geen BMI zonder lengte', () => {
    expect(reeksVoor([{ id: 'x', bron: 'meting', datum: '2026-01-01', waarden: { gewicht_kg: 80 } }], 'bmi')).toEqual([])
  })

  it('zet op dezelfde dag de intake voor de losse meting', () => {
    const zelfdeDag: MeetPunt = { id: 'm1', bron: 'meting', datum: '2026-07-01', waarden: { gewicht_kg: 89 } }
    expect(reeksVoor([zelfdeDag, intake], 'gewicht_kg').map((p) => p.bron)).toEqual(['intake', 'meting'])
  })
})

describe('verschillen', () => {
  it('geeft verschil sinds start en sinds vorige', () => {
    // Arrange
    const reeks = reeksVoor(punten, 'gewicht_kg')
    // Act
    const v = verschillen(reeks)
    // Assert
    expect(v?.sindsStart).toBe(-4)
    expect(v?.sindsVorige).toBe(-1.5)
    expect(v?.laatste.waarde).toBe(86)
  })

  it('geeft geen verschil bij een meting en null bij geen', () => {
    expect(verschillen([{ datum: '2026-01-01', waarde: 80, bron: 'meting' }])?.sindsStart).toBeNull()
    expect(verschillen([])).toBeNull()
  })
})

describe('beschikbareReeksen', () => {
  it('toont alleen meetwaarden met data, zonder lengte, BMI na gewicht', () => {
    expect(beschikbareReeksen(punten).map((r) => r.sleutel)).toEqual(['gewicht_kg', 'bmi', 'buikomtrek_cm'])
  })
})

describe('laatsteBloeddruk', () => {
  it('pakt de nieuwste', () => {
    expect(laatsteBloeddruk(punten)).toEqual({ datum: '2026-09-01', waarde: '124/80' })
    expect(laatsteBloeddruk([])).toBeNull()
  })
})

describe('toonVerschilGetal', () => {
  it('schrijft met teken en komma', () => {
    expect(toonVerschilGetal(-1.5)).toBe('-1,5')
    expect(toonVerschilGetal(2)).toBe('+2')
    expect(toonVerschilGetal(0)).toBe('0')
  })
})
