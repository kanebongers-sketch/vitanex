import { describe, it, expect } from 'vitest'
import { kalenderIdUitRij } from './koppeling'

// De pure default-regel van de agenda-keuze: een `koppelingen`-rij → de gekozen
// kalender_id, of null (= de primaire agenda). null is hier geen fout maar de
// DEFAULT — een koppeling zonder gekozen agenda werkt door op primary.

describe('kalenderIdUitRij — de kalender_id-default', () => {
  it('leest een gezette kalender_id', () => {
    expect(kalenderIdUitRij({ kalender_id: 'werk@x.nl' })).toBe('werk@x.nl')
  })

  it('valt terug op null bij een ontbrekende kolom', () => {
    // Vóór de migratie of bij een verse koppeling: geen kolom/waarde = primary.
    expect(kalenderIdUitRij({})).toBeNull()
  })

  it('leest een null of lege kalender_id als null (= primary)', () => {
    expect(kalenderIdUitRij({ kalender_id: null })).toBeNull()
    expect(kalenderIdUitRij({ kalender_id: '' })).toBeNull()
    expect(kalenderIdUitRij({ kalender_id: '   ' })).toBeNull()
  })

  it('valt terug op null bij iets dat geen rij-object is', () => {
    expect(kalenderIdUitRij(null)).toBeNull()
    expect(kalenderIdUitRij(undefined)).toBeNull()
    expect(kalenderIdUitRij('werk@x.nl')).toBeNull()
    // Een array is geen bruikbare rij.
    expect(kalenderIdUitRij([])).toBeNull()
  })
})
