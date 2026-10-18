import { describe, expect, it } from 'vitest'
import { DEMO_SPORTSCHOOL_ID, isEchtAdres, mailBeslissing, nogGeldig, volgendePoging, type MailOntvanger } from './beleid'

const AAN = { actief: true, ingesteld: true }
const lid: MailOntvanger = { organisatieId: 'org-1', organisatieDemo: false, lidDemo: false, rijDemo: false, email: 'Sanne@Gmail.com ', voorkeur: null }

describe('mailBeslissing', () => {
  it('mailt een echt lid als alles aan staat (adres opgeschoond)', () => {
    expect(mailBeslissing('les_geboekt', lid, AAN)).toEqual({ ok: true, email: 'sanne@gmail.com' })
  })

  it('mailt niets zonder schakelaar of zonder sleutel en afzender', () => {
    expect(mailBeslissing('les_geboekt', lid, { actief: false, ingesteld: true }).ok).toBe(false)
    expect(mailBeslissing('les_geboekt', lid, { actief: true, ingesteld: false }).ok).toBe(false)
  })

  it('mailt nooit naar demo-leden of de demo-sportschool', () => {
    expect(mailBeslissing('les_geboekt', { ...lid, lidDemo: true }, AAN).ok).toBe(false)
    expect(mailBeslissing('les_geboekt', { ...lid, rijDemo: true }, AAN).ok).toBe(false)
    expect(mailBeslissing('les_geboekt', { ...lid, organisatieDemo: true }, AAN).ok).toBe(false)
    expect(mailBeslissing('les_geboekt', { ...lid, organisatieId: DEMO_SPORTSCHOOL_ID }, AAN).ok).toBe(false)
  })

  it('mailt niet zonder adres of naar testadressen', () => {
    expect(mailBeslissing('les_geboekt', { ...lid, email: null }, AAN).ok).toBe(false)
    expect(mailBeslissing('les_geboekt', { ...lid, email: 'iemand@example.com' }, AAN).ok).toBe(false)
    expect(isEchtAdres('lid@demo.test')).toBe(false)
    expect(isEchtAdres('geen-adres')).toBe(false)
  })

  it('respecteert de afmelding van het lid', () => {
    const geenHerinneringen = { ...lid, voorkeur: { mails: true, herinneringenPerMail: false } }
    expect(mailBeslissing('les_herinnering', geenHerinneringen, AAN).ok).toBe(false)
    expect(mailBeslissing('les_geboekt', geenHerinneringen, AAN).ok).toBe(true)
    expect(mailBeslissing('les_geboekt', { ...lid, voorkeur: { mails: false, herinneringenPerMail: true } }, AAN).ok).toBe(false)
  })
})

describe('nogGeldig', () => {
  const nu = new Date('2026-10-21T15:00:00.000Z')
  const start = '2026-10-21T17:00:00.000Z'
  const rij = { geplandOp: '2026-10-21T15:00:00.000Z', bronStart: start }

  it('stuurt een lesherinnering alleen als de boeking nog staat', () => {
    expect(nogGeldig('les_herinnering', rij, { status: 'geboekt', start, lesGeannuleerd: false }, nu)).toBe(true)
    expect(nogGeldig('les_herinnering', rij, { status: 'geannuleerd', start }, nu)).toBe(false)
    expect(nogGeldig('les_herinnering', rij, { status: 'geboekt', start, lesGeannuleerd: true }, nu)).toBe(false)
    expect(nogGeldig('les_herinnering', rij, null, nu)).toBe(false)
  })

  it('stuurt geen afspraakherinnering na verplaatsen of na de start', () => {
    expect(nogGeldig('afspraak_herinnering', rij, { status: 'gepland', start }, nu)).toBe(true)
    expect(nogGeldig('afspraak_herinnering', rij, { status: 'gepland', start: '2026-10-22T17:00:00.000Z' }, nu)).toBe(false)
    expect(nogGeldig('afspraak_herinnering', rij, { status: 'gepland', start }, new Date('2026-10-21T17:30:00.000Z'))).toBe(false)
  })

  it('laat een directe melding vallen als hij te lang bleef liggen', () => {
    expect(nogGeldig('les_geboekt', { geplandOp: '2026-10-21T14:00:00.000Z', bronStart: start }, null, nu)).toBe(true)
    expect(nogGeldig('les_geboekt', { geplandOp: '2026-10-19T14:00:00.000Z', bronStart: start }, null, nu)).toBe(false)
  })
})

describe('volgendePoging', () => {
  it('probeert het tot drie keer, een kwartier later', () => {
    const nu = new Date('2026-10-21T15:00:00.000Z')
    expect(volgendePoging(0, nu)).toEqual({ status: 'gepland', op: '2026-10-21T15:15:00.000Z' })
    expect(volgendePoging(1, nu).status).toBe('gepland')
    expect(volgendePoging(2, nu).status).toBe('mislukt')
  })
})
