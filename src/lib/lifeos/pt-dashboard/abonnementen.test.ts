import { describe, expect, test } from 'vitest'
import {
  abonnementRegel, eindeVastePeriode, euro, isLopend, klantPrijs, laatsteDag, leesKlantInvoer, maandprijs, vatKlantenSamen, zonderPrijs, type PtKlant,
} from './abonnementen'

const klant = (over: Partial<PtKlant> = {}): PtKlant => ({
  id: 'k1', naam: 'Sanne', contact: null, duoPartner: null, club: 'budel', abonnement: '1x',
  startdatum: '2026-09-01', status: 'actief', opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, ...over,
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
  test('leadId: alleen een echte uuid komt door, rommel wordt null (raakt de database niet)', () => {
    const basis = { naam: 'A', club: 'budel', abonnement: '1x', startdatum: '2026-10-01' }
    const goed = leesKlantInvoer({ ...basis, leadId: '55555555-5555-4555-8555-555555555555' })
    expect(goed.ok && goed.waarde.leadId).toBe('55555555-5555-4555-8555-555555555555')
    for (const rommel of ['------------------------------------', 'abc', 42, { id: 'x' }]) {
      const r = leesKlantInvoer({ ...basis, leadId: rommel })
      expect(r.ok && r.waarde.leadId).toBe(null)
    }
  })
})

describe('notitie', () => {
  test('regeleinden blijven staan, overtollige witruimte niet', () => {
    const r = leesKlantInvoer({ naam: 'A', club: 'budel', abonnement: '1x', startdatum: '2026-10-01', notitie: '  Doel: 5 kg\r\n\n\n\nKnie   links  ' })
    expect(r.ok && r.waarde.notitie).toBe('Doel: 5 kg\n\nKnie links')
  })
})

describe('afwijkende prijs en reden van stoppen', () => {
  const basis = { naam: 'Stefanie', club: 'eindhoven_boschdijk', abonnement: '1x', startdatum: '2026-09-01', status: 'actief' }

  test('klantPrijs: afwijkend gaat voor de standaard; de maandwaarde telt ermee', () => {
    expect(klantPrijs(klant({ abonnement: '1x', club: 'budel' }))).toBe(299)
    expect(klantPrijs(klant({ abonnement: '1x', club: 'budel', prijsAfwijkend: 249 }))).toBe(249)
    expect(vatKlantenSamen([klant({ prijsAfwijkend: 249 }), klant({ id: 'b' })], '2026-10-08').maandwaarde).toBe(249 + 299)
  })

  test('zonderPrijs: een PT\'er krijgt de afwijkende prijs nooit mee', () => {
    expect(zonderPrijs(klant({ prijsAfwijkend: 249 })).prijsAfwijkend).toBeNull()
  })

  test('invoer zonder prijsveld laat de opgeslagen prijs staan (undefined, niet null)', () => {
    const zonder = leesKlantInvoer(basis)
    expect(zonder.ok && 'prijsAfwijkend' in zonder.waarde).toBe(false)
    const leeg = leesKlantInvoer({ ...basis, prijsAfwijkend: null })
    expect(leeg.ok && leeg.waarde.prijsAfwijkend).toBeNull()
    const met = leesKlantInvoer({ ...basis, prijsAfwijkend: '249,50' })
    expect(met.ok && met.waarde.prijsAfwijkend).toBe(249.5)
    // Een ongeldige prijs is een fout (zie hieronder), geen stille standaardprijs.
    expect(leesKlantInvoer({ ...basis, prijsAfwijkend: -5 }).ok).toBe(false)
  })

  test('reden telt alleen bij opgezegd of gestopt', () => {
    const actief = leesKlantInvoer({ ...basis, stopReden: 'tijd' })
    expect(actief.ok && actief.waarde.stopReden).toBeNull()
    const gestopt = leesKlantInvoer({ ...basis, status: 'gestopt', opgezegdOp: '2026-10-01', stopReden: 'tijd' })
    expect(gestopt.ok && gestopt.waarde.stopReden).toBe('tijd')
  })

  test('abonnementRegel toont een afwijkende prijs als zodanig', () => {
    expect(abonnementRegel({ abonnement: '1x', club: 'budel', prijsAfwijkend: 249 })).toBe(`1x per week · Budel · ${euro(249)} p/m (afwijkend)`)
    expect(abonnementRegel({ abonnement: '1x', club: 'budel', prijsAfwijkend: 249 }, false)).toBe('1x per week · Budel')
  })
})

describe('afwijkende prijs: ongeldig is een fout, niet stil de standaard', () => {
  const basis = { naam: 'X', club: 'budel', abonnement: '1x', startdatum: '2026-09-01', status: 'actief' }
  test('te hoog, negatief of geen getal → foutmelding', () => {
    for (const prijsAfwijkend of [6000, -1, 'abc']) expect(leesKlantInvoer({ ...basis, prijsAfwijkend }).ok).toBe(false)
  })
  test('leeg of null → standaardprijs (null)', () => {
    for (const prijsAfwijkend of [null, '']) {
      const r = leesKlantInvoer({ ...basis, prijsAfwijkend })
      expect(r.ok && r.waarde.prijsAfwijkend).toBeNull()
    }
  })
})
