import { describe, expect, it } from 'vitest'
import { CLUB_ROLLEN_V2_OVERAL, rollenV2Aan } from './schakelaar'

// Besluit Kane (30-10-2026): rollen v2 voor elke sportschool.
describe('schakelaar rollen v2', () => {
  it('staat overal aan, ook voor een sportschool buiten de lijst', () => {
    expect(CLUB_ROLLEN_V2_OVERAL).toBe(true)
    expect(rollenV2Aan('be000000-0000-4000-8000-0000000000b2')).toBe(true)
  })
})
