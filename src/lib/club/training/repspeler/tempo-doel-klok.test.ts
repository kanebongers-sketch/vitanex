import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { AFSPEEL_SEC_PER_RICHTING, AFSPEEL_TEMPO, EXPLOSIEF_SEC, STANDAARD_TEMPO, leesRepTempo, leesSchemaTempo, secTekst } from './tempo'
import { doelVan } from './doel'
import { herstart, loopt, metSnelheid, nieuweKlok, pauzeer, start, tijdVan } from './klok'
import { planVoor, schemaTempoUitleg } from './plan'
import type { FrameFases } from './typen'

describe('leesRepTempo', () => {
  it('leest de vier tekens uit het schema', () => {
    expect(leesRepTempo('3110')).toEqual({ excentrisch: 3, pauzeGerekt: 1, concentrisch: 1, pauzeSamen: 0 })
    expect(leesRepTempo('3-1-1-0')).toEqual(leesRepTempo('3110'))
    expect(leesRepTempo('3 1 1 0')).toEqual(leesRepTempo('3110'))
  })

  it('X is explosief; een 0 bij een beweging ook', () => {
    expect(leesRepTempo('31x0').concentrisch).toBe(EXPLOSIEF_SEC)
    expect(leesRepTempo('0000').excentrisch).toBe(EXPLOSIEF_SEC)
    expect(leesRepTempo('2X20').pauzeGerekt).toBe(0)
  })

  it('leesSchemaTempo: null bij leeg of onleesbaar', () => {
    expect(leesSchemaTempo('3010')).toEqual({ excentrisch: 3, pauzeGerekt: 0, concentrisch: 1, pauzeSamen: 0 })
    expect(leesSchemaTempo(null)).toBeNull()
    expect(leesSchemaTempo('langzaam')).toBeNull()
  })

  it('leeg of onleesbaar: 2-0-2-0', () => {
    expect(leesRepTempo(null)).toEqual(STANDAARD_TEMPO)
    expect(leesRepTempo('')).toEqual(STANDAARD_TEMPO)
    expect(leesRepTempo('langzaam')).toEqual(STANDAARD_TEMPO)
    expect(leesRepTempo('31100')).toEqual(STANDAARD_TEMPO)
  })

  it('bewegingen duren nooit korter dan explosief', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const t = leesRepTempo(s)
        return t.excentrisch >= EXPLOSIEF_SEC && t.concentrisch >= EXPLOSIEF_SEC && t.pauzeGerekt >= 0 && t.pauzeSamen >= 0
      }),
    )
  })

  it('secTekst', () => {
    expect(secTekst(2)).toBe('2 sec')
    expect(secTekst(1.5)).toBe('1,5 sec')
    expect(secTekst(EXPLOSIEF_SEC)).toBe('explosief')
  })
})

describe('doelVan', () => {
  it('herhalingen: getal, bereik (bovenkant) of standaard', () => {
    expect(doelVan({ soort: 'herhaling', herhalingen: '15', tijdSec: null, repDuur: 4 })).toEqual({ soort: 'herhaling', reps: 15 })
    expect(doelVan({ soort: 'herhaling', herhalingen: '8-10', tijdSec: null, repDuur: 4 })).toEqual({ soort: 'herhaling', reps: 10 })
    expect(doelVan({ soort: 'herhaling', herhalingen: 'AMRAP', tijdSec: null, repDuur: 4 })).toEqual({ soort: 'herhaling', reps: 10 })
  })

  it('herhalingsoefening op tijd: omgerekend met de duur van een herhaling', () => {
    expect(doelVan({ soort: 'herhaling', herhalingen: null, tijdSec: 40, repDuur: 4 })).toEqual({ soort: 'herhaling', reps: 10 })
    expect(doelVan({ soort: 'herhaling', herhalingen: '30 sec', tijdSec: null, repDuur: 3 })).toEqual({ soort: 'herhaling', reps: 10 })
  })

  it('vasthouden: seconden uit tijd of tekst, anders 30', () => {
    expect(doelVan({ soort: 'vasthouden', herhalingen: null, tijdSec: 45, repDuur: 0 })).toEqual({ soort: 'vasthouden', sec: 45 })
    expect(doelVan({ soort: 'vasthouden', herhalingen: '1 min', tijdSec: null, repDuur: 0 })).toEqual({ soort: 'vasthouden', sec: 60 })
    expect(doelVan({ soort: 'vasthouden', herhalingen: null, tijdSec: null, repDuur: 0 })).toEqual({ soort: 'vasthouden', sec: 30 })
  })

  it('altijd een bruikbaar doel', () => {
    fc.assert(
      fc.property(fc.option(fc.string()), fc.option(fc.integer({ min: -10, max: 10000 })), fc.double({ min: 0, max: 20, noNaN: true }), (h, t, d) => {
        const r = doelVan({ soort: 'herhaling', herhalingen: h, tijdSec: t, repDuur: d })
        const v = doelVan({ soort: 'vasthouden', herhalingen: h, tijdSec: t, repDuur: d })
        return r.soort === 'herhaling' && Number.isInteger(r.reps) && r.reps >= 1 && r.reps <= 100 && v.soort === 'vasthouden' && v.sec >= 5 && v.sec <= 600
      }),
    )
  })
})

describe('klok', () => {
  it('loopt, pauzeert en gaat verder waar hij was', () => {
    let k = start(nieuweKlok(), 1000)
    expect(loopt(k)).toBe(true)
    expect(tijdVan(k, 3000)).toBe(2)
    k = pauzeer(k, 3000)
    expect(tijdVan(k, 9000)).toBe(2)
    k = start(k, 10000)
    expect(tijdVan(k, 11000)).toBe(3)
  })

  it('snelheid geldt alleen voor het vervolg', () => {
    let k = start(nieuweKlok(), 0)
    k = metSnelheid(k, 0.5, 2000)
    expect(tijdVan(k, 4000)).toBe(3)
    expect(metSnelheid(nieuweKlok(), 99, 0).snelheid).toBe(2)
  })

  it('herstart: terug naar nul en stil', () => {
    const k = herstart(start(nieuweKlok(0.5), 0))
    expect(k).toEqual({ looptijd: 0, sinds: null, snelheid: 0.5 })
  })

  it('pauzeren en verder gaan verliest of wint nooit tijd', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 5000 }), { minLength: 1, maxLength: 20 }), (stappen) => {
        let k = nieuweKlok()
        let nu = 0
        let verwacht = 0
        stappen.forEach((dt, i) => {
          if (i % 2 === 0) {
            k = start(k, nu)
            nu += dt
            verwacht += dt / 1000
          } else {
            k = pauzeer(k, nu)
            nu += dt
          }
        })
        return Math.abs(tijdVan(k, nu) - verwacht) < 1e-9
      }),
    )
  })
})

describe('planVoor (besluit Kane 29-10-2026: altijd 1 seconde heen, 1 terug)', () => {
  const fases: FrameFases = { rust_begin: [0, 3], heen: [4, 30], houden_ver: [31, 36], terug: [37, 66], rust_eind: [67, 71] }
  const squat = { frames: 72, fps: 24, fases, heenIs: 'excentrisch' as const, soort: 'herhaling' as const }
  const curl = { ...squat, heenIs: 'concentrisch' as const }

  it('15 herhalingen duren 30 seconden, welk tempo het schema ook heeft', () => {
    const p = planVoor(squat, { herhalingen: '15', tijdSec: null, tempo: '2020' })
    expect(p.soort === 'herhaling' && p.reps).toBe(15)
    expect(p.totaal).toBe(30)
  })

  it.each(['1010', '2020', '3010', '4111', 'X', 'XXXX', '31X0', null, ''])('schematempo %s: 1 sec heen, 1 sec terug, geen vastmomenten', (tempo) => {
    for (const render of [squat, curl]) {
      const p = planVoor(render, { herhalingen: '10', tijdSec: null, tempo })
      if (p.soort !== 'herhaling') throw new Error('verwacht herhaling')
      expect(p.segmenten.map((s) => [s.soort, s.duur])).toEqual([
        ['heen', AFSPEEL_SEC_PER_RICHTING],
        ['terug', AFSPEEL_SEC_PER_RICHTING],
      ])
      expect(p.repDuur).toBe(2)
      expect(p.totaal).toBe(20)
    }
  })

  it('elk schematempo geeft precies hetzelfde plan als het afspeeltempo', () => {
    const verwacht = planVoor(squat, { herhalingen: '12', tijdSec: null, tempo: null })
    fc.assert(
      fc.property(fc.string({ maxLength: 8 }), (tempo) => {
        expect(planVoor(squat, { herhalingen: '12', tijdSec: null, tempo })).toEqual(verwacht)
      }),
    )
    expect(AFSPEEL_TEMPO).toEqual({ excentrisch: 1, pauzeGerekt: 0, concentrisch: 1, pauzeSamen: 0 })
  })

  it('tijd in het schema telt herhalingen van 2 seconden', () => {
    const p = planVoor(squat, { herhalingen: null, tijdSec: 40, tempo: '3010' })
    expect(p.soort === 'herhaling' && p.reps).toBe(20)
  })

  it('de tekst toont het schematempo, zonder schematempo het afspeeltempo', () => {
    expect(schemaTempoUitleg(squat, { herhalingen: '10', tijdSec: null, tempo: '3010' })).toBe('3 sec omlaag, 1 sec omhoog')
    expect(schemaTempoUitleg(curl, { herhalingen: '10', tijdSec: null, tempo: '3012' })).toBe('1 sec omhoog, 2 sec vast, 3 sec omlaag')
    expect(schemaTempoUitleg(squat, { herhalingen: '10', tijdSec: null, tempo: null })).toBe('1 sec omlaag, 1 sec omhoog')
    expect(schemaTempoUitleg({ ...squat, soort: 'vasthouden' }, { herhalingen: null, tijdSec: 40, tempo: '3010' })).toBe('40 sec vasthouden')
  })

  it('plank: doeltijd uit het schema', () => {
    const p = planVoor({ frames: 72, fps: 24, fases, heenIs: 'excentrisch', soort: 'vasthouden' }, { herhalingen: null, tijdSec: 40, tempo: null })
    expect(p).toMatchObject({ soort: 'vasthouden', doelSec: 40, totaal: 40 })
  })
})
