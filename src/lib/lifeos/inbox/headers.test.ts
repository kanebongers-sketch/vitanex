import { describe, expect, test } from 'vitest'
import {
  adressenIn,
  bevatAdres,
  leesAfzender,
  leesHeader,
  leesMailMeta,
  normaliseerAdres,
  type Header,
} from './headers'

describe('leesHeader', () => {
  const headers: Header[] = [
    { name: 'From', value: 'jan@example.nl' },
    { name: 'subject', value: 'Hallo' },
    { name: 'X-Leeg', value: '   ' },
  ]

  test('vindt een header', () => {
    expect(leesHeader(headers, 'From')).toBe('jan@example.nl')
  })

  test('is hoofdletterongevoelig — Gmail is niet consequent', () => {
    expect(leesHeader(headers, 'Subject')).toBe('Hallo')
    expect(leesHeader(headers, 'FROM')).toBe('jan@example.nl')
  })

  test('een header die er niet is, is null', () => {
    expect(leesHeader(headers, 'List-Unsubscribe')).toBeNull()
  })

  test('een lege header telt als afwezig', () => {
    // Anders is `heeftAfmeldlink` true op een lege List-Unsubscribe.
    expect(leesHeader(headers, 'X-Leeg')).toBeNull()
  })
})

describe('adressenIn', () => {
  test('haalt één adres uit punthaken', () => {
    expect(adressenIn('Jan Jansen <jan@example.nl>')).toEqual(['jan@example.nl'])
  })

  test('haalt meerdere adressen uit een lijst', () => {
    expect(adressenIn('jan@example.nl, Piet <piet@example.nl>')).toEqual([
      'jan@example.nl',
      'piet@example.nl',
    ])
  })

  test('trapt niet in een komma in een aangehaalde naam', () => {
    // `"Jansen, Jan" <jan@x.nl>` — splitsen op komma zou hier twee kapotte
    // adressen opleveren. Vandaar dat we tokens zoeken i.p.v. te splitsen.
    expect(adressenIn('"Jansen, Jan" <jan@example.nl>, piet@example.nl')).toEqual([
      'jan@example.nl',
      'piet@example.nl',
    ])
  })

  test('geen adressen levert een lege lijst', () => {
    expect(adressenIn('undisclosed-recipients:;')).toEqual([])
  })
})

describe('normaliseerAdres', () => {
  test('maakt kleine letters', () => {
    expect(normaliseerAdres('Jan@Example.NL')).toBe('jan@example.nl')
  })

  test('haalt de +tag eraf', () => {
    expect(normaliseerAdres('kane+lifeos@example.nl')).toBe('kane@example.nl')
  })

  test('negeert punten bij gmail.com', () => {
    expect(normaliseerAdres('k.a.n.e@gmail.com')).toBe('kane@gmail.com')
  })

  test('negeert punten ook bij googlemail.com', () => {
    expect(normaliseerAdres('k.a.n.e@googlemail.com')).toBe('kane@googlemail.com')
  })

  test('behoudt punten op een eigen domein', () => {
    // Cruciaal: op een eigen domein kan `jan.jansen@` een ander mens zijn dan
    // `janjansen@`. Die samenvoegen zou post van een collega aan jou toewijzen.
    expect(normaliseerAdres('jan.jansen@bedrijf.nl')).toBe('jan.jansen@bedrijf.nl')
  })

  test('laat iets dat geen adres is met rust', () => {
    expect(normaliseerAdres('undisclosed-recipients')).toBe('undisclosed-recipients')
  })
})

describe('bevatAdres', () => {
  test('vindt je adres in de aan', () => {
    expect(bevatAdres('kane@example.nl, jan@example.nl', 'kane@example.nl')).toBe(true)
  })

  test('vindt je adres met een +tag', () => {
    // Het fout-negatief dat je nooit zou merken: zonder normalisatie valt deze
    // mail door de cc-regel en verdwijnt hij uit je triage.
    expect(bevatAdres('kane+nieuwsbrief@example.nl', 'kane@example.nl')).toBe(true)
  })

  test('vindt je gmail-adres met punten', () => {
    expect(bevatAdres('k.a.n.e@gmail.com', 'kane@gmail.com')).toBe(true)
  })

  test('vindt je adres tussen punthaken met naam', () => {
    expect(bevatAdres('Kane Bongers <kane@example.nl>', 'kane@example.nl')).toBe(true)
  })

  test('een ander adres is niet jouw adres', () => {
    expect(bevatAdres('jan@example.nl', 'kane@example.nl')).toBe(false)
  })

  test('geen header is niet gevonden', () => {
    expect(bevatAdres(null, 'kane@example.nl')).toBe(false)
  })

  test('een adres dat jouw adres bevat maar niet is, telt niet', () => {
    // Substring-vergelijking zou hier true zeggen. Dat is een echte bug:
    // `nietkane@example.nl` bevat `kane@example.nl` niet als adres.
    expect(bevatAdres('nietkane@example.nl', 'kane@example.nl')).toBe(false)
  })
})

describe('leesAfzender', () => {
  test('splitst naam en adres', () => {
    expect(leesAfzender('Jan Jansen <jan@example.nl>')).toEqual({
      naam: 'Jan Jansen',
      adres: 'jan@example.nl',
    })
  })

  test('haalt de aanhalingstekens van de naam', () => {
    expect(leesAfzender('"Jansen, Jan" <jan@example.nl>')).toEqual({
      naam: 'Jansen, Jan',
      adres: 'jan@example.nl',
    })
  })

  test('een kaal adres heeft geen naam', () => {
    expect(leesAfzender('jan@example.nl')).toEqual({ naam: null, adres: 'jan@example.nl' })
  })

  test('punthaken zonder naam', () => {
    expect(leesAfzender('<jan@example.nl>')).toEqual({ naam: null, adres: 'jan@example.nl' })
  })

  test('geen From-header', () => {
    expect(leesAfzender(null)).toEqual({ naam: null, adres: null })
  })

  test('onzin zonder @ is geen adres', () => {
    // Liever null dan een "adres" dat later een no-reply-check verpest.
    expect(leesAfzender('Mailer Daemon')).toEqual({ naam: null, adres: null })
  })
})

describe('leesMailMeta', () => {
  const ontvangen = new Date('2026-07-16T09:00:00Z')

  test('bouwt de metadata uit de headers', () => {
    // Arrange
    const headers: Header[] = [
      { name: 'From', value: 'Jan Jansen <jan@example.nl>' },
      { name: 'To', value: 'kane@example.nl' },
      { name: 'Subject', value: 'Voorstel' },
    ]

    // Act
    const meta = leesMailMeta('m1', 't1', headers, ['INBOX', 'UNREAD'], ontvangen, 'kane@example.nl')

    // Assert
    expect(meta).toEqual({
      id: 'm1',
      threadId: 't1',
      afzenderNaam: 'Jan Jansen',
      afzenderAdres: 'jan@example.nl',
      onderwerp: 'Voorstel',
      ontvangenOp: ontvangen,
      aanMij: true,
      heeftAfmeldlink: false,
      precedence: null,
      labels: ['INBOX', 'UNREAD'],
    })
  })

  test('draagt de thread-id mee', () => {
    // Zonder deze reist de thread-id niet naar het concept, en komt een
    // AI-antwoord los te staan i.p.v. ónder het gesprek.
    const meta = leesMailMeta('m1', 'thread-42', [], [], ontvangen, 'kane@example.nl')

    expect(meta.threadId).toBe('thread-42')
  })

  test('ziet een afmeldlink', () => {
    const headers: Header[] = [{ name: 'List-Unsubscribe', value: '<https://x.nl/uit>' }]

    const meta = leesMailMeta('m1', 't1', headers, [], ontvangen, 'kane@example.nl')

    expect(meta.heeftAfmeldlink).toBe(true)
  })

  test('leest Precedence', () => {
    const headers: Header[] = [{ name: 'Precedence', value: 'bulk' }]

    expect(leesMailMeta('m1', 't1', headers, [], ontvangen, 'kane@example.nl').precedence).toBe('bulk')
  })

  test('staat je niet in de aan, dan aanMij=false', () => {
    const headers: Header[] = [{ name: 'To', value: 'iemand-anders@example.nl' }]

    expect(leesMailMeta('m1', 't1', headers, [], ontvangen, 'kane@example.nl').aanMij).toBe(false)
  })

  test('houdt geen adressen van derden vast', () => {
    // De harde grens: `To` wordt gelezen voor één ja/nee-vraag en daarna
    // losgelaten. Als iemand hier ooit `ontvangers` aan toevoegt, valt deze test
    // om — en dat is precies de bedoeling.
    const headers: Header[] = [
      { name: 'From', value: 'jan@example.nl' },
      { name: 'To', value: 'kane@example.nl, piet@example.nl, marie@example.nl' },
    ]

    const meta = leesMailMeta('m1', 't1', headers, [], ontvangen, 'kane@example.nl')

    expect(JSON.stringify(meta)).not.toContain('piet@example.nl')
    expect(JSON.stringify(meta)).not.toContain('marie@example.nl')
  })

  test('een mail zonder enige header levert nog steeds bruikbare metadata', () => {
    const meta = leesMailMeta('m1', 't1', [], [], ontvangen, 'kane@example.nl')

    expect(meta.id).toBe('m1')
    expect(meta.afzenderNaam).toBeNull()
    expect(meta.onderwerp).toBeNull()
    expect(meta.aanMij).toBe(false)
  })
})
