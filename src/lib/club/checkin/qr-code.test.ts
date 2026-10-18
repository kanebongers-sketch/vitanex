import { describe, expect, it } from 'vitest'
import { checkinGeheim, controleerCheckinCode, maakCheckinCode, MIN_GEHEIM_LENGTE, tijdvak } from './qr-code'
import { lijktOpCheckinCode } from './qr-formaat'

const GEHEIM = 'test-geheim-dat-lang-genoeg-is-voor-de-check-in-code'
const LID = '3f2b8c1e-7a4d-4e2b-9c1a-0d5e6f7a8b9c'
const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDERE_GYM = '11111111-2222-4333-8444-555555555555'
/** Precies het begin van een tijdvak, zodat de grenzen exact te testen zijn. */
const NU = new Date(Math.floor(Date.parse('2026-10-18T09:00:10Z') / 30_000) * 30_000)
const S = 1000

function na(sec: number): Date {
  return new Date(NU.getTime() + sec * S)
}

describe('check-in code: ondertekenen', () => {
  it('maakt een code die de balie bij dezelfde sportschool accepteert', () => {
    const { code } = maakCheckinCode(LID, GYM, GEHEIM, NU)
    expect(lijktOpCheckinCode(code)).toBe(true)
    expect(code.length).toBeLessThan(100)
    expect(controleerCheckinCode(code, GYM, GEHEIM, NU)).toEqual({ ok: true, lidId: LID })
  })

  it('bevat geen naam of leesbare id', () => {
    const { code } = maakCheckinCode(LID, GYM, GEHEIM, NU)
    expect(code).not.toContain(LID)
    expect(code).not.toContain(GYM)
  })

  it('verandert elke 30 seconden en geeft de juiste tijden', () => {
    const a = maakCheckinCode(LID, GYM, GEHEIM, NU)
    expect(maakCheckinCode(LID, GYM, GEHEIM, na(29)).code).toBe(a.code)
    expect(maakCheckinCode(LID, GYM, GEHEIM, na(30)).code).not.toBe(a.code)
    expect(a.vernieuwOp).toEqual(na(30))
    expect(a.geldigTot).toEqual(na(90))
    expect(tijdvak(na(30))).toBe(tijdvak(NU) + 1)
  })

  it('weigert een ongeldige id', () => {
    expect(() => maakCheckinCode('lid-1', GYM, GEHEIM, NU)).toThrow()
  })
})

describe('check-in code: controleren', () => {
  it('accepteert tot 60 seconden na het tijdvak en daarna niet meer', () => {
    const { code } = maakCheckinCode(LID, GYM, GEHEIM, NU)
    expect(controleerCheckinCode(code, GYM, GEHEIM, na(89)).ok).toBe(true)
    expect(controleerCheckinCode(code, GYM, GEHEIM, na(90))).toEqual({ ok: false, reden: 'verlopen' })
    expect(controleerCheckinCode(code, GYM, GEHEIM, na(3600))).toEqual({ ok: false, reden: 'verlopen' })
  })

  it('weigert een code uit de toekomst', () => {
    const { code } = maakCheckinCode(LID, GYM, GEHEIM, na(300))
    expect(controleerCheckinCode(code, GYM, GEHEIM, NU)).toEqual({ ok: false, reden: 'ongeldig' })
  })

  it('werkt niet bij een andere sportschool', () => {
    const { code } = maakCheckinCode(LID, GYM, GEHEIM, NU)
    expect(controleerCheckinCode(code, ANDERE_GYM, GEHEIM, NU)).toEqual({ ok: false, reden: 'andere_sportschool' })
  })

  it('weigert een andere sportschool in de code gezet', () => {
    const { code } = maakCheckinCode(LID, GYM, GEHEIM, NU)
    const anders = maakCheckinCode(LID, ANDERE_GYM, GEHEIM, NU).code.split('.')[2]
    const delen = code.split('.')
    delen[2] = anders
    expect(controleerCheckinCode(delen.join('.'), ANDERE_GYM, GEHEIM, NU)).toEqual({ ok: false, reden: 'ongeldig' })
  })

  it('weigert een gemanipuleerde code', () => {
    const { code } = maakCheckinCode(LID, GYM, GEHEIM, NU)
    const ander = maakCheckinCode('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', GYM, GEHEIM, NU).code.split('.')
    const delen = code.split('.')
    // Ander lid met de handtekening van dit lid.
    expect(controleerCheckinCode([delen[0], ander[1], delen[2], delen[3], delen[4]].join('.'), GYM, GEHEIM, NU).ok).toBe(false)
    // Ouder tijdvak terugzetten naar nu.
    const oud = maakCheckinCode(LID, GYM, GEHEIM, na(-600)).code.split('.')
    expect(controleerCheckinCode([...oud.slice(0, 3), delen[3], oud[4]].join('.'), GYM, GEHEIM, NU)).toEqual({ ok: false, reden: 'ongeldig' })
    // Een teken in de handtekening veranderd.
    const sig = delen[4]
    const fout = `${sig.slice(0, 5)}${sig[5] === 'A' ? 'B' : 'A'}${sig.slice(6)}`
    expect(controleerCheckinCode([...delen.slice(0, 4), fout].join('.'), GYM, GEHEIM, NU)).toEqual({ ok: false, reden: 'ongeldig' })
  })

  it('weigert een code met een ander geheim', () => {
    const { code } = maakCheckinCode(LID, GYM, `${GEHEIM}-anders`, NU)
    expect(controleerCheckinCode(code, GYM, GEHEIM, NU)).toEqual({ ok: false, reden: 'ongeldig' })
  })

  it('weigert onzin', () => {
    for (const onzin of ['', 'FFC1', 'abc', 'FFC1.x.y.z.w', `${'A'.repeat(300)}`, 'qr_token_123']) {
      expect(controleerCheckinCode(onzin, GYM, GEHEIM, NU)).toEqual({ ok: false, reden: 'ongeldig' })
    }
  })
})

describe('check-in geheim', () => {
  it('telt alleen een lang genoeg geheim', () => {
    expect(checkinGeheim({})).toBeNull()
    expect(checkinGeheim({ CLUB_CHECKIN_SECRET: 'kort' })).toBeNull()
    expect(checkinGeheim({ CLUB_CHECKIN_SECRET: 'x'.repeat(MIN_GEHEIM_LENGTE) })).toBe('x'.repeat(MIN_GEHEIM_LENGTE))
  })
})
