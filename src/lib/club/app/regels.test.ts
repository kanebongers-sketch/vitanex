import { describe, expect, it } from 'vitest'
import { annulerenZonderGevolg, appRegelsUitJson, bezoekenDezeMaand, dagNaamKort, groet, lesKeuze, magGratisAnnuleren, regelTeksten, STANDAARD_APP_REGELS, vrijePlekken, wekenOpRij } from './regels'

describe('regels uit de vestiging', () => {
  it('leest de jsonb en valt terug op de standaard bij rommel', () => {
    expect(appRegelsUitJson({ annuleer_uren: 4, reserveer_dagen_vooruit: '10', max_open_reserveringen: -1 })).toEqual({
      ...STANDAARD_APP_REGELS,
      annuleerUren: 4,
      reserveerDagenVooruit: 10,
    })
    expect(appRegelsUitJson(null)).toEqual(STANDAARD_APP_REGELS)
  })

  it('schrijft de regels in gewone taal', () => {
    const t = regelTeksten(STANDAARD_APP_REGELS)
    expect(t[0]).toBe('Gratis annuleren tot 2 uur voor de les. Later annuleren telt als te laat.')
    expect(t).toHaveLength(4)
    expect(regelTeksten({ ...STANDAARD_APP_REGELS, noShowBlokkadeDagen: 0, annuleerUren: 0 })[0]).toBe('Gratis annuleren kan tot de les begint.')
    expect(regelTeksten({ ...STANDAARD_APP_REGELS, noShowBlokkadeDagen: 0 })).toHaveLength(3)
  })

  it('weet tot wanneer annuleren gratis is', () => {
    const start = new Date('2026-10-14T18:00:00Z')
    expect(magGratisAnnuleren(start, new Date('2026-10-14T16:00:00Z'), STANDAARD_APP_REGELS)).toBe(true)
    expect(magGratisAnnuleren(start, new Date('2026-10-14T16:01:00Z'), STANDAARD_APP_REGELS)).toBe(false)
  })
})

describe('les vanuit het lid', () => {
  const nu = new Date('2026-10-14T10:00:00Z')
  const les = { start: new Date('2026-10-14T18:00:00Z'), capaciteit: 10, bezet: 10, geannuleerd: false }

  it('kiest de juiste stand van de knop', () => {
    expect(lesKeuze(les, null, nu)).toBe('vol')
    expect(lesKeuze({ ...les, bezet: 3 }, null, nu)).toBe('vrij')
    expect(lesKeuze(les, 'geboekt', nu)).toBe('geboekt')
    expect(lesKeuze(les, 'wachtlijst', nu)).toBe('wachtlijst')
    expect(lesKeuze(les, 'geannuleerd', nu)).toBe('vol')
    expect(lesKeuze({ ...les, geannuleerd: true }, 'geboekt', nu)).toBe('geannuleerd')
    expect(lesKeuze({ ...les, start: new Date('2026-10-14T09:00:00Z') }, null, nu)).toBe('voorbij')
    // Begonnen: geen annuleerknop meer, ook niet met een boeking of wachtlijstplek.
    expect(lesKeuze({ ...les, start: new Date('2026-10-14T09:00:00Z') }, 'geboekt', nu)).toBe('voorbij')
    expect(lesKeuze({ ...les, start: new Date('2026-10-14T09:00:00Z') }, 'wachtlijst', nu)).toBe('voorbij')
    expect(lesKeuze(les, 'aanwezig', nu)).toBe('aanwezig')
    expect(vrijePlekken(10, 12)).toBe(0)
  })
})

describe('bezoek en motivatie', () => {
  const nu = new Date('2026-10-14T10:00:00Z') // woensdag
  it('telt bezoeken in deze maand', () => {
    expect(bezoekenDezeMaand([new Date('2026-10-01T08:00:00Z'), new Date('2026-09-30T21:00:00Z'), new Date('2026-09-30T23:30:00Z')], nu)).toBe(2)
  })

  it('telt weken op rij, ook als deze week nog leeg is', () => {
    const bezoek = [new Date('2026-10-06T08:00:00Z'), new Date('2026-09-29T08:00:00Z'), new Date('2026-09-15T08:00:00Z')]
    expect(wekenOpRij(bezoek, nu)).toBe(2)
    expect(wekenOpRij([...bezoek, new Date('2026-10-13T08:00:00Z')], nu)).toBe(3)
    expect(wekenOpRij([], nu)).toBe(0)
  })

  it('groet op Nederlandse tijd', () => {
    expect(groet(new Date('2026-10-14T05:30:00Z'))).toBe('Goedemorgen')
    expect(groet(new Date('2026-10-14T12:00:00Z'))).toBe('Goedemiddag')
    expect(groet(new Date('2026-10-14T20:00:00Z'))).toBe('Goedenavond')
  })

  it('noemt lesdagen kort', () => {
    expect(dagNaamKort('2026-10-14', '2026-10-14')).toBe('Vandaag')
    expect(dagNaamKort('2026-10-15', '2026-10-14')).toBe('Morgen')
    expect(dagNaamKort('2026-10-17', '2026-10-14')).toBe('Zaterdag')
  })
})

describe('annuleren zonder gevolg', () => {
  const nu = new Date('2026-10-14T10:00:00Z')
  const straks = new Date('2026-10-14T11:00:00Z') // binnen de standaard 2 uur
  it('van de wachtlijst af telt nooit als te laat', () => {
    expect(annulerenZonderGevolg('wachtlijst', straks, nu, STANDAARD_APP_REGELS)).toBe(true)
  })
  it('een boeking binnen de termijn wel', () => {
    expect(annulerenZonderGevolg('geboekt', straks, nu, STANDAARD_APP_REGELS)).toBe(false)
    expect(annulerenZonderGevolg('geboekt', new Date('2026-10-14T13:00:00Z'), nu, STANDAARD_APP_REGELS)).toBe(true)
  })
})
