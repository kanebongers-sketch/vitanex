import { describe, expect, test } from 'vitest'
import type { CoachRij } from '@/lib/lifeos/pt-coaching/coach-overzicht'
import { bouwCoachWeek, coachWeekHtml, coachWeekRegels, coachWeekTekst, vorigeWeekZonderVervolg } from './coach-week'
import { bouwWeekmail } from './weekmail'

// Maandag 16 november 2026, 07:00 in Nederland (06:00 UTC).
const NU = new Date('2026-11-16T06:00:00Z')
const LINK = 'https://fitfactorypt.nl/kane/coach'

function rij(over: Partial<CoachRij> & { naam: string }): CoachRij {
  return {
    id: over.naam.toLowerCase(),
    volgendeOp: null,
    laatsteGesprekOp: null,
    afspraken: [],
    verslagen: [],
    openPunten: [],
    opTePakken: { teLaat: [], vandaag: [], zonderPlan: [] },
    ...over,
  }
}

const ingepland = rij({ naam: 'Joey', volgendeOp: '2026-11-18T13:00:00Z', laatsteGesprekOp: '2026-11-11T13:00:00Z' })
const zonderVervolg = rij({ naam: 'Indy', laatsteGesprekOp: '2026-11-12T09:00:00Z' })
const nooit = rij({ naam: 'Damian' })
const volgendeWeek = rij({ naam: 'Bram', volgendeOp: '2026-11-24T09:00:00Z', laatsteGesprekOp: '2026-11-13T09:00:00Z' })

describe('vorigeWeekZonderVervolg', () => {
  test('alleen wie vorige week een gesprek had en geen volgende afspraak heeft', () => {
    // Arrange
    const rijen = [ingepland, zonderVervolg, nooit, volgendeWeek]
    // Act
    const uit = vorigeWeekZonderVervolg(rijen, NU)
    // Assert
    expect(uit.map((r) => r.naam)).toEqual(['Indy'])
  })

  test('een gesprek van twee weken terug telt niet', () => {
    // Arrange
    const oud = rij({ naam: 'Oud', laatsteGesprekOp: '2026-11-04T09:00:00Z' })
    // Act
    const uit = vorigeWeekZonderVervolg([oud], NU)
    // Assert
    expect(uit).toEqual([])
  })
})

describe('bouwCoachWeek', () => {
  test('telt deze week en noemt wie nog niet is ingepland, op naam gesorteerd', () => {
    // Arrange
    const rijen = [ingepland, zonderVervolg, nooit, volgendeWeek]
    // Act
    const blok = bouwCoachWeek(rijen, 'ok', NU, LINK)
    // Assert
    expect(blok).toEqual({
      staat: 'ok',
      dezeWeek: 1,
      totaal: 4,
      nietIngepland: ['Bram', 'Damian', 'Indy'],
      zonderVervolg: ['Indy'],
      link: LINK,
    })
  })

  test('zonder gekoppelde agenda geen tellingen of namen', () => {
    // Act
    const blok = bouwCoachWeek([ingepland, nooit], 'niet_gekoppeld', NU, LINK)
    // Assert
    expect(blok).toEqual({ staat: 'geen_agenda', link: LINK })
    expect(coachWeekRegels(blok)[0]).toContain('niet te lezen')
  })

  test('bij een fout in de agenda een eerlijke melding', () => {
    // Act
    const blok = bouwCoachWeek([ingepland], 'fout', NU, null)
    // Assert
    expect(blok.staat).toBe('fout')
    expect(coachWeekRegels(blok)).toEqual(['De afspraken waren nu niet te lezen. Bekijk de stand op de coachpagina.'])
  })
})

describe('coachWeekRegels en tekst', () => {
  test('noemt x van y, wie nog niet is ingepland en wie geen vervolg heeft', () => {
    // Arrange
    const blok = bouwCoachWeek([ingepland, zonderVervolg, nooit, volgendeWeek], 'ok', NU, LINK)
    // Act
    const tekst = coachWeekTekst(blok).join('\n')
    // Assert
    expect(tekst).toContain('1 van 4 gesprekken deze week ingepland.')
    expect(tekst).toContain('Deze week nog niet ingepland: Bram, Damian, Indy.')
    expect(tekst).toContain('Vorige week een gesprek, nog geen vervolgafspraak: Indy.')
    expect(tekst).toContain(LINK)
  })

  test('iedereen ingepland en niemand zonder vervolg', () => {
    // Arrange
    const blok = bouwCoachWeek([ingepland], 'ok', NU, null)
    // Act
    const regels = coachWeekRegels(blok)
    // Assert
    expect(regels).toEqual(['1 van 1 gesprekken deze week ingepland.', 'Iedereen heeft deze week een gesprek.'])
    expect(coachWeekTekst(blok).join('\n')).not.toContain('coachpagina:')
  })

  test('geen gedachtestreepjes en geen klemtoon-accenten in de tekst', () => {
    // Arrange
    const blokken = [
      bouwCoachWeek([ingepland, zonderVervolg, nooit], 'ok', NU, LINK),
      bouwCoachWeek([], 'ok', NU, LINK),
      bouwCoachWeek([], 'niet_gekoppeld', NU, LINK),
      bouwCoachWeek([], 'fout', NU, LINK),
    ]
    // Act
    const tekst = blokken.map((b) => coachWeekTekst(b).join('\n') + coachWeekHtml(b)).join('\n')
    // Assert
    expect(tekst).not.toMatch(/[–—]| - /)
    expect(tekst).not.toMatch(/[éèëêáàäóòöúùüíìï]/)
  })
})

describe('coachWeekHtml', () => {
  test('ontsnapt namen en zet de link erin', () => {
    // Arrange
    const blok = bouwCoachWeek([rij({ naam: '<b>X</b>' })], 'ok', NU, LINK)
    // Act
    const html = coachWeekHtml(blok)
    // Assert
    expect(html).toContain('&lt;b&gt;X&lt;/b&gt;')
    expect(html).toContain(`href="${LINK}"`)
  })
})

describe('bouwWeekmail met coachblok', () => {
  test('het blok staat in tekst en HTML; zonder blok geen sectie', () => {
    // Arrange
    const basis = { afgerondeTaken: [], koudeContacten: [], zelf: null }
    const blok = bouwCoachWeek([ingepland, nooit], 'ok', NU, LINK)
    // Act
    const met = bouwWeekmail(NU, { ...basis, coachWeek: blok })
    const zonder = bouwWeekmail(NU, basis)
    // Assert
    expect(met.tekst).toContain('COACHGESPREKKEN DEZE WEEK')
    expect(met.html).toContain('Coachgesprekken deze week')
    expect(met.html).toContain(LINK)
    expect(zonder.tekst).not.toContain('COACHGESPREKKEN')
  })
})
