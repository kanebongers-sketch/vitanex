import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { excelDatum, isDatumOpmaak, kolomIndex, leesXlsx, ontsnap, XlsxFout } from './xlsx'
import { bestandSoort, controleerBestand, leesLedenBestand } from './bestand'
import { raadKoppeling } from './kolommen'

// Een minimale ZIP-schrijver voor de test: elk bestand met deflate (of stored).
function zip(bestanden: Record<string, string>, opties: { stored?: boolean; versleuteld?: boolean } = {}): Uint8Array {
  const enc = new TextEncoder()
  const lokaal: number[] = []
  const centraal: number[] = []
  const u16 = (a: number[], n: number) => a.push(n & 0xff, (n >> 8) & 0xff)
  const u32 = (a: number[], n: number) => a.push(n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff)
  let aantal = 0
  for (const [naam, inhoud] of Object.entries(bestanden)) {
    const ruw = enc.encode(inhoud)
    const data = opties.stored ? ruw : new Uint8Array(deflateRawSync(ruw))
    const naamBytes = enc.encode(naam)
    const begin = lokaal.length
    const vlag = opties.versleuteld ? 1 : 0
    const methode = opties.stored ? 0 : 8
    u32(lokaal, 0x04034b50); u16(lokaal, 20); u16(lokaal, vlag); u16(lokaal, methode); u16(lokaal, 0); u16(lokaal, 0)
    u32(lokaal, 0); u32(lokaal, data.length); u32(lokaal, ruw.length); u16(lokaal, naamBytes.length); u16(lokaal, 0)
    lokaal.push(...naamBytes, ...data)
    u32(centraal, 0x02014b50); u16(centraal, 20); u16(centraal, 20); u16(centraal, vlag); u16(centraal, methode); u16(centraal, 0); u16(centraal, 0)
    u32(centraal, 0); u32(centraal, data.length); u32(centraal, ruw.length); u16(centraal, naamBytes.length); u16(centraal, 0); u16(centraal, 0)
    u16(centraal, 0); u16(centraal, 0); u32(centraal, 0); u32(centraal, begin)
    centraal.push(...naamBytes)
    aantal++
  }
  const eind: number[] = []
  u32(eind, 0x06054b50); u16(eind, 0); u16(eind, 0); u16(eind, aantal); u16(eind, aantal)
  u32(eind, centraal.length); u32(eind, lokaal.length); u16(eind, 0)
  return new Uint8Array([...lokaal, ...centraal, ...eind])
}

const WORKBOOK = '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Leden" sheetId="1" r:id="rId1"/></sheets></workbook>'
const RELS = '<Relationships><Relationship Id="rId1" Type="worksheet" Target="worksheets/blad1.xml"/></Relationships>'
const GEDEELD = '<sst><si><t>Voornaam</t></si><si><t>Achternaam</t></si><si><t>E-mail</t></si><si><t>Geboortedatum</t></si><si><r><t>Ann</t></r><r><t xml:space="preserve">a </t></r></si><si><t>de Vries &amp; Zn</t></si><si><t>ann@voorbeeld.nl</t></si></sst>'
const STIJLEN = '<styleSheet><numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts><cellXfs count="3"><xf numFmtId="0"/><xf numFmtId="164"/><xf numFmtId="14"/></cellXfs></styleSheet>'
const BLAD = `<worksheet><sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="inlineStr"><is><t>Telefoon</t></is></c></row>
<row r="2"/>
<row r="3"><c r="A3" t="s"><v>4</v></c><c r="B3" t="s"><v>5</v></c><c r="C3" t="s"><v>6</v></c><c r="D3" s="1"><v>33270</v></c><c r="E3"><v>612345678</v></c></row>
<row r="5"><c r="B5" t="str"><f>A1</f><v>Jansen</v></c><c r="D5" s="2"><v>45000</v></c></row>
</sheetData></worksheet>`

function werkmap(extra: Record<string, string> = {}): Uint8Array {
  return zip({ 'xl/workbook.xml': WORKBOOK, 'xl/_rels/workbook.xml.rels': RELS, 'xl/sharedStrings.xml': GEDEELD, 'xl/styles.xml': STIJLEN, 'xl/worksheets/blad1.xml': BLAD, ...extra })
}

describe('leesXlsx', () => {
  it('leest het eerste werkblad als dezelfde tabel als een CSV', async () => {
    const tabel = await leesXlsx(werkmap())
    expect(tabel.koppen).toEqual(['Voornaam', 'Achternaam', 'E-mail', 'Geboortedatum', 'Telefoon'])
    expect(tabel.rijen).toEqual([
      ['Anna', 'de Vries & Zn', 'ann@voorbeeld.nl', '1991-02-01', '612345678'],
      ['', 'Jansen', '', '2023-03-15', ''],
    ])
    expect(tabel.regels).toEqual([3, 5])
    expect(tabel.onafgesloten).toBe(false)
  })

  it('herkent de kolommen zoals bij een CSV', async () => {
    const k = raadKoppeling((await leesXlsx(werkmap())).koppen)
    expect(k.voornaam).toBe(0)
    expect(k.email).toBe(2)
  })

  it('werkt ook met niet ingepakte onderdelen', async () => {
    const b = zip({ 'xl/workbook.xml': WORKBOOK, 'xl/_rels/workbook.xml.rels': RELS, 'xl/sharedStrings.xml': GEDEELD, 'xl/worksheets/blad1.xml': BLAD }, { stored: true })
    expect((await leesXlsx(b)).rijen[0][0]).toBe('Anna')
  })

  it('weigert een bestand dat geen ZIP is (oud .xls of beveiligd)', async () => {
    await expect(leesXlsx(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3]))).rejects.toBeInstanceOf(XlsxFout)
  })

  it('weigert een versleutelde ZIP', async () => {
    const b = zip({ 'xl/workbook.xml': WORKBOOK }, { versleuteld: true })
    await expect(leesXlsx(b)).rejects.toThrow(/wachtwoord/)
  })

  it('weigert een ZIP zonder werkmap', async () => {
    await expect(leesXlsx(zip({ 'iets.txt': 'hallo' }))).rejects.toThrow(/Excel-werkmap/)
  })

  it('weigert een uitgepakt te groot onderdeel', async () => {
    const groot = () => Promise.resolve(new Uint8Array(41 * 1024 * 1024))
    await expect(leesXlsx(werkmap(), groot)).rejects.toThrow(/te groot/)
  })
})

describe('hulpjes', () => {
  it('rekent Excel-datums om', () => {
    expect(excelDatum(1)).toBe('1900-01-01')
    expect(excelDatum(61)).toBe('1900-03-01')
    expect(excelDatum(45000)).toBe('2023-03-15')
    expect(excelDatum(0)).toBeNull()
    expect(excelDatum(43538, true)).toBe('2023-03-15')
  })

  it('herkent datumopmaak', () => {
    expect(isDatumOpmaak('dd/mm/yyyy')).toBe(true)
    expect(isDatumOpmaak('[$-413]d mmmm yyyy')).toBe(true)
    expect(isDatumOpmaak('h:mm:ss')).toBe(false)
    expect(isDatumOpmaak('0.00')).toBe(false)
    expect(isDatumOpmaak('"dag "0')).toBe(false)
  })

  it('zet kolomletters om', () => {
    expect(kolomIndex('A1')).toBe(0)
    expect(kolomIndex('Z9')).toBe(25)
    expect(kolomIndex('AA3')).toBe(26)
  })

  it('ontsnapt XML-entiteiten', () => {
    expect(ontsnap('&lt;b&gt; &#233; &#x20AC; &amp;')).toBe('<b> é € &')
  })
})

describe('leesLedenBestand', () => {
  it('kiest het formaat op de naam', () => {
    expect(bestandSoort('leden.CSV')).toBe('csv')
    expect(bestandSoort('leden.xlsx')).toBe('xlsx')
    expect(bestandSoort('leden.xls')).toBe('onbekend')
  })

  it('weigert te groot, leeg of onbekend', () => {
    expect(controleerBestand('a.xlsx', 11 * 1024 * 1024)).toMatch(/10 MB/)
    expect(controleerBestand('a.csv', 0)).toMatch(/leeg/)
    expect(controleerBestand('a.ods', 10)).toMatch(/xlsx/)
  })

  it('leest CSV en Excel naar dezelfde vorm', async () => {
    const csv = await leesLedenBestand('a.csv', new TextEncoder().encode('Voornaam;Achternaam\nAnna;Jansen\n').buffer as ArrayBuffer)
    expect(csv).toEqual({ ok: true, tabel: { koppen: ['Voornaam', 'Achternaam'], rijen: [['Anna', 'Jansen']], regels: [2], onafgesloten: false } })
    const b = werkmap()
    const xlsx = await leesLedenBestand('a.xlsx', b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer)
    expect(xlsx.ok && xlsx.tabel.rijen.length).toBe(2)
  })

  it('geeft een begrijpelijke fout bij een kapot Excel-bestand', async () => {
    const uit = await leesLedenBestand('a.xlsx', new Uint8Array([1, 2, 3, 4]).buffer)
    expect(uit.ok).toBe(false)
  })
})
