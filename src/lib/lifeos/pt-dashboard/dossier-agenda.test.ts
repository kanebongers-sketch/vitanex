import { describe, expect, test } from 'vitest'
import { dossierTaakTekst, dossierTaken } from './dossier-agenda'
import type { DossierStand } from './dossier-opslag'
import type { PtKlant } from './abonnementen'

const klant = (id: string, startdatum: string, over: Partial<PtKlant> = {}): PtKlant => ({
  id, naam: id, contact: null, duoPartner: null, club: 'eersel', abonnement: '1x', startdatum, status: 'actief', opgezegdOp: null,
  notitie: null, leadId: null, prijsAfwijkend: null, stopReden: null, ...over,
})
const stand = (over: Partial<DossierStand> = {}): DossierStand => ({ intake: true, startmeting: true, laatsteMeting: '2026-10-05', laatsteSessie: null, ...over })
const VANDAAG = '2026-10-09'

describe('dossierTaken', () => {
  test('check-week, ontbrekende basis en stil dossier; compleet dossier zonder moment valt weg', () => {
    const k = [
      klant('check', '2026-09-14'),          // week 4 → check 1
      klant('nieuw', '2026-10-06'),          // week 1, geen intake/nulmeting
      klant('stil', '2026-08-03'),           // week 10, laatste meting lang geleden
      klant('rustig', '2026-09-28'),         // week 2, alles op orde
      klant('gestopt', '2026-09-14', { status: 'gestopt', opgezegdOp: '2026-10-01' }),
    ]
    const st = new Map<string, DossierStand>([
      ['check', stand()], ['nieuw', stand({ intake: false, startmeting: false, laatsteMeting: null })],
      ['stil', stand({ laatsteMeting: '2026-09-01' })], ['rustig', stand()], ['gestopt', stand({ intake: false })],
    ])
    const uit = dossierTaken(k, st, VANDAAG)
    expect(uit.map((t) => t.klant.id)).toEqual(['check', 'nieuw', 'stil'])
    expect(uit[0].moment?.soort).toBe('check')
    expect(uit[1].signalen).toEqual(['intake_ontbreekt', 'nulmeting_ontbreekt'])
    expect(uit[2].dagenSindsMeting).toBe(38)
  })

  test('teksten', () => {
    const uit = dossierTaken(
      [klant('a', '2026-07-13'), klant('b', '2026-10-13'), klant('c', '2026-08-31')],
      new Map([['a', stand()], ['b', stand({ intake: false, startmeting: false, laatsteMeting: null })], ['c', stand({ laatsteMeting: null })]]),
      VANDAAG,
    )
    const [a, b, c] = ['a', 'b', 'c'].map((id) => uit.find((t) => t.klant.id === id)!)
    expect(dossierTaakTekst(a)).toBe('Week 13 · Eindevaluatie: meting, voor en na, vervolg bespreken')
    expect(dossierTaakTekst(b)).toBe('Start nog niet geweest')
    expect(dossierTaakTekst(c)).toBe('Week 6 · nog niet gemeten')
  })
})

describe('dossierTaken: bevroren klanten', () => {
  test('geen signalen tijdens een blessure (bevroren), ook als het dossier stil is', () => {
    const k = [klant('blessure', '2026-08-03', { status: 'bevroren' })]
    expect(dossierTaken(k, new Map([['blessure', stand({ laatsteMeting: '2026-09-01' })]]), VANDAAG)).toEqual([])
  })
})
