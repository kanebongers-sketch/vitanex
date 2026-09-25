import { describe, expect, test } from 'vitest'
import { bepaalStatusHints, ptKlantenUit, telMeeVoorPlanning } from './klantstatus'
import type { PtEvent } from './pt-klant'
import type { Persoon } from '@/lib/lifeos/crm/crm'

const NU = new Date('2026-09-25T12:00:00Z')
const DAG = 24 * 60 * 60 * 1000

function persoon(over: Partial<Persoon> = {}): Persoon {
  return {
    id: over.naam ?? 'p',
    naam: 'Naam',
    groep: 'pt_klant',
    status: 'actieve_klant',
    sortering: 0,
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: null,
    laatsteContactOp: null,
    sessiesPerWeek: null,
    locatie: null,
    vakantieTot: null,
    abonnement: null,
    duo: false,
    aangemaaktOp: '2026-01-01T00:00:00Z',
    ...over,
  }
}

function sessie(naam: string, dagenGeleden: number): PtEvent {
  return { titel: `${naam} PT`, startOp: new Date(NU.getTime() - dagenGeleden * DAG).toISOString() }
}

describe('telMeeVoorPlanning', () => {
  test('actieve klant telt altijd mee, ook zonder abonnement', () => {
    expect(telMeeVoorPlanning({ status: 'actieve_klant', abonnement: null })).toBe(true)
  })

  test('inactief telt nooit mee, ook met abonnement', () => {
    expect(telMeeVoorPlanning({ status: 'inactief', abonnement: 'wekelijks_1' })).toBe(false)
  })

  test('prospect telt alleen mee als er een abonnement is ingesteld', () => {
    expect(telMeeVoorPlanning({ status: 'moet_benaderen', abonnement: null })).toBe(false)
    expect(telMeeVoorPlanning({ status: 'afspraak_ingepland', abonnement: 'wekelijks_2' })).toBe(true)
  })
})

describe('ptKlantenUit', () => {
  test('filtert op groep én op meetellen', () => {
    const uit = ptKlantenUit([
      persoon({ naam: 'Kevin', status: 'actieve_klant' }),
      persoon({ naam: 'Nieuw', status: 'moet_benaderen' }),
      persoon({ naam: 'Gestopt', status: 'inactief', abonnement: 'wekelijks_1' }),
      persoon({ naam: 'Teamlid', groep: 'pt_team', status: 'actief' }),
    ])
    expect(uit.map((k) => k.naam)).toEqual(['Kevin'])
  })
})

describe('bepaalStatusHints', () => {
  test('prospect die al traint → voorstel met sessies en leesbaar statuslabel', () => {
    const hints = bepaalStatusHints(
      [persoon({ naam: 'Joris Bax', status: 'moet_benaderen' })],
      [sessie('Joris Bax', 2), sessie('Joris Bax', 8), sessie('Joris Bax', 15)],
      NU,
    )
    expect(hints).toEqual([
      { id: 'Joris Bax', naam: 'Joris Bax', status: 'moet_benaderen', statusLabel: 'Moet benaderen', sessies: 3 },
    ])
  })

  test('één sessie is nog geen klant (kan een intake zijn)', () => {
    expect(bepaalStatusHints([persoon({ naam: 'Iris', status: 'afspraak_ingepland' })], [sessie('Iris', 3)], NU)).toEqual([])
  })

  test('toekomstige boekingen tellen niet als "traint al"', () => {
    expect(
      bepaalStatusHints([persoon({ naam: 'Iris', status: 'benaderd' })], [sessie('Iris', -2), sessie('Iris', -9)], NU),
    ).toEqual([])
  })

  test('actieve en inactieve klanten krijgen nooit een voorstel', () => {
    const events = [sessie('Kevin', 2), sessie('Kevin', 9), sessie('Oud', 2), sessie('Oud', 9)]
    expect(
      bepaalStatusHints(
        [persoon({ naam: 'Kevin', status: 'actieve_klant' }), persoon({ naam: 'Oud', status: 'inactief' })],
        events,
        NU,
      ),
    ).toEqual([])
  })

  test('alleen PT-klanten; meeste sessies eerst', () => {
    const hints = bepaalStatusHints(
      [
        persoon({ naam: 'Anna', status: 'moet_benaderen' }),
        persoon({ naam: 'Bram', status: 'benaderd' }),
        persoon({ naam: 'Coach', groep: 'pt_team', status: 'nieuw' }),
      ],
      [sessie('Anna', 1), sessie('Anna', 5), sessie('Bram', 1), sessie('Bram', 5), sessie('Bram', 9), sessie('Coach', 1), sessie('Coach', 2)],
      NU,
    )
    expect(hints.map((h) => h.naam)).toEqual(['Bram', 'Anna'])
  })
})
