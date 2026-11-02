import { createECDH } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { koppelingenStand } from './koppelingen-stand'

const dienst = (env: Record<string, string>, sleutel: string) => koppelingenStand(env).find((d) => d.sleutel === sleutel)!
const b64u = (b: Buffer) => b.toString('base64url')

describe('koppelingenStand', () => {
  it('zonder instellingen: mail en push staan uit, Stripe en betalen ontbreken', () => {
    const stand = koppelingenStand({})
    expect(stand.map((d) => [d.sleutel, d.stand])).toEqual([
      ['mail_club', 'uit'], ['mail_ayg', 'onvolledig'], ['push', 'uit'], ['stripe_ayg', 'onvolledig'], ['betalen', 'uit'], ['cron', 'onvolledig'],
    ])
  })

  it('mail van Club werkt met schakelaar, sleutel en afzender', () => {
    const d = dienst({ CLUB_MAILS_ACTIEF: '1', CLUB_RESEND_API_KEY: 're_abcdefgh123', CLUB_RESEND_FROM: 'Club <club@aiyourgym.com>' }, 'mail_club')
    expect(d.stand).toBe('werkt')
  })

  it('sleutel en afzender zonder schakelaar: onvolledig, de schakelaar ontbreekt', () => {
    const d = dienst({ CLUB_RESEND_API_KEY: 're_abcdefgh123', CLUB_RESEND_FROM: 'club@aiyourgym.com' }, 'mail_club')
    expect(d.stand).toBe('onvolledig')
    expect(d.instellingen.find((i) => i.naam === 'CLUB_MAILS_ACTIEF')?.stand).toBe('ontbreekt')
  })

  it('een verkeerde vorm heet klopt_niet en toont nooit de waarde', () => {
    const d = dienst({ CLUB_MAILS_ACTIEF: 'ja', CLUB_RESEND_API_KEY: 'geheim-123', CLUB_RESEND_FROM: 'geen adres' }, 'mail_club')
    expect(d.instellingen.map((i) => i.stand)).toEqual(['klopt_niet', 'klopt_niet', 'klopt_niet'])
    expect(JSON.stringify(d)).not.toContain('geheim-123')
  })

  it('push: sleutels die niet bij elkaar horen kloppen niet; een echt paar werkt', () => {
    const a = createECDH('prime256v1'); a.generateKeys()
    const b = createECDH('prime256v1'); b.generateKeys()
    const basis = { CLUB_PUSH_ACTIEF: '1', CLUB_VAPID_SUBJECT: 'mailto:kane@aiyourgym.com' }
    const goed = dienst({ ...basis, CLUB_VAPID_PUBLIC_KEY: b64u(a.getPublicKey()), CLUB_VAPID_PRIVATE_KEY: b64u(a.getPrivateKey()) }, 'push')
    expect(goed.stand).toBe('werkt')
    const fout = dienst({ ...basis, CLUB_VAPID_PUBLIC_KEY: b64u(a.getPublicKey()), CLUB_VAPID_PRIVATE_KEY: b64u(b.getPrivateKey()) }, 'push')
    expect(fout.stand).toBe('onvolledig')
    expect(fout.instellingen.find((i) => i.naam === 'CLUB_VAPID_PRIVATE_KEY')?.stand).toBe('klopt_niet')
  })

  it('Stripe van AI Your Gym: test of live uit de sleutel, alle prijzen nodig', () => {
    const env: Record<string, string> = { AIYOURGYM_STRIPE_SECRET_KEY: 'sk_test_abcdefghijkl', AIYOURGYM_STRIPE_WEBHOOK_SECRET: 'whsec_abcdefghijkl' }
    expect(dienst(env, 'stripe_ayg')).toMatchObject({ stand: 'onvolledig', modus: 'test' })
    for (const p of ['ADMINISTRATIE', 'LESSEN', 'TRAINING', 'AFSPRAKEN', 'TEAM', 'GROEI']) env[`AIYOURGYM_STRIPE_PRIJS_${p}`] = 'price_abcdef123'
    expect(dienst(env, 'stripe_ayg').stand).toBe('werkt')
  })

  it('cron: een van de twee geheimen is genoeg', () => {
    expect(dienst({ CRON_SECRET: 'x' }, 'cron').stand).toBe('werkt')
    expect(dienst({ CLUB_CRON_SECRET: 'y' }, 'cron').stand).toBe('werkt')
  })
})
