import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { controleerOpeningstijden } from '@/lib/club/rooster/openingstijden'
import { NEUTRALE_LES, SOORT_INFO, SPORTSCHOOL_SOORTEN, STANDAARD_TIJD, heeftOpenDag, legeWeek, standaardWeek, voorbeeldLes, weekMet, weekTekst } from './soorten'

const T = (van: string, tot: string) => ({ van, tot })

describe('soorten sportschool (alleen namen, voor de website)', () => {
  it('heeft zeven soorten met een titel en uitleg', () => {
    expect(SPORTSCHOOL_SOORTEN).toEqual(['gym', 'boutique', 'pt', 'keten', 'yoga', 'vechtsport', 'bootcamp'])
    for (const s of SPORTSCHOOL_SOORTEN) {
      expect(SOORT_INFO[s].titel.length).toBeGreaterThan(2)
      expect(SOORT_INFO[s].kort.length).toBeGreaterThan(10)
    }
  })
})

describe('openingstijden', () => {
  it('maakt de standaardweek van 06:00 tot 23:00 (een keuze, nooit vooraf gezet)', () => {
    expect(STANDAARD_TIJD).toEqual(T('06:00', '23:00'))
    expect(standaardWeek()).toEqual(Array(7).fill(T('06:00', '23:00')))
    expect(controleerOpeningstijden(standaardWeek()).ok).toBe(true)
  })

  it('begint een vestiging zonder eigen tijden leeg: elke dag dicht', () => {
    expect(legeWeek()).toEqual(Array(7).fill(null))
    expect(heeftOpenDag(legeWeek())).toBe(false)
  })

  it('beschrijft een week in gewone taal', () => {
    expect(weekTekst(standaardWeek())).toBe('Elke dag 06:00 tot 23:00')
    expect(weekTekst(weekMet(T('07:00', '21:00'), T('08:00', '14:00'), null))).toBe('Ma tot vr 07:00 tot 21:00, za 08:00 tot 14:00, zo dicht')
    expect(weekTekst(weekMet(T('07:00', '21:00'), T('09:00', '13:00')))).toBe('Ma tot vr 07:00 tot 21:00, za en zo 09:00 tot 13:00')
    expect(weekTekst(legeWeek())).toBe('Elke dag dicht')
    expect(weekTekst(standaardWeek(), 'en')).toBe('Every day 06:00 to 23:00')
  })
})

describe('de les in het voorbeeld van de ledenapp', () => {
  it('kiest het eerste eigen lestype', () => {
    expect(voorbeeldLes(['Ochtendkracht', 'Boksen'])).toBe('Ochtendkracht')
  })

  it('valt zonder eigen lestypen terug op een neutrale les', () => {
    expect(voorbeeldLes([])).toBe(NEUTRALE_LES)
    expect(voorbeeldLes(['  '])).toBe(NEUTRALE_LES)
  })
})

describe('besluit Kane 30-10-2026: niets automatisch klaarzetten', () => {
  it('de wizard heeft geen klaarzet-code meer', () => {
    const map = join(process.cwd(), 'src/components/club/start')
    for (const bestand of ['StapLessen.tsx', 'StapVestiging.tsx', 'StapOnderdelen.tsx', 'StapTeamInvoer.tsx', 'LestypeKeuze.tsx']) {
      const code = readFileSync(join(map, bestand), 'utf8')
      expect(code, bestand).not.toMatch(/AlvastIngevuld|toepasPlan|pakketVoor|SportschoolSoort/)
    }
  })
})
