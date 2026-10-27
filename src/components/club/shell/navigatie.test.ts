import { describe, expect, it } from 'vitest'
import { RECHTEN } from '@/lib/club/kern/medewerker'
import { ONDERDELEN, ONDERBALK_MAX, menuOnderdeel, onderbalkOnderdelen, onderdeelPad, onderdeelVoorToets, onderdelenVan, sectiesVoor, toetsTekst } from './onderdelen'
import { clubHref } from './hulpbalk-items'
import { ledenItems, ledenUitAntwoord, zoekHref, zoekItems, zoektLeden } from './zoeken'
import { stappenNaarLid } from './ClubKruimel'

// Navigatie voor de trainer op de vloer (besluit Kane 20-10-2026): onderbalk,
// sneltoetsen en leden zoeken, altijd binnen de rechten van de rol.

const TRAINER = ['vandaag', ...RECHTEN.trainer]
const INSTRUCTEUR = ['vandaag', ...RECHTEN.instructeur]
const labels = (lijst: readonly { label: string }[]) => lijst.map((o) => o.label)

describe('onderbalk', () => {
  it('trainer: Vandaag (met check-in, taken en opvolgen), Leden, Training en Groepslessen', () => {
    expect(labels(onderbalkOnderdelen([], TRAINER))).toEqual(['Vandaag', 'Leden', 'Training', 'Groepslessen'])
  })

  it('instructeur: alleen wat de rol mag', () => {
    expect(labels(onderbalkOnderdelen([], INSTRUCTEUR))).toEqual(['Vandaag', 'Groepslessen', 'Personeel'])
  })

  it('een onderdeel dat uit staat schuift door naar het volgende', () => {
    expect(labels(onderbalkOnderdelen(['training'], TRAINER))).toEqual(['Vandaag', 'Leden', 'Groepslessen', 'Personeel'])
  })

  it('geen check-in, taken of opvolgen in de balk: die staan op Vandaag', () => {
    const sleutels = onderbalkOnderdelen([], null).map((o) => o.sleutel)
    for (const s of ['checkin', 'taken', 'opvolgen']) expect(sleutels).not.toContain(s)
  })

  it('nooit meer dan vier, en nooit iets buiten de rechten', () => {
    const alles = onderbalkOnderdelen([], null)
    expect(alles).toHaveLength(ONDERBALK_MAX)
    for (const rol of Object.values(RECHTEN)) {
      for (const o of onderbalkOnderdelen([], ['vandaag', ...rol])) expect(['vandaag', ...rol]).toContain(o.sleutel)
    }
  })
})

describe('sneltoetsen (G en dan een letter)', () => {
  it('elke letter hoort bij een onderdeel', () => {
    const letters = ONDERDELEN.flatMap((o) => (o.toets ? [o.toets] : []))
    expect(new Set(letters).size).toBe(letters.length)
    expect(letters).not.toContain('g')
  })

  it('G L opent Leden, G C Check-in, G T Training', () => {
    expect(onderdeelVoorToets('l', [], TRAINER)?.sleutel).toBe('leden')
    expect(onderdeelVoorToets('C', [], TRAINER)?.sleutel).toBe('checkin')
    expect(onderdeelVoorToets('t', [], TRAINER)?.sleutel).toBe('schemas')
  })

  it('G C, G K en G O gaan naar hun sectie op Vandaag', () => {
    const doel = (l: string) => {
      const o = onderdeelVoorToets(l, [], TRAINER)
      return o ? clubHref(onderdeelPad(o), 'budel') : null
    }
    expect(doel('c')).toBe('/club?v=budel#checkin')
    expect(doel('k')).toBe('/club?v=budel#taken')
    expect(doel('o')).toBe('/club?v=budel#opvolgen')
    expect(onderdeelVoorToets('k', [], INSTRUCTEUR)).toBeNull()
    expect(onderdeelVoorToets('c', [], TRAINER.filter((s) => s !== 'vandaag'))).toBeNull()
  })

  it('niets wat de rol niet mag of wat uit staat', () => {
    expect(onderdeelVoorToets('i', [], TRAINER, false)).toBeNull()
    expect(onderdeelVoorToets('b', [], TRAINER)).toBeNull()
    expect(onderdeelVoorToets('c', ['checkin'], TRAINER)).toBeNull()
    expect(onderdeelVoorToets('x', [], null)).toBeNull()
  })

  it('de toets staat bij het onderdeel in het zoekvenster', () => {
    const leden = zoekItems({ uit: [], toegestaan: TRAINER, medewerker: true, betalenAan: false }, false).find((i) => i.id === 'menu-leden')
    expect(leden?.toets).toBe('G L')
    expect(toetsTekst({ toets: undefined })).toBeNull()
  })
})

describe('leden zoeken', () => {
  it('pas vanaf twee tekens', () => {
    expect(zoektLeden('a')).toBe(false)
    expect(zoektLeden(' an ')).toBe(true)
  })

  it('leest alleen geldige rijen uit het antwoord', () => {
    expect(ledenUitAntwoord({ leden: [{ id: 'x', naam: 'Anna', lidnummer: 'FF1', status: 'Actief' }, { naam: 'zonder id' }, null] })).toEqual([
      { id: 'x', naam: 'Anna', lidnummer: 'FF1', status: 'Actief' },
    ])
    expect(ledenUitAntwoord(null)).toEqual([])
    expect(ledenUitAntwoord({ leden: 'nee' })).toEqual([])
  })

  it('een lid opent de ledenkaart, de laatste regel de lijst met de zoekterm', () => {
    const items = ledenItems([{ id: 'abc', naam: 'Anna de Vries', lidnummer: 'FF1', status: 'Actief' }], ' anna ')
    expect(items.map((i) => i.label)).toEqual(['Anna de Vries', 'Alle leden met "anna"'])
    expect(items[0].uitleg).toBe('Lidnummer FF1 · Actief')
    expect(zoekHref(items[0], 'budel')).toBe('/club/leden/abc?v=budel')
    expect(zoekHref(items[1], 'budel')).toBe('/club/leden?q=anna&v=budel')
  })
})

describe('kruimelpad naar een lid', () => {
  it('Leden › naam, met de vestiging', () => {
    expect(stappenNaarLid(true, { id: 'abc', naam: 'Anna' }, 'budel')).toEqual([
      { label: 'Leden', href: '/club/leden?v=budel' },
      { label: 'Anna', href: '/club/leden/abc?v=budel' },
    ])
  })

  it('leeg voor wie Leden niet mag', () => {
    expect(stappenNaarLid(false, { id: 'abc', naam: 'Anna' }, 'budel')).toEqual([])
  })
})

describe('minder tabbladen: Werkvloer (besluit Kane 27-10-2026)', () => {
  it('Werkvloer heeft alleen Vandaag en Notities', () => {
    expect(labels(onderdelenVan('werkvloer'))).toEqual(['Vandaag', 'Notities'])
  })

  it('check-in, taken en opvolgen zijn secties op Vandaag, binnen de rechten', () => {
    expect(sectiesVoor([], null).map((o) => o.sectie)).toEqual(['checkin', 'taken', 'opvolgen'])
    expect(sectiesVoor([], INSTRUCTEUR)).toEqual([])
    expect(sectiesVoor(['taken'], TRAINER).map((o) => o.sleutel)).toEqual(['checkin', 'opvolgen'])
  })

  it('op de volledige schermen licht Vandaag op', () => {
    for (const pad of ['/club/checkin', '/club/checkin/kiosk', '/club/taken', '/club/taken/week', '/club/taken/beheer', '/club/opvolgen']) {
      expect(menuOnderdeel(pad)?.sleutel, pad).toBe('vandaag')
    }
    expect(menuOnderdeel('/club/notities')?.sleutel).toBe('notities')
  })

  it('een link met anker houdt de vestiging voor het anker', () => {
    expect(clubHref('#taken', 'budel')).toBe('/club?v=budel#taken')
    expect(clubHref('#taken', null)).toBe('/club#taken')
    expect(clubHref('/leden', 'budel')).toBe('/club/leden?v=budel')
  })
})
