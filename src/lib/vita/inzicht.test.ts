import { describe, it, expect } from 'vitest'
import { kiesVitaInzicht, type VitaSignalen } from './inzicht'

const leeg: VitaSignalen = { slaapDezeWeek: null, slaapVorigeWeek: null, slaapschuld: null, regelmaat: null, streak: 0 }

describe('kiesVitaInzicht', () => {
  it('is null zonder enig signaal (geen holle peptalk)', () => {
    expect(kiesVitaInzicht(leeg)).toBeNull()
  })

  it('viert betere slaap dan vorige week', () => {
    const i = kiesVitaInzicht({ ...leeg, slaapDezeWeek: 8, slaapVorigeWeek: 7 })
    expect(i?.toon).toBe('winst')
    expect(i?.tekst).toContain('%')
  })

  it('viert een slaapschuld van nul', () => {
    const i = kiesVitaInzicht({ ...leeg, slaapDezeWeek: 8, slaapschuld: 0 })
    expect(i?.tekst).toContain('slaapschuld staat op nul')
  })

  it('viert regelmaat en streak', () => {
    expect(kiesVitaInzicht({ ...leeg, regelmaat: 80 })?.toon).toBe('winst')
    expect(kiesVitaInzicht({ ...leeg, streak: 5 })?.tekst).toContain('5 dagen')
  })

  it('geeft een zachte tip als de slaap flink terugliep', () => {
    const i = kiesVitaInzicht({ ...leeg, slaapDezeWeek: 6, slaapVorigeWeek: 7.5 })
    expect(i?.toon).toBe('tip')
  })

  it('prioriteert winst boven een tip', () => {
    // Zowel betere slaap (+14%) als een hoge streak → winst, de slaap-winst eerst.
    const i = kiesVitaInzicht({ slaapDezeWeek: 8, slaapVorigeWeek: 7, slaapschuld: 2, regelmaat: 90, streak: 10 })
    expect(i?.toon).toBe('winst')
    expect(i?.emoji).toBe('💤')
  })
})
