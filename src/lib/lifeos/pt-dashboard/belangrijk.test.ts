import { describe, expect, test } from 'vitest'
import {
  aantalOpen, beheerOverzicht, belangrijkVoorPt, isBeheerActie, leesBelangrijkActie, leesKledingmaten, leesLink, linkVoorPt,
  matenPerPt, sorteerPunten, verplaats, volgendeVolgorde, type Aandachtspunt, type BelangrijkActie,
} from './belangrijk'
import { geweigerd, magActie } from './belangrijk-rechten'
import { krijgtBelangrijk, LINK_ROLLEN, magAandachtspuntenBeheren } from '@/lib/lifeos/leads/links'

const ID = '11111111-1111-4111-8111-111111111111'
const punt = (over: Partial<Aandachtspunt>): Aandachtspunt => ({
  id: 'p', titel: 'Punt', uitleg: null, link: null, volgorde: 0, actief: true, ...over,
})
const REFERRALS = punt({ id: 'a', titel: 'Vraag om referrals', volgorde: 0 })
const RECENSIE = punt({ id: 'b', titel: 'Vraag om een recensie', volgorde: 10 })
const UIT = punt({ id: 'c', titel: 'Oud punt', volgorde: 20, actief: false })

describe('rechten', () => {
  test('alleen de beheerder (Kane) beheert de punten', () => {
    expect(LINK_ROLLEN.filter(magAandachtspuntenBeheren)).toEqual(['beheerder'])
  })
  test('alleen PT\'ers krijgen "Belangrijk" (afvinken, kledingmaten)', () => {
    expect(LINK_ROLLEN.filter(krijgtBelangrijk)).toEqual(['pt'])
  })
  const beheer: BelangrijkActie[] = [
    { actie: 'toevoegen', titel: 'x', uitleg: null, link: null },
    { actie: 'wijzigen', id: ID, titel: 'x', uitleg: null, link: null },
    { actie: 'actief', id: ID, actief: false },
    { actie: 'verplaats', id: ID, richting: 'op' },
    { actie: 'verwijderen', id: ID },
  ]
  const pt: BelangrijkActie[] = [
    { actie: 'gedaan', id: ID, gedaan: true },
    { actie: 'kledingmaten', maten: { boven: 'M', onder: 'L' } },
  ]
  test.each(beheer)('beheeractie $actie: alleen de beheerder', (a) => {
    expect(isBeheerActie(a)).toBe(true)
    expect(LINK_ROLLEN.filter((r) => magActie(r, a))).toEqual(['beheerder'])
    expect(geweigerd(a)).toMatch(/Kane/)
  })
  test.each(pt)('PT-actie $actie: alleen een PT\'er, niet de eigenaar of Kane', (a) => {
    expect(isBeheerActie(a)).toBe(false)
    expect(LINK_ROLLEN.filter((r) => magActie(r, a))).toEqual(['pt'])
  })
})

describe('invoer', () => {
  test('toevoegen: titel verplicht, witruimte samengevoegd, te lang is een fout', () => {
    expect(leesBelangrijkActie({ actie: 'toevoegen', titel: '  Vraag   om referrals ', uitleg: '', link: '' })).toEqual({
      ok: true, waarde: { actie: 'toevoegen', titel: 'Vraag om referrals', uitleg: null, link: null },
    })
    expect(leesBelangrijkActie({ actie: 'toevoegen', titel: '   ' })).toEqual({ ok: false, fout: 'Vul een titel in.' })
    expect(leesBelangrijkActie({ actie: 'toevoegen', titel: 'x'.repeat(81) }).ok).toBe(false)
    expect(leesBelangrijkActie({ actie: 'toevoegen', titel: 'x', uitleg: 'y'.repeat(301) }).ok).toBe(false)
  })
  test('acties met een punt: geldig id verplicht, juiste velden', () => {
    expect(leesBelangrijkActie({ actie: 'verwijderen', id: 'nope' })).toEqual({ ok: false, fout: 'Onbekend punt.' })
    expect(leesBelangrijkActie({ actie: 'actief', id: ID, actief: 'ja' }).ok).toBe(false)
    expect(leesBelangrijkActie({ actie: 'verplaats', id: ID, richting: 'links' }).ok).toBe(false)
    expect(leesBelangrijkActie({ actie: 'gedaan', id: ID, gedaan: true })).toEqual({ ok: true, waarde: { actie: 'gedaan', id: ID, gedaan: true } })
    expect(leesBelangrijkActie({ actie: 'wijzigen', id: ID, titel: 'Nieuw', link: '/bibliotheek' })).toEqual({
      ok: true, waarde: { actie: 'wijzigen', id: ID, titel: 'Nieuw', uitleg: null, link: '/bibliotheek' },
    })
    expect(leesBelangrijkActie({ actie: 'iets', id: ID })).toEqual({ ok: false, fout: 'Onbekende actie.' })
    expect(leesBelangrijkActie(null).ok).toBe(false)
    expect(leesBelangrijkActie([]).ok).toBe(false)
  })
  test('link: https of een pad in de app; niets anders', () => {
    expect(leesLink('')).toEqual({ ok: true, waarde: null })
    expect(leesLink(undefined)).toEqual({ ok: true, waarde: null })
    expect(leesLink(' https://g.page/r/fitfactory/review ')).toEqual({ ok: true, waarde: 'https://g.page/r/fitfactory/review' })
    expect(leesLink('/bibliotheek')).toEqual({ ok: true, waarde: '/bibliotheek' })
    for (const slecht of ['http://voorbeeld.nl', 'javascript:alert(1)', '//evil.nl', '/../lifeoskane', 'https://kane:geheim@voorbeeld.nl', 'https://localhost', 'voorbeeld.nl', '/a b', `https://x.nl/${'a'.repeat(500)}`]) {
      expect(leesLink(slecht).ok, slecht).toBe(false)
    }
  })
  test('kledingmaten: beide verplicht, alleen standaardmaten, hoofdletters', () => {
    expect(leesKledingmaten({ boven: 'm', onder: ' xl ' })).toEqual({ ok: true, waarde: { boven: 'M', onder: 'XL' } })
    expect(leesKledingmaten({ boven: 'M' }).ok).toBe(false)
    expect(leesKledingmaten({ boven: 'XXXL', onder: 'M' }).ok).toBe(false)
    expect(leesBelangrijkActie({ actie: 'kledingmaten', maten: { boven: 'S', onder: 'S' } })).toEqual({
      ok: true, waarde: { actie: 'kledingmaten', maten: { boven: 'S', onder: 'S' } },
    })
  })
})

describe('startscherm van de PT\'er', () => {
  test('alleen actieve punten, op volgorde; afgevinkte apart; kleding ontbreekt telt als open', () => {
    const b = belangrijkVoorPt([RECENSIE, UIT, REFERRALS], new Set(['b']), null)
    expect(b.kledingOntbreekt).toBe(true)
    expect(b.open.map((p) => p.id)).toEqual(['a'])
    expect(b.gedaan.map((p) => p.id)).toEqual(['b'])
    expect(aantalOpen(b)).toBe(2)
  })
  test('maten doorgegeven en alles gedaan → niets open', () => {
    const b = belangrijkVoorPt([REFERRALS], new Set(['a']), { boven: 'M', onder: 'M' })
    expect(aantalOpen(b)).toBe(0)
  })
  test('link: een pad gaat naar de eigen app van de PT\'er, https blijft', () => {
    expect(linkVoorPt('/bibliotheek', 'joey')).toBe('/joey/bibliotheek')
    expect(linkVoorPt('/', 'joey')).toBe('/joey')
    expect(linkVoorPt('https://g.page/x', 'joey')).toBe('https://g.page/x')
  })
})

describe('volgorde', () => {
  test('sorteren op volgorde, dan titel', () => {
    expect(sorteerPunten([punt({ id: 'z', titel: 'B' }), punt({ id: 'y', titel: 'A' }), punt({ id: 'x', volgorde: -1 })]).map((p) => p.id)).toEqual(['x', 'y', 'z'])
  })
  test('nieuw punt achteraan', () => {
    expect(volgendeVolgorde([])).toBe(0)
    expect(volgendeVolgorde([REFERRALS, RECENSIE])).toBe(20)
  })
  test('verplaatsen: wisselt met de buur en geeft alleen gewijzigde rijen', () => {
    expect(verplaats([REFERRALS, RECENSIE, UIT], 'b', 'op')).toEqual([{ id: 'b', volgorde: 0 }, { id: 'a', volgorde: 10 }])
    expect(verplaats([REFERRALS, RECENSIE], 'a', 'op')).toEqual([])
    expect(verplaats([REFERRALS, RECENSIE], 'b', 'neer')).toEqual([])
    expect(verplaats([REFERRALS], 'onbekend', 'neer')).toEqual([])
  })
  test('verplaatsen nummert scheve volgordes opnieuw', () => {
    const scheef = [punt({ id: 'a', volgorde: 5 }), punt({ id: 'b', volgorde: 5, titel: 'Q' }), punt({ id: 'c', volgorde: 7 })]
    expect(verplaats(scheef, 'c', 'op')).toEqual([{ id: 'a', volgorde: 0 }, { id: 'c', volgorde: 10 }, { id: 'b', volgorde: 20 }])
  })
})

describe('overzicht voor Kane', () => {
  const team = [{ id: 'joey', naam: 'Joey' }, { id: 'sem', naam: 'Sem' }]
  test('afgevinkt telt alleen het huidige team; wie geen maten heeft, staat erbij', () => {
    const o = beheerOverzicht([REFERRALS, RECENSIE], new Map([['a', ['joey', 'oud-pt']]]), team, new Map([['joey', { boven: 'M', onder: 'L' }]]))
    expect(o).toEqual({ gedaan: { a: 1, b: 0 }, zonderMaten: ['Sem'] })
  })
  test('maten per PT\'er: null = nog niet doorgegeven', () => {
    expect(matenPerPt(team, new Map([['sem', { boven: 'S', onder: 'S' }]]))).toEqual({ joey: null, sem: { boven: 'S', onder: 'S' } })
  })
})
