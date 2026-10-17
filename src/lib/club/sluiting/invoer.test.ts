import { describe, expect, it } from 'vitest'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { jaarUitParam, leesFeestdagen, leesSluiting } from './invoer'
import { sluitingUitRij } from './model'
import { datumKort, datumLang, lessenTekst, soortTekst, wanneer } from './weergave'

const V: VestigingInfo[] = [{ sleutel: 'budel', naam: 'Budel', standaard: true }]

describe('leesSluiting', () => {
  it('accepteert een gesloten dag voor alle vestigingen', () => {
    const uit = leesSluiting({ datum: '2026-12-26', vestiging: '', soort: 'gesloten', reden: '  Tweede   Kerstdag ' }, V)
    expect(uit).toEqual({ ok: true, waarde: { datum: '2026-12-26', vestiging: null, soort: 'gesloten', van: null, tot: null, reden: 'Tweede Kerstdag' } })
  })

  it('accepteert afwijkende tijden voor een vestiging', () => {
    const uit = leesSluiting({ datum: '2026-04-27', vestiging: 'budel', soort: 'afwijkend', van: '09:00', tot: '16:00', reden: 'Koningsdag' }, V)
    expect(uit.ok && uit.waarde).toMatchObject({ vestiging: 'budel', van: '09:00', tot: '16:00' })
  })

  it.each([
    [{ datum: '2026-02-30', soort: 'gesloten', reden: 'x' }, 'Kies een geldige datum.'],
    [{ datum: '2026-12-26', vestiging: 'eersel', soort: 'gesloten', reden: 'x' }, 'Onbekende vestiging.'],
    [{ datum: '2026-12-26', soort: 'afwijkend', van: '14:00', tot: '09:00', reden: 'x' }, 'Sluiten moet na openen.'],
    [{ datum: '2026-12-26', soort: 'afwijkend', reden: 'x' }, 'Vul een open- en sluittijd in.'],
    [{ datum: '2026-12-26', soort: 'dicht', reden: 'x' }, 'Kies gesloten of afwijkende tijden.'],
  ])('weigert ongeldige invoer', (invoer, fout) => {
    expect(leesSluiting(invoer, V)).toEqual({ ok: false, fout })
  })

  it('wil een reden van hoogstens 80 tekens', () => {
    expect(leesSluiting({ datum: '2026-12-26', soort: 'gesloten', reden: ' ' }, V).ok).toBe(false)
    expect(leesSluiting({ datum: '2026-12-26', soort: 'gesloten', reden: 'a'.repeat(81) }, V).ok).toBe(false)
  })
})

describe('leesFeestdagen', () => {
  it('leest jaar, vestiging en keuzes', () => {
    const uit = leesFeestdagen({ jaar: 2027, vestiging: null, keuzes: [{ sleutel: 'koningsdag', soort: 'afwijkend', van: '09:00', tot: '16:00' }] }, V)
    expect(uit).toEqual({ ok: true, waarde: { jaar: 2027, vestiging: null, keuzes: [{ sleutel: 'koningsdag', soort: 'afwijkend', van: '09:00', tot: '16:00' }] } })
  })

  it('weigert een onbekende feestdag, een leeg lijstje en een raar jaar', () => {
    expect(leesFeestdagen({ jaar: 2027, keuzes: [{ sleutel: 'carnaval', soort: 'gesloten' }] }, V).ok).toBe(false)
    expect(leesFeestdagen({ jaar: 2027, keuzes: [] }, V).ok).toBe(false)
    expect(leesFeestdagen({ jaar: 1500, keuzes: [{ sleutel: 'koningsdag', soort: 'gesloten' }] }, V).ok).toBe(false)
  })
})

describe('jaarUitParam', () => {
  it('neemt een geldig jaar en valt anders terug', () => {
    expect(jaarUitParam('2027', 2026)).toBe(2027)
    expect(jaarUitParam('abc', 2026)).toBe(2026)
    expect(jaarUitParam(undefined, 2026)).toBe(2026)
  })
})

describe('sluitingUitRij', () => {
  it('leest een databaserij en knipt seconden van de tijden', () => {
    const s = sluitingUitRij({ id: 'x', vestiging: null, datum: '2026-04-27', soort: 'afwijkend', open_van: '09:00:00', open_tot: '16:00:00', reden: 'Koningsdag', demo: true })
    expect(s).toEqual({ id: 'x', vestiging: null, datum: '2026-04-27', soort: 'afwijkend', van: '09:00', tot: '16:00', reden: 'Koningsdag', demo: true })
  })

  it('weigert afwijkend zonder tijden', () => {
    expect(sluitingUitRij({ id: 'x', datum: '2026-04-27', soort: 'afwijkend' })).toBeNull()
  })
})

describe('weergave', () => {
  it('schrijft datums en soorten in gewone taal', () => {
    expect(datumKort('2026-12-26')).toBe('za 26 dec')
    expect(datumLang('2026-12-26')).toBe('zaterdag 26 december')
    expect(wanneer('2026-12-26', '2026-12-26')).toBe('Vandaag')
    expect(wanneer('2026-12-26', '2026-12-25')).toBe('Morgen')
    expect(soortTekst({ soort: 'afwijkend', van: '09:00', tot: '14:00' })).toBe('Open 09:00 tot 14:00')
    expect(soortTekst({ soort: 'gesloten', van: null, tot: null })).toBe('Gesloten')
    expect(lessenTekst(1)).toBe('1 les')
    expect(lessenTekst(3)).toBe('3 lessen')
  })
})
