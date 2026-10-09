import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { TALEN, taalUitAcceptLanguage } from './talen'
import { GEBIEDEN } from './laders'
import { alleSleutels, variabelen, vertaal, type Woordenboek } from './vertaal'

const MAP = join(__dirname, 'woordenboeken')
const lees = (code: string): Woordenboek => JSON.parse(readFileSync(join(MAP, `${code}.json`), 'utf8'))
const nl = lees('nl')

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

const BESTANDEN = ['', ...GEBIEDEN.map((g) => `${g}/`)]

describe.each(TALEN.filter((t) => t.code !== 'nl').map((t) => t.code))('woordenboek %s', (code) => {
  test.each(BESTANDEN)('%s: precies dezelfde sleutels, geen lege teksten, dezelfde {variabelen}', (map) => {
    const bron = lees(`${map}nl`)
    const boek = lees(`${map}${code}`)
    const sleutels = alleSleutels(bron).sort()
    expect(alleSleutels(boek).sort()).toEqual(sleutels)
    for (const sleutel of sleutels) {
      const vertaling = tekst(boek, sleutel)
      expect(typeof vertaling === 'string' && vertaling.trim().length > 0, `${code}: ${sleutel} is leeg`).toBe(true)
      expect(variabelen(vertaling as string), `${code}: ${sleutel}`).toEqual(variabelen(tekst(bron, sleutel) as string))
    }
  })
})

describe('gebieden', () => {
  test.each(GEBIEDEN)('%s/nl.json heeft precies één top-level sleutel: de naam van het gebied', (gebied) => {
    expect(Object.keys(lees(`${gebied}/nl`))).toEqual([gebied])
  })
})

describe('geen AI-schrijftekens in het Nederlands', () => {
  test.each(BESTANDEN)('%snl.json: geen lange streepjes of klemtoon-accenten', (map) => {
    // Echte spelling (privé, café, cliché, cliënt, ideeën) mag; klemtonen als één/vóór/méér niet.
    const boek = lees(`${map}nl`)
    const fout = alleSleutels(boek).filter((k) => /[—–éóáú]/.test((tekst(boek, k) as string).replace(/privé|café|cliché/gi, '')))
    expect(fout).toEqual([])
  })
})
