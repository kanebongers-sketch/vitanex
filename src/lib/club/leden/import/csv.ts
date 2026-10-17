// ─── Fit Factory Club: een CSV-bestand lezen (PUUR) ─────────────────────────
// Exports uit Sportivity, Virtuagym en Excel zijn in Nederland vaak met een
// puntkomma gescheiden, soms met een komma of tab. We kiezen het scheidingsteken
// dat in de kopregel het vaakst voorkomt. Aanhalingstekens, regeleinden binnen
// een veld en een BOM aan het begin worden netjes afgehandeld.

export interface CsvTabel {
  koppen: string[]
  rijen: string[][]
  /** Per rij het regelnummer in het bestand waar die rij begint (de kopregel is 1). */
  regels: number[]
  /** Er staat ergens een aanhalingsteken dat nooit wordt gesloten: de rest van het bestand is dan een veld. */
  onafgesloten: boolean
}

interface Velden {
  regels: { velden: string[]; begin: number }[]
  onafgesloten: boolean
}

const SCHEIDINGSTEKENS = [';', ',', '\t'] as const

/** Het scheidingsteken dat in de eerste regel het vaakst voorkomt (buiten aanhalingstekens). */
export function raadScheidingsteken(tekst: string): string {
  const eersteRegel = tekst.split(/\r?\n/, 1)[0] ?? ''
  let beste: string = ';'
  let meeste = 0
  for (const teken of SCHEIDINGSTEKENS) {
    const aantal = eersteRegel.replace(/"[^"]*"/g, '').split(teken).length - 1
    if (aantal > meeste) {
      beste = teken
      meeste = aantal
    }
  }
  return beste
}

/** Alle velden van het bestand, regel voor regel, met de regel waar elke rij begint. Lege regels vallen weg. */
export function leesVelden(tekst: string, scheiding: string): Velden {
  const regels: Velden['regels'] = []
  let regel: string[] = []
  let veld = ''
  let binnenAanhaling = false
  let lijn = 1
  let begin = 1

  const sluitRegel = () => {
    regel.push(veld)
    if (regel.some((v) => v.trim() !== '')) regels.push({ velden: regel, begin })
    regel = []
    veld = ''
  }

  for (let i = 0; i < tekst.length; i++) {
    const teken = tekst[i]
    if (binnenAanhaling) {
      if (teken === '"' && tekst[i + 1] === '"') {
        veld += '"'
        i++
      } else if (teken === '"') {
        binnenAanhaling = false
      } else {
        if (teken === '\n') lijn++
        veld += teken
      }
    } else if (teken === '"' && veld.trim() === '') {
      binnenAanhaling = true
      veld = ''
    } else if (teken === scheiding) {
      regel.push(veld)
      veld = ''
    } else if (teken === '\n' || teken === '\r') {
      if (teken === '\r' && tekst[i + 1] === '\n') i++
      sluitRegel()
      lijn++
      begin = lijn
    } else {
      veld += teken
    }
  }
  if (veld !== '' || regel.length > 0) sluitRegel()
  return { regels, onafgesloten: binnenAanhaling }
}

/** Een heel CSV-bestand: de eerste regel zijn de koppen, de rest de rijen. */
export function leesCsv(ruw: string): CsvTabel {
  const tekst = ruw.replace(/^\uFEFF/, '')
  const { regels, onafgesloten } = leesVelden(tekst, raadScheidingsteken(tekst))
  const [kop, ...rest] = regels
  if (!kop) return { koppen: [], rijen: [], regels: [], onafgesloten }
  const koppen = kop.velden.map((k) => k.trim())
  const rijen = rest.map((r) => koppen.map((_, i) => (r.velden[i] ?? '').trim()))
  return { koppen, rijen, regels: rest.map((r) => r.begin), onafgesloten }
}

/**
 * Bytes van een bestand naar tekst. Eerst als UTF-8; zitten er dan onleesbare
 * tekens in, dan was het een oud Excel-bestand (Windows-1252) en lezen we het zo.
 */
export function decodeerBestand(bytes: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  return utf8.includes('\uFFFD') ? new TextDecoder('windows-1252').decode(bytes) : utf8
}
