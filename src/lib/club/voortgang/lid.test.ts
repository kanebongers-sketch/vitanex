import { describe, expect, it } from 'vitest'
import { voortgangVoorLid } from './lid'
import type { VoortgangData } from './model'

describe('voortgang voor het lid', () => {
  it('laat alleen lichaamsmaten en trainingen door, geen gezondheidsdata of notities', () => {
    const data = {
      lidId: 'l1',
      punten: [
        { id: 'a', bron: 'meting', datum: '2026-10-01', waarden: { gewicht_kg: 80, rusthartslag: 60, bloeddruk: '120/80' } },
        { id: 'b', bron: 'intake', datum: '2026-09-01', waarden: { rusthartslag: 64 } },
      ],
      metingen: [{ id: 'a', notitie: 'knie gevoelig' }],
      trainingen: ['2026-10-02'],
      totaalTrainingen: 1,
      fouten: [],
    } as unknown as VoortgangData
    const lid = voortgangVoorLid(data)
    expect(lid.punten).toEqual([{ id: 'a', bron: 'meting', datum: '2026-10-01', waarden: { gewicht_kg: 80 } }])
    expect(lid.metingen).toEqual([])
    expect(JSON.stringify(lid)).not.toMatch(/bloeddruk|rusthartslag|knie/)
    expect(lid.totaalTrainingen).toBe(1)
  })
})
