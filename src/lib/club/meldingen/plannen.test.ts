import { describe, expect, it } from 'vitest'
import { bouwMeldingen, herinnerMoment, sleutelVan, type AfspraakGebeurtenis, type LesGebeurtenis } from './plannen'
import { STANDAARD_INSTELLINGEN, type MeldingInstellingen } from './soorten'

const ontvanger = { voornaam: 'Sanne', sportschool: 'Fit Factory' }
// Woensdag 21 oktober 2026, 19:00 Nederlandse tijd (zomertijd, UTC+2).
const START = '2026-10-21T17:00:00.000Z'
const NU = new Date('2026-10-20T10:00:00.000Z')

function les(soort: LesGebeurtenis['soort'], extra: Partial<LesGebeurtenis> = {}): LesGebeurtenis {
  return {
    soort,
    reserveringId: 'r1',
    geboektOp: '2026-10-20T10:00:00.000Z',
    les: { naam: 'Spinning', start: START, vestigingNaam: 'Budel', instructeur: 'Joyce' },
    ...extra,
  }
}

function afspraak(soort: AfspraakGebeurtenis['soort'], start = START): AfspraakGebeurtenis {
  return { soort, afspraakId: 'a1', afspraak: { typeNaam: 'Intake', start, vestigingNaam: 'Budel', trainer: 'Kane' } }
}

describe('bouwMeldingen', () => {
  it('geeft bij een boeking een bevestiging (app en mail) en een herinnering 2 uur voor de start', () => {
    const rijen = bouwMeldingen(les('les_geboekt'), ontvanger, STANDAARD_INSTELLINGEN, NU)
    expect(rijen.map((r) => `${r.soort}/${r.kanaal}/${r.status}`)).toEqual([
      'les_geboekt/app/verstuurd',
      'les_geboekt/email/gepland',
      'les_herinnering/app/gepland',
      'les_herinnering/email/gepland',
    ])
    expect(rijen[2].gepland_op).toBe('2026-10-21T15:00:00.000Z')
    expect(rijen[0].verstuurd_op).toBe(NU.toISOString())
  })

  it('volgt de herinnertijd van de sportschool', () => {
    const inst: MeldingInstellingen = { ...STANDAARD_INSTELLINGEN, lesHerinneringMin: 30 }
    const rijen = bouwMeldingen(les('les_geboekt'), ontvanger, inst, NU)
    expect(rijen.find((r) => r.soort === 'les_herinnering')?.gepland_op).toBe('2026-10-21T16:30:00.000Z')
  })

  it('plant geen herinnering als dat moment al voorbij is', () => {
    const vlakVoor = new Date('2026-10-21T16:00:00.000Z')
    const rijen = bouwMeldingen(les('les_geboekt'), ontvanger, STANDAARD_INSTELLINGEN, vlakVoor)
    expect(rijen.map((r) => r.soort)).toEqual(['les_geboekt', 'les_geboekt'])
  })

  it('geeft niets voor een les die al begonnen is', () => {
    expect(bouwMeldingen(les('les_geannuleerd'), ontvanger, STANDAARD_INSTELLINGEN, new Date('2026-10-21T17:00:00.000Z'))).toEqual([])
  })

  it('slaat soorten over die uit staan, maar houdt de herinnering als die aan staat', () => {
    const inst: MeldingInstellingen = { ...STANDAARD_INSTELLINGEN, uit: ['les_geboekt'] }
    expect(bouwMeldingen(les('les_geboekt'), ontvanger, inst, NU).map((r) => r.soort)).toEqual(['les_herinnering', 'les_herinnering'])
    const zonderHerinnering: MeldingInstellingen = { ...STANDAARD_INSTELLINGEN, uit: ['les_herinnering'] }
    expect(bouwMeldingen(les('les_geboekt'), ontvanger, zonderHerinnering, NU).map((r) => r.soort)).toEqual(['les_geboekt', 'les_geboekt'])
  })

  it('geeft geen herinnering bij de wachtlijst, afmelding of annulering', () => {
    for (const soort of ['les_wachtlijst', 'les_afgemeld', 'les_geannuleerd'] as const) {
      expect(bouwMeldingen(les(soort), ontvanger, STANDAARD_INSTELLINGEN, NU).every((r) => r.soort === soort)).toBe(true)
    }
  })

  it('plant bij doorschuiven van de wachtlijst ook een herinnering', () => {
    expect(bouwMeldingen(les('les_doorgeschoven'), ontvanger, STANDAARD_INSTELLINGEN, NU).map((r) => r.soort)).toContain('les_herinnering')
  })

  it('herinnert een afspraak standaard een dag van tevoren', () => {
    const rijen = bouwMeldingen(afspraak('afspraak_geboekt', '2026-10-25T09:00:00.000Z'), ontvanger, STANDAARD_INSTELLINGEN, NU)
    expect(rijen.find((r) => r.soort === 'afspraak_herinnering')?.gepland_op).toBe('2026-10-24T09:00:00.000Z')
    expect(rijen.every((r) => r.bron_soort === 'afspraak' && r.bron_id === 'a1')).toBe(true)
  })
})

describe('sleutelVan (ontdubbelen)', () => {
  it('is gelijk voor dezelfde gebeurtenis en anders na opnieuw boeken', () => {
    expect(sleutelVan('les_geboekt', les('les_geboekt'))).toBe(sleutelVan('les_geboekt', les('les_geboekt')))
    expect(sleutelVan('les_geboekt', les('les_geboekt'))).not.toBe(sleutelVan('les_geboekt', les('les_geboekt', { geboektOp: '2026-10-20T11:00:00.000Z' })))
  })

  it('geeft een verplaatste afspraak een nieuwe herinnering', () => {
    const oud = sleutelVan('afspraak_herinnering', afspraak('afspraak_geboekt'))
    const nieuw = sleutelVan('afspraak_herinnering', afspraak('afspraak_verplaatst', '2026-10-22T08:00:00.000Z'))
    expect(oud).not.toBe(nieuw)
  })

  it('stuurt een les-annulering een keer per reservering', () => {
    expect(sleutelVan('les_geannuleerd', les('les_geannuleerd'))).toBe('les_geannuleerd:r1')
  })
})

describe('herinnerMoment', () => {
  it('rekent terug vanaf de start en geeft null als het al voorbij is', () => {
    expect(herinnerMoment(START, 120, NU)?.toISOString()).toBe('2026-10-21T15:00:00.000Z')
    expect(herinnerMoment(START, 120, new Date('2026-10-21T15:00:00.000Z'))).toBeNull()
  })
})
