import { describe, expect, test } from 'vitest'
import { planBlokken, teOpruimen, vindPlek, BOUW_TITEL, type BestaandBlok, type TaakKandidaat } from './plan'
import type { Afspraak } from '@/lib/lifeos/agenda/vrije-blokken'
import { opMoment } from './tijd'

// Donderdag 1 oktober 2026, 10:00 in Amsterdam.
const NU = opMoment('2026-10-01', 10)

function taak(over: Partial<TaakKandidaat> = {}): TaakKandidaat {
  return { id: 't1', titel: 'Offerte maken', datum: null, deadline: null, inspanningMinuten: null, top3: false, uitMail: false, ...over }
}
function afspraak(dag: string, van: number, tot: number, titel = 'PT'): Afspraak {
  return { id: `${dag}-${van}`, titel, startOp: opMoment(dag, van), eindOp: opMoment(dag, tot), heleDag: false, locatie: null }
}
function bestaand(over: Partial<BestaandBlok> & { sleutel: string }): BestaandBlok {
  return { soort: 'bouw', taakIds: [], startOp: null, status: 'gepland', ...over }
}
/** Alle bouwblokken al gepland, zodat een test alleen over taken/mail gaat. */
const BOUW_KLAAR: BestaandBlok[] = ['2026-09-28', '2026-10-05'].flatMap((w) => [1, 2].map((n) => bestaand({ sleutel: `bouw:${w}:${n}` })))

describe('vindPlek', () => {
  test('schuift voorbij bezette tijd en rondt af op een kwartier', () => {
    const bezet = [{ van: opMoment('2026-10-01', 8).getTime(), tot: opMoment('2026-10-01', 9, 5).getTime() }]
    expect(vindPlek(bezet, opMoment('2026-10-01', 8), opMoment('2026-10-01', 20), 30)?.toISOString()).toBe(
      opMoment('2026-10-01', 9, 15).toISOString(),
    )
  })
  test('past niet → null', () => {
    expect(vindPlek([], opMoment('2026-10-01', 19, 45), opMoment('2026-10-01', 20), 30)).toBeNull()
  })
})

describe('planBlokken — taken', () => {
  test('taak met een dag krijgt een blok op die dag, met lucht na een afspraak', () => {
    const uit = planBlokken({
      nu: NU,
      afspraken: [afspraak('2026-10-02', 8, 10)],
      taken: [taak({ datum: '2026-10-02' })],
      bestaand: BOUW_KLAAR,
    })
    expect(uit).toHaveLength(1)
    expect(uit[0]).toMatchObject({ soort: 'taak', sleutel: 'taak:t1', titel: 'Taak: Offerte maken', taakIds: ['t1'] })
    expect(uit[0].startOp.toISOString()).toBe(opMoment('2026-10-02', 10, 15).toISOString())
    expect(uit[0].eindOp.getTime() - uit[0].startOp.getTime()).toBe(30 * 60_000)
  })

  test('vandaag niet in het verleden en pas na een kwartier marge', () => {
    const uit = planBlokken({ nu: NU, afspraken: [], taken: [taak({ datum: '2026-10-01' })], bestaand: BOUW_KLAAR })
    expect(uit[0].startOp.toISOString()).toBe(opMoment('2026-10-01', 10, 15).toISOString())
  })

  test('vóór 09:00 wordt vandaag niet gepland (de ochtendplanning gaat voor)', () => {
    const vroeg = opMoment('2026-10-01', 7)
    const uit = planBlokken({ nu: vroeg, afspraken: [], taken: [taak({ datum: '2026-10-01' })], bestaand: BOUW_KLAAR })
    expect(uit).toEqual([])
  })

  test('alleen deadline → eerste dag met ruimte vóór de deadline', () => {
    const vol = [afspraak('2026-10-01', 8, 20)]
    const uit = planBlokken({ nu: NU, afspraken: vol, taken: [taak({ deadline: '2026-10-03' })], bestaand: BOUW_KLAAR })
    expect(uit[0].startOp.toISOString()).toBe(opMoment('2026-10-02', 8).toISOString())
  })

  test('geen dag en geen deadline → geen blok', () => {
    expect(planBlokken({ nu: NU, afspraken: [], taken: [taak()], bestaand: BOUW_KLAAR })).toEqual([])
  })

  test('al eens gepland (ook als jij het weggooide) → nooit opnieuw', () => {
    const uit = planBlokken({
      nu: NU, afspraken: [], taken: [taak({ datum: '2026-10-02' })],
      bestaand: [...BOUW_KLAAR, bestaand({ sleutel: 'taak:t1', soort: 'taak', status: 'opgeruimd' })],
    })
    expect(uit).toEqual([])
  })

  test('maximaal 3 taakblokken per dag', () => {
    const taken = ['a', 'b', 'c', 'd'].map((id) => taak({ id, titel: id, datum: '2026-10-02' }))
    const uit = planBlokken({ nu: NU, afspraken: [], taken, bestaand: BOUW_KLAAR })
    expect(uit).toHaveLength(3)
  })

  test('de vroegste deadline gaat voor', () => {
    const taken = [taak({ id: 'laat', deadline: '2026-10-06' }), taak({ id: 'vroeg', deadline: '2026-10-02' })]
    const uit = planBlokken({ nu: NU, afspraken: [], taken, bestaand: BOUW_KLAAR })
    expect(uit[0].taakIds).toEqual(['vroeg'])
  })
})

describe('planBlokken — mail', () => {
  test('mailtaken worden één gebundeld blok', () => {
    const taken = [taak({ id: 'm1', titel: 'Reageren op Jan', uitMail: true }), taak({ id: 'm2', titel: 'Factuur bepalen', uitMail: true })]
    const uit = planBlokken({ nu: NU, afspraken: [], taken, bestaand: BOUW_KLAAR })
    expect(uit).toHaveLength(1)
    expect(uit[0]).toMatchObject({ soort: 'mail', sleutel: 'mail:2026-10-01', titel: 'Mail afhandelen (2)', taakIds: ['m1', 'm2'] })
    expect(uit[0].beschrijving).toContain('- Reageren op Jan')
  })

  test('al gedekte mailtaken geven geen nieuw blok; vandaag al een mailblok → morgen', () => {
    const taken = [taak({ id: 'm1', uitMail: true }), taak({ id: 'm2', uitMail: true })]
    const uit = planBlokken({
      nu: NU, afspraken: [], taken,
      bestaand: [...BOUW_KLAAR, bestaand({ sleutel: 'mail:2026-10-01', soort: 'mail', taakIds: ['m1'] })],
    })
    expect(uit).toHaveLength(1)
    expect(uit[0]).toMatchObject({ sleutel: 'mail:2026-10-02', taakIds: ['m2'] })
  })
})

describe('planBlokken — bouwblok PT uitbouwen', () => {
  test('2× per werkweek, \'s ochtends, op verschillende dagen', () => {
    const uit = planBlokken({ nu: NU, afspraken: [], taken: [], bestaand: [] }).filter((b) => b.soort === 'bouw')
    const dezeWeek = uit.filter((b) => b.sleutel.startsWith('bouw:2026-09-28'))
    expect(dezeWeek).toHaveLength(2)
    expect(dezeWeek.every((b) => b.titel === BOUW_TITEL)).toBe(true)
    expect(dezeWeek[0].startOp.toISOString()).toBe(opMoment('2026-10-01', 10, 15).toISOString())
    expect(dezeWeek[1].startOp.toISOString()).toBe(opMoment('2026-10-02', 8).toISOString())
    // Volgende week (binnen de horizon van 7 dagen): ma en di.
    expect(uit.filter((b) => b.sleutel.startsWith('bouw:2026-10-05'))).toHaveLength(2)
  })

  test('ochtend vol → de middag', () => {
    const vol = ['2026-10-01', '2026-10-02'].map((d) => afspraak(d, 8, 12))
    const bestaandVolgendeWeek = [1, 2].map((n) => bestaand({ sleutel: `bouw:2026-10-05:${n}` }))
    const uit = planBlokken({ nu: NU, afspraken: vol, taken: [], bestaand: bestaandVolgendeWeek })
    expect(uit[0].startOp.toISOString()).toBe(opMoment('2026-10-01', 12, 15).toISOString())
  })

  test('niet in het weekend', () => {
    const zaterdag = opMoment('2026-10-03', 10)
    const uit = planBlokken({ nu: zaterdag, afspraken: [], taken: [], bestaand: [] })
    expect(uit.every((b) => !b.sleutel.startsWith('bouw:2026-09-28'))).toBe(true)
  })
})

describe('teOpruimen', () => {
  const morgen = opMoment('2026-10-02', 10)
  test('taak af en blok nog niet begonnen → opruimen', () => {
    const b = bestaand({ sleutel: 'taak:t1', soort: 'taak', taakIds: ['t1'], startOp: morgen })
    expect(teOpruimen([b], new Set(), NU)).toEqual([b])
  })
  test('taak nog open, blok al begonnen, of een bouwblok → laten staan', () => {
    const open = bestaand({ sleutel: 'taak:t1', soort: 'taak', taakIds: ['t1'], startOp: morgen })
    const begonnen = bestaand({ sleutel: 'taak:t2', soort: 'taak', taakIds: ['t2'], startOp: opMoment('2026-10-01', 9) })
    const bouw = bestaand({ sleutel: 'bouw:x:1', startOp: morgen })
    expect(teOpruimen([open, begonnen, bouw], new Set(['t1']), NU)).toEqual([])
  })
  test('mailblok pas weg als álle mails af zijn', () => {
    const b = bestaand({ sleutel: 'mail:d', soort: 'mail', taakIds: ['m1', 'm2'], startOp: morgen })
    expect(teOpruimen([b], new Set(['m2']), NU)).toEqual([])
    expect(teOpruimen([b], new Set(), NU)).toEqual([b])
  })
})
