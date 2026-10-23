import { describe, expect, it } from 'vitest'
import {
  AANVRAAG_MAX_PER_ADRES, AANVRAAG_MAX_PER_IP, PER_RONDE, RONDE_MS, aanvraagSleutel, duurTekst, exactPatroon, leesAanvraag, leesSportschoolSleutel,
  leesUitnodigInvoer, linkTekst, mailKlaar, normaliseerEmail, posterDoel, remHash, remOordeel, selecteer, spreidMoment, uitnodigBlokkade,
  uitnodigingSleutel, uitnodigingTekst, type Kandidaat,
} from './regels'

const ID = '11111111-1111-4111-8111-111111111111'

describe('aanvraag lezen', () => {
  it('maakt het adres schoon en weigert onzin', () => {
    expect(normaliseerEmail('  Sanne@Voorbeeld.NL ')).toBe('sanne@voorbeeld.nl')
    expect(normaliseerEmail('geen adres')).toBeNull()
    expect(normaliseerEmail(42)).toBeNull()
    expect(normaliseerEmail(`${'a'.repeat(250)}@x.nl`)).toBeNull()
  })

  it('herkent een robot aan het honingpotveld', () => {
    expect(leesAanvraag({ email: 'a@b.nl', website: 'http://spam' })).toEqual({ soort: 'robot' })
    expect(leesAanvraag({ email: 'a@b.nl', website: '' })).toEqual({ soort: 'ok', email: 'a@b.nl', sportschool: null })
    expect(leesAanvraag({ email: 'x' })).toEqual({ soort: 'ongeldig' })
    expect(leesAanvraag(null)).toEqual({ soort: 'ongeldig' })
  })

  it('leest de sportschool als slug of id', () => {
    expect(leesSportschoolSleutel('budel-gym')).toEqual({ kolom: 'slug', waarde: 'budel-gym' })
    expect(leesSportschoolSleutel(ID.toUpperCase())).toEqual({ kolom: 'id', waarde: ID })
    expect(leesSportschoolSleutel(['testgym'])).toEqual({ kolom: 'slug', waarde: 'testgym' })
    expect(leesSportschoolSleutel('www')).toBeNull()
    expect(leesSportschoolSleutel('a')).toBeNull()
    expect(leesAanvraag({ email: 'a@b.nl', s: 'testgym' })).toEqual({ soort: 'ok', email: 'a@b.nl', sportschool: { kolom: 'slug', waarde: 'testgym' } })
  })

  it('zoekt het adres letterlijk (geen jokers)', () => {
    expect(exactPatroon('a_b%c\\d@x.nl')).toBe('a\\_b\\%c\\\\d@x.nl')
  })
})

describe('de rem', () => {
  it('stopt na drie per adres en na tien per IP', () => {
    expect(remOordeel(0, 0)).toBe('ok')
    expect(remOordeel(AANVRAAG_MAX_PER_ADRES - 1, 0)).toBe('ok')
    expect(remOordeel(AANVRAAG_MAX_PER_ADRES, 0)).toBe('adres')
    expect(remOordeel(0, AANVRAAG_MAX_PER_IP)).toBe('ip')
  })

  it('bewaart alleen hashes, per soort anders', () => {
    const h = remHash('email', 'a@b.nl')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(h).not.toBe(remHash('ip', 'a@b.nl'))
    expect(remHash('email', 'a@b.nl')).toBe(h)
  })
})

describe('uitnodigen', () => {
  const lid = (id: string, extra: Partial<Kandidaat> = {}): Kandidaat => ({ id, voornaam: 'Sanne', vestiging: 'budel', status: 'actief', email: `${id}@fitfactory.nl`, demo: false, ...extra })

  it('leest alleen toegestane vestigingen', () => {
    expect(leesUitnodigInvoer({ vestigingen: ['budel', 'budel'] }, ['budel'])).toEqual({ ok: true, waarde: { vestigingen: ['budel'], alleenZonderApp: true } })
    expect(leesUitnodigInvoer({ vestigingen: ['eersel'], alleenZonderApp: false }, ['budel']).ok).toBe(false)
    expect(leesUitnodigInvoer({ vestigingen: [] }, ['budel']).ok).toBe(false)
    expect(leesUitnodigInvoer({ vestigingen: ['budel'], alleenZonderApp: false }, ['budel'])).toEqual({ ok: true, waarde: { vestigingen: ['budel'], alleenZonderApp: false } })
  })

  it('selecteert en telt wie niet mee kan', () => {
    const leden = [
      lid('a'),
      lid('b', { email: null }),
      lid('c', { email: 'c@example.com' }),
      lid('d'),
      lid('e', { demo: true }),
      lid('f', { status: 'gestopt' }),
      lid('g', { vestiging: 'eersel' }),
      lid('h'),
    ]
    const s = selecteer(leden, { vestigingen: ['budel'], alleenZonderApp: true }, new Set(['d']), new Set(['h']))
    expect(s.teSturen.map((l) => l.id)).toEqual(['a'])
    expect(s).toMatchObject({ zonderEmail: 2, heeftApp: 1, afgemeld: 1, demo: 1 })
    const ook = selecteer(leden, { vestigingen: ['budel'], alleenZonderApp: false }, new Set(['d']), new Set())
    expect(ook.teSturen.map((l) => l.id)).toEqual(['a', 'd', 'h'])
  })

  it('ontdubbelt per lid per dag in Nederlandse tijd', () => {
    expect(uitnodigingSleutel('x', new Date('2026-10-18T21:59:00Z'))).toBe('app_uitnodiging:x:2026-10-18')
    expect(uitnodigingSleutel('x', new Date('2026-10-18T22:01:00Z'))).toBe('app_uitnodiging:x:2026-10-19')
    expect(aanvraagSleutel('x', 'y')).toBe('app_link:x:y')
  })

  it('spreidt de mails over de rondes van de cron', () => {
    const nu = new Date('2026-10-18T10:00:00Z')
    expect(spreidMoment(0, nu).getTime()).toBe(nu.getTime())
    expect(spreidMoment(PER_RONDE - 1, nu).getTime()).toBe(nu.getTime())
    expect(spreidMoment(PER_RONDE, nu).getTime()).toBe(nu.getTime() + RONDE_MS)
    expect(spreidMoment(-3, nu).getTime()).toBe(nu.getTime())
  })

  it('zegt hoe lang het versturen duurt', () => {
    expect(duurTekst(0)).toBe('Er is niets te versturen.')
    expect(duurTekst(20)).toContain('paar minuten')
    expect(duurTekst(200)).toContain('35 minuten')
    expect(duurTekst(1000)).toContain('2,8 uur')
  })

  it('blokkeert bij demo, dichte app of zonder mail', () => {
    const basis = { ledenLoginAan: true, appModuleAan: true, demo: false, mailKlaar: true }
    expect(uitnodigBlokkade(basis)).toBeNull()
    expect(uitnodigBlokkade({ ...basis, demo: true })).toBe('demo')
    expect(uitnodigBlokkade({ ...basis, ledenLoginAan: false })).toBe('ledenapp_dicht')
    expect(uitnodigBlokkade({ ...basis, appModuleAan: false })).toBe('module_uit')
    expect(uitnodigBlokkade({ ...basis, mailKlaar: false })).toBe('mails_uit')
  })

  it('weet of mailen kan', () => {
    expect(mailKlaar({ CLUB_MAILS_ACTIEF: '1', CLUB_RESEND_API_KEY: 'k', CLUB_RESEND_FROM: 'a@b.nl' })).toBe(true)
    expect(mailKlaar({ CLUB_MAILS_ACTIEF: '0', CLUB_RESEND_API_KEY: 'k', CLUB_RESEND_FROM: 'a@b.nl' })).toBe(false)
    expect(mailKlaar({ CLUB_MAILS_ACTIEF: '1', CLUB_RESEND_API_KEY: ' ', CLUB_RESEND_FROM: 'a@b.nl' })).toBe(false)
  })
})

describe('teksten', () => {
  it('zijn persoonlijk, zonder link en zonder gedachtestreepjes', () => {
    for (const t of [uitnodigingTekst('Sanne', 'Fit Factory'), linkTekst('Sanne', 'Fit Factory')]) {
      expect(t.mail.startsWith('Hoi Sanne,')).toBe(true)
      expect(t.onderwerp).toContain('Fit Factory')
      expect(t.mail).not.toMatch(/[–—]| - |https?:/)
      expect(t.mail).not.toMatch(/[éèëáóú]/)
    }
    expect(linkTekst('', 'X').mail.startsWith('Hoi daar,')).toBe(true)
  })
})

describe('poster', () => {
  it('wijst naar het subdomein of naar de aanvraagpagina met de sportschool', () => {
    expect(posterDoel({ id: ID, slug: 'budel' }, true, 'aiyourgym.com', 'https://fitfactorypt.nl')).toBe('https://budel.aiyourgym.com/mijn/aanvragen')
    expect(posterDoel({ id: ID, slug: 'budel' }, false, 'aiyourgym.com', 'https://fitfactorypt.nl/')).toBe('https://fitfactorypt.nl/mijn/aanvragen?s=budel')
    expect(posterDoel({ id: ID, slug: null }, true, 'aiyourgym.com', 'https://fitfactorypt.nl')).toBe(`https://fitfactorypt.nl/mijn/aanvragen?s=${ID}`)
  })
})
