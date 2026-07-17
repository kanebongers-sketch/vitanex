import { describe, it, expect } from 'vitest'
import { heeftBereik, ontbrekendBereik, beoordeelBereik } from './bereik'
import { GMAIL_BEREIK, GMAIL_SCHRIJF_BEREIK } from './gmail'

const READONLY = 'https://www.googleapis.com/auth/gmail.readonly'
const MODIFY = 'https://www.googleapis.com/auth/gmail.modify'

describe('heeftBereik', () => {
  it('herkent een koppeling met genoeg rechten', () => {
    expect(heeftBereik([MODIFY], [MODIFY])).toBe(true)
  })

  it('herkent een koppeling die te weinig heeft', () => {
    expect(heeftBereik([READONLY], [MODIFY])).toBe(false)
  })

  it('accepteert extra scopes die we niet vroegen', () => {
    expect(heeftBereik([MODIFY, 'https://www.googleapis.com/auth/calendar.events'], [MODIFY])).toBe(true)
  })

  it('vraagt niets → altijd genoeg', () => {
    expect(heeftBereik([], [])).toBe(true)
  })

  it('matcht exact, niet op deelstring', () => {
    // `gmail.modify` en `gmail.metadata` lijken op elkaar in naam en niet in
    // betekenis; een `includes`-truc zou hier het verkeerde antwoord geven.
    expect(heeftBereik(['https://www.googleapis.com/auth/gmail.metadata'], [MODIFY])).toBe(false)
    expect(heeftBereik(['https://www.googleapis.com/auth/gmail.modify.extra'], [MODIFY])).toBe(false)
  })
})

describe('ontbrekendBereik', () => {
  it('noemt precies wat er mist', () => {
    expect(ontbrekendBereik([READONLY], [MODIFY])).toEqual([MODIFY])
  })

  it('is leeg als alles er is', () => {
    expect(ontbrekendBereik([MODIFY], [MODIFY])).toEqual([])
  })
})

describe('beoordeelBereik', () => {
  it('zegt "genoeg" bij een verse koppeling', () => {
    expect(beoordeelBereik([MODIFY], GMAIL_SCHRIJF_BEREIK)).toEqual({ soort: 'genoeg' })
  })

  it('zegt "te weinig" bij de oude read-only koppeling', () => {
    // Dit is het echte geval: Kane koppelde vóór de scope-uitbreiding.
    expect(beoordeelBereik([READONLY], GMAIL_SCHRIJF_BEREIK)).toEqual({
      soort: 'te_weinig',
      ontbreekt: [MODIFY],
    })
  })

  it('zegt "onbekend" bij een leeg bereik — niet "te weinig"', () => {
    // Afwezigheid van bewijs is geen bewijs van afwezigheid. Zou dit 'te_weinig'
    // geven, dan sturen we Kane naar het koppelscherm voor een koppeling die
    // misschien prima werkt.
    expect(beoordeelBereik([], GMAIL_SCHRIJF_BEREIK)).toEqual({ soort: 'onbekend' })
  })
})

describe('de scope die we vragen', () => {
  it('dekt het schrijfbereik dat de acties nodig hebben', () => {
    // Regressie: wie GMAIL_BEREIK versmalt zonder GMAIL_SCHRIJF_BEREIK aan te
    // passen, levert een koppeling op die per definitie geen concept kan maken.
    expect(heeftBereik(GMAIL_BEREIK, GMAIL_SCHRIJF_BEREIK)).toBe(true)
  })

  it('vraagt gmail.send NIET — versturen doet LifeOS niet', () => {
    // Let op: dit is een gebaar, geen slot. `gmail.modify` mág al versturen; de
    // echte garantie is dat er nergens een send-aanroep staat (zie gmail.ts).
    expect(GMAIL_BEREIK).not.toContain('https://www.googleapis.com/auth/gmail.send')
  })

  it('vraagt niet de volledige mail.google.com-scope', () => {
    expect(GMAIL_BEREIK).not.toContain('https://mail.google.com/')
  })
})
