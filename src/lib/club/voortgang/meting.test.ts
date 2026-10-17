import { describe, expect, it } from 'vitest'
import { GEEN_TOESTEMMING, leesMetingVelden, leesNieuweMeting, leesWaarden, metingKolommen, metingUitRij } from './meting'

const LID = '11111111-1111-4111-8111-111111111111'
const VANDAAG = '2026-10-17'

describe('leesWaarden', () => {
  it('leest getallen met komma en rondt af op een decimaal', () => {
    // Arrange
    const ruw = { gewicht_kg: '82,46', buikomtrek_cm: 91, rusthartslag: '61.6' }
    // Act
    const uit = leesWaarden(ruw)
    // Assert
    expect(uit).toEqual({ ok: true, waarde: { gewicht_kg: 82.5, buikomtrek_cm: 91, rusthartslag: 62 } })
  })

  it('weigert een waarde buiten de grens', () => {
    const uit = leesWaarden({ gewicht_kg: 900 })
    expect(uit.ok).toBe(false)
    if (!uit.ok) expect(uit.fout).toContain('Gewicht')
  })

  it('weigert een lege meting', () => {
    expect(leesWaarden({ gewicht_kg: '', bloeddruk: null })).toEqual({ ok: false, fout: 'Vul minstens een meting in.' })
  })

  it('leest bloeddruk en weigert onzin', () => {
    expect(leesWaarden({ bloeddruk: '125 / 82' })).toEqual({ ok: true, waarde: { bloeddruk: '125/82' } })
    expect(leesWaarden({ bloeddruk: 'hoog' }).ok).toBe(false)
  })

  it('accepteert heupomtrek en spiermassa', () => {
    expect(leesWaarden({ heupomtrek_cm: 101.5, spiermassa_kg: 34.2 })).toEqual({ ok: true, waarde: { heupomtrek_cm: 101.5, spiermassa_kg: 34.2 } })
  })
})

describe('leesMetingVelden', () => {
  const geldig = { toestemmingGezondheid: true, datum: '2026-10-01', waarden: { gewicht_kg: 80 }, notitie: '  Ochtend  ' }

  it('slaat zonder toestemming niets op', () => {
    // Arrange
    const body = { ...geldig, toestemmingGezondheid: false }
    // Act
    const uit = leesMetingVelden(body, VANDAAG)
    // Assert
    expect(uit).toEqual({ ok: false, fout: GEEN_TOESTEMMING })
  })

  it('accepteert alleen true als toestemming, geen "true" als tekst', () => {
    expect(leesMetingVelden({ ...geldig, toestemmingGezondheid: 'true' }, VANDAAG).ok).toBe(false)
  })

  it('neemt vandaag als er geen datum is en knipt de notitie bij', () => {
    const uit = leesMetingVelden({ ...geldig, datum: '' }, VANDAAG)
    expect(uit).toEqual({ ok: true, waarde: { medewerkerId: null, datum: VANDAAG, waarden: { gewicht_kg: 80 }, notitie: 'Ochtend' } })
  })

  it('weigert een datum in de toekomst', () => {
    expect(leesMetingVelden({ ...geldig, datum: '2026-10-18' }, VANDAAG).ok).toBe(false)
  })

  it('weigert een kapot medewerker-id', () => {
    expect(leesMetingVelden({ ...geldig, medewerkerId: 'abc' }, VANDAAG)).toEqual({ ok: false, fout: 'Onbekende medewerker.' })
  })
})

describe('leesNieuweMeting', () => {
  it('eist een lid', () => {
    expect(leesNieuweMeting({ toestemmingGezondheid: true, waarden: { gewicht_kg: 70 } }, VANDAAG)).toEqual({ ok: false, fout: 'Kies eerst een lid.' })
  })

  it('geeft lid en velden terug', () => {
    const uit = leesNieuweMeting({ lidId: LID, toestemmingGezondheid: true, waarden: { gewicht_kg: 70 } }, VANDAAG)
    expect(uit.ok && uit.waarde.lidId).toBe(LID)
  })
})

describe('metingKolommen', () => {
  it('zet lege meetwaarden op null en toestemming altijd op true', () => {
    const k = metingKolommen({ medewerkerId: null, datum: VANDAAG, waarden: { gewicht_kg: 70 }, notitie: null })
    expect(k.gewicht_kg).toBe(70)
    expect(k.vetpercentage).toBeNull()
    expect(k.bloeddruk).toBeNull()
    expect(k.toestemming_gezondheid).toBe(true)
  })
})

describe('metingUitRij', () => {
  it('leest numerieke tekst uit de database en laat kapotte velden weg', () => {
    // Arrange
    const rij = { id: 'm1', lid_id: LID, datum: '2026-09-01', gewicht_kg: '81.2', vetpercentage: 999, bloeddruk: 'x', medewerker_id: null, notitie: null }
    // Act
    const m = metingUitRij(rij)
    // Assert
    expect(m).toEqual({ id: 'm1', lidId: LID, medewerkerId: null, datum: '2026-09-01', waarden: { gewicht_kg: 81.2 }, notitie: null })
  })

  it('geeft null bij een rij zonder id', () => {
    expect(metingUitRij({ lid_id: LID, datum: '2026-09-01' })).toBeNull()
  })
})
