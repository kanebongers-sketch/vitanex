import { describe, expect, test } from 'vitest'
import { eindeVastePeriode, isLopend, laatsteDag, leesKlantInvoer, maandprijs, vatKlantenSamen, type PtKlant } from './abonnementen'

const klant = (over: Partial<PtKlant> = {}): PtKlant => ({
  id: 'k1', naam: 'Sanne', contact: null, duoPartner: null, club: 'budel', abonnement: '1x',
  startdatum: '2026-09-01', status: 'actief', opgezegdOp: null, notitie: null, leadId: null, ...over,
})

describe('prijzen (Fit Factory PT 2026)', () => {
  test('standaard en Eersel', () => {
    expect(maandprijs('1x', 'budel')).toBe(299)
    expect(maandprijs('1x', 'eersel')).toBe(319)
    expect(maandprijs('2x', 'oisterwijk')).toBe(499)
    expect(maandprijs('2x', 'eersel')).toBe(519)
    expect(maandprijs('duo_1x', 'bladel')).toBe(399)
    expect(maandprijs('duo_2x', 'eersel')).toBe(619)
  })
})

describe('looptijd', () => {
  test('3 maanden vast: t/m de dag vóór dezelfde datum 3 maanden later', () => {
    expect(eindeVastePeriode('2026-10-01')).toBe('2026-12-31')
    expect(eindeVastePeriode('2026-09-15')).toBe('2026-12-14')
    expect(eindeVastePeriode('2026-11-30')).toBe('2027-02-27')
  })
  test('opzeggen: een volle kalendermaand, maar nooit vóór het einde van de vaste periode', () => {
    // Na de vaste periode: opgezegd 10 jan → loopt t/m 28 feb.
    expect(laatsteDag('2026-09-01', '2027-01-10')).toBe('2027-02-28')
    // Binnen de vaste periode: opgezegd 5 okt zou t/m 30 nov zijn, maar vast loopt t/m 31 dec.
    expect(laatsteDag('2026-10-01', '2026-10-05')).toBe('2026-12-31')
  })
  test('lopend: opgezegd telt tot en met de laatste dag mee; gestopt en toekomst niet', () => {
    const opgezegd = klant({ status: 'opgezegd', opgezegdOp: '2026-10-05' })
    expect(isLopend(opgezegd, '2026-11-30')).toBe(true)
    expect(isLopend(opgezegd, '2026-12-01')).toBe(false)
    expect(isLopend(klant({ status: 'gestopt', opgezegdOp: '2026-10-01' }), '2026-10-08')).toBe(false)
    expect(isLopend(klant({ startdatum: '2026-11-01' }), '2026-10-08')).toBe(false)
  })
})

describe('samenvatting', () => {
  test('maandwaarde zonder bevroren, personen tellen duo dubbel, vaste periode bijna klaar', () => {
    const s = vatKlantenSamen(
      [
        klant({ id: 'a', abonnement: '2x', club: 'eersel', startdatum: '2026-08-01' }),
        klant({ id: 'b', abonnement: 'duo_1x', duoPartner: 'Tom' }),
        klant({ id: 'c', status: 'bevroren' }),
        klant({ id: 'd', status: 'gestopt', opgezegdOp: '2026-09-20' }),
      ],
      '2026-10-08',
    )
    expect(s.lopend).toBe(3)
    expect(s.bevroren).toBe(1)
    expect(s.maandwaarde).toBe(519 + 399)
    expect(s.personen).toBe(4)
    expect(s.sessiesPerWeek).toBe(3)
    expect(s.vastBijnaKlaar.map((k) => k.id)).toEqual(['a'])
  })
})

describe('invoer', () => {
  test('geldig; duo-partner alleen bij duo; opzegdatum verplicht bij opgezegd', () => {
    const r = leesKlantInvoer({ naam: ' Sanne ', club: 'eersel', abonnement: '1x', startdatum: '2026-10-01', duoPartner: 'X' })
    expect(r.ok && r.waarde.duoPartner).toBe(null)
    expect(leesKlantInvoer({ naam: 'A', club: 'eersel', abonnement: '1x', startdatum: '2026-10-01', status: 'opgezegd' }).ok).toBe(false)
    expect(leesKlantInvoer({ naam: 'A', club: 'mars', abonnement: '1x', startdatum: '2026-10-01' }).ok).toBe(false)
    expect(leesKlantInvoer({ naam: 'A', club: 'budel', abonnement: '1x', startdatum: '2026-10-01', status: 'opgezegd', opgezegdOp: '2026-09-01' }).ok).toBe(false)
  })
})
