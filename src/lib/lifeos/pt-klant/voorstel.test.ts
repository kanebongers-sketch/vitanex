import { describe, expect, test } from 'vitest'
import { gewoonteMomenten, inplanVoorstellen } from './voorstel'
import type { Afspraak } from '../agenda/vrije-blokken'

// Lokale tijden, net als de code (die draait op TZ=Europe/Amsterdam).
function op(j: number, m: number, d: number, u: number, min: number, titel: string, duurMin = 60): Afspraak {
  const startOp = new Date(j, m - 1, d, u, min)
  return { id: `${titel}-${d}-${u}`, titel, startOp, eindOp: new Date(startOp.getTime() + duurMin * 60_000), heleDag: false, locatie: null }
}

const NU = new Date(2026, 8, 28, 9, 0) // ma 28 sep 09:00
const TOT = new Date(2026, 9, 5) // ma 5 okt 00:00
const HISTORIE = [
  op(2026, 9, 15, 19, 30, 'Kevin PT'), // di
  op(2026, 9, 22, 19, 30, 'Kevin PT'), // di
  op(2026, 9, 17, 20, 0, 'Kevin PT'), // do, één keer
]

describe('gewoonteMomenten', () => {
  test('minstens twee keer op dezelfde weekdag + tijd', () => {
    expect(gewoonteMomenten('Kevin', HISTORIE, NU)).toEqual([{ weekdag: 2, minuut: 19 * 60 + 30, aantal: 2 }])
  })
})

describe('inplanVoorstellen', () => {
  test('eerst "zoals meestal" (di 19:30), dan vrije momenten; max drie', () => {
    const uit = inplanVoorstellen('Kevin', HISTORIE, NU, TOT)
    expect(uit).toHaveLength(3)
    expect(uit[0]).toEqual({ startOp: new Date(2026, 8, 29, 19, 30).toISOString(), reden: 'gewoonte' })
    expect(uit.slice(1).every((v) => v.reden === 'vrij')).toBe(true)
  })

  test('gewoonte-moment bezet → niet voorgesteld; nooit over een afspraak heen', () => {
    const agenda = [...HISTORIE, op(2026, 9, 29, 19, 0, 'Tandarts', 90)]
    const uit = inplanVoorstellen('Kevin', agenda, NU, TOT)
    expect(uit.some((v) => v.reden === 'gewoonte')).toBe(false)
    for (const v of uit) {
      const s = new Date(v.startOp).getTime()
      expect(agenda.some((a) => a.startOp.getTime() < s + 3_600_000 && (a.eindOp as Date).getTime() > s)).toBe(false)
    }
  })

  test('niet in het verleden of binnen het uur, niet op zondag, één per dag', () => {
    const uit = inplanVoorstellen('Sanne', [], NU, TOT)
    const dagen = uit.map((v) => new Date(v.startOp))
    expect(dagen.every((d) => d.getTime() >= NU.getTime() + 3_600_000)).toBe(true)
    expect(dagen.every((d) => d.getDay() !== 0)).toBe(true)
    expect(new Set(dagen.map((d) => d.toDateString())).size).toBe(dagen.length)
    // Geen historie → rond 17:00, het standaard-PT-tijdstip.
    expect(dagen[0].getHours()).toBe(17)
  })

  test('geen tweede sessie op een dag waar de klant al staat', () => {
    const agenda = [op(2026, 9, 28, 18, 0, 'Sanne PT')]
    const uit = inplanVoorstellen('Sanne', agenda, NU, TOT)
    expect(uit.some((v) => new Date(v.startOp).getDate() === 28)).toBe(false)
  })

  test('vrije momenten liggen rond het gebruikelijke tijdstip van de klant', () => {
    const uit = inplanVoorstellen('Kevin', HISTORIE, NU, TOT).filter((v) => v.reden === 'vrij')
    // Kevin traint 's avonds (19:30/20:00) → vrije voorstellen rond 19:30, niet om 07:00.
    expect(uit.every((v) => new Date(v.startOp).getHours() >= 19)).toBe(true)
  })

  test('dag vol → die dag overgeslagen', () => {
    const vol = [op(2026, 9, 28, 7, 0, 'Werk', 14 * 60)]
    const uit = inplanVoorstellen('Sanne', vol, NU, TOT)
    expect(uit.some((v) => new Date(v.startOp).getDate() === 28)).toBe(false)
  })
})
