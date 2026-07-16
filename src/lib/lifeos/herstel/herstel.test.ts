import { describe, it, expect } from 'vitest'
import {
  vanWhoop,
  vanOura,
  vanGarmin,
  vanSamsung,
  voegSamen,
  leverancierScoreVergelijkbaar,
  type HerstelMeting,
} from './herstel'

const DATUM = '2026-07-15'

// De testen hieronder bewaken één ding boven alles: dat "ik weet het niet"
// nooit stilletjes een getal wordt. Dat is de bug die MentaForce's readiness
// jarenlang had (een verzonnen 50 als basislijn) — die maken we hier niet na.

describe('bronnen leveren alleen wat ze echt meten', () => {
  it('geeft null voor een veld dat de leverancier niet stuurt — nooit 0', () => {
    // Arrange — een lege payload: de API deed het, maar stuurde niets bruikbaars.
    const leeg = {}

    // Act
    const w = vanWhoop(DATUM, leeg)

    // Assert
    expect(w.hrvMs).toBeNull()
    expect(w.rustHartslag).toBeNull()
    expect(w.leverancierScore).toBeNull()
    expect(w.hrvMs).not.toBe(0)
  })

  it('negeert onzin-waarden i.p.v. ze door te laten als NaN', () => {
    // Arrange — een leverancier die ineens een string stuurt.
    const kapot = { score: { hrv_rmssd_milli: 'veel', recovery_score: null } }

    // Act
    const w = vanWhoop(DATUM, kapot)

    // Assert — geen NaN die verderop in een gemiddelde belandt.
    expect(w.hrvMs).toBeNull()
    expect(Number.isNaN(w.hrvMs as unknown as number)).toBe(false)
  })

  it('leest Whoop recovery en klemt op 0-100', () => {
    // Arrange
    const ruw = { score: { recovery_score: 142, hrv_rmssd_milli: 62, resting_heart_rate: 48 } }

    // Act
    const w = vanWhoop(DATUM, ruw)

    // Assert
    expect(w.leverancierScore).toBe(100)
    expect(w.hrvMs).toBe(62)
    expect(w.rustHartslag).toBe(48)
  })

  it('leidt Whoop-slaapduur af uit stage_summary — anders open je de Whoop-app tóch', () => {
    // Arrange — 8u01 in bed (28.860.000ms), 31 min wakker (1.860.000ms).
    // Dit veld stond ooit hard op null met de comment "komt uit de sleep-call",
    // waardoor een Whoop-only gebruiker nooit zijn slaapduur zag. Dat is de
    // gouden regel van LifeOS breken in één veld.
    const ruw = {
      score: {
        recovery_score: 66,
        stage_summary: {
          total_in_bed_time_milli: 28_860_000,
          total_awake_time_milli: 1_860_000,
        },
      },
    }

    // Act
    const w = vanWhoop(DATUM, ruw)

    // Assert — 27.000.000ms = 450 min = 7u30 daadwerkelijk geslapen.
    expect(w.slaapMinuten).toBe(450)
  })

  it('verzint geen Whoop-slaapduur als één van de twee tijden ontbreekt', () => {
    // Arrange — alleen "in bed". Dat alleen gebruiken zou wakker liggen als
    // slaap tellen: een te gunstig getal, en dus een onwaar getal.
    const ruw = { score: { stage_summary: { total_in_bed_time_milli: 28_860_000 } } }

    // Act
    const w = vanWhoop(DATUM, ruw)

    // Assert
    expect(w.slaapMinuten).toBeNull()
  })

  it('leest Whoops EFFICIENCY, niet zijn PERFORMANCE, in slaapEfficientie', () => {
    // Arrange — Whoop heeft twee cijfers die op elkaar lijken:
    //   performance = geslapen t.o.v. je BEHOEFTE
    //   efficiency  = geslapen t.o.v. tijd IN BED   ← wat slaapEfficientie belooft
    // Ze verschillen hier bewust, zodat de test faalt als iemand de verkeerde
    // sleutel terugzet. Dan toont de UI een cijfer dat iets anders betekent
    // dan het label ernaast.
    const ruw = {
      score: {
        sleep_efficiency_percentage: 91.7,
        sleep_performance_percentage: 89,
      },
    }

    // Act
    const w = vanWhoop(DATUM, ruw)

    // Assert
    expect(w.slaapEfficientie).toBe(91.7)
    expect(w.slaapEfficientie).not.toBe(89)
  })

  it('rekent Oura-slaap van seconden naar minuten', () => {
    // Arrange — 7u30m = 27000s
    const ruw = { total_sleep_duration: 27_000, score: 81, average_hrv: 55 }

    // Act
    const o = vanOura(DATUM, ruw)

    // Assert
    expect(o.slaapMinuten).toBe(450)
    expect(o.leverancierScore).toBe(81)
  })

  it('geeft Samsung geen leverancierScore — die meet hij niet', () => {
    // Arrange — Samsung levert in de praktijk alleen slaap.
    const ruw = { start_time: 1_700_000_000_000, end_time: 1_700_027_000_000 }

    // Act
    const s = vanSamsung(DATUM, ruw)

    // Assert
    expect(s.leverancierScore).toBeNull()
    expect(s.slaapMinuten).toBeGreaterThan(0)
    expect(s.hrvMs).toBeNull()
  })

  it('verzint geen slaapduur als Samsung een onmogelijk venster stuurt', () => {
    // Arrange — eind vóór start.
    const ruw = { start_time: 1_700_027_000_000, end_time: 1_700_000_000_000 }

    // Act
    const s = vanSamsung(DATUM, ruw)

    // Assert
    expect(s.slaapMinuten).toBeNull()
  })
})

describe('body battery is geen herstelscore', () => {
  it('markeert Garmin als niet-vergelijkbaar', () => {
    expect(leverancierScoreVergelijkbaar('garmin')).toBe(false)
    expect(leverancierScoreVergelijkbaar('whoop')).toBe(true)
    expect(leverancierScoreVergelijkbaar('oura')).toBe(true)
    expect(leverancierScoreVergelijkbaar('samsung')).toBe(false)
  })

  it('laat Garmins body battery nooit als herstel de samenvoeging in', () => {
    // Arrange — Garmin is de ENIGE bron, met een lage avond-body-battery.
    // Die als "slecht herstel" lezen zou elke avond vals alarm geven.
    const garmin = vanGarmin(DATUM, {
      bodyBatteryMostRecentValue: 12,
      restingHeartRateInBeatsPerMinute: 52,
    })

    // Act
    const samen = voegSamen([garmin])

    // Assert — de échte meting blijft, het budget-cijfer niet.
    expect(samen?.rustHartslag).toBe(52)
    expect(samen?.leverancierScore).toBeNull()
  })
})

describe('voegSamen', () => {
  it('geeft null bij geen enkele meting', () => {
    expect(voegSamen([])).toBeNull()
  })

  it('neemt per veld de beste bron die het écht heeft', () => {
    // Arrange — Whoop meet HRV maar geen slaap; Samsung alleen slaap.
    const whoop: HerstelMeting = {
      bron: 'whoop', datum: DATUM, hrvMs: 64, rustHartslag: 47,
      slaapMinuten: null, slaapEfficientie: null, leverancierScore: 78,
    }
    const samsung: HerstelMeting = {
      bron: 'samsung', datum: DATUM, hrvMs: null, rustHartslag: null,
      slaapMinuten: 421, slaapEfficientie: 91, leverancierScore: null,
    }

    // Act
    const samen = voegSamen([samsung, whoop])

    // Assert — geen gemiddelde tussen ongelijksoortige bronnen; per veld de echte.
    expect(samen?.hrvMs).toBe(64)          // van Whoop
    expect(samen?.slaapMinuten).toBe(421)  // van Samsung
    expect(samen?.leverancierScore).toBe(78)
    expect(samen?.bron).toBe('whoop')      // hoogste rang leidt
  })

  it('laat handmatige invoer een sensor overrulen', () => {
    // Arrange — jij weet dat je wearable ernaast zat.
    const garmin: HerstelMeting = {
      bron: 'garmin', datum: DATUM, hrvMs: 30, rustHartslag: 70,
      slaapMinuten: 300, slaapEfficientie: null, leverancierScore: 40,
    }
    const handmatig: HerstelMeting = {
      bron: 'handmatig', datum: DATUM, hrvMs: null, rustHartslag: null,
      slaapMinuten: 480, slaapEfficientie: null, leverancierScore: null,
    }

    // Act
    const samen = voegSamen([garmin, handmatig])

    // Assert — jouw slaap wint; Garmins HRV blijft want jij vulde die niet in.
    expect(samen?.slaapMinuten).toBe(480)
    expect(samen?.hrvMs).toBe(30)
  })

  it('houdt alles null als geen enkele bron iets meet', () => {
    // Arrange — twee gekoppelde wearables die vandaag niets stuurden.
    const leegA = vanWhoop(DATUM, {})
    const leegB = vanSamsung(DATUM, {})

    // Act
    const samen = voegSamen([leegA, leegB])

    // Assert — "niets gemeten" is een antwoord, geen 0.
    expect(samen).not.toBeNull()
    expect(samen?.hrvMs).toBeNull()
    expect(samen?.slaapMinuten).toBeNull()
    expect(samen?.leverancierScore).toBeNull()
  })
})
