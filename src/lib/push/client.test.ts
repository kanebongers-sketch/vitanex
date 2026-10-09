import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth-fetch', () => ({ authFetch: vi.fn() }))

import { isAppPad } from './client'

describe('isAppPad', () => {
  it('accepteert eigen app-paden', () => {
    expect(isAppPad("/vandaag")).toBe(true)
    expect(isAppPad('/gezondheid/slaap')).toBe(true)
  })
  it('weigert externe, protocol-relatieve en rare waarden', () => {
    for (const p of ['https://evil.nl', '//evil.nl', 'javascript:alert(1)', '/1?x=<script>', '', 42, null]) {
      expect(isAppPad(p)).toBe(false)
    }
  })
})
