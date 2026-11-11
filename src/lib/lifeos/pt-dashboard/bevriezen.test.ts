import { describe, expect, test } from 'vitest'
import { isLopend, leesKlant, leesKlantInvoer, vatKlantenSamen, type PtKlant } from './abonnementen'
import {
  bevriesLabel, bevrorenDagenInMaand, bevriezingGepland, bevriezingLooptOfKomt, dagenInMaand, isBevrorenOp, maandGrenzen, prijsNaRato, standOp,
} from './bevriezen'
import { dossierTaken } from './dossier-agenda'

const klant = (over: Partial<PtKlant> = {}): PtKlant => ({
  id: 'a', naam: 'Sanne', contact: null, duoPartner: null, club: 'budel', abonnement: '1x',
  startdatum: '2026-09-01', status: 'actief', opgezegdOp: null, notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null,
  referralGevraagdOp: null, bevrorenVan: null, bevrorenTot: null, ...over,
})
const bevroren = (van: string | null, tot: string | null, over: Partial<PtKlant> = {}) => klant({ status: 'bevroren', bevrorenVan: van, bevrorenTot: tot, ...over })

describe('isBevrorenOp en standOp: de stand per dag', () => {
  test('binnen de periode bevroren, van en tot tellen allebei mee', () => {
    // Arrange
    const k = bevroren('2026-11-10', '2026-11-20')
    // Act en Assert
    expect(isBevrorenOp(k, '2026-11-10')).toBe(true)
    expect(isBevrorenOp(k, '2026-11-15')).toBe(true)
    expect(isBevrorenOp(k, '2026-11-20')).toBe(true)
  })

  test('van in de toekomst: tot dan gewoon actief', () => {
    const k = bevroren('2026-12-01', null)
    expect(isBevrorenOp(k, '2026-11-30')).toBe(false)
    expect(standOp(k, '2026-11-30')).toBe('actief')
    expect(bevriezingGepland(k, '2026-11-30')).toBe(true)
    expect(standOp(k, '2026-12-01')).toBe('bevroren')
  })

  test('tot in het verleden: vanzelf weer actief, zonder de status terug te zetten', () => {
    const k = bevroren('2026-10-01', '2026-10-31')
    expect(standOp(k, '2026-11-01')).toBe('actief')
    expect(bevriezingLooptOfKomt(k, '2026-11-01')).toBe(false)
    expect(isLopend(k, '2026-11-01')).toBe(true)
  })

  test('zonder tot-datum blijft de klant bevroren; zonder van-datum (oud) al bevroren', () => {
    expect(isBevrorenOp(bevroren('2026-10-01', null), '2027-06-01')).toBe(true)
    expect(isBevrorenOp(bevroren(null, null), '2026-01-01')).toBe(true)
    expect(isBevrorenOp(bevroren(null, '2026-10-31'), '2026-11-01')).toBe(false)
  })

  test('andere statussen zijn nooit bevroren, ook niet met datums', () => {
    const opgezegd = klant({ status: 'opgezegd', opgezegdOp: '2026-11-05', bevrorenVan: '2026-11-01', bevrorenTot: null })
    expect(isBevrorenOp(opgezegd, '2026-11-10')).toBe(false)
    expect(standOp(opgezegd, '2026-11-10')).toBe('opgezegd')
  })
})

describe('kalendermaand', () => {
  test('grenzen en aantal dagen, ook februari in een schrikkeljaar', () => {
    expect(maandGrenzen('2026-11-11')).toEqual({ begin: '2026-11-01', eind: '2026-11-30' })
    expect(dagenInMaand('2026-12-05')).toBe(31)
    expect(dagenInMaand('2026-02-10')).toBe(28)
    expect(dagenInMaand('2028-02-10')).toBe(29)
  })

  test('bevroren dagen worden afgekapt op de maandgrenzen', () => {
    // Over de maandgrens: 20 nov tot en met 10 dec.
    const k = bevroren('2026-11-20', '2026-12-10')
    expect(bevrorenDagenInMaand(k, '2026-11-11')).toBe(11)
    expect(bevrorenDagenInMaand(k, '2026-12-01')).toBe(10)
    expect(bevrorenDagenInMaand(k, '2027-01-01')).toBe(0)
    expect(bevrorenDagenInMaand(bevroren('2026-11-16', null), '2026-11-11')).toBe(15)
    expect(bevrorenDagenInMaand(bevroren(null, null), '2026-11-11')).toBe(30)
  })
})

describe('prijsNaRato', () => {
  test('halverwege de maand bevroren: de helft van de prijs, op centen', () => {
    expect(prijsNaRato(299, bevroren('2026-11-16', null), '2026-11-11')).toBe(149.5)
    expect(prijsNaRato(499, bevroren('2026-11-01', '2026-11-10'), '2026-11-20')).toBe(332.67)
  })

  test('niet bevroren: de hele prijs; de hele maand bevroren: niets', () => {
    expect(prijsNaRato(299, klant(), '2026-11-11')).toBe(299)
    expect(prijsNaRato(299, bevroren('2026-10-01', null), '2026-11-11')).toBe(0)
  })
})

describe('vatKlantenSamen met een bevriesperiode', () => {
  const VANDAAG = '2026-11-11'

  test('maandwaarde rekent bevroren dagen naar rato af, ook voor een duo', () => {
    // Arrange: 1x (299) actief, duo 1x (399) bevroren vanaf 16 nov, 2x (499) hele maand bevroren.
    const klanten = [
      klant({ id: 'a' }),
      bevroren('2026-11-16', null, { id: 'b', abonnement: 'duo_1x', duoPartner: 'Tom' }),
      bevroren('2026-10-01', null, { id: 'c', abonnement: '2x' }),
    ]
    // Act
    const s = vatKlantenSamen(klanten, VANDAAG)
    // Assert: de duo is vandaag nog niet bevroren, c wel.
    expect(s.lopend).toBe(3)
    expect(s.bevroren).toBe(1)
    expect(s.personen).toBe(4)
    expect(s.maandwaarde).toBe(299 + 199.5)
    expect(s.sessiesPerWeek).toBe(2)
  })

  test('na de tot-datum telt de klant weer mee, ook in de vaste periode bijna klaar', () => {
    const k = bevroren('2026-09-01', '2026-11-05', { startdatum: '2026-08-20' })
    const s = vatKlantenSamen([k], VANDAAG)
    expect(s.bevroren).toBe(0)
    expect(s.sessiesPerWeek).toBe(1)
    expect(s.vastBijnaKlaar).toHaveLength(1)
    // 5 van de 30 novemberdagen bevroren.
    expect(s.maandwaarde).toBe(249.17)
  })

  test('opgezegd tijdens een bevriezing: de status opgezegd geldt, de klant loopt tot de laatste dag', () => {
    const k = klant({ status: 'opgezegd', opgezegdOp: '2026-11-05', startdatum: '2026-06-01' })
    expect(isLopend(k, '2026-12-31')).toBe(true)
    expect(isLopend(k, '2027-01-01')).toBe(false)
    expect(vatKlantenSamen([k], VANDAAG)).toMatchObject({ bevroren: 0, maandwaarde: 299 })
  })
})

describe('bevriesLabel', () => {
  const VANDAAG = '2026-11-11'
  test('loopt met einddatum, loopt zonder einddatum, gepland, voorbij', () => {
    expect(bevriesLabel(bevroren('2026-11-01', '2026-12-12'), VANDAAG)).toBe('Bevroren tot 12 dec')
    expect(bevriesLabel(bevroren('2026-11-01', null), VANDAAG)).toBe('Bevroren, einddatum onbekend')
    expect(bevriesLabel(bevroren('2026-12-01', null), VANDAAG)).toBe('Bevroren vanaf 1 dec')
    expect(bevriesLabel(bevroren('2026-12-01', '2026-12-31'), VANDAAG)).toBe('Bevroren vanaf 1 dec tot 31 dec')
    expect(bevriesLabel(bevroren('2026-10-01', '2026-10-31'), VANDAAG)).toBeNull()
    expect(bevriesLabel(klant(), VANDAAG)).toBeNull()
  })

  test('een ander jaar krijgt het jaartal erbij', () => {
    expect(bevriesLabel(bevroren('2026-11-01', '2027-01-15'), VANDAAG)).toBe('Bevroren tot 15 jan 2027')
  })
})

describe('leesKlantInvoer: bevriezing op de systeemgrens', () => {
  const basis = { naam: 'Sanne', club: 'budel', abonnement: '1x', startdatum: '2026-09-01', status: 'bevroren' }

  test('van verplicht, tot mag leeg', () => {
    expect(leesKlantInvoer(basis)).toEqual({ ok: false, fout: 'Vul in vanaf wanneer de klant bevroren is.' })
    const uit = leesKlantInvoer({ ...basis, bevrorenVan: '2026-11-01', bevrorenTot: '' })
    expect(uit.ok && uit.waarde).toMatchObject({ bevrorenVan: '2026-11-01', bevrorenTot: null })
  })

  test('tot voor van, of een ongeldige datum, wordt geweigerd', () => {
    expect(leesKlantInvoer({ ...basis, bevrorenVan: '2026-11-10', bevrorenTot: '2026-11-09' }).ok).toBe(false)
    expect(leesKlantInvoer({ ...basis, bevrorenVan: '2026-11-10', bevrorenTot: '10-11-2026' }).ok).toBe(false)
    expect(leesKlantInvoer({ ...basis, bevrorenVan: 'morgen' }).ok).toBe(false)
  })

  test('bij een andere status vallen de datums weg', () => {
    const uit = leesKlantInvoer({ ...basis, status: 'actief', bevrorenVan: '2026-11-01', bevrorenTot: '2026-11-30' })
    expect(uit.ok && uit.waarde).toMatchObject({ status: 'actief', bevrorenVan: null, bevrorenTot: null })
  })

  test('leesKlant accepteert een oude bevriezing zonder van-datum en laat hem leeg', () => {
    expect(leesKlant({ id: 'x', ...basis })).toMatchObject({ status: 'bevroren', bevrorenVan: null, bevrorenTot: null })
  })
})

describe('dossierTaken volgt de bevriesperiode', () => {
  test('signalen alleen buiten de periode', () => {
    const stand = new Map()
    const k = (van: string, tot: string | null) => [bevroren(van, tot, { startdatum: '2026-10-19' })]
    expect(dossierTaken(k('2026-11-01', null), stand, '2026-11-11')).toHaveLength(0)
    expect(dossierTaken(k('2026-11-01', '2026-11-05'), stand, '2026-11-11').length).toBeGreaterThan(0)
    expect(dossierTaken(k('2026-12-01', null), stand, '2026-11-11').length).toBeGreaterThan(0)
  })
})
