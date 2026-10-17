import { describe, expect, it } from 'vitest'
import { parseerOpmaak, telTekens } from './opmaak'

describe('parseerOpmaak', () => {
  it('maakt koppen, alinea en lijst', () => {
    // Arrange
    const tekst = '# Toegang\nJe checkt in met je band.\nOok met QR.\n\n- Handdoek mee\n- Opruimen'
    // Act
    const blokken = parseerOpmaak(tekst)
    // Assert
    expect(blokken).toEqual([
      { soort: 'kop', tekst: 'Toegang' },
      { soort: 'alinea', regels: ['Je checkt in met je band.', 'Ook met QR.'] },
      { soort: 'lijst', punten: ['Handdoek mee', 'Opruimen'] },
    ])
  })

  it('splitst alinea en lijst ook zonder lege regel ertussen', () => {
    expect(parseerOpmaak('Let op:\n- een\n- twee\nDaarna tekst.')).toEqual([
      { soort: 'alinea', regels: ['Let op:'] },
      { soort: 'lijst', punten: ['een', 'twee'] },
      { soort: 'alinea', regels: ['Daarna tekst.'] },
    ])
  })

  it('ziet een streepje of hekje zonder spatie als gewone tekst', () => {
    expect(parseerOpmaak('#1 regel\n-5 graden')).toEqual([{ soort: 'alinea', regels: ['#1 regel', '-5 graden'] }])
  })

  it('slaat lege koppen en punten over en werkt met Windows-regeleinden', () => {
    expect(parseerOpmaak('# \r\n-  \r\nTekst')).toEqual([{ soort: 'alinea', regels: ['Tekst'] }])
  })

  it('geeft niets bij een lege tekst', () => {
    expect(parseerOpmaak('')).toEqual([])
    expect(parseerOpmaak('\n\n  \n')).toEqual([])
  })

  it('laat HTML gewoon tekst zijn (React rendert het nooit als opmaak)', () => {
    expect(parseerOpmaak('<script>x</script>')).toEqual([{ soort: 'alinea', regels: ['<script>x</script>'] }])
  })
})

describe('telTekens', () => {
  it('telt een Windows-regeleinde als een teken', () => {
    expect(telTekens('a\r\nb')).toBe(3)
  })
})
