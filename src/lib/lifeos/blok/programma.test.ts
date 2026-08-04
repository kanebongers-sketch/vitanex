import { describe, it, expect } from 'vitest'
import {
  BLOK_WEEK,
  BLOK_WEKEN,
  blokWeekVoorDatum,
  dagVoorCode,
  dagVoorWeekdag,
  hyroxRondes,
  isIsolatie,
  isSessieCode,
  pasWeekToe,
  pasWeekToeOpOefening,
  planVoorDatum,
  planVoorSessie,
  weekProfiel,
} from './programma'
import { UPPER_A, LOWER_A, KRACHT_SESSIES } from './kracht-sessies'

// Het programma is de bron van waarheid voor élke sessie; een fout hier verpest
// vier weken training. Daarom testen we niet alleen de functies maar ook de DATA:
// dat elke oefening een werkbare rep-range en een zinnige gewichtsstap heeft.

describe('de weekindeling', () => {
  it('heeft zeven dagen: 4x kracht, 2x cardio, 1x rust', () => {
    expect(BLOK_WEEK).toHaveLength(7)
    expect(BLOK_WEEK.filter((d) => d.soort === 'kracht')).toHaveLength(4)
    expect(BLOK_WEEK.filter((d) => d.soort === 'cardio')).toHaveLength(2)
    expect(BLOK_WEEK.filter((d) => d.soort === 'rust')).toHaveLength(1)
  })

  it('koppelt elke weekdag aan precies één dag van het blok', () => {
    const codes = [0, 1, 2, 3, 4, 5, 6].map((wd) => dagVoorWeekdag(wd)?.code)
    expect(codes).toEqual(['hyrox', 'upper_a', 'lower_a', 'zone2', 'upper_b', 'rust', 'lower_b'])
  })

  it('zet de rustdag tussen de twee zware helften van de week', () => {
    // Vrijdag rust: donderdag Upper B en zaterdag Lower B leunen erop.
    expect(dagVoorWeekdag(5)?.code).toBe('rust')
  })

  it('vindt een dag op zijn code en geeft null bij een onbekende code', () => {
    expect(dagVoorCode('upper_a')?.titel).toBe('Upper A')
    expect(dagVoorCode('bestaat-niet')).toBeNull()
  })

  it('herkent geldige sessie-codes op de systeemgrens', () => {
    expect(isSessieCode('lower_b')).toBe(true)
    expect(isSessieCode('onzin')).toBe(false)
    expect(isSessieCode(42)).toBe(false)
    expect(isSessieCode(null)).toBe(false)
  })
})

describe('de programma-data zelf', () => {
  it('geeft elke krachtsessie werkbare oefeningen', () => {
    for (const sessie of KRACHT_SESSIES) {
      expect(sessie.oefeningen.length).toBeGreaterThanOrEqual(6)
      for (const o of sessie.oefeningen) {
        expect(o.naam.length).toBeGreaterThan(0)
        // Een rep-range moet een range zijn, niet één getal of omgekeerd.
        expect(o.doel.repMin).toBeLessThan(o.doel.repMax)
        expect(o.doel.sets).toBeGreaterThanOrEqual(2)
        // Een stap van 0 zou de progressie-engine laten vastlopen.
        expect(o.doel.stap).toBeGreaterThan(0)
        expect(o.rustSec).toBeGreaterThanOrEqual(30)
        expect(o.doel.rirDoel[0]).toBeLessThanOrEqual(o.doel.rirDoel[1])
      }
    }
  })

  it('houdt compounds van falen af en laat isolatie eraan', () => {
    // De belofte uit de kop van kracht-sessies.ts: intensiteit uit compounds,
    // vermoeidheid uit isolatie. Elke sessie opent met een compound (RIR >= 1).
    for (const sessie of KRACHT_SESSIES) {
      expect(sessie.oefeningen[0]?.doel.rirDoel[0]).toBeGreaterThanOrEqual(1)
      expect(isIsolatie(sessie.oefeningen[0])).toBe(false)
    }
  })

  it('opent elke sessie in een lage rep-range voor krachtbehoud', () => {
    for (const sessie of KRACHT_SESSIES) {
      expect(sessie.oefeningen[0]?.doel.repMax).toBeLessThanOrEqual(10)
    }
  })

  it('houdt het volume per sessie beheerst (tekort = minder herstel)', () => {
    for (const sessie of KRACHT_SESSIES) {
      const sets = sessie.oefeningen.reduce((n, o) => n + o.doel.sets, 0)
      expect(sets).toBeGreaterThanOrEqual(16)
      expect(sets).toBeLessThanOrEqual(28)
    }
  })

  it('geeft de zware compounds echte rust', () => {
    expect(UPPER_A.oefeningen[0]?.rustSec).toBeGreaterThanOrEqual(150)
    expect(LOWER_A.oefeningen[0]?.rustSec).toBeGreaterThanOrEqual(150)
  })
})

describe('blokWeekVoorDatum', () => {
  const start = '2026-08-03' // een maandag

  it('rekent de eerste zeven dagen naar week 1', () => {
    expect(blokWeekVoorDatum(start, '2026-08-03')).toBe(1)
    expect(blokWeekVoorDatum(start, '2026-08-09')).toBe(1)
  })

  it('rolt op de achtste dag door naar week 2', () => {
    expect(blokWeekVoorDatum(start, '2026-08-10')).toBe(2)
  })

  it('kent week 3 en 4', () => {
    expect(blokWeekVoorDatum(start, '2026-08-17')).toBe(3)
    expect(blokWeekVoorDatum(start, '2026-08-24')).toBe(4)
    expect(blokWeekVoorDatum(start, '2026-08-30')).toBe(4)
  })

  it('geeft null buiten het blok — geen stilzwijgende herhaling van week 1', () => {
    expect(blokWeekVoorDatum(start, '2026-08-02')).toBeNull() // vóór de start
    expect(blokWeekVoorDatum(start, '2026-08-31')).toBeNull() // ná week 4
  })

  it('geeft null bij een onbruikbare datum (systeemgrens)', () => {
    expect(blokWeekVoorDatum(start, 'morgen')).toBeNull()
    expect(blokWeekVoorDatum('', '2026-08-03')).toBeNull()
    expect(blokWeekVoorDatum(start, '2026-13-45')).toBeNull()
  })

  it('duurt precies vier weken', () => {
    expect(BLOK_WEKEN).toBe(4)
  })
})

describe('weekmodulatie', () => {
  it('maakt week 1 en 4 rustiger dan week 2 en 3', () => {
    expect(weekProfiel(1).rirOffset).toBe(1)
    expect(weekProfiel(2).rirOffset).toBe(0)
    expect(weekProfiel(3).rirOffset).toBe(0)
    expect(weekProfiel(4).rirOffset).toBe(1)
  })

  it('haalt in week 4 alleen van ISOLATIE een set af, niet van de compounds', () => {
    const bench = UPPER_A.oefeningen[0] // compound
    const isolatie = UPPER_A.oefeningen.find(isIsolatie)
    expect(isolatie).toBeDefined()
    if (!isolatie) return

    expect(pasWeekToeOpOefening(bench, 4).doel.sets).toBe(bench.doel.sets)
    expect(pasWeekToeOpOefening(isolatie, 4).doel.sets).toBe(isolatie.doel.sets - 1)
  })

  it('verschuift het RIR-doel met de week-offset', () => {
    const bench = UPPER_A.oefeningen[0]
    const week1 = pasWeekToeOpOefening(bench, 1)
    const week2 = pasWeekToeOpOefening(bench, 2)

    expect(week1.doel.rirDoel[0]).toBe(bench.doel.rirDoel[0] + 1)
    expect(week2.doel.rirDoel[0]).toBe(bench.doel.rirDoel[0])
  })

  it('houdt sets minimaal 1 en RIR binnen 0-10', () => {
    const eenSet = { ...UPPER_A.oefeningen[0], doel: { ...UPPER_A.oefeningen[0].doel, sets: 1, rirDoel: [0, 0] as const } }
    const week4 = pasWeekToeOpOefening(eenSet, 4)
    expect(week4.doel.sets).toBeGreaterThanOrEqual(1)
    expect(week4.doel.rirDoel[0]).toBeGreaterThanOrEqual(0)
    expect(week4.doel.rirDoel[1]).toBeLessThanOrEqual(10)
  })

  it('muteert het programma niet — de constanten blijven ongemoeid', () => {
    const setsVoor = UPPER_A.oefeningen.map((o) => o.doel.sets)
    const rirVoor = UPPER_A.oefeningen.map((o) => o.doel.rirDoel[0])

    pasWeekToe(UPPER_A, 4)
    pasWeekToe(UPPER_A, 1)

    expect(UPPER_A.oefeningen.map((o) => o.doel.sets)).toEqual(setsVoor)
    expect(UPPER_A.oefeningen.map((o) => o.doel.rirDoel[0])).toEqual(rirVoor)
  })

  it('past de hele sessie in één keer aan', () => {
    const week4 = pasWeekToe(UPPER_A, 4)
    expect(week4.oefeningen).toHaveLength(UPPER_A.oefeningen.length)
    expect(week4.titel).toBe(UPPER_A.titel)
  })
})

describe('hyroxRondes', () => {
  it('bouwt op naar week 3 en houdt week 4 in', () => {
    expect(hyroxRondes(1)).toBe(2)
    expect(hyroxRondes(3)).toBe(3)
    expect(hyroxRondes(4)).toBe(2)
  })
})

describe('planVoorDatum', () => {
  const start = '2026-08-03'

  it('geeft de gemoduleerde sessie van vandaag', () => {
    // Maandag 10 aug = week 2, Upper A.
    const plan = planVoorDatum(start, '2026-08-10', 1)
    expect(plan?.week).toBe(2)
    expect(plan?.dag.code).toBe('upper_a')
    expect(plan?.profiel.naam).toBe('Progressie')
  })

  it('geeft bij Hyrox het aantal rondes van die week mee', () => {
    // Zondag 23 aug = week 3 → 3 rondes.
    const plan = planVoorDatum(start, '2026-08-23', 0)
    expect(plan?.dag.code).toBe('hyrox')
    expect(plan?.rondes).toBe(3)
  })

  it('geeft de rustdag als volwaardige dag terug', () => {
    const plan = planVoorDatum(start, '2026-08-07', 5)
    expect(plan?.dag.code).toBe('rust')
    expect(plan?.dag.soort).toBe('rust')
  })

  it('geeft null buiten het blok', () => {
    expect(planVoorDatum(start, '2026-09-15', 1)).toBeNull()
  })

  it('geeft null bij een onmogelijke weekdag', () => {
    expect(planVoorDatum(start, '2026-08-10', 9)).toBeNull()
  })
})

describe('planVoorSessie — zelf je training kiezen', () => {
  const start = '2026-08-03'

  it('overschrijft het weekschema: Lower B op een rustdag (vrijdag)', () => {
    // Vrijdag 7 aug is normaal rust; je kiest Lower B.
    const plan = planVoorSessie(start, '2026-08-07', 'lower_b')
    expect(plan?.dag.code).toBe('lower_b')
    expect(plan?.week).toBe(1)
  })

  it('behoudt de weekmodulatie uit de datum, niet uit de sessie', () => {
    // Upper A in week 2 → profiel Progressie, ongeacht welke weekdag.
    const plan = planVoorSessie(start, '2026-08-11', 'upper_a')
    expect(plan?.week).toBe(2)
    expect(plan?.profiel.naam).toBe('Progressie')
  })

  it('geeft bij een zelfgekozen Hyrox de rondes van die week', () => {
    const plan = planVoorSessie(start, '2026-08-17', 'hyrox')
    expect(plan?.dag.code).toBe('hyrox')
    expect(plan?.rondes).toBe(hyroxRondes(3))
  })

  it('geeft null bij een onbekende sessiecode', () => {
    expect(planVoorSessie(start, '2026-08-10', 'benchpressen')).toBeNull()
  })

  it('geeft null buiten het blok', () => {
    expect(planVoorSessie(start, '2026-09-15', 'upper_a')).toBeNull()
  })
})
