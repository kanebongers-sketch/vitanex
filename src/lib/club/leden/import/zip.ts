// ─── Club, leden inlezen: een ZIP-bestand uitpakken (PUUR) ──────────────────
// Een .xlsx is een ZIP met XML-bestanden. We lezen alleen de inhoudsopgave
// (central directory) en pakken uit wat we nodig hebben. Uitpakken gebeurt met
// de ingebouwde DecompressionStream van de browser (of Node); geen extra pakket.
// Grenzen tegen een "zipbom": een maximum per bestand en een maximum aantal
// bestanden. Versleutelde of gesplitste ZIP's weigeren we.

export type Inflate = (data: Uint8Array) => Promise<Uint8Array>

export interface ZipItem {
  naam: string
  methode: number
  gecomprimeerd: number
  grootte: number
  begin: number
  versleuteld: boolean
}

export class ZipFout extends Error {}

const EOCD = 0x06054b50
const CENTRAAL = 0x02014b50
const LOKAAL = 0x04034b50
export const MAX_ITEMS = 2000
/** Uitgepakt nooit meer dan dit per bestand (een ledenlijst van 5000 rijen is een paar MB). */
export const MAX_UITGEPAKT = 40 * 1024 * 1024

function u16(b: Uint8Array, i: number): number {
  return b[i] | (b[i + 1] << 8)
}

function u32(b: Uint8Array, i: number): number {
  return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0
}

/** Is dit (waarschijnlijk) een ZIP? De eerste vier bytes zijn dan PK\x03\x04. */
export function isZip(b: Uint8Array): boolean {
  return b.length >= 4 && u32(b, 0) === LOKAAL
}

function zoekEinde(b: Uint8Array): number {
  const ondergrens = Math.max(0, b.length - 22 - 65535)
  for (let i = b.length - 22; i >= ondergrens; i--) if (u32(b, i) === EOCD) return i
  throw new ZipFout('Geen geldig ZIP-bestand.')
}

/** De inhoudsopgave van de ZIP. */
export function zipInhoud(b: Uint8Array): ZipItem[] {
  const eind = zoekEinde(b)
  const aantal = u16(b, eind + 10)
  let pos = u32(b, eind + 16)
  if (aantal > MAX_ITEMS) throw new ZipFout('Dit bestand bevat te veel onderdelen.')
  const namen = new TextDecoder('utf-8')
  const items: ZipItem[] = []
  for (let n = 0; n < aantal; n++) {
    if (pos + 46 > b.length || u32(b, pos) !== CENTRAAL) throw new ZipFout('De inhoud van het bestand is beschadigd.')
    const naamLengte = u16(b, pos + 28)
    const extra = u16(b, pos + 30)
    const opmerking = u16(b, pos + 32)
    items.push({
      naam: namen.decode(b.subarray(pos + 46, pos + 46 + naamLengte)),
      versleuteld: (u16(b, pos + 8) & 1) === 1,
      methode: u16(b, pos + 10),
      gecomprimeerd: u32(b, pos + 20),
      grootte: u32(b, pos + 24),
      begin: u32(b, pos + 42),
    })
    pos += 46 + naamLengte + extra + opmerking
  }
  return items
}

/** Uitpakken met DecompressionStream('deflate-raw'), met een harde grens op de grootte. */
export async function inflateStandaard(data: Uint8Array): Promise<Uint8Array> {
  const stroom = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  const lezer = stroom.getReader()
  const stukken: Uint8Array[] = []
  let totaal = 0
  for (;;) {
    const { done, value } = await lezer.read()
    if (done) break
    totaal += value.length
    if (totaal > MAX_UITGEPAKT) {
      await lezer.cancel()
      throw new ZipFout('Dit bestand is uitgepakt te groot.')
    }
    stukken.push(value)
  }
  const uit = new Uint8Array(totaal)
  let i = 0
  for (const s of stukken) {
    uit.set(s, i)
    i += s.length
  }
  return uit
}

/** Een bestand uit de ZIP, of null als het er niet in zit. */
export async function pakUit(b: Uint8Array, items: readonly ZipItem[], naam: string, inflate: Inflate = inflateStandaard): Promise<Uint8Array | null> {
  const item = items.find((i) => i.naam === naam)
  if (!item) return null
  if (item.versleuteld) throw new ZipFout('Dit bestand is beveiligd met een wachtwoord.')
  if (item.grootte > MAX_UITGEPAKT) throw new ZipFout('Dit bestand is uitgepakt te groot.')
  const p = item.begin
  if (p + 30 > b.length || u32(b, p) !== LOKAAL) throw new ZipFout('De inhoud van het bestand is beschadigd.')
  const start = p + 30 + u16(b, p + 26) + u16(b, p + 28)
  const data = b.subarray(start, start + item.gecomprimeerd)
  if (data.length !== item.gecomprimeerd) throw new ZipFout('Het bestand is niet compleet.')
  if (item.methode === 0) return data
  if (item.methode !== 8) throw new ZipFout('Dit bestand gebruikt een inpakmethode die we niet kennen.')
  const uit = await inflate(data)
  if (uit.length > MAX_UITGEPAKT) throw new ZipFout('Dit bestand is uitgepakt te groot.')
  return uit
}
