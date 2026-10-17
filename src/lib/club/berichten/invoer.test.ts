import { describe, expect, it } from 'vitest'
import { leesActie, leesBericht, stopVenster } from './invoer'
import { datumNaarLokaal, lokaalNaarDatum } from './tijd'

const NU = new Date('2026-10-17T10:00:00.000Z')
const VESTIGINGEN = ['budel', 'eersel']

function geldig(over: Record<string, unknown> = {}): Record<string, unknown> {
  return { titel: 'Nieuwe les', tekst: 'Tekst', soort: 'nieuws', vestigingen: ['budel'], statussen: [], van: '2026-10-17T12:00', tot: '', ...over }
}

describe('leesBericht', () => {
  it('accepteert een geldig bericht en rekent in Nederlandse tijd', () => {
    // Act
    const uit = leesBericht(geldig(), VESTIGINGEN, NU)
    // Assert
    expect(uit.ok).toBe(true)
    if (!uit.ok) return
    expect(uit.waarde.zichtbaar_van).toBe('2026-10-17T10:00:00.000Z')
    expect(uit.waarde.zichtbaar_tot).toBeNull()
    expect(uit.waarde.vastgepind).toBe(false)
  })

  it('weigert een lege of te lange titel', () => {
    expect(leesBericht(geldig({ titel: '  ' }), VESTIGINGEN, NU)).toEqual({ ok: false, fout: 'Geef het bericht een titel.' })
    expect(leesBericht(geldig({ titel: 'x'.repeat(81) }), VESTIGINGEN, NU).ok).toBe(false)
  })

  it('weigert te lange tekst', () => {
    expect(leesBericht(geldig({ tekst: 'x'.repeat(2001) }), VESTIGINGEN, NU).ok).toBe(false)
  })

  it('weigert een vestiging van een andere sportschool', () => {
    const uit = leesBericht(geldig({ vestigingen: ['voorbeeld-centrum'] }), VESTIGINGEN, NU)
    expect(uit).toEqual({ ok: false, fout: 'Een van de vestigingen hoort niet bij deze sportschool.' })
  })

  it('maakt van alle vestigingen aangevinkt een lege lijst (alle)', () => {
    const uit = leesBericht(geldig({ vestigingen: ['eersel', 'budel', 'budel'] }), VESTIGINGEN, NU)
    expect(uit.ok && uit.waarde.vestigingen).toEqual([])
  })

  it('weigert een onbekende status of soort', () => {
    expect(leesBericht(geldig({ statussen: ['vip'] }), VESTIGINGEN, NU).ok).toBe(false)
    expect(leesBericht(geldig({ soort: 'reclame' }), VESTIGINGEN, NU).ok).toBe(false)
  })

  it('eist een einde na het begin', () => {
    const uit = leesBericht(geldig({ tot: '2026-10-17T11:00' }), VESTIGINGEN, NU)
    expect(uit).toEqual({ ok: false, fout: 'De einddatum moet na de begindatum liggen.' })
  })

  it('begint nu als er geen begin is opgegeven', () => {
    const uit = leesBericht(geldig({ van: '' }), VESTIGINGEN, NU)
    expect(uit.ok && uit.waarde.zichtbaar_van).toBe(NU.toISOString())
  })

  it('leest een lege tag als geen tag', () => {
    const uit = leesBericht(geldig({ tag: '   ' }), VESTIGINGEN, NU)
    expect(uit.ok && uit.waarde.tag).toBeNull()
  })
})

describe('leesActie', () => {
  it('herkent de drie acties', () => {
    expect(leesActie({ actie: 'vastpinnen', vastgepind: true })).toEqual({ ok: true, waarde: { actie: 'vastpinnen', vastgepind: true } })
    expect(leesActie({ actie: 'stoppen' })).toEqual({ ok: true, waarde: { actie: 'stoppen' } })
    expect(leesActie({ actie: 'bewerken', titel: 'x' }).ok).toBe(true)
  })

  it('weigert iets onbekends', () => {
    expect(leesActie({ actie: 'versturen' }).ok).toBe(false)
    expect(leesActie(null).ok).toBe(false)
  })
})

describe('stopVenster', () => {
  it('laat een begonnen bericht nu eindigen', () => {
    expect(stopVenster('2026-10-01T00:00:00.000Z', NU)).toEqual({ zichtbaar_van: '2026-10-01T00:00:00.000Z', zichtbaar_tot: NU.toISOString() })
  })

  it('zet bij een gepland bericht het begin net voor nu', () => {
    const uit = stopVenster('2026-12-01T00:00:00.000Z', NU)
    expect(Date.parse(uit.zichtbaar_van)).toBeLessThan(Date.parse(uit.zichtbaar_tot))
  })
})

describe('tijd', () => {
  it('leest datetime-local als Nederlandse tijd, ook in de wintertijd', () => {
    expect(lokaalNaarDatum('2026-12-01T08:00')?.toISOString()).toBe('2026-12-01T07:00:00.000Z')
    expect(lokaalNaarDatum('2026-13-01T08:00')).toBeNull()
  })

  it('zet een tijdstip terug naar de formulierwaarde', () => {
    expect(datumNaarLokaal(new Date('2026-07-01T06:30:00.000Z'))).toBe('2026-07-01T08:30')
  })
})
