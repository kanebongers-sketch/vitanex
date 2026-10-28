import { describe, expect, it } from 'vitest'
import type { InstelKijker } from '@/lib/club/kern/instel-paginas'
import { filterZoek, normaliseerZoek, zoekHref, zoekItems } from './zoeken'

const ALLES: InstelKijker = { uit: [], toegestaan: null, medewerker: false, betalenAan: false }

describe('zoekItems', () => {
  it('vindt ook instel-pagina\'s die niet in het menu staan', () => {
    const items = zoekItems(ALLES, true)
    expect(filterZoek(items, 'huisstijl')[0].label).toBe('Huisstijl')
    expect(filterZoek(items, 'zalen')[0].pad).toBe('/instellingen/zalen')
    expect(filterZoek(items, 'feestdag').map((i) => i.id)).toContain('instel-sluiting')
    expect(filterZoek(items, 'automatiseringen').map((i) => i.id)).toEqual(['instel-opvolgregels'])
  })

  it('unieke ids en elk item een keer', () => {
    const ids = zoekItems(ALLES, true).map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('een clubmanager vindt niets wat hij niet mag', () => {
    const items = zoekItems({ ...ALLES, toegestaan: ['vandaag', 'leden'] }, false)
    const labels = items.map((i) => i.label)
    expect(labels).toEqual(expect.arrayContaining(['Vandaag', 'Leden', 'Hulp', 'Wat is nieuw']))
    for (const verboden of ['Huisstijl', 'Rechten per rol', 'Instellingen', 'Zalen', 'Cijfers', 'Abonnement en facturen', 'Ledenapp']) expect(labels).not.toContain(verboden)
  })

  it('de hulpbalk is te vinden, met plek Onderaan en de sneltoets', () => {
    const items = zoekItems(ALLES, true)
    const hulp = items.filter((i) => i.id.startsWith('hulp-'))
    expect(hulp.map((i) => i.label)).toEqual(['Instellingen', 'Koppelingen', 'Ledenapp', 'Wat is nieuw', 'Hulp'])
    expect(hulp.every((i) => i.plek === 'Onderaan')).toBe(true)
    expect(hulp.find((i) => i.label === 'Instellingen')?.toets).toBe('G I')
    expect(filterZoek(items, 'koppelingen')[0].pad).toBe('/koppelingen')
    expect(filterZoek(items, 'updates')[0].pad).toBe('/nieuw')
  })

  it('onderdeel uit: niet te vinden', () => {
    const labels = zoekItems({ ...ALLES, uit: ['rooster'] }, true).map((i) => i.label)
    expect(labels).not.toContain('Groepslessen')
    expect(labels).not.toContain('Weekrooster')
  })
})

describe('secties op Vandaag', () => {
  it('check-in en opvolgen landen op hun anker op Vandaag', () => {
    const items = zoekItems(ALLES, true)
    expect(filterZoek(items, 'check-in')[0]).toMatchObject({ id: 'vandaag-checkin', pad: '#checkin', plek: 'Werkvloer · Vandaag', toets: 'G C' })
    expect(filterZoek(items, 'opvolgen')[0]).toMatchObject({ id: 'vandaag-opvolgen', pad: '#opvolgen' })
    expect(zoekHref(filterZoek(items, 'opvolgen')[0], 'budel')).toBe('/club?v=budel#opvolgen')
  })

  it('de volledige schermen blijven te vinden', () => {
    const items = zoekItems(ALLES, true)
    expect(filterZoek(items, 'takenweek')[0].pad).toBe('/taken/week')
    expect(filterZoek(items, 'zelf-check-in')[0].pad).toBe('/checkin/kiosk')
    expect(filterZoek(items, 'check-in volledig scherm')[0].pad).toBe('/checkin')
    expect(filterZoek(items, 'takenlijsten beheren')[0].pad).toBe('/taken/beheer')
  })

  it('niet zonder het recht of als het onderdeel uit staat', () => {
    const trainerZonderTaken = zoekItems({ ...ALLES, toegestaan: ['vandaag', 'checkin'] }, false).map((i) => i.id)
    expect(trainerZonderTaken).toContain('vandaag-checkin')
    expect(trainerZonderTaken).not.toContain('menu-taken')
    expect(trainerZonderTaken).not.toContain('scherm-taken-week')
    expect(zoekItems({ ...ALLES, uit: ['checkin'] }, true).map((i) => i.id)).not.toContain('vandaag-checkin')
  })
})

describe('taken (eigen tab in Werkvloer, besluit Kane 28-10-2026)', () => {
  it('taken en poetsrooster landen op het takenscherm', () => {
    const items = zoekItems(ALLES, true)
    expect(filterZoek(items, 'taken')[0]).toMatchObject({ id: 'menu-taken', pad: '/taken', plek: 'Werkvloer', toets: 'G K' })
    expect(filterZoek(items, 'poetsrooster')[0]).toMatchObject({ id: 'menu-taken', pad: '/taken' })
    expect(filterZoek(items, 'dagelijkse taken')[0].pad).toBe('/taken')
    expect(zoekHref(filterZoek(items, 'poetsrooster')[0], 'budel')).toBe('/club/taken?v=budel')
  })
})

describe('filterZoek', () => {
  const items = zoekItems(ALLES, true)
  it('leeg geeft alles, onzin niets', () => {
    expect(filterZoek(items, '  ')).toHaveLength(items.length)
    expect(filterZoek(items, 'xyzonzin')).toEqual([])
  })
  it('alle woorden moeten passen en accenten maken niet uit', () => {
    expect(normaliseerZoek('  Ideeën  ')).toBe('ideeen')
    expect(filterZoek(items, 'ideeen').map((i) => i.label)).toContain('Notities')
    expect(filterZoek(items, 'ledenapp bekijken')[0].id).toBe('hulp-ledenapp')
  })
})

describe('zoekHref', () => {
  it('vestiging mee waar dat hoort', () => {
    expect(zoekHref({ pad: '', perVestiging: true }, 'budel')).toBe('/club?v=budel')
    expect(zoekHref({ pad: '/beheer/rechten', perVestiging: false }, 'budel')).toBe('/club/beheer/rechten')
  })
})
