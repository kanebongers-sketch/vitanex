// Tests voor de lead-scoring. De kern: de badge verschijnt alleen waar 'ie iets
// zegt (pt_klant in een pipeline-status, niet voor teams of gewonnen klanten), de
// score komt uit échte signalen, en 'ie beweegt monotoon mee met de pipeline-fase.

import { describe, expect, it } from 'vitest'
import type { Groep, Persoon } from './crm'
import { scoorLead } from './leadscore'

// Vaste "vandaag" zodat de test niet van de echte klok afhangt.
const VANDAAG = new Date(2026, 6, 20) // 20 juli 2026 (lokale middernacht)

/** Een ISO-moment n dagen vóór VANDAAG (voor laatsteContactOp). */
function dagenGeleden(n: number): string {
  return new Date(2026, 6, 20 - n, 9, 0, 0).toISOString()
}

function maakPersoon(over: Partial<Persoon> = {}): Persoon {
  return {
    id: 'p1',
    naam: 'Test Prospect',
    groep: 'pt_klant',
    status: 'benaderd',
    sortering: 0,
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: null,
    laatsteContactOp: null,
    aangemaaktOp: dagenGeleden(100),
    ...over,
  }
}

describe('scoorLead — waar hoort de badge niet', () => {
  it('geeft null voor teams (die zijn geen sales-leads)', () => {
    const teams: Groep[] = ['budel_team', 'pt_team']
    for (const groep of teams) {
      expect(scoorLead(maakPersoon({ groep, status: 'actief' }), VANDAAG)).toBeNull()
    }
  })

  it('geeft null voor een actieve klant (al gewonnen)', () => {
    expect(scoorLead(maakPersoon({ status: 'actieve_klant' }), VANDAAG)).toBeNull()
  })

  it('geeft null bij een onbekende/niet-pipeline status', () => {
    expect(scoorLead(maakPersoon({ status: 'zomaar_iets' }), VANDAAG)).toBeNull()
  })
})

describe('scoorLead — de niveaus', () => {
  it('een afspraak met een dringende follow-up en vers contact is heet', () => {
    const lead = scoorLead(
      maakPersoon({
        status: 'afspraak_ingepland',
        followUpDatum: '2026-07-20', // vandaag → dringend
        laatsteContactOp: dagenGeleden(1),
      }),
      VANDAAG,
    )
    expect(lead?.niveau).toBe('heet')
    expect(lead?.reden).toContain('afspraak ingepland')
    expect(lead?.reden).toContain('opvolging vandaag')
    expect(lead?.reden).toContain('recent contact')
  })

  it('een inactieve, lang-niet-gesproken prospect is koud', () => {
    const lead = scoorLead(
      maakPersoon({ status: 'inactief', laatsteContactOp: dagenGeleden(40) }),
      VANDAAG,
    )
    expect(lead?.niveau).toBe('koud')
    expect(lead?.score).toBe(0) // nooit negatief
    expect(lead?.reden).toContain('inactief')
    expect(lead?.reden).toContain('lang niets gehoord')
  })

  it('koud contact drukt ook een gestarte prospect naar koud', () => {
    const lead = scoorLead(
      maakPersoon({ status: 'moet_benaderen', laatsteContactOp: dagenGeleden(45) }),
      VANDAAG,
    )
    expect(lead?.niveau).toBe('koud')
  })

  it('een afspraak zonder verdere signalen is warm, niet meteen heet', () => {
    const lead = scoorLead(maakPersoon({ status: 'afspraak_ingepland' }), VANDAAG)
    expect(lead?.niveau).toBe('warm')
  })

  it('een dringende follow-up tilt een verse benadering naar warm', () => {
    const koel = scoorLead(maakPersoon({ status: 'moet_benaderen' }), VANDAAG)
    const getild = scoorLead(
      maakPersoon({ status: 'moet_benaderen', followUpDatum: '2026-07-19' }), // te laat
      VANDAAG,
    )
    expect(koel?.niveau).toBe('koud')
    expect(getild?.niveau).toBe('warm')
    expect(getild?.score).toBeGreaterThan(koel?.score ?? 0)
  })
})

describe('scoorLead — beweegt mee met de pipeline-fase', () => {
  it('scoort hoger naarmate de prospect verder in de benader-pipeline staat', () => {
    // Zelfde persoon, alleen de fase verschilt: de score moet strikt oplopen.
    const fasen = ['moet_benaderen', 'benaderd', 'wacht_op_reactie', 'afspraak_ingepland']
    const scores = fasen.map((status) => scoorLead(maakPersoon({ status }), VANDAAG)?.score ?? -1)

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1])
    }
  })

  it('geeft een neutrale, klok-onafhankelijke score als vandaag nog onbekend is', () => {
    // Vóór mount (vandaag null) telt alleen de fase — deterministisch, geen
    // hydration-verrassing. afspraak_ingepland = 4 → warm.
    const lead = scoorLead(maakPersoon({ status: 'afspraak_ingepland' }), null)
    expect(lead?.niveau).toBe('warm')
    expect(lead?.score).toBe(4)
  })
})
