import { describe, expect, it } from 'vitest'
import { statussenVoorGroep, type Persoon } from '@/lib/lifeos/crm/crm'
import { bouwOverzicht } from './overzicht'

const VANDAAG = new Date(2026, 6, 20) // 20 juli 2026
const STATUSSEN = statussenVoorGroep('pt_klant') // 'goed' = afspraak_ingepland, actieve_klant

function persoon(over: Partial<Persoon>): Persoon {
  return {
    id: over.id ?? crypto.randomUUID(),
    naam: over.naam ?? 'Test',
    groep: 'pt_klant',
    status: over.status ?? 'moet_benaderen',
    sortering: over.sortering ?? 0,
    followUpDatum: over.followUpDatum ?? null,
    telefoon: over.telefoon ?? null,
    email: over.email ?? null,
    bijzonderheden: over.bijzonderheden ?? null,
    laatsteContactOp: over.laatsteContactOp ?? null,
    aangemaaktOp: over.aangemaaktOp ?? '2026-01-01T00:00:00.000Z',
  }
}

function isoDagenGeleden(n: number): string {
  return new Date(2026, 6, 20 - n, 9).toISOString()
}

describe('bouwOverzicht', () => {
  it('telt totaal, en 0 voor de rest bij een lege lijst', () => {
    expect(bouwOverzicht([], STATUSSEN, VANDAAG)).toEqual({ totaal: 0, opvolgen: 0, actief: 0, koud: 0 })
  })

  it('telt "opvolgen" alleen voor follow-up op of vóór vandaag', () => {
    const ov = bouwOverzicht(
      [
        persoon({ followUpDatum: '2026-07-20' }), // vandaag → telt
        persoon({ followUpDatum: '2026-07-10' }), // te laat → telt
        persoon({ followUpDatum: '2026-07-25' }), // toekomst → niet
        persoon({ followUpDatum: null }), // geen → niet
      ],
      STATUSSEN,
      VANDAAG,
    )
    expect(ov.opvolgen).toBe(2)
  })

  it('telt "actief" alleen voor statussen met tint goed', () => {
    const ov = bouwOverzicht(
      [
        persoon({ status: 'actieve_klant' }),
        persoon({ status: 'afspraak_ingepland' }),
        persoon({ status: 'moet_benaderen' }),
        persoon({ status: 'inactief' }),
      ],
      STATUSSEN,
      VANDAAG,
    )
    expect(ov.actief).toBe(2)
  })

  it('telt "koud" voor lang-geen-contact, niet voor nooit-gesproken', () => {
    const ov = bouwOverzicht(
      [
        persoon({ laatsteContactOp: isoDagenGeleden(40) }), // koud
        persoon({ laatsteContactOp: isoDagenGeleden(5) }), // vers
        persoon({ laatsteContactOp: null }), // nooit → niet koud
      ],
      STATUSSEN,
      VANDAAG,
    )
    expect(ov.koud).toBe(1)
    expect(ov.totaal).toBe(3)
  })
})
