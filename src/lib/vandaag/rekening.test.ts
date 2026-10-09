import { describe, expect, test } from 'vitest'
import { maakRekening, slaapRegel, stappenRegel } from './rekening'
import { conditieRegel, rusthartslagRegel } from './rekening-hart'

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

describe('hart en conditie', () => {
  test('VO2max: groep uit het onderzoek, tekort tot "hoog", met bron', () => {
    const r = conditieRegel(32)
    expect(r.goed).toBe(false)
    expect(r.jij).toBe('Je VO2max (conditie) is 32. Dat valt in dit onderzoek in de groep "gemiddeld".')
    expect(r.stap).toContain('6,2 punt onder "hoog"')
    expect(r.bronnen[0].url).toContain('jama.2009.681')
  })
  test('VO2max hoog → in de zone, geen stap', () => {
    expect(conditieRegel(45).goed).toBe(true)
    expect(conditieRegel(45).stap).toBeNull()
    expect(conditieRegel(25).jij).toContain('"laag"')
  })
  test('rusthartslag: onder 60 in de zone, daarboven een stap', () => {
    expect(rusthartslagRegel(55).goed).toBe(true)
    expect(rusthartslagRegel(72).goed).toBe(false)
    expect(rusthartslagRegel(72).jij).toBe('Je rusthartslag is normaal 72 slagen per minuut.')
  })
  test('maakRekening neemt VO2max en rusthartslag mee als ze er zijn', () => {
    const r = maakRekening({ ...leeg, vo2max: 40, herstel: { rustHartslag: 70, rustHartslagHistorie: [70, 71, 69, 70], hrv: null, hrvHistorie: [] } })
    if (r.soort !== 'klaar') throw new Error('verwacht een rekening')
    expect(r.regels.map((x) => x.id)).toEqual(['rusthartslag', 'vo2max'])
  })
})
