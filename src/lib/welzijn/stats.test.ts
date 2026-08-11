import { describe, it, expect } from 'vitest'
import { gemiddelde, reflectiePrompt, kiesWelzijnSignaal, type WelzijnLog } from './stats'

function log(stemming: number | null, energie: number | null = null, stress: number | null = null): WelzijnLog {
  return { stemming, energie, stress }
}

describe('gemiddelde', () => {
  it('middelt over de eerste N en negeert null', () => {
    const logs = [log(4), log(2), log(null)]
    expect(gemiddelde(logs, 'stemming')).toBe(3)
  })
  it('is null zonder data', () => {
    expect(gemiddelde([log(null)], 'stress')).toBeNull()
  })
  it('leest de juiste as', () => {
    expect(gemiddelde([log(1, 5, 3)], 'energie')).toBe(5)
  })
})

describe('reflectiePrompt', () => {
  it('vraagt naar druk bij hoge stress', () => {
    expect(reflectiePrompt(3, 5).vraag).toContain('druk')
  })
  it('is zacht bij lage stemming', () => {
    expect(reflectiePrompt(1, null).vraag).toContain('speelde')
  })
  it('viert bij goede stemming', () => {
    expect(reflectiePrompt(5, 1).vraag).toContain('goed')
  })
  it('heeft altijd een neutrale terugval', () => {
    expect(reflectiePrompt(3, 2).vraag.length).toBeGreaterThan(0)
  })
})

describe('kiesWelzijnSignaal', () => {
  it('zwijgt bij te weinig data', () => {
    expect(kiesWelzijnSignaal([log(1), log(1)])).toBeNull()
  })
  it('zwijgt als het goed gaat', () => {
    const logs = [log(4, 4, 2), log(4, 4, 2), log(5, 4, 1), log(4, 4, 2)]
    expect(kiesWelzijnSignaal(logs)).toBeNull()
  })
  it('signaleert aanhoudend hoge stress (niet-klinisch)', () => {
    const logs = [log(3, 3, 5), log(3, 3, 4), log(3, 3, 4), log(3, 3, 5)]
    const s = kiesWelzijnSignaal(logs)
    expect(s?.tekst).toContain('stress')
    expect(s?.tekst.toLowerCase()).toContain('geen diagnose')
  })
  it('signaleert aanhoudend lage stemming', () => {
    const logs = [log(2), log(1), log(2), log(2)]
    const s = kiesWelzijnSignaal(logs)
    expect(s?.tekst).toContain('stemming')
  })
  it('stress heeft voorrang op stemming', () => {
    const logs = [log(2, 2, 5), log(1, 2, 5), log(2, 2, 4), log(2, 2, 4)]
    expect(kiesWelzijnSignaal(logs)?.emoji).toBe('🫧')
  })
})
