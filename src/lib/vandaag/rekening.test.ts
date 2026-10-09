import { describe, expect, test } from 'vitest'
import { maakRekening, slaapRegel, stappenRegel } from './rekening'

const leeg = { slaapMinuten: null, slaapHistorie: [], stappenGisteren: null, stappenHistorie: [] }

describe('maakRekening', () => {
  test('te weinig metingen → eerlijk zeggen, geen getallen', () => {
    expect(maakRekening({ ...leeg, stappenHistorie: [5000, 5000, 5000] })).toEqual({ soort: 'te_weinig_data', nodig: 5 })
  })

  test('gisteren en vandaag tellen mee voor je normaal', () => {
    const r = maakRekening({ ...leeg, slaapMinuten: 360, slaapHistorie: [360, 360, 360, 360] })
    expect(r.soort).toBe('klaar')
    if (r.soort === 'klaar') expect(r.regels.map((x) => x.id)).toEqual(['slaap'])
  })

  test('wat je iets kost staat bovenaan', () => {
    const r = maakRekening({ ...leeg, slaapHistorie: [480, 480, 480, 480, 480], stappenHistorie: [4000, 4000, 4000, 4000, 4000] })
    if (r.soort !== 'klaar') throw new Error('verwacht een rekening')
    expect(r.regels.map((x) => [x.id, x.goed])).toEqual([['stappen', false], ['slaap', true]])
  })
})

describe('stappenRegel', () => {
  test('tekort naar 8.000 en wandelminuten, met bronnen', () => {
    const r = stappenRegel(4230)
    expect(r.goed).toBe(false)
    expect(r.getal).toBe('3.800')
    expect(r.stap).toBe('Dat is ongeveer 40 minuten extra wandelen per dag.')
    expect(r.bronnen.length).toBe(2)
  })
  test('in de zone → geen stap, wel het verband', () => {
    const r = stappenRegel(9100)
    expect(r.goed).toBe(true)
    expect(r.stap).toBeNull()
  })
})

describe('slaapRegel', () => {
  test('onder 7 uur → tekort en een haalbare eerste stap', () => {
    const r = slaapRegel(365)
    expect(r.goed).toBe(false)
    expect(r.jij).toBe('Je slaapt normaal 6u05 per nacht.')
    expect(r.stap).toBe('Je komt 55 minuten tekort op 7 uur. Begin met 30 minuten eerder naar bed.')
  })
  test('nooit een verzonnen persoonlijk getal: alleen het getal uit de bron', () => {
    for (const r of [slaapRegel(300), slaapRegel(480)]) expect(r.getal).toBe('4,7 jaar')
  })
})
