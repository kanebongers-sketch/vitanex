import { describe, expect, it } from 'vitest'
import { INSTEL_PAGINAS, type InstelKijker } from './instel-paginas'
import { ALTIJD, KOPPELINGEN, betaalStand, koppelingHref, ledenappStand, meldingenStand, widgetStand, zichtbareKoppelingen, type Koppeling } from './koppelingen'

// Koppelingen: alleen wat echt bestaat, met een eerlijke stand, binnen de rechten.

const ALLES: InstelKijker = { uit: [], toegestaan: null, medewerker: false, betalenAan: true }
const ids = (k: InstelKijker) => zichtbareKoppelingen(k).map((x) => x.id)
const koppeling = (id: string): Koppeling => {
  const k = KOPPELINGEN.find((x) => x.id === id)
  if (!k) throw new Error(id)
  return k
}

describe('KOPPELINGEN', () => {
  it('elke koppeling hoort bij een bestaande instel-pagina of bij Rapporten', () => {
    for (const k of KOPPELINGEN) {
      if (k.instel) expect(INSTEL_PAGINAS.some((p) => p.id === k.instel), k.id).toBe(true)
      else expect(k.onderdeel?.sleutel).toBe('rapporten')
    }
  })

  it('schrijfstijl en geen andere systemen of beloftes', () => {
    const tekst = JSON.stringify([KOPPELINGEN, ALTIJD])
    expect(tekst).not.toMatch(/[–—]|\s-\s/)
    expect(tekst).not.toMatch(/[éèáàíóú]/i)
    expect(tekst).not.toMatch(/virtuagym|sportivity|google|binnenkort|marketplace/i)
  })
})

describe('wie wat ziet', () => {
  it('de eigenaar ziet alles, ook betalen als dat nog niet open staat', () => {
    expect(ids(ALLES)).toEqual(['betalen', 'widget', 'ledenapp', 'meldingen', 'importeren', 'exports'])
    expect(ids({ ...ALLES, betalenAan: false })).toContain('betalen')
  })

  it('zonder link als betalen nog niet open staat of als een vestiging nodig is', () => {
    expect(koppelingHref(koppeling('betalen'), { ...ALLES, betalenAan: false }, 'budel')).toBeNull()
    expect(koppelingHref(koppeling('betalen'), ALLES, 'budel')).toBe('/club/beheer/betalen')
    expect(koppelingHref(koppeling('widget'), ALLES, 'budel')).toBe('/club/beheer/widget?v=budel')
    expect(koppelingHref(koppeling('widget'), ALLES, null)).toBeNull()
    expect(koppelingHref(koppeling('exports'), ALLES, 'budel')).toBe('/club/rapporten?v=budel')
  })

  it('een clubmanager ziet nooit wat alleen de eigenaar heeft', () => {
    expect(ids({ ...ALLES, toegestaan: ['vandaag', 'leden', 'rapporten'] })).toEqual(['importeren', 'exports'])
    expect(ids({ ...ALLES, toegestaan: ['vandaag'] })).toEqual([])
  })

  it('een onderdeel dat uit staat, geeft geen koppeling', () => {
    expect(ids({ ...ALLES, uit: ['rooster', 'app', 'leden'] })).toEqual(['betalen', 'meldingen', 'exports'])
  })
})

describe('de stand', () => {
  const account = { stripeAccountId: 'acct_1', chargesAan: true, gegevensCompleet: true, betalenAan: true }
  it('betalen', () => {
    expect(betaalStand({ actief: false, sleutelGezet: true, account }).stand).toBe('dicht')
    expect(betaalStand({ actief: true, sleutelGezet: false, account }).stand).toBe('dicht')
    expect(betaalStand({ actief: true, sleutelGezet: true, account: null }).stand).toBe('onbekend')
    expect(betaalStand({ actief: true, sleutelGezet: true, account: { ...account, stripeAccountId: null } }).stand).toBe('uit')
    expect(betaalStand({ actief: true, sleutelGezet: true, account: { ...account, chargesAan: false } }).stand).toBe('bezig')
    expect(betaalStand({ actief: true, sleutelGezet: true, account: { ...account, betalenAan: false } }).stand).toBe('uit')
    expect(betaalStand({ actief: true, sleutelGezet: true, account }).stand).toBe('aan')
  })

  it('boekingswidget', () => {
    expect(widgetStand({ actief: true, adres: true, aanOp: null, vestigingen: 2 }).stand).toBe('onbekend')
    expect(widgetStand({ actief: true, adres: false, aanOp: 1, vestigingen: 2 }).stand).toBe('uit')
    expect(widgetStand({ actief: true, adres: true, aanOp: 0, vestigingen: 2 }).stand).toBe('uit')
    expect(widgetStand({ actief: false, adres: true, aanOp: 1, vestigingen: 2 })).toEqual({ stand: 'bezig', tekst: 'Aan op 1 van 2 vestigingen, maar nog niet zichtbaar voor bezoekers van je website.' })
    expect(widgetStand({ actief: true, adres: true, aanOp: 1, vestigingen: 1 }).tekst).toBe('Aan. Bezoekers zien je rooster op je website.')
  })

  it('ledenapp en meldingen', () => {
    expect(ledenappStand({ open: false, qr: true }).stand).toBe('dicht')
    expect(ledenappStand({ open: true, qr: false }).stand).toBe('aan')
    expect(meldingenStand({ mail: false, push: false }).stand).toBe('dicht')
    expect(meldingenStand({ mail: false, push: true }).stand).toBe('bezig')
    expect(meldingenStand({ mail: true, push: true }).stand).toBe('aan')
  })
})
