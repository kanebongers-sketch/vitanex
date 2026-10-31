'use client'

// Laden en uitpakken van de frames in de browser. De regels (welke maat, hoe
// lang bewaren) staan puur in geheugen.ts; hier alleen fetch, decode en
// vrijgeven. Ingepakt = de webp-bestanden als Blob (klein), uitgepakt =
// ImageBitmap (of een <img> waar createImageBitmap ontbreekt).

import { FrameVoorraad, MAX_OEFENINGEN, isTelefoon, type SchermProfiel } from './geheugen'

export type Frame = ImageBitmap | HTMLImageElement

export interface Uitgepakt {
  beelden: readonly Frame[]
  /** Geeft alle uitgepakte beelden vrij. */
  los: () => void
}

/** Breedte van een frame in px; 0 als hij al is vrijgegeven. */
export function breedteVan(f: Frame): number {
  return f instanceof HTMLImageElement ? f.naturalWidth : f.width
}

export function hoogteVan(f: Frame): number {
  return f instanceof HTMLImageElement ? f.naturalHeight : f.height
}

/** Een voorraad voor de hele pagina: hoogstens 2 oefeningen, uitgepakt alleen zolang in gebruik. */
export const VOORRAAD = new FrameVoorraad<readonly Blob[], Uitgepakt>(MAX_OEFENINGEN, (k) => k.los())

interface Verbinding {
  saveData?: boolean
}

export function leesSchermProfiel(): SchermProfiel {
  if (typeof window === 'undefined') return { telefoon: false, zuinig: false }
  const grof = window.matchMedia('(pointer: coarse)').matches
  const korte = Math.min(window.screen?.width ?? Infinity, window.screen?.height ?? Infinity)
  const verbinding = (navigator as Navigator & { connection?: Verbinding }).connection
  return { telefoon: isTelefoon(grof, korte), zuinig: verbinding?.saveData === true }
}

/** Wacht tot het stilstaande beginbeeld er is (hoogstens even), zodat het nooit met de frames om voorrang vecht. */
export function wachtOpPoster(src: string, maxMs = 1500): Promise<void> {
  const img = new Image()
  img.src = src
  const geladen = img.decode().then(
    () => undefined,
    () => undefined,
  )
  return Promise.race([geladen, new Promise<void>((klaar) => setTimeout(klaar, maxMs))])
}

/** Haalt alle bestanden op, hoogstens `tegelijk` tegelijk, in volgorde van index. */
export async function haalBestanden(adressen: readonly string[], opStap: () => void, tegelijk = 6): Promise<Blob[]> {
  const uit: Blob[] = new Array(adressen.length)
  let volgende = 0
  async function werker(): Promise<void> {
    while (volgende < adressen.length) {
      const i = volgende++
      const antwoord = await fetch(adressen[i])
      if (!antwoord.ok) throw new Error(`frame load failed: ${adressen[i]} (${antwoord.status})`)
      uit[i] = await antwoord.blob()
      opStap()
    }
  }
  await Promise.all(Array.from({ length: Math.min(tegelijk, adressen.length) }, werker))
  return uit
}

async function pakEenUit(blob: Blob, adressen: string[]): Promise<Frame> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob)
  const adres = URL.createObjectURL(blob)
  adressen.push(adres)
  const img = new Image()
  img.decoding = 'async'
  img.src = adres
  await img.decode()
  return img
}

function sluit(beelden: readonly (Frame | undefined)[], adressen: readonly string[]): void {
  for (const b of beelden) if (b && !(b instanceof HTMLImageElement)) b.close()
  for (const a of adressen) URL.revokeObjectURL(a)
}

/** Pakt alle bestanden uit. Lukt een beeld niet, dan wordt alles wat al uitgepakt is vrijgegeven. */
export async function pakUit(bestanden: readonly Blob[], opStap: () => void): Promise<Uitgepakt> {
  const adressen: string[] = []
  const beelden: (Frame | undefined)[] = new Array(bestanden.length)
  try {
    await Promise.all(
      bestanden.map(async (blob, i) => {
        beelden[i] = await pakEenUit(blob, adressen)
        opStap()
      }),
    )
  } catch (fout) {
    sluit(beelden, adressen)
    throw fout
  }
  const klaar = beelden as Frame[]
  return { beelden: klaar, los: () => sluit(klaar, adressen) }
}
