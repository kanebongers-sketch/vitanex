import { describe, it, expect } from 'vitest'
import {
  INACTIEF,
  startWerk,
  resterendMs,
  isKlaar,
  voortgang,
  volgendeFase,
  pauzeMinutenNa,
  klokTekst,
  WERK_MINUTEN,
  PAUZE_MINUTEN,
  LANGE_PAUZE_MINUTEN,
} from './focus'

const T0 = 1_800_000_000_000 // een vast moment; de klok komt erín
const MIN = 60_000

describe('resterendMs', () => {
  it('telt af vanaf de starttijd', () => {
    // Arrange
    const s = startWerk(T0)

    // Act + Assert
    expect(resterendMs(s, T0)).toBe(WERK_MINUTEN * MIN)
    expect(resterendMs(s, T0 + 10 * MIN)).toBe(15 * MIN)
  })

  it('geeft null bij inactief, geen 0 — dat betekent iets anders', () => {
    // Arrange/Act/Assert — 0 is "je blok is afgelopen", null is "er loopt
    // niets". Ze samenvoegen zou de UI laten juichen over een blok dat nooit
    // gestart is.
    expect(resterendMs(INACTIEF, T0)).toBeNull()
    expect(resterendMs(INACTIEF, T0)).not.toBe(0)
  })

  it('gaat nooit negatief als de tab lang sliep', () => {
    // Arrange — laptop dicht, twee uur later weer open.
    const s = startWerk(T0)

    // Act
    const rest = resterendMs(s, T0 + 120 * MIN)

    // Assert — "-95 minuten" is geen tijd.
    expect(rest).toBe(0)
  })
})

describe('isKlaar', () => {
  it('is pas klaar op de seconde, niet ervoor', () => {
    const s = startWerk(T0)
    expect(isKlaar(s, T0 + 24 * MIN)).toBe(false)
    expect(isKlaar(s, T0 + WERK_MINUTEN * MIN)).toBe(true)
  })

  it('is nooit klaar als er niets loopt', () => {
    expect(isKlaar(INACTIEF, T0)).toBe(false)
  })
})

describe('voortgang', () => {
  it('loopt van 0 naar 1', () => {
    const s = startWerk(T0)
    expect(voortgang(s, T0)).toBe(0)
    expect(voortgang(s, T0 + 12.5 * MIN)).toBe(0.5)
    expect(voortgang(s, T0 + WERK_MINUTEN * MIN)).toBe(1)
  })

  it('klemt op 1 — een slapende tab geeft geen 3.4', () => {
    const s = startWerk(T0)
    expect(voortgang(s, T0 + 120 * MIN)).toBe(1)
  })

  it('geeft null bij inactief', () => {
    expect(voortgang(INACTIEF, T0)).toBeNull()
  })
})

describe('volgendeFase', () => {
  it('doet niets zolang de fase nog loopt — geen stille doorstart', () => {
    // Arrange
    const s = startWerk(T0)

    // Act
    const na = volgendeFase(s, T0 + 5 * MIN)

    // Assert — je blok is van jou; de timer beslist niet dat je klaar bent.
    expect(na).toBe(s)
  })

  it('gaat van werk naar pauze en houdt vast waar je aan werkte', () => {
    // Arrange
    const s = startWerk(T0, 'LifeOS afmaken')

    // Act
    const na = volgendeFase(s, T0 + WERK_MINUTEN * MIN)

    // Assert
    expect(na.fase).toBe('pauze')
    expect(na.duurMs).toBe(PAUZE_MINUTEN * MIN)
    expect(na.ronde).toBe(1)
    expect(na.waaraan).toBe('LifeOS afmaken')
  })

  it('gaat van pauze naar het volgende werkblok en telt de ronde op', () => {
    // Arrange
    const pauze = volgendeFase(startWerk(T0), T0 + WERK_MINUTEN * MIN)
    const eindePauze = T0 + (WERK_MINUTEN + PAUZE_MINUTEN) * MIN

    // Act
    const na = volgendeFase(pauze, eindePauze)

    // Assert
    expect(na.fase).toBe('werk')
    expect(na.ronde).toBe(2)
  })
})

describe('pauzeMinutenNa', () => {
  it('geeft na de vierde ronde een lange pauze — daarom tellen we ronden', () => {
    expect(pauzeMinutenNa(1)).toBe(PAUZE_MINUTEN)
    expect(pauzeMinutenNa(3)).toBe(PAUZE_MINUTEN)
    expect(pauzeMinutenNa(4)).toBe(LANGE_PAUZE_MINUTEN)
    expect(pauzeMinutenNa(8)).toBe(LANGE_PAUZE_MINUTEN)
  })
})

describe('klokTekst', () => {
  it('vult de seconden aan tot twee cijfers', () => {
    expect(klokTekst(25 * MIN)).toBe('25:00')
    expect(klokTekst(65_000)).toBe('1:05')
    expect(klokTekst(9_000)).toBe('0:09')
  })

  it('toont 0:00 i.p.v. een negatieve klok', () => {
    expect(klokTekst(-5_000)).toBe('0:00')
  })
})
