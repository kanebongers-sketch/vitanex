import { describe, expect, it } from 'vitest'
import { LID_STATUSSEN } from '@/lib/club/kern/lid'
import type { Lidmaatschapsvorm } from '@/lib/club/lidmaatschappen/model'
import { actiesVoor, pauzeStand, vormKeuzes, vormToegestaan, vormVanLid, wijzigingVoorActie } from './lidmaatschap'

const VANDAAG = '2026-10-27'

function vorm(id: string, naam: string, actief = true): Lidmaatschapsvorm {
  return { id, naam, omschrijving: '', vestigingen: null, groepslessen: true, maxLessenPerWeek: null, dalVan: null, dalTot: null, dalWeekendVrij: false, kleur: 'amber', actief, demo: false }
}

describe('actiesVoor', () => {
  it('heeft voor elke status minstens een actie', () => {
    for (const s of LID_STATUSSEN) expect(actiesVoor(s).length).toBeGreaterThan(0)
  })

  it('biedt pauzeren alleen bij een actief lid en hervatten bij gepauzeerd', () => {
    expect(actiesVoor('actief')).toContain('pauzeren')
    expect(actiesVoor('gepauzeerd')).toContain('hervatten')
    expect(actiesVoor('gestopt')).toEqual(['activeren'])
    expect(actiesVoor('opgezegd')).toContain('intrekken')
  })
})

describe('wijzigingVoorActie', () => {
  it('pauzeren zet de status en de datums; zonder einde is de pauze open', () => {
    expect(wijzigingVoorActie('pauzeren', { van: '2026-11-01', tot: '2026-11-30' }, VANDAAG, null))
      .toEqual({ ok: true, wijziging: { status: 'gepauzeerd', pauzeVan: '2026-11-01', pauzeTot: '2026-11-30' } })
    expect(wijzigingVoorActie('pauzeren', { van: null, tot: null }, VANDAAG, null))
      .toEqual({ ok: true, wijziging: { status: 'gepauzeerd', pauzeVan: VANDAAG, pauzeTot: null } })
  })

  it('weigert een pauze die eindigt voor hij begint', () => {
    expect(wijzigingVoorActie('pauzeren', { van: '2026-11-10', tot: '2026-11-01' }, VANDAAG, null)).toEqual({ ok: false, fout: 'pauzeOmgekeerd' })
  })

  it('hervatten maakt actief en wist de pauze', () => {
    expect(wijzigingVoorActie('hervatten', { van: null, tot: null }, VANDAAG, null)).toEqual({ ok: true, wijziging: { status: 'actief', pauzeVan: null, pauzeTot: null } })
  })

  it('opzeggen vraagt een einddatum vanaf vandaag', () => {
    expect(wijzigingVoorActie('opzeggen', { van: null, tot: null }, VANDAAG, null)).toEqual({ ok: false, fout: 'opzeggenZonderDatum' })
    expect(wijzigingVoorActie('opzeggen', { van: null, tot: '2026-10-01' }, VANDAAG, null)).toEqual({ ok: false, fout: 'opzeggenVerleden' })
    expect(wijzigingVoorActie('opzeggen', { van: null, tot: '2026-12-31' }, VANDAAG, null))
      .toEqual({ ok: true, wijziging: { status: 'opgezegd', einddatum: '2026-12-31', pauzeVan: null, pauzeTot: null } })
  })

  it('stoppen zonder datum stopt vandaag; intrekken wist de einddatum', () => {
    expect(wijzigingVoorActie('stoppen', { van: null, tot: null }, VANDAAG, null))
      .toEqual({ ok: true, wijziging: { status: 'gestopt', einddatum: VANDAAG, pauzeVan: null, pauzeTot: null } })
    expect(wijzigingVoorActie('intrekken', { van: null, tot: null }, VANDAAG, null)).toEqual({ ok: true, wijziging: { status: 'actief', einddatum: null } })
  })

  it('activeren houdt een bestaande startdatum, anders de gekozen dag', () => {
    const met = wijzigingVoorActie('activeren', { van: '2026-11-01', tot: null }, VANDAAG, '2025-01-01')
    expect(met.ok && met.wijziging.lidSinds).toBe('2025-01-01')
    const zonder = wijzigingVoorActie('activeren', { van: '2026-11-01', tot: null }, VANDAAG, null)
    expect(zonder.ok && zonder.wijziging).toEqual({ status: 'actief', lidSinds: '2026-11-01', einddatum: null, pauzeVan: null, pauzeTot: null })
  })
})

describe('pauzeStand', () => {
  it('kent gepland, loopt en voorbij, en geen bij een andere status', () => {
    expect(pauzeStand('actief', { van: '2026-10-01', tot: null }, VANDAAG)).toBe('geen')
    expect(pauzeStand('gepauzeerd', { van: '2026-11-01', tot: null }, VANDAAG)).toBe('gepland')
    expect(pauzeStand('gepauzeerd', { van: '2026-10-01', tot: '2026-10-31' }, VANDAAG)).toBe('loopt')
    expect(pauzeStand('gepauzeerd', { van: '2026-10-01', tot: '2026-10-26' }, VANDAAG)).toBe('voorbij')
    expect(pauzeStand('gepauzeerd', { van: null, tot: null }, VANDAAG)).toBe('loopt')
  })
})

describe('vormen', () => {
  const vormen = [vorm('1', 'All-in 12 maanden'), vorm('2', 'Dal'), vorm('3', 'Oud', false)]

  it('vindt de vorm van het lid op naam, ongeacht hoofdletters en spaties', () => {
    expect(vormVanLid(vormen, '  all-in  12 Maanden ')?.id).toBe('1')
    expect(vormVanLid(vormen, null)).toBeNull()
  })

  it('toont vormen die te koop zijn plus de huidige, ook als die niet meer bestaat', () => {
    expect(vormKeuzes(vormen, 'Oud').map((v) => v.naam)).toEqual(['All-in 12 maanden', 'Dal', 'Oud'])
    expect(vormKeuzes(vormen, 'Iets uit Sportivity').map((v) => v.naam)).toEqual(['Iets uit Sportivity', 'All-in 12 maanden', 'Dal'])
    expect(vormKeuzes(vormen, null).map((v) => v.naam)).toEqual(['All-in 12 maanden', 'Dal'])
  })

  it('laat alleen een bestaande vorm, de huidige of geen vorm toe', () => {
    expect(vormToegestaan(vormen, null, 'Dal')).toBe(true)
    expect(vormToegestaan(vormen, null, 'Oud')).toBe(false)
    expect(vormToegestaan(vormen, 'Oud', 'oud')).toBe(true)
    expect(vormToegestaan(vormen, null, 'Verzonnen')).toBe(false)
    expect(vormToegestaan(vormen, 'Dal', null)).toBe(true)
  })
})
