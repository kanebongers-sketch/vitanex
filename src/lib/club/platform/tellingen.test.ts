import { describe, expect, it } from 'vitest'
import {
  aanmeldingPerOrganisatie,
  aanmeldingUitRij,
  isAanvraag,
  isInProef,
  kerncijfers,
  maandBegin,
  maandNaam,
  nieuwsteEerst,
  pakketNaam,
  startStand,
  telActief,
  urenGeleden,
  type PlatformAanmelding,
} from './tellingen'

const ORG_A = '11111111-1111-4111-8111-111111111111'
const ORG_B = '22222222-2222-4222-8222-222222222222'

function aanmelding(deel: Partial<PlatformAanmelding> = {}): PlatformAanmelding {
  return {
    id: 'a1',
    pakket: 'club',
    sportschoolNaam: 'Test Gym',
    slug: 'testgym',
    aantalVestigingen: 1,
    eigenaarNaam: 'Eigenaar',
    eigenaarEmail: 'eigenaar@voorbeeld.nl',
    eigenaarTelefoon: '0612345678',
    status: 'actief',
    organisatieId: ORG_A,
    stripeAbonnementId: 'sub_abc123',
    aangemaaktOp: '2026-10-01T10:00:00.000Z',
    ...deel,
  }
}

describe('maandBegin', () => {
  it('geeft de 1e om middernacht Nederlandse tijd in de zomertijd', () => {
    expect(maandBegin(new Date('2026-10-18T12:00:00Z'))).toBe('2026-09-30T22:00:00.000Z')
  })

  it('geeft de 1e om middernacht Nederlandse tijd in de wintertijd', () => {
    expect(maandBegin(new Date('2026-12-15T12:00:00Z'))).toBe('2026-11-30T23:00:00.000Z')
  })

  it('rekent de nacht van de 1e al tot de nieuwe maand', () => {
    // 31 oktober 23:30 UTC is 1 november 00:30 in Nederland.
    expect(maandBegin(new Date('2026-10-31T23:30:00Z'))).toBe('2026-10-31T23:00:00.000Z')
  })

  it('werkt bij de jaarwisseling', () => {
    expect(maandBegin(new Date('2027-01-01T00:30:00Z'))).toBe('2026-12-31T23:00:00.000Z')
  })
})

describe('urenGeleden en maandNaam', () => {
  it('trekt het aantal uren af', () => {
    expect(urenGeleden(new Date('2026-10-18T12:00:00Z'), 24)).toBe('2026-10-17T12:00:00.000Z')
  })

  it('geeft de Nederlandse maandnaam', () => {
    expect(maandNaam(new Date('2026-10-18T12:00:00Z'))).toBe('oktober')
  })
})

describe('aanmeldingUitRij', () => {
  const rij = {
    id: 'x1',
    pakket: 'start',
    sportschool_naam: 'Gym Noord',
    slug: 'gymnoord',
    aantal_vestigingen: 2,
    eigenaar_naam: 'Sam',
    eigenaar_email: 'sam@voorbeeld.nl',
    eigenaar_telefoon: '0612345678',
    status: 'aanvraag',
    organisatie_id: null,
    stripe_subscription_id: null,
    aangemaakt_op: '2026-10-10T08:00:00Z',
  }

  it('leest een geldige rij', () => {
    expect(aanmeldingUitRij(rij)).toMatchObject({ id: 'x1', sportschoolNaam: 'Gym Noord', status: 'aanvraag', organisatieId: null, stripeAbonnementId: null, aantalVestigingen: 2 })
  })

  it('weigert een onbekende status of geen object', () => {
    expect(aanmeldingUitRij({ ...rij, status: 'kwijt' })).toBeNull()
    expect(aanmeldingUitRij(null)).toBeNull()
    expect(aanmeldingUitRij('rij')).toBeNull()
  })

  it('ziet een abonnement aan het Stripe-id', () => {
    expect(aanmeldingUitRij({ ...rij, status: 'actief', stripe_subscription_id: 'sub_123' })?.stripeAbonnementId).toBe('sub_123')
  })
})

describe('ordenen', () => {
  it('zet de nieuwste eerst en een kapotte datum achteraan', () => {
    const lijst = [aanmelding({ id: 'oud', aangemaaktOp: '2026-09-01T00:00:00Z' }), aanmelding({ id: 'kapot', aangemaaktOp: 'nee' }), aanmelding({ id: 'nieuw', aangemaaktOp: '2026-10-15T00:00:00Z' })]
    expect(nieuwsteEerst(lijst).map((a) => a.id)).toEqual(['nieuw', 'oud', 'kapot'])
  })

  it('kiest per sportschool de nieuwste aanmelding en slaat losse aanvragen over', () => {
    const lijst = [
      aanmelding({ id: 'oud', status: 'opgezegd', aangemaaktOp: '2026-08-01T00:00:00Z' }),
      aanmelding({ id: 'nieuw', status: 'actief', aangemaaktOp: '2026-10-01T00:00:00Z' }),
      aanmelding({ id: 'los', organisatieId: null, status: 'aanvraag' }),
      aanmelding({ id: 'b', organisatieId: ORG_B, status: 'test' }),
    ]
    const per = aanmeldingPerOrganisatie(lijst)
    expect(per.size).toBe(2)
    expect(per.get(ORG_A)?.id).toBe('nieuw')
    expect(per.get(ORG_B)?.id).toBe('b')
  })
})

describe('startStand', () => {
  it('geen voortgang is niet gestart', () => {
    expect(startStand({})).toEqual({ soort: 'niet', klaar: 0, totaal: 9 })
    expect(startStand(null)).toEqual({ soort: 'niet', klaar: 0, totaal: 9 })
  })

  it('telt de stappen die klaar zijn', () => {
    expect(startStand({ start: { stap: 4, klaar: ['welkom', 'huisstijl', 'onzin'], afgerond_op: null } })).toEqual({ soort: 'bezig', klaar: 2, totaal: 9 })
  })

  it('ziet een afgeronde wizard', () => {
    expect(startStand({ start: { stap: 9, klaar: ['welkom'], afgerond_op: '2026-10-12T09:00:00Z' } })).toMatchObject({ soort: 'af', afgerondOp: '2026-10-12T09:00:00Z' })
  })
})

describe('kerncijfers', () => {
  it('telt actieve sportscholen een keer per sportschool', () => {
    const lijst = [aanmelding({ id: '1' }), aanmelding({ id: '2' }), aanmelding({ id: '3', organisatieId: ORG_B, status: 'betaling_mislukt' }), aanmelding({ id: '4', organisatieId: null })]
    expect(telActief(lijst)).toBe(1)
  })

  it('telt aanvragen, support en fouten', () => {
    const lijst = [aanmelding({ id: '1', status: 'aanvraag', organisatieId: null }), aanmelding({ id: '2', status: 'aanvraag', organisatieId: null }), aanmelding({ id: '3' })]
    expect(kerncijfers({ aanmeldingen: lijst, inProef: 1, supportStatussen: ['open', 'bezig', 'open', 'klaar'], fouten24: 4 })).toEqual({
      actief: 1,
      inProef: 1,
      aanvragen: 2,
      supportOpen: 3,
      supportNietOpgepakt: 2,
      fouten24: 4,
    })
  })

  it('laat een telling die niet te lezen was leeg', () => {
    expect(kerncijfers({ aanmeldingen: null, inProef: null, supportStatussen: null, fouten24: null })).toEqual({
      actief: null,
      inProef: null,
      aanvragen: null,
      supportOpen: null,
      supportNietOpgepakt: null,
      fouten24: null,
    })
  })

  it('isAanvraag en isInProef', () => {
    expect(isAanvraag({ status: 'aanvraag' })).toBe(true)
    expect(isAanvraag({ status: 'wacht_op_betaling' })).toBe(false)
    const nu = new Date('2026-10-18T12:00:00Z')
    expect(isInProef(new Date('2026-10-20T00:00:00Z'), nu)).toBe(true)
    expect(isInProef(new Date('2026-10-01T00:00:00Z'), nu)).toBe(false)
    expect(isInProef(null, nu)).toBe(false)
  })

  it('pakketNaam valt terug op de sleutel', () => {
    expect(pakketNaam('onbekend')).toBe('onbekend')
    expect(pakketNaam('')).toBe('Onbekend')
  })
})
