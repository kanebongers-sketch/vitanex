import { describe, expect, it } from 'vitest'
import { doorstuurPad } from './doorsturen'

describe('doorstuurPad', () => {
  it('neemt de zoekstring mee en zet de nieuwe sleutels', () => {
    expect(doorstuurPad('/agenda', { v: 'budel', week: '2026-W45' }, { filter: 'leden' })).toBe('/club/agenda?v=budel&week=2026-W45&filter=leden')
  })

  it('laat weg wat de oude plek betekende', () => {
    expect(doorstuurPad('/leads', { v: 'budel', tab: 'x' }, { tab: 'opvolgen' })).toBe('/club/leads?v=budel&tab=opvolgen')
    expect(doorstuurPad('/training', { v: 'budel', tab: 'sjablonen', s: '1' }, {}, ['tab', 's'])).toBe('/club/training?v=budel')
  })

  it('herhaalde waarden blijven, lege zoekstring geeft een kaal pad, anker achteraan', () => {
    expect(doorstuurPad('leden', { tag: ['a', 'b'] })).toBe('/club/leden?tag=a&tag=b')
    expect(doorstuurPad('/app', {})).toBe('/club/app')
    expect(doorstuurPad('/training', { v: 'x' }, { tab: 'bibliotheek' }, [], 'oefeningen')).toBe('/club/training?v=x&tab=bibliotheek#oefeningen')
  })
})
