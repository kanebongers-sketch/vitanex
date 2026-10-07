import { describe, expect, test } from 'vitest'
import { mailNaarTaak, persoonlijkOndanksBulk, schoonOnderwerp } from './regels'
import type { BeoordeeldeMail, MailMeta } from '@/lib/lifeos/inbox/classificeer'

const ONTVANGEN = new Date('2026-10-01T08:00:00Z') // do 1 okt

function mail(over: Partial<MailMeta> = {}, vraagtActie = true): BeoordeeldeMail {
  return {
    mail: {
      id: 'm1', threadId: 't1', afzenderNaam: 'Judith', afzenderAdres: 'judith@example.nl', onderwerp: 'Planning',
      ontvangenOp: ONTVANGEN, aanMij: true, heeftAfmeldlink: false, precedence: null, labels: ['INBOX', 'UNREAD'], ...over,
    },
    oordeel: { vraagtActie, reden: 'test' },
  }
}

describe('mailNaarTaak', () => {
  test('gewone mail → reageren binnen 2 dagen, met Gmail-link en eerlijke uitleg', () => {
    const t = mailNaarTaak(mail())
    expect(t).toMatchObject({ soort: 'reageren', titel: 'Reageren op Judith: Planning', deadline: '2026-10-03', inspanningMinuten: 15 })
    expect(t?.notitie).toContain('https://mail.google.com/mail/u/0/#inbox/m1')
    expect(t?.notitie).toContain('vuistregel')
  })

  test('vraag in het onderwerp → 1 dag; dringend → vandaag', () => {
    expect(mailNaarTaak(mail({ onderwerp: 'Re: Kun je morgen?' }))?.deadline).toBe('2026-10-02')
    expect(mailNaarTaak(mail({ onderwerp: 'Dringend: rooster' }))?.deadline).toBe('2026-10-01')
  })

  test('factuur → 7 dagen, ook van een no-reply-adres; aanmaning → 2 dagen', () => {
    const f = mailNaarTaak(mail({ afzenderNaam: 'KPN', afzenderAdres: 'noreply@kpn.nl', onderwerp: 'Je factuur van oktober' }, false))
    expect(f).toMatchObject({ soort: 'factuur', deadline: '2026-10-08' })
    expect(f?.titel).toBe('Factuur afhandelen: Je factuur van oktober (KPN)')
    expect(mailNaarTaak(mail({ onderwerp: 'Aanmaning factuur 123' }))?.deadline).toBe('2026-10-03')
  })

  test('offerte/contract → 3 dagen', () => {
    expect(mailNaarTaak(mail({ onderwerp: 'Offerte personal training' }))).toMatchObject({ soort: 'offerte', deadline: '2026-10-04' })
  })

  test('gelezen mail telt gewoon mee (je leest op je telefoon)', () => {
    expect(mailNaarTaak(mail({ labels: ['INBOX'] }))?.soort).toBe('reageren')
  })

  test('hypotheekofferte is een offerte', () => {
    expect(mailNaarTaak(mail({ onderwerp: 'Uw hypotheekofferte' }))?.soort).toBe('offerte')
  })

  test('reclame, geen actie, agenda-melding of eigen mail → geen taak', () => {
    expect(mailNaarTaak(mail({ labels: ['UNREAD', 'CATEGORY_PROMOTIONS'], onderwerp: 'Factuur korting!' }))).toBeNull()
    expect(mailNaarTaak(mail({}, false))).toBeNull()
    expect(mailNaarTaak(mail({ onderwerp: 'Uitnodiging: Coachgesprek @ do 2 okt' }))).toBeNull()
    expect(mailNaarTaak(mail({ afzenderNaam: 'MentaForce', afzenderAdres: 'onboarding@resend.dev' }))).toBeNull()
    expect(mailNaarTaak(mail({ afzenderAdres: 'Kane@Gmail.com' }), new Set(['kane@gmail.com']))).toBeNull()
  })

  test('lange onderwerpen worden netjes ingekort', () => {
    const t = mailNaarTaak(mail({ onderwerp: 'a'.repeat(300) }))
    expect(t?.titel.length).toBeLessThanOrEqual(110)
    expect(t?.titel.endsWith('…')).toBe(true)
  })
})

describe('persoonlijk ondanks afmeldlink', () => {
  test('hypotheekofferte en aanvraag aan jou → ja; eerder gemaild in het gesprek → ja', () => {
    expect(persoonlijkOndanksBulk(mail({ onderwerp: 'Hypotheekofferte met algemene voorwaarden' }).mail, false)).toBe(true)
    expect(persoonlijkOndanksBulk(mail({ onderwerp: 'Uw aanvraag hypotheekbescherming' }).mail, false)).toBe(true)
    expect(persoonlijkOndanksBulk(mail({ onderwerp: 'Tot zaterdag' }).mail, true)).toBe(true)
  })
  test('gewone nieuwsbrief of niet aan jou → nee', () => {
    expect(persoonlijkOndanksBulk(mail({ onderwerp: 'Voorkom financiële zorgen' }).mail, false)).toBe(false)
    expect(persoonlijkOndanksBulk(mail({ onderwerp: 'Uw offerte', aanMij: false }).mail, true)).toBe(false)
  })
  test('automatisch antwoord wordt nooit een taak', () => {
    expect(mailNaarTaak(mail({ onderwerp: 'Automatisch antwoord: Uw aanvraag' }))).toBeNull()
  })
})

describe('schoonOnderwerp', () => {
  test('haalt Re:/Fwd:/Antw: weg', () => {
    expect(schoonOnderwerp('Re: Fwd: Antw: Vraag')).toBe('Vraag')
    expect(schoonOnderwerp(null)).toBe('')
  })
})
