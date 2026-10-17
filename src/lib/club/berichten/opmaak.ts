// ─── Club: eenvoudige opmaak van een bericht (PUUR) ─────────────────────────
// Berichten blijven gewone tekst (geen HTML, dus geen XSS). Twee afspraken:
// een lege regel begint een nieuwe alinea, en regels die met "- " beginnen
// worden een opsomming.

export type Blok = { soort: 'alinea'; regels: string[] } | { soort: 'lijst'; punten: string[] }

const PUNT = /^\s*[-*]\s+(.*)$/

/** De tekst als alinea's en opsommingen, in volgorde. */
export function blokken(tekst: string): Blok[] {
  const uit: Blok[] = []
  let huidig: Blok | null = null
  for (const ruw of tekst.replace(/\r\n?/g, '\n').split('\n')) {
    const punt = PUNT.exec(ruw)
    if (punt) {
      if (huidig?.soort !== 'lijst') {
        huidig = { soort: 'lijst', punten: [] }
        uit.push(huidig)
      }
      if (punt[1].trim()) huidig.punten.push(punt[1].trim())
    } else if (ruw.trim() === '') {
      huidig = null
    } else {
      if (huidig?.soort !== 'alinea') {
        huidig = { soort: 'alinea', regels: [] }
        uit.push(huidig)
      }
      huidig.regels.push(ruw.trim())
    }
  }
  return uit.filter((b) => (b.soort === 'lijst' ? b.punten.length > 0 : b.regels.length > 0))
}

/** Een korte platte voorproef (voor compacte kaarten): opsommingstekens weg, alles op een regel. */
export function voorproef(tekst: string, max = 140): string {
  const plat = blokken(tekst)
    .flatMap((b) => (b.soort === 'lijst' ? b.punten : b.regels))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plat.length <= max) return plat
  const knip = plat.slice(0, max)
  const spatie = knip.lastIndexOf(' ')
  return `${(spatie > max * 0.6 ? knip.slice(0, spatie) : knip).replace(/[,.;:]$/, '')}...`
}
