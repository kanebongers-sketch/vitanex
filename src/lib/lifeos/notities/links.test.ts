import { describe, it, expect } from 'vitest'
import {
  maskeerCode,
  normaliseerTitel,
  parseLinks,
  titelSleutel,
  MAX_LINKS_PER_NOTITIE,
  MAX_TITEL_LENGTE,
} from './links'
import { linksInBlokken, ontleedMarkdown } from './markdown'

describe('normaliseerTitel', () => {
  it('trimt en klapt witruimte in — dat is dezelfde verwijzing voor een mens', () => {
    // Arrange
    const ruw = '  Marge   model  '

    // Act
    const titel = normaliseerTitel(ruw)

    // Assert
    expect(titel).toBe('Marge model')
  })

  it('behoudt hoofdletters — anders dan een tag is een titel prose', () => {
    expect(normaliseerTitel('Marge-Model')).toBe('Marge-Model')
  })

  it('weigert leeg en witruimte-only', () => {
    expect(normaliseerTitel('')).toBeNull()
    expect(normaliseerTitel('   ')).toBeNull()
    expect(normaliseerTitel('\n\t')).toBeNull()
  })

  it('weigert niet-tekst i.p.v. het door te laten glippen', () => {
    expect(normaliseerTitel(null)).toBeNull()
    expect(normaliseerTitel(undefined)).toBeNull()
    expect(normaliseerTitel(42)).toBeNull()
    expect(normaliseerTitel(['Titel'])).toBeNull()
  })

  it('WEIGERT te lange titels i.p.v. af te kappen — afkappen wijst stil naar iets anders', () => {
    // Arrange — precies op de grens mag nog, één erover niet.
    const opDeGrens = 'a'.repeat(MAX_TITEL_LENGTE)
    const eenTeVeel = 'a'.repeat(MAX_TITEL_LENGTE + 1)

    // Act / Assert
    expect(normaliseerTitel(opDeGrens)).toBe(opDeGrens)
    expect(normaliseerTitel(eenTeVeel)).toBeNull()
  })

  it('meet de lengte ná normalisatie, niet ervoor', () => {
    // Arrange — 120 tekens + spaties eromheen: na trim past hij precies.
    const metSpaties = `   ${'b'.repeat(MAX_TITEL_LENGTE)}   `

    // Act / Assert
    expect(normaliseerTitel(metSpaties)).toBe('b'.repeat(MAX_TITEL_LENGTE))
  })
})

describe('titelSleutel', () => {
  it('is hoofdletterloos — spiegelt lower(btrim(titel)) uit migratie 110', () => {
    expect(titelSleutel('Marge-Model')).toBe('marge-model')
    expect(titelSleutel('  MARGE   MODEL ')).toBe('marge model')
  })

  it('geeft null waar normaliseerTitel null geeft', () => {
    expect(titelSleutel('  ')).toBeNull()
    expect(titelSleutel('x'.repeat(MAX_TITEL_LENGTE + 1))).toBeNull()
  })
})

describe('maskeerCode', () => {
  it('blindeert een code-span', () => {
    expect(maskeerCode('een `[[Titel]]` hier')).not.toContain('[[Titel]]')
  })

  it('blindeert een gesloten fence', () => {
    // Arrange
    const tekst = 'voor\n```\n[[In code]]\n```\nna'

    // Act
    const uit = maskeerCode(tekst)

    // Assert
    expect(uit).not.toContain('[[In code]]')
    expect(uit).toContain('voor')
    expect(uit).toContain('na')
  })

  it('laat een ONGESLOTEN fence tot het einde lopen — net als de renderer', () => {
    expect(maskeerCode('tekst\n```\n[[Nooit af]]')).not.toContain('[[Nooit af]]')
  })

  it('laat gewone tekst met rust', () => {
    expect(maskeerCode('[[Marge-model]] telt wel')).toContain('[[Marge-model]]')
  })
})

describe('parseLinks', () => {
  it('haalt een verwijzing uit een zin', () => {
    // Arrange
    const tekst = 'Denk aan [[Marge-model]] bij de offerte.'

    // Act
    const links = parseLinks(tekst)

    // Assert
    expect(links).toEqual(['Marge-model'])
  })

  it('houdt de leesvolgorde aan', () => {
    expect(parseLinks('[[Een]] dan [[Twee]] dan [[Drie]]')).toEqual(['Een', 'Twee', 'Drie'])
  })

  it('ontdubbelt hoofdletterloos en houdt de EERSTE schrijfwijze — die typte je', () => {
    // Arrange
    const tekst = '[[Marge-model]] en later nog eens [[marge-MODEL]]'

    // Act
    const links = parseLinks(tekst)

    // Assert
    expect(links).toEqual(['Marge-model'])
  })

  it('normaliseert witruimte binnen de haken', () => {
    expect(parseLinks('[[  Marge   model  ]]')).toEqual(['Marge model'])
  })

  it('negeert lege en witruimte-only verwijzingen — dat zijn haken, geen links', () => {
    expect(parseLinks('[[]] en [[   ]]')).toEqual([])
  })

  it('negeert een ongesloten [[', () => {
    expect(parseLinks('begin [[Marge-model zonder eind')).toEqual([])
    expect(parseLinks('[[')).toEqual([])
    expect(parseLinks('[[[[')).toEqual([])
  })

  it('negeert een losse ]]', () => {
    expect(parseLinks('zomaar ]] hier')).toEqual([])
  })

  it('pakt bij geneste haken de BINNENSTE — geneste verwijzingen bestaan niet', () => {
    // Arrange — [[a[[b]]]] : de buitenste is geen geldige verwijzing.
    const tekst = '[[a[[b]]]]'

    // Act / Assert
    expect(parseLinks(tekst)).toEqual(['b'])
  })

  it('negeert een te lange titel i.p.v. hem af te kappen', () => {
    // Arrange
    const teLang = 'x'.repeat(MAX_TITEL_LENGTE + 1)

    // Act / Assert
    expect(parseLinks(`[[${teLang}]]`)).toEqual([])
  })

  it('telt een verwijzing in een code-span NIET — anders krijgt de grafiek een onzichtbare kant', () => {
    expect(parseLinks('gebruik `[[Titel]]` als syntax')).toEqual([])
  })

  it('telt een verwijzing in een codeblok NIET', () => {
    expect(parseLinks('uitleg\n```\n[[Titel]]\n```\n')).toEqual([])
  })

  it('kapt af op MAX_LINKS_PER_NOTITIE', () => {
    // Arrange — 60 unieke verwijzingen.
    const tekst = Array.from({ length: 60 }, (_, i) => `[[Titel ${i}]]`).join(' ')

    // Act
    const links = parseLinks(tekst)

    // Assert
    expect(links).toHaveLength(MAX_LINKS_PER_NOTITIE)
    expect(links[0]).toBe('Titel 0')
  })

  it('is leeg bij lege of niet-tekst invoer', () => {
    expect(parseLinks('')).toEqual([])
    expect(parseLinks('gewone notitie zonder verwijzingen')).toEqual([])
  })

  it('werkt over regels heen', () => {
    expect(parseLinks('regel een [[A]]\nregel twee [[B]]')).toEqual(['A', 'B'])
  })

  it('staat geen nieuwe regel binnen één verwijzing toe... maar breekt er ook niet op', () => {
    // Arrange — `[[a\nb]]` is regex-technisch een treffer ([^[\]] matcht \n).
    // Dat is prima: de normalisatie klapt de enter tot een spatie in, en dat is
    // wat iemand die over twee regels typt bedoelt.
    const tekst = '[[Marge\nmodel]]'

    // Act / Assert
    expect(parseLinks(tekst)).toEqual(['Marge model'])
  })
})

// ─── De invariant tussen de twee parsers ────────────────────────────────────
// `parseLinks` (naar de database) en de markdown-ontleder (naar het scherm)
// implementeren de code-voorrangsregel elk apart: de één met `maskeerCode`, de
// ander doordat de inline-tokenizer code-spans eerst consumeert.
//
// Dat is bewuste duplicatie (parseLinks mag geen AST hoeven bouwen), en deze
// test is de prijs ervoor: lopen ze uiteen, dan krijgt de grafiek een kant die
// je in je tekst niet ziet — of mis je er een die er wel staat.

describe('parseLinks en de markdown-parser zijn het altijd eens', () => {
  const GEVALLEN: readonly string[] = [
    'gewoon [[Een]] en [[Twee]]',
    'code `[[Niet]]` maar wel [[Wel]]',
    '```\n[[In blok]]\n```\nen [[Erbuiten]]',
    'ongesloten fence\n```\n[[Nooit]]',
    // Een losse ``` MIDDEN in een regel is geen codeblok — markdown toont de
    // link erna, dus parseLinks moet 'm ook vinden. Dit is het geval dat een
    // echte bug liet ontsnappen: de oude maskeerCode maskeerde vanaf hier tot
    // het einde en verloor [[Tweede]]/[[Derde]] stil.
    'met [[Eerste]].\n\ndrie backticks ``` in een zin.\n\nzie ook [[Tweede]] en [[Derde]].',
    'zie ``` voor de config [[Config]]',
    // Ingesprongen fence (tot 3 spaties) telt nog als regelbegin, net als in markdown.
    '   ```\n[[Ingesprongen]]\n   ```\nna [[Buiten]]',
    '[[]] leeg en [[   ]] witruimte',
    '[[a[[b]]]] genest',
    'ongesloten [[haak',
    '# Kop met [[Verwijzing]]\n\n- lijst met [[Andere]]',
    '**vet met [[Link]]** en *cursief met [[Nog een]]*',
    `[[${'x'.repeat(MAX_TITEL_LENGTE + 1)}]] te lang`,
    'geen enkele verwijzing hier',
    '',
  ]

  it.each(GEVALLEN)('zelfde verzameling titels voor: %j', (tekst) => {
    // Arrange / Act
    const viaParseLinks = parseLinks(tekst)
    const viaAst = linksInBlokken(ontleedMarkdown(tekst))

    // Assert — parseLinks ontdubbelt (dat is de kant naar de DB), de AST niet.
    // De VERZAMELING moet gelijk zijn; dat is de invariant die telt.
    const uniekUitAst = [...new Set(viaAst.map((t) => t.toLowerCase()))].sort()
    const uniekUitParse = [...new Set(viaParseLinks.map((t) => t.toLowerCase()))].sort()
    expect(uniekUitParse).toEqual(uniekUitAst)
  })
})
