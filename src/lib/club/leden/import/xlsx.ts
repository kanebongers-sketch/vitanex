// ─── Club, leden inlezen: een Excel-bestand (.xlsx) lezen (PUUR) ────────────
// Het eerste werkblad wordt dezelfde tabel als een CSV (CsvTabel), zodat het
// koppelen van kolommen en de controle precies hetzelfde blijven. We lezen
// alleen celwaarden: tekst, getallen, ja/nee en datums (een getal met een
// datumopmaak wordt JJJJ-MM-DD). Formules tellen met hun laatst berekende
// waarde. Het bestand wordt in de browser gelezen en nergens bewaard.

import type { CsvTabel } from './csv'
import { isZip, pakUit, zipInhoud, ZipFout, type Inflate } from './zip'

export class XlsxFout extends Error {}

/** Meer rijen dan dit lezen we niet eens: de import kan er hooguit 5000 per keer aan. */
export const MAX_XLSX_RIJEN = 20_000
/** Meer kolommen dan dit is geen ledenlijst. */
export const MAX_XLSX_KOLOMMEN = 200

const ENTITEITEN: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/** XML-entiteiten (&amp;, &#233;, &#x20AC;) terug naar tekst. */
export function ontsnap(t: string): string {
  return t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (heel, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''
    }
    return ENTITEITEN[code.toLowerCase()] ?? heel
  })
}

function attr(tag: string, naam: string): string | null {
  const m = new RegExp(`\\s${naam}\\s*=\\s*("([^"]*)"|'([^']*)')`).exec(tag)
  return m ? ontsnap(m[2] ?? m[3] ?? '') : null
}

/** De tekst van een gedeelde of inline string: alle <t>, zonder de uitspraakhulp (<rPh>). */
function tekstVan(xml: string): string {
  const zonderUitspraak = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '')
  let uit = ''
  for (const m of zonderUitspraak.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) uit += ontsnap(m[1])
  return uit
}

export function leesGedeeldeTeksten(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => (m[1] ? tekstVan(m[1]) : ''))
}

const DATUM_IDS = new Set([14, 15, 16, 17, 22, 27, 28, 29, 30, 31, 34, 35, 36, 50, 51, 52, 53, 54, 55, 56, 57, 58])

/** Is deze opmaakcode een datum? Tekst tussen aanhalingstekens, escapes en [..] tellen niet mee. */
export function isDatumOpmaak(code: string): boolean {
  const kaal = code.replace(/"[^"]*"/g, '').replace(/\\./g, '').replace(/\[[^\]]*\]/g, '').toLowerCase()
  return /[dy]/.test(kaal) || (/m/.test(kaal) && !/[hs]/.test(kaal))
}

/** Per stijlindex (het s-attribuut van een cel): is het een datum? */
export function leesDatumStijlen(xml: string): boolean[] {
  const eigen = new Map<number, string>()
  for (const m of xml.matchAll(/<numFmt\b[^>]*>/g)) {
    const id = Number(attr(m[0], 'numFmtId'))
    const code = attr(m[0], 'formatCode')
    if (Number.isInteger(id) && code !== null) eigen.set(id, code)
  }
  const xfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml)?.[1] ?? ''
  return [...xfs.matchAll(/<xf\b[^>]*>/g)].map((m) => {
    const id = Number(attr(m[0], 'numFmtId') ?? '0')
    const code = eigen.get(id)
    return code !== undefined ? isDatumOpmaak(code) : DATUM_IDS.has(id)
  })
}

/** Een Excel-datumgetal naar JJJJ-MM-DD (1900-systeem, of 1904 voor oude Mac-bestanden). */
export function excelDatum(getal: number, systeem1904 = false): string | null {
  if (!Number.isFinite(getal) || getal < 1) return null
  const dagen = Math.floor(getal) + (systeem1904 ? 1462 : 0)
  // 25569 = 1-1-1970; Excel telt 29-2-1900 mee, daarom vanaf 61 gelijk aan de echte kalender.
  const ms = (dagen - 25569) * 86_400_000
  const d = new Date(dagen < 61 ? ms + 86_400_000 : ms)
  const jaar = d.getUTCFullYear()
  return jaar >= 1900 && jaar <= 2100 ? d.toISOString().slice(0, 10) : null
}

/** Kolomletters (A, Z, AA) naar een index vanaf 0. */
export function kolomIndex(ref: string): number {
  const letters = /^([A-Z]+)/i.exec(ref)?.[1].toUpperCase() ?? ''
  let n = 0
  for (const l of letters) n = n * 26 + (l.charCodeAt(0) - 64)
  return n - 1
}

interface Context {
  teksten: readonly string[]
  datums: readonly boolean[]
  systeem1904: boolean
}

function celWaarde(tag: string, binnen: string, ctx: Context): string {
  const soort = attr(tag, 't')
  if (soort === 'inlineStr') return tekstVan(binnen)
  const v = /<v>([\s\S]*?)<\/v>/.exec(binnen)?.[1]
  if (v === undefined) return ''
  const ruw = ontsnap(v)
  if (soort === 's') return ctx.teksten[Number(ruw)] ?? ''
  if (soort === 'str') return ruw
  if (soort === 'b') return ruw === '1' ? 'ja' : 'nee'
  if (soort === 'e') return ''
  const stijl = Number(attr(tag, 's') ?? '0')
  if (ctx.datums[stijl]) return excelDatum(Number(ruw), ctx.systeem1904) ?? ruw
  return ruw
}

interface Rij {
  regel: number
  velden: string[]
}

/** De rijen van een werkblad, met het Excel-rijnummer erbij. Lege rijen vallen weg. */
export function leesWerkblad(xml: string, ctx: Context): Rij[] {
  const data = /<sheetData\b[^>]*>([\s\S]*?)<\/sheetData>/.exec(xml)?.[1] ?? ''
  const rijen: Rij[] = []
  let volgende = 1
  for (const r of data.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const regel = Number(attr(`<row${r[1]}>`, 'r') ?? volgende)
    volgende = regel + 1
    if (!r[2]) continue
    const velden: string[] = []
    let kolom = 0
    for (const c of r[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const open = `<c${c[1]}>`
      const ref = attr(open, 'r')
      kolom = ref ? kolomIndex(ref) : kolom
      if (kolom >= MAX_XLSX_KOLOMMEN) break
      if (c[2]) velden[kolom] = celWaarde(open, c[2], ctx).trim()
      kolom++
    }
    const vol = Array.from(velden, (v) => v ?? '')
    if (vol.some((v) => v !== '')) rijen.push({ regel, velden: vol })
    if (rijen.length > MAX_XLSX_RIJEN) throw new XlsxFout(`Dit werkblad heeft meer dan ${MAX_XLSX_RIJEN} regels. Splits het bestand.`)
  }
  return rijen
}

/** Het pad van het eerste werkblad, via workbook.xml en de relaties. */
export function eersteWerkblad(workbook: string, relaties: string | null): string {
  const blad = /<sheet\b[^>]*>/.exec(workbook)?.[0]
  const rid = blad ? (attr(blad, 'r:id') ?? attr(blad, 'id')) : null
  const rel = rid && relaties ? [...relaties.matchAll(/<Relationship\b[^>]*>/g)].find((m) => attr(m[0], 'Id') === rid)?.[0] : undefined
  const doel = rel ? attr(rel, 'Target') : null
  if (!doel) return 'xl/worksheets/sheet1.xml'
  return doel.startsWith('/') ? doel.slice(1) : `xl/${doel.replace(/^\.\//, '')}`
}

async function tekstUit(b: Uint8Array, items: ReturnType<typeof zipInhoud>, naam: string, inflate?: Inflate): Promise<string | null> {
  const bytes = await pakUit(b, items, naam, inflate)
  return bytes ? new TextDecoder('utf-8').decode(bytes) : null
}

/** Een .xlsx-bestand als tabel: de eerste niet-lege rij zijn de koppen. */
export async function leesXlsx(bytes: Uint8Array, inflate?: Inflate): Promise<CsvTabel> {
  if (!isZip(bytes)) throw new XlsxFout('Dit is geen .xlsx-bestand. Is het beveiligd met een wachtwoord, of een oud .xls-bestand? Sla het dan op als .xlsx of CSV.')
  try {
    const items = zipInhoud(bytes)
    const workbook = await tekstUit(bytes, items, 'xl/workbook.xml', inflate)
    if (!workbook) throw new XlsxFout('Dit is geen Excel-werkmap.')
    const [relaties, gedeeld, stijlen] = await Promise.all([
      tekstUit(bytes, items, 'xl/_rels/workbook.xml.rels', inflate),
      tekstUit(bytes, items, 'xl/sharedStrings.xml', inflate),
      tekstUit(bytes, items, 'xl/styles.xml', inflate),
    ])
    const blad = await tekstUit(bytes, items, eersteWerkblad(workbook, relaties), inflate)
    if (!blad) throw new XlsxFout('Het eerste werkblad kon niet worden gevonden.')
    const systeem1904 = /<workbookPr\b[^>]*\sdate1904\s*=\s*["'](1|true)["']/.test(workbook)
    const rijen = leesWerkblad(blad, { teksten: gedeeld ? leesGedeeldeTeksten(gedeeld) : [], datums: stijlen ? leesDatumStijlen(stijlen) : [], systeem1904 })
    const [kop, ...rest] = rijen
    if (!kop) return { koppen: [], rijen: [], regels: [], onafgesloten: false }
    const koppen = kop.velden.map((k) => k.trim())
    return { koppen, rijen: rest.map((r) => koppen.map((_, i) => r.velden[i] ?? '')), regels: rest.map((r) => r.regel), onafgesloten: false }
  } catch (err) {
    if (err instanceof XlsxFout) throw err
    if (err instanceof ZipFout) throw new XlsxFout(`${err.message} Sla het opnieuw op in Excel, of als CSV.`)
    throw new XlsxFout('Dit Excel-bestand kon niet worden gelezen. Sla het opnieuw op in Excel, of als CSV.')
  }
}
