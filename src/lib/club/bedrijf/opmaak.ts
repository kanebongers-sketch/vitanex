// ─── Club: eenvoudige opmaak van teksten voor leden (PUUR) ──────────────────
// Platte tekst met drie afspraken, zodat een eigenaar geen opmaakcode hoeft
// te kennen en er nooit HTML in de pagina komt:
//   lege regel    = nieuwe alinea
//   "- " vooraan  = opsommingspunt
//   "# " vooraan  = tussenkop
// Gewone regels binnen een alinea blijven aparte regels (een regelafbreking).

export type Blok =
  | { soort: 'kop'; tekst: string }
  | { soort: 'alinea'; regels: string[] }
  | { soort: 'lijst'; punten: string[] }

// "#" of "-" alleen (zonder tekst) is een lege kop of een leeg punt: die vallen weg.
const KOP = /^#(?:\s+(.*))?$/
const PUNT = /^-(?:\s+(.*))?$/

export function parseerOpmaak(tekst: string): Blok[] {
  const blokken: Blok[] = []
  let alinea: string[] = []
  let lijst: string[] = []

  const sluit = () => {
    if (alinea.length > 0) blokken.push({ soort: 'alinea', regels: alinea })
    if (lijst.length > 0) blokken.push({ soort: 'lijst', punten: lijst })
    alinea = []
    lijst = []
  }

  for (const ruweRegel of tekst.replace(/\r\n?/g, '\n').split('\n')) {
    const regel = ruweRegel.trim()
    const kop = KOP.exec(regel)
    const punt = PUNT.exec(regel)
    if (regel === '') {
      sluit()
    } else if (kop) {
      sluit()
      if (kop[1]?.trim()) blokken.push({ soort: 'kop', tekst: kop[1].trim() })
    } else if (punt) {
      if (alinea.length > 0) sluit()
      if (punt[1]?.trim()) lijst = [...lijst, punt[1].trim()]
    } else {
      if (lijst.length > 0) sluit()
      alinea = [...alinea, regel]
    }
  }
  sluit()
  return blokken
}

/** Het aantal tekens zoals de teller het toont (regeleinden tellen als een teken). */
export function telTekens(tekst: string): number {
  return tekst.replace(/\r\n?/g, '\n').length
}
