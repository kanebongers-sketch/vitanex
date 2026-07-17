import { describe, it, expect } from 'vitest'
import {
  bouwConceptBericht,
  leesConceptInvoer,
  veiligeHeaderwaarde,
  heeftHeaderInjectie,
  MAX_ONDERWERP_LENGTE,
  MAX_BODY_LENGTE,
} from './concept-bericht'

// Control-tekens via tekencodes, niet via escapes in de bron: die zijn onzichtbaar
// in een diff, en dit bestand gaat er nou juist over. Zelfde reden als in
// `concept-bericht.ts` zelf.
const CR = String.fromCharCode(13)
const LF = String.fromCharCode(10)
const NUL = String.fromCharCode(0)
const CRLF = CR + LF

/** De ruwe mail terug uit base64url — zo testen we wat er écht de deur uit gaat. */
function ontcijfer(raw: string): string {
  return Buffer.from(raw, 'base64url').toString('utf8')
}

/** De body staat ná de eerste lege regel en is zelf base64. */
function bodyVan(raw: string): string {
  const ruw = ontcijfer(raw)
  const scheiding = ruw.indexOf(CRLF + CRLF)
  return Buffer.from(ruw.slice(scheiding + 4), 'base64').toString('utf8')
}

describe('heeftHeaderInjectie', () => {
  it('vindt CR, LF en NUL', () => {
    expect(heeftHeaderInjectie(`Hoi${CR}Bcc: x@y.nl`)).toBe(true)
    expect(heeftHeaderInjectie(`Hoi${LF}Bcc: x@y.nl`)).toBe(true)
    expect(heeftHeaderInjectie(`Hoi${NUL}rommel`)).toBe(true)
  })

  it('laat gewone tekst met spaties met rust', () => {
    expect(heeftHeaderInjectie('Offerte voor volgende week')).toBe(false)
    expect(heeftHeaderInjectie('Voorstel: €500 — akkoord?')).toBe(false)
  })

  it('geeft hetzelfde antwoord bij herhaald aanroepen', () => {
    // Regressie: met een /g-regex draagt `lastIndex` mee en gaat `.test()` om en om.
    const vies = `Hoi${CRLF}Bcc: x@y.nl`
    expect(heeftHeaderInjectie(vies)).toBe(true)
    expect(heeftHeaderInjectie(vies)).toBe(true)
    expect(heeftHeaderInjectie(vies)).toBe(true)
  })
})

describe('veiligeHeaderwaarde', () => {
  it('haalt regeleinden weg en klapt witruimte in', () => {
    expect(veiligeHeaderwaarde(`Hoi${CRLF}Bcc: x@y.nl`)).toBe('Hoi Bcc: x@y.nl')
  })

  it('plakt woorden niet aan elkaar', () => {
    // Weghalen i.p.v. vervangen zou "HoiBcc:" opleveren — onleesbaar.
    expect(veiligeHeaderwaarde(`Hoi${LF}Bcc`)).toBe('Hoi Bcc')
  })

  it('laat een schone waarde ongemoeid', () => {
    expect(veiligeHeaderwaarde('Offerte volgende week')).toBe('Offerte volgende week')
  })
})

describe('bouwConceptBericht — header-injectie', () => {
  it('laat een onderwerp met CRLF geen tweede header worden', () => {
    // Dit is de aanval: als dit lekt, krijgt het concept een Bcc die Kane niet ziet.
    const raw = bouwConceptBericht({
      aan: 'jan@example.com',
      onderwerp: `Offerte${CRLF}Bcc: aanvaller@example.com`,
      body: 'Hoi Jan',
    })
    const ruw = ontcijfer(raw)

    expect(ruw).not.toContain(`${CRLF}Bcc:`)
    expect(ruw).toContain('Subject: Offerte Bcc: aanvaller@example.com')
  })

  it('laat een adres met CRLF geen tweede header worden', () => {
    const raw = bouwConceptBericht({
      aan: `jan@example.com${CRLF}Bcc: aanvaller@example.com`,
      onderwerp: 'Offerte',
      body: 'Hoi',
    })

    expect(ontcijfer(raw)).not.toContain(`${CRLF}Bcc:`)
  })

  it('laat een onderwerp de body niet vervroegen', () => {
    // Twee CRLF's = einde headers. Zou dat doorlekken, dan is de rest "body" en
    // verdwijnen Content-Type en de echte tekst.
    const raw = bouwConceptBericht({
      aan: 'jan@example.com',
      onderwerp: `Offerte${CRLF}${CRLF}Ik ben de body nu`,
      body: 'De echte tekst',
    })

    expect(ontcijfer(raw)).toContain('Content-Transfer-Encoding: base64')
    expect(bodyVan(raw)).toBe('De echte tekst')
  })

  it('strandt niet op een NUL in het onderwerp', () => {
    const raw = bouwConceptBericht({
      aan: 'jan@example.com',
      onderwerp: `Offerte${NUL}rommel`,
      body: 'Hoi',
    })
    expect(ontcijfer(raw)).not.toContain(NUL)
  })
})

describe('bouwConceptBericht — vorm', () => {
  it('zet To, Subject en de body op hun plek', () => {
    const raw = bouwConceptBericht({
      aan: 'jan@example.com',
      onderwerp: 'Offerte',
      body: 'Hoi Jan, hierbij.',
    })
    const ruw = ontcijfer(raw)

    expect(ruw).toContain('To: jan@example.com')
    expect(ruw).toContain('Subject: Offerte')
    expect(bodyVan(raw)).toBe('Hoi Jan, hierbij.')
  })

  it('laat To weg als er geen ontvanger is — een concept mag dat', () => {
    const ruw = ontcijfer(bouwConceptBericht({ aan: null, onderwerp: 'Notitie', body: 'Later' }))
    expect(ruw).not.toContain('To:')
    expect(ruw).toContain('Subject: Notitie')
  })

  it('codeert een niet-ASCII onderwerp als RFC 2047 encoded-word', () => {
    const ruw = ontcijfer(
      bouwConceptBericht({ aan: null, onderwerp: 'Voorstel: €500 — akkoord?', body: 'Hoi' }),
    )
    expect(ruw).toContain('=?UTF-8?B?')
    // De ruwe bytes van € mogen niet los in de header staan.
    expect(ruw).not.toContain('Subject: Voorstel: €500')
  })

  it('laat een ASCII-onderwerp leesbaar (geen onnodige encoding)', () => {
    const ruw = ontcijfer(bouwConceptBericht({ aan: null, onderwerp: 'Offerte', body: 'Hoi' }))
    expect(ruw).toContain('Subject: Offerte')
    expect(ruw).not.toContain('=?UTF-8?B?')
  })

  it('houdt emoji en accenten in de body heel', () => {
    const tekst = 'Prima — tot dinsdag! 👍 Café Zürich?'
    expect(bodyVan(bouwConceptBericht({ aan: null, onderwerp: 'Ok', body: tekst }))).toBe(tekst)
  })

  it('houdt regeleinden in de body wél heel — die zijn daar ongevaarlijk', () => {
    const tekst = `Hoi Jan,${CRLF}${CRLF}Hierbij de offerte.${CRLF}${CRLF}Groet, Kane`
    expect(bodyVan(bouwConceptBericht({ aan: null, onderwerp: 'Ok', body: tekst }))).toBe(tekst)
  })

  it('koppelt aan een gesprek met In-Reply-To én References', () => {
    const ruw = ontcijfer(
      bouwConceptBericht({
        aan: 'jan@example.com',
        onderwerp: 'Re: Offerte',
        body: 'Ja, prima.',
        inReplyTo: '<abc123@mail.example.com>',
      }),
    )
    expect(ruw).toContain('In-Reply-To: <abc123@mail.example.com>')
    expect(ruw).toContain('References: <abc123@mail.example.com>')
  })

  it('levert base64url op — geen +, / of = padding', () => {
    // Gewone base64 wordt door drafts.create geweigerd.
    const raw = bouwConceptBericht({
      aan: 'jan@example.com',
      onderwerp: 'Test ÿÿÿ >>> ???',
      body: 'Hoi'.repeat(200),
    })
    expect(raw).not.toMatch(/[+/=]/)
  })
})

describe('leesConceptInvoer', () => {
  it('leest een geldig verzoek', () => {
    const uitkomst = leesConceptInvoer({
      aan: 'jan@example.com',
      onderwerp: '  Offerte  ',
      body: 'Hoi Jan',
      threadId: 'thread-1',
      inReplyTo: '<abc@x>',
    })
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.waarde).toEqual({
      aan: 'jan@example.com',
      onderwerp: 'Offerte',
      body: 'Hoi Jan',
      threadId: 'thread-1',
      inReplyTo: '<abc@x>',
    })
  })

  it('accepteert een concept zonder ontvanger', () => {
    const uitkomst = leesConceptInvoer({ aan: null, onderwerp: 'Notitie', body: 'Later' })
    expect(uitkomst.ok).toBe(true)
    if (!uitkomst.ok) return
    expect(uitkomst.waarde.aan).toBeNull()
  })

  it('WEIGERT een injectie van de client in plaats van hem stil op te schonen', () => {
    // De strippen-of-weigeren-asymmetrie: van een client is dit een poging, geen ruis.
    expect(leesConceptInvoer({ aan: `x@y.nl${CRLF}Bcc: z@q.nl`, onderwerp: 'Hoi', body: 'x' })).toEqual({
      ok: false,
      fout: 'Ontvanger bevat ongeldige tekens.',
    })
    expect(leesConceptInvoer({ aan: null, onderwerp: `Hoi${CRLF}Bcc: z@q.nl`, body: 'x' })).toEqual({
      ok: false,
      fout: 'Onderwerp bevat ongeldige tekens.',
    })
  })

  it('weigert een leeg of ontbrekend onderwerp', () => {
    expect(leesConceptInvoer({ aan: null, body: 'x' }).ok).toBe(false)
    expect(leesConceptInvoer({ aan: null, onderwerp: '   ', body: 'x' }).ok).toBe(false)
  })

  it('weigert een concept zonder tekst', () => {
    expect(leesConceptInvoer({ aan: null, onderwerp: 'Hoi', body: '   ' })).toEqual({
      ok: false,
      fout: 'Een concept zonder tekst is geen concept.',
    })
  })

  it('weigert een te lang onderwerp of een te lange body', () => {
    expect(leesConceptInvoer({ aan: null, onderwerp: 'x'.repeat(MAX_ONDERWERP_LENGTE + 1), body: 'y' }).ok).toBe(false)
    expect(leesConceptInvoer({ aan: null, onderwerp: 'x', body: 'y'.repeat(MAX_BODY_LENGTE + 1) }).ok).toBe(false)
  })

  it('weigert een ontvanger die geen tekst is', () => {
    expect(leesConceptInvoer({ aan: 42, onderwerp: 'Hoi', body: 'x' }).ok).toBe(false)
  })

  it('weigert een body die geen object is', () => {
    expect(leesConceptInvoer(null).ok).toBe(false)
    expect(leesConceptInvoer('concept').ok).toBe(false)
  })
})
