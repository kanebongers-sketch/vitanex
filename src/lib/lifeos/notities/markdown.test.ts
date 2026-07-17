import { describe, it, expect } from 'vitest'
import { ontleedInline, ontleedMarkdown, type Blok, type Inline } from './markdown'

/** Platte tekst uit inline-nodes — handig om te bewijzen dat er niets wegvalt. */
function alsTekst(nodes: readonly Inline[]): string {
  return nodes
    .map((n) => {
      if (n.soort === 'tekst' || n.soort === 'code') return n.waarde
      if (n.soort === 'link') return n.titel
      return alsTekst(n.kinderen)
    })
    .join('')
}

describe('ontleedMarkdown — blokken', () => {
  it('is leeg bij lege invoer (geen blok met een lege alinea)', () => {
    expect(ontleedMarkdown('')).toEqual([])
    expect(ontleedMarkdown('   \n\n  ')).toEqual([])
  })

  it('maakt van gewone tekst één alinea', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('Gewoon een gedachte.')

    // Assert
    expect(blokken).toHaveLength(1)
    expect(blokken[0].soort).toBe('alinea')
  })

  it('splitst alinea\'s op een lege regel', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('Eerste.\n\nTweede.')

    // Assert
    expect(blokken.map((b) => b.soort)).toEqual(['alinea', 'alinea'])
  })

  it('houdt enters BINNEN een alinea vast — in een notitie is een enter een enter', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('regel een\nregel twee')

    // Assert
    expect(blokken).toHaveLength(1)
    const blok = blokken[0]
    if (blok.soort !== 'alinea') throw new Error('verwachtte een alinea')
    expect(alsTekst(blok.inhoud)).toBe('regel een\nregel twee')
  })

  it('leest koppen met hun bron-niveau', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('# Een\n## Twee\n###### Zes')

    // Assert
    expect(blokken.map((b) => (b.soort === 'kop' ? b.niveau : null))).toEqual([1, 2, 6])
  })

  it('is geen kop zonder spatie of met zeven hekjes', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('#geenkop\n\n####### zeven')

    // Assert — allebei gewoon tekst; niets valt weg.
    expect(blokken.every((b) => b.soort === 'alinea')).toBe(true)
  })

  it('leest een ongeordende lijst', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('- een\n- twee\n* drie\n+ vier')

    // Assert — één lijst, vier items.
    expect(blokken).toHaveLength(1)
    const blok = blokken[0]
    if (blok.soort !== 'lijst') throw new Error('verwachtte een lijst')
    expect(blok.geordend).toBe(false)
    expect(blok.items.map(alsTekst)).toEqual(['een', 'twee', 'drie', 'vier'])
  })

  it('leest een geordende lijst', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('1. een\n2) twee')

    // Assert
    const blok = blokken[0]
    if (blok.soort !== 'lijst') throw new Error('verwachtte een lijst')
    expect(blok.geordend).toBe(true)
    expect(blok.items.map(alsTekst)).toEqual(['een', 'twee'])
  })

  it('begint een NIEUWE lijst als de soort wisselt — een stap mag niet in een bullet verdwijnen', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('- bullet\n1. stap')

    // Assert
    expect(blokken).toHaveLength(2)
    expect(blokken.every((b) => b.soort === 'lijst')).toBe(true)
  })

  it('leest een codeblok en ontleedt de inhoud NIET', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('```\nconst x = **niet vet**\n```')

    // Assert
    expect(blokken).toEqual<Blok[]>([{ soort: 'codeblok', waarde: 'const x = **niet vet**' }])
  })

  it('laat een ongesloten codeblok tot het einde lopen', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('```\nnog aan het typen')

    // Assert
    expect(blokken).toEqual<Blok[]>([{ soort: 'codeblok', waarde: 'nog aan het typen' }])
  })

  it('laat een alinea eindigen op een kop of lijst zonder lege regel ertussen', () => {
    // Arrange / Act
    const blokken = ontleedMarkdown('tekst\n# kop\n- item')

    // Assert
    expect(blokken.map((b) => b.soort)).toEqual(['alinea', 'kop', 'lijst'])
  })
})

describe('ontleedInline', () => {
  it('leest **vet**', () => {
    expect(ontleedInline('a **b** c')).toEqual<Inline[]>([
      { soort: 'tekst', waarde: 'a ' },
      { soort: 'vet', kinderen: [{ soort: 'tekst', waarde: 'b' }] },
      { soort: 'tekst', waarde: ' c' },
    ])
  })

  it('leest *cursief*', () => {
    expect(ontleedInline('*b*')).toEqual<Inline[]>([
      { soort: 'cursief', kinderen: [{ soort: 'tekst', waarde: 'b' }] },
    ])
  })

  it('geeft **vet** voorrang op *cursief* — anders eet cursief de sterren op', () => {
    // Arrange / Act
    const nodes = ontleedInline('**vet**')

    // Assert
    expect(nodes).toHaveLength(1)
    expect(nodes[0].soort).toBe('vet')
  })

  it('leest `code` letterlijk — opmaak erin blijft tekst', () => {
    expect(ontleedInline('`**niet vet**`')).toEqual<Inline[]>([
      { soort: 'code', waarde: '**niet vet**' },
    ])
  })

  it('geeft code voorrang op een verwijzing', () => {
    expect(ontleedInline('`[[Titel]]`')).toEqual<Inline[]>([{ soort: 'code', waarde: '[[Titel]]' }])
  })

  it('leest een [[verwijzing]]', () => {
    expect(ontleedInline('zie [[Marge-model]] hier')).toEqual<Inline[]>([
      { soort: 'tekst', waarde: 'zie ' },
      { soort: 'link', titel: 'Marge-model' },
      { soort: 'tekst', waarde: ' hier' },
    ])
  })

  it('normaliseert de titel van een verwijzing', () => {
    expect(ontleedInline('[[  Marge   model ]]')).toEqual<Inline[]>([
      { soort: 'link', titel: 'Marge model' },
    ])
  })

  it('toont een ONGELDIGE verwijzing als tekst i.p.v. hem weg te laten', () => {
    // Arrange — een lege verwijzing is geen link maar wel jouw tekst.
    const nodes = ontleedInline('a [[]] b')

    // Assert — de haken staan er nog; er is niets verdwenen.
    expect(alsTekst(nodes)).toBe('a [[]] b')
    expect(nodes.some((n) => n.soort === 'link')).toBe(false)
  })

  it('toont een te lange verwijzing als tekst', () => {
    // Arrange
    const teLang = `[[${'x'.repeat(121)}]]`

    // Act
    const nodes = ontleedInline(teLang)

    // Assert
    expect(alsTekst(nodes)).toBe(teLang)
    expect(nodes.some((n) => n.soort === 'link')).toBe(false)
  })

  it('nest opmaak: **vet met `code`**', () => {
    // Arrange / Act
    const nodes = ontleedInline('**vet met `code`**')

    // Assert
    expect(nodes).toHaveLength(1)
    const vet = nodes[0]
    if (vet.soort !== 'vet') throw new Error('verwachtte vet')
    expect(vet.kinderen).toEqual<Inline[]>([
      { soort: 'tekst', waarde: 'vet met ' },
      { soort: 'code', waarde: 'code' },
    ])
  })

  it('laat losse sterretjes gewoon staan — geen markdown is ook een antwoord', () => {
    expect(alsTekst(ontleedInline('3 * 4 = 12'))).toBe('3 * 4 = 12')
    expect(alsTekst(ontleedInline('een * los'))).toBe('een * los')
  })

  it('laat tekst die GEEN opmaak is letterlijk staan', () => {
    // Arrange — rommel die er als markdown uitziet maar het niet is. Hier mag
    // geen enkel teken verdwijnen: het is gewoon wat je typte.
    const rommel = ['*', '**', '***', '`', '``', '[[', ']]', '[[]]', '`x', '* geen opmaak *', '3 * 4']

    // Act / Assert
    for (const invoer of rommel) {
      expect(alsTekst(ontleedInline(invoer))).toBe(invoer)
    }
  })

  it('laat sterretjessoep met rust i.p.v. hem tot lege vet-nodes te laten imploderen', () => {
    // Arrange — regressie: met `**([\s\S]+?)**` werd dit 8 sterren i.p.v. 40,
    // omdat `*****` als "vet met een ster erin" matchte. Tekens uit een notitie
    // laten verdwijnen is de ene fout die deze functie niet mag maken.
    const soep = '*'.repeat(40)

    // Act
    const nodes = ontleedInline(soep)

    // Assert
    expect(alsTekst(nodes)).toBe(soep)
    expect(nodes).toEqual<Inline[]>([{ soort: 'tekst', waarde: soep }])
  })

  it('consumeert de markers van ECHTE opmaak — die zijn markup, geen inhoud', () => {
    // Arrange — de tegenhanger van de test hierboven: hier hoort `*` wél weg.
    // `*a**b*` is twee cursieve stukken, geen verloren tekst.
    const nodes = ontleedInline('*a**b*')

    // Act / Assert
    expect(nodes.map((n) => n.soort)).toEqual(['cursief', 'cursief'])
    expect(alsTekst(nodes)).toBe('ab')
  })

  it('is leeg bij een lege string', () => {
    expect(ontleedInline('')).toEqual([])
  })
})
