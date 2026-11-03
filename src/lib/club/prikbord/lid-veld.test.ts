import { describe, expect, it } from 'vitest'
import { heeftLidVeld, lidVoorUitvoering } from './lid-veld'
import { WERKWIJZE_SOORTEN } from './typen'

const LID = '00000000-0000-4000-8000-0000000000a1'

describe('lidveld bij een uitvoering', () => {
  it('staat er bij nieuw lid, klacht en ongeval', () => {
    expect(heeftLidVeld('nieuw_lid')).toBe(true)
    expect(heeftLidVeld('klacht')).toBe(true)
    expect(heeftLidVeld('veiligheid')).toBe(true)
  })

  it('staat er niet bij openen, sluiten en eigen', () => {
    const zonder = WERKWIJZE_SOORTEN.filter((s) => !heeftLidVeld(s))
    expect(zonder).toEqual(['openen', 'sluiten', 'eigen'])
  })

  it('stuurt het lid alleen mee bij een soort met lidveld', () => {
    expect(lidVoorUitvoering('klacht', LID)).toBe(LID)
    expect(lidVoorUitvoering('openen', LID)).toBeNull()
  })

  it('is nooit verplicht: zonder lid gaat er null mee', () => {
    expect(lidVoorUitvoering('veiligheid', null)).toBeNull()
    expect(lidVoorUitvoering('nieuw_lid', '')).toBeNull()
  })
})
