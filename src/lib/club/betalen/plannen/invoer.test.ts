import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { leesPlanInvoer, leesPlanVestigingen, planRij } from './invoer'
import { GRENS } from './model'

const EIGEN = ['budel', 'eersel', 'valkenswaard']
const GOED = {
  naam: '12 maanden',
  interval: 'maand',
  bedragCent: 3995,
  btwProcent: 9,
  contractMaanden: 12,
  opzegtermijnDagen: 30,
  verlenging: 'onbepaald',
  proefDagen: 0,
  inschrijfkostenCent: 0,
  vestigingen: null,
  doelgroep: 'iedereen',
}

function fout(body: unknown): string {
  const uit = leesPlanInvoer(body, EIGEN)
  if (uit.ok) throw new Error('verwacht een fout')
  return uit.fout
}

describe('leesPlanInvoer', () => {
  it('neemt een goed plan aan en vult standaarden in', () => {
    const uit = leesPlanInvoer(GOED, EIGEN)
    expect(uit.ok).toBe(true)
    if (!uit.ok) return
    expect(uit.waarde).toMatchObject({ naam: '12 maanden', bedragCent: 3995, btwProcent: 9, contractMaanden: 12, proRataEerste: true, actief: true, vereistBewijs: false, factuurDag: null })
  })

  it('flex: lege looptijd is onbepaalde tijd', () => {
    const uit = leesPlanInvoer({ ...GOED, contractMaanden: '' }, EIGEN)
    expect(uit.ok && uit.waarde.contractMaanden).toBeNull()
  })

  it('weigert bedragen die geen hele centen binnen de grenzen zijn', () => {
    for (const b of [49, 1_000_001, 39.95, -100, '39,95', null, Number.NaN]) expect(fout({ ...GOED, bedragCent: b })).toMatch(/prijs/)
  })

  it('btw alleen uit het regelbestand', () => {
    expect(fout({ ...GOED, btwProcent: 6 })).toMatch(/btw/)
    expect(leesPlanInvoer({ ...GOED, btwProcent: 21 }, EIGEN).ok).toBe(true)
    expect(leesPlanInvoer({ ...GOED, btwProcent: 0 }, EIGEN).ok).toBe(true)
  })

  it('Wet van Dam: looptijd hooguit 12 maanden, opzegtermijn hooguit een maand', () => {
    expect(fout({ ...GOED, contractMaanden: 24 })).toMatch(/12 maanden/)
    expect(fout({ ...GOED, opzegtermijnDagen: 60 })).toMatch(/een maand/)
    expect(leesPlanInvoer({ ...GOED, opzegtermijnDagen: 31 }, EIGEN).ok).toBe(true)
  })

  it('verlenging: alleen onbepaald of geen, en geen vraagt een looptijd', () => {
    expect(fout({ ...GOED, verlenging: 'zelfde_looptijd' })).toMatch(/na de looptijd/)
    expect(fout({ ...GOED, verlenging: 'geen', contractMaanden: null })).toMatch(/looptijd/)
    expect(leesPlanInvoer({ ...GOED, verlenging: 'geen' }, EIGEN).ok).toBe(true)
  })

  it('proefdagen, inschrijfkosten en doelgroep binnen de grenzen', () => {
    expect(fout({ ...GOED, proefDagen: 61 })).toMatch(/Proefdagen/)
    expect(fout({ ...GOED, inschrijfkostenCent: 100_001 })).toMatch(/inschrijfkosten/)
    expect(fout({ ...GOED, doelgroep: 'kinderen' })).toMatch(/doelgroep/)
    expect(leesPlanInvoer({ ...GOED, doelgroep: 'student', vereistBewijs: true }, EIGEN).ok).toBe(true)
  })

  it('factuurdag alleen 1 tot en met 28 en alleen bij maandintervallen', () => {
    expect(fout({ ...GOED, factuurDag: 29 })).toMatch(/28/)
    expect(fout({ ...GOED, interval: 'week', factuurDag: 1 })).toMatch(/per maand/)
    expect(leesPlanInvoer({ ...GOED, interval: 'kwartaal', factuurDag: '1' }, EIGEN).ok).toBe(true)
  })

  it('naam en interval verplicht', () => {
    expect(fout({ ...GOED, naam: ' x ' })).toMatch(/naam/)
    expect(fout({ ...GOED, interval: 'dag' })).toMatch(/betaald/)
    expect(fout(null)).toMatch(/Vul/)
  })

  it('eigenschap: elk geaccepteerd plan past in de check-regels van de database', () => {
    fc.assert(
      fc.property(
        fc.record({
          bedragCent: fc.integer({ min: -10, max: 1_100_000 }),
          contractMaanden: fc.option(fc.integer({ min: -2, max: 40 })),
          opzegtermijnDagen: fc.integer({ min: -5, max: 100 }),
          proefDagen: fc.integer({ min: -5, max: 70 }),
          inschrijfkostenCent: fc.integer({ min: -5, max: 120_000 }),
          btwProcent: fc.constantFrom(0, 6, 9, 21, 25),
        }),
        (r) => {
          const uit = leesPlanInvoer({ ...GOED, ...r }, EIGEN)
          if (!uit.ok) return
          const w = uit.waarde
          expect(Number.isSafeInteger(w.bedragCent) && w.bedragCent >= GRENS.bedragMin && w.bedragCent <= GRENS.bedragMax).toBe(true)
          expect([0, 9, 21]).toContain(w.btwProcent)
          expect(w.contractMaanden === null || (w.contractMaanden >= 1 && w.contractMaanden <= 12)).toBe(true)
          expect(w.opzegtermijnDagen >= 0 && w.opzegtermijnDagen <= 31).toBe(true)
          expect(w.proefDagen >= 0 && w.proefDagen <= GRENS.proefMax).toBe(true)
          expect(w.inschrijfkostenCent >= 0 && w.inschrijfkostenCent <= GRENS.inschrijfMax).toBe(true)
        },
      ),
    )
  })

  it('planRij gebruikt de kolomnamen van migratie 460 (interval_soort) zonder user_id', () => {
    const uit = leesPlanInvoer(GOED, EIGEN)
    if (!uit.ok) throw new Error(uit.fout)
    const rij = planRij(uit.waarde)
    expect(rij.interval_soort).toBe('maand')
    expect(rij).not.toHaveProperty('user_id')
    expect(rij).not.toHaveProperty('interval')
  })
})

describe('leesPlanVestigingen', () => {
  it('alleen vestigingen van de eigen sportschool', () => {
    expect(leesPlanVestigingen(['budel', 'vreemd'], EIGEN).ok).toBe(false)
    expect(leesPlanVestigingen([], EIGEN).ok).toBe(false)
    expect(leesPlanVestigingen(['eersel', 'budel'], EIGEN)).toEqual({ ok: true, waarde: ['budel', 'eersel'] })
  })
  it('alles aangevinkt of leeg is alle vestigingen', () => {
    expect(leesPlanVestigingen(EIGEN, EIGEN)).toEqual({ ok: true, waarde: null })
    expect(leesPlanVestigingen(null, EIGEN)).toEqual({ ok: true, waarde: null })
    expect(leesPlanVestigingen('alle', EIGEN)).toEqual({ ok: true, waarde: null })
  })
  it('eigenschap: de uitkomst is altijd een deel van de eigen vestigingen', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...EIGEN, 'x', 'y'), { maxLength: 6 }), (lijst) => {
        const uit = leesPlanVestigingen(lijst, EIGEN)
        if (uit.ok && uit.waarde) expect(uit.waarde.every((s) => EIGEN.includes(s))).toBe(true)
      }),
    )
  })
})
