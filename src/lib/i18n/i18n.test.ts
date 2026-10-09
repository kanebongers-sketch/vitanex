import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { TALEN, taalUitAcceptLanguage } from './talen'
import { alleSleutels, variabelen, vertaal, type Woordenboek } from './vertaal'

const MAP = join(__dirname, 'woordenboeken')
const lees = (code: string): Woordenboek => JSON.parse(readFileSync(join(MAP, `${code}.json`), 'utf8'))
const nl = lees('nl')
const NL_SLEUTELS = alleSleutels(nl).sort()

function tekst(boek: Woordenboek, sleutel: string): string | undefined {
  return sleutel.split('.').reduce<string | Woordenboek | undefined>((h, d) => (typeof h === 'object' ? h[d] : undefined), boek) as string | undefined
}

describe('vertaal', () => {
  test('sleutel, variabelen en terugval op Nederlands', () => {
    const en: Woordenboek = { a: { b: 'Hi {naam}' } }
    expect(vertaal(en, nl, 'a.b', { naam: 'Kane' })).toBe('Hi Kane')
    expect(vertaal(en, nl, 'nav.uitloggen')).toBe('Uitloggen')
    expect(vertaal(en, nl, 'bestaat.niet')).toBe('bestaat.niet')
  })
})

describe('taalUitAcceptLanguage', () => {
  test('eerste ondersteunde taal op volgorde van voorkeur', () => {
    expect(taalUitAcceptLanguage('de-DE,de;q=0.9,en;q=0.8,nl;q=0.7')).toBe('en')
    expect(taalUitAcceptLanguage('zh-CN,zh;q=0.9')).toBe('zh')
    expect(taalUitAcceptLanguage('de')).toBeNull()
    expect(taalUitAcceptLanguage(null)).toBeNull()
  })
})

describe.each(TALEN.filter((t) => t.code !== 'nl').map((t) => t.code))('woordenboek %s', (code) => {
  const boek = lees(code)

  test('precies dezelfde sleutels als het Nederlands', () => {
    expect(alleSleutels(boek).sort()).toEqual(NL_SLEUTELS)
  })

  test('geen lege teksten en dezelfde {variabelen}', () => {
    for (const sleutel of NL_SLEUTELS) {
      const vertaling = tekst(boek, sleutel)
      expect(typeof vertaling === 'string' && vertaling.trim().length > 0, `${code}: ${sleutel} is leeg`).toBe(true)
      expect(variabelen(vertaling as string), `${code}: ${sleutel}`).toEqual(variabelen(tekst(nl, sleutel) as string))
    }
  })
})
