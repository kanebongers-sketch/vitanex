import { describe, expect, it } from 'vitest'
import { installeerOmgeving, isIos, type ToestelInfo } from './installeren'

const IPHONE: ToestelInfo = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  platform: 'iPhone',
  maxTouchPoints: 5,
  standalone: false,
}
const ANDROID: ToestelInfo = { userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/130.0 Mobile Safari/537.36', platform: 'Linux armv8l', maxTouchPoints: 5, standalone: false }
const MAC: ToestelInfo = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 0, standalone: false }

describe('installeerOmgeving', () => {
  it('herkent een iPhone en een iPad die zich als Mac meldt', () => {
    expect(installeerOmgeving(IPHONE)).toBe('ios')
    expect(isIos({ ...MAC, maxTouchPoints: 5 })).toBe(true)
  })

  it('een Mac en Android zijn geen iOS', () => {
    expect(installeerOmgeving(MAC)).toBe('anders')
    expect(installeerOmgeving(ANDROID)).toBe('anders')
  })

  it('toont niets als de app al vanaf het beginscherm draait', () => {
    expect(installeerOmgeving({ ...IPHONE, standalone: true })).toBe('standalone')
    expect(installeerOmgeving({ ...ANDROID, standalone: true })).toBe('standalone')
  })
})
