import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  BETALING_GRAAF,
  BETALING_TOESTANDEN,
  bereikbaar,
  betalingOvergang,
  CONTRACT_GRAAF,
  CONTRACT_TOESTANDEN,
  contractOvergang,
  FACTUUR_GRAAF,
  FACTUUR_TOESTANDEN,
  factuurBedragenBevroren,
  factuurOvergang,
  isEindtoestand,
  type BetalingToestand,
} from './overgangen'

describe('betaling', () => {
  it('gaat vooruit, ook met gemiste stappen', () => {
    expect(betalingOvergang('klaar', 'aangeboden')).toEqual({ soort: 'toepassen' })
    expect(betalingOvergang('aangeboden', 'geslaagd')).toEqual({ soort: 'toepassen' })
    expect(betalingOvergang('geslaagd', 'gestorneerd')).toEqual({ soort: 'toepassen' })
    expect(betalingOvergang('gestorneerd', 'storno_teruggedraaid')).toEqual({ soort: 'toepassen' })
  })

  it('negeert een ouder of dubbel bericht', () => {
    expect(betalingOvergang('geslaagd', 'in_behandeling')).toEqual({ soort: 'negeren', reden: 'ouder' })
    expect(betalingOvergang('gestorneerd', 'geslaagd')).toEqual({ soort: 'negeren', reden: 'ouder' })
    expect(betalingOvergang('geslaagd', 'geslaagd')).toEqual({ soort: 'negeren', reden: 'gelijk' })
  })

  it('weigert tegenstrijdige berichten', () => {
    expect(betalingOvergang('geslaagd', 'mislukt').soort).toBe('weigeren')
    expect(betalingOvergang('mislukt', 'geslaagd').soort).toBe('weigeren')
    expect(betalingOvergang('geannuleerd', 'gestorneerd').soort).toBe('weigeren')
  })

  it('elke volgorde van berichten eindigt in dezelfde toestand als de laatste stap op het pad', () => {
    const pad: BetalingToestand[] = ['klaar', 'aangeboden', 'in_behandeling', 'geslaagd', 'gestorneerd', 'storno_teruggedraaid']
    fc.assert(
      fc.property(fc.shuffledSubarray(pad.slice(1), { minLength: 1 }), fc.array(fc.nat(10)), (berichten, dubbel) => {
        const metDubbel = [...berichten, ...dubbel.map((i) => berichten[i % berichten.length])]
        let t: BetalingToestand = 'klaar'
        for (const b of metDubbel) {
          const u = betalingOvergang(t, b)
          expect(u.soort).not.toBe('weigeren')
          if (u.soort === 'toepassen') t = b
        }
        const verste = berichten.reduce((m, b) => (pad.indexOf(b) > pad.indexOf(m) ? b : m), berichten[0])
        expect(t).toBe(verste)
      }),
    )
  })
})

describe('factuur', () => {
  it('volgt 1.5 en bevriest bedragen na concept', () => {
    expect(factuurOvergang('concept', 'definitief')).toEqual({ soort: 'toepassen' })
    expect(factuurOvergang('open', 'deels_betaald')).toEqual({ soort: 'toepassen' })
    expect(factuurOvergang('deels_betaald', 'betaald')).toEqual({ soort: 'toepassen' })
    expect(factuurOvergang('betaald', 'open')).toEqual({ soort: 'negeren', reden: 'ouder' })
    expect(factuurOvergang('betaald', 'oninbaar').soort).toBe('weigeren')
    expect(factuurBedragenBevroren('concept')).toBe(false)
    for (const t of FACTUUR_TOESTANDEN.filter((x) => x !== 'concept')) expect(factuurBedragenBevroren(t)).toBe(true)
  })
})

describe('contract', () => {
  it('pauze heen en terug, opzeggen en stoppen', () => {
    expect(contractOvergang('concept', 'actief')).toEqual({ soort: 'toepassen' })
    expect(contractOvergang('actief', 'gepauzeerd')).toEqual({ soort: 'toepassen' })
    expect(contractOvergang('gepauzeerd', 'actief')).toEqual({ soort: 'toepassen' })
    expect(contractOvergang('gepauzeerd', 'proef')).toEqual({ soort: 'negeren', reden: 'ouder' })
    expect(contractOvergang('opgezegd', 'beeindigd')).toEqual({ soort: 'toepassen' })
    expect(contractOvergang('beeindigd', 'actief')).toEqual({ soort: 'negeren', reden: 'ouder' })
    expect(contractOvergang('gestopt_wegens_achterstand', 'opgezegd').soort).toBe('weigeren')
  })
})

describe('grafen', () => {
  it('kennen alleen eigen toestanden en eindtoestanden zijn doodlopend', () => {
    const grafen = [
      [BETALING_GRAAF, BETALING_TOESTANDEN],
      [FACTUUR_GRAAF, FACTUUR_TOESTANDEN],
      [CONTRACT_GRAAF, CONTRACT_TOESTANDEN],
    ] as const
    for (const [g, lijst] of grafen) {
      const alle = new Set<string>(lijst)
      for (const [van, naar] of Object.entries(g) as [string, readonly string[]][]) {
        expect(alle.has(van)).toBe(true)
        for (const n of naar) expect(alle.has(n)).toBe(true)
      }
    }
    expect(isEindtoestand(BETALING_GRAAF, 'mislukt')).toBe(true)
    expect(bereikbaar(BETALING_GRAAF, 'klaar').has('storno_teruggedraaid')).toBe(true)
  })
})
