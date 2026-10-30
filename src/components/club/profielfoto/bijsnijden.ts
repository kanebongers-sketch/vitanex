// Een profielfoto in de browser klaarmaken: vierkant uitsnijden en tekenen op
// 256 en 512 pixels, als WebP. Een canvas neemt geen metadata mee (geen EXIF,
// geen GPS, geen toestelnaam): alleen de pixels gaan naar de server.

import { FOTO_MATEN, MAX_BYTES, uitsnede, type FotoMaat } from '@/lib/club/profielfoto/model'

export interface Beeld {
  bron: CanvasImageSource
  breedte: number
  hoogte: number
  sluit: () => void
}

/** Leest een gekozen bestand, gedraaid zoals de telefoon hem nam (EXIF-stand). */
export async function leesBeeld(bestand: Blob): Promise<Beeld | null> {
  try {
    const b = await createImageBitmap(bestand, { imageOrientation: 'from-image' })
    return { bron: b, breedte: b.width, hoogte: b.height, sluit: () => b.close() }
  } catch {
    return null
  }
}

/** Tekent de uitsnede op een canvas van zijde x zijde pixels. */
export function tekenUitsnede(doek: HTMLCanvasElement, beeld: Beeld, zoom: number, x: number, y: number, zijde: number): boolean {
  const vak = uitsnede(beeld.breedte, beeld.hoogte, zoom, x, y)
  const ctx = doek.getContext('2d')
  if (!vak || !ctx) return false
  doek.width = zijde
  doek.height = zijde
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(beeld.bron, vak.x, vak.y, vak.zijde, vak.zijde, 0, 0, zijde, zijde)
  return true
}

function naarWebp(doek: HTMLCanvasElement, kwaliteit: number): Promise<Blob | null> {
  return new Promise((klaar) => doek.toBlob(klaar, 'image/webp', kwaliteit))
}

export type Gemaakt = { ok: true; bestanden: Record<FotoMaat, Blob> } | { ok: false; code: 'webp' | 'teGroot' }

/** Beide maten als WebP; een browser die geen WebP maakt (oud Safari) geeft een nette fout. */
export async function maakFotos(beeld: Beeld, zoom: number, x: number, y: number): Promise<Gemaakt> {
  const uit: Partial<Record<FotoMaat, Blob>> = {}
  for (const maat of FOTO_MATEN) {
    const doek = document.createElement('canvas')
    if (!tekenUitsnede(doek, beeld, zoom, x, y, maat)) return { ok: false, code: 'webp' }
    let blob: Blob | null = null
    for (const kwaliteit of [0.86, 0.74, 0.6]) {
      blob = await naarWebp(doek, kwaliteit)
      if (!blob || blob.type !== 'image/webp') return { ok: false, code: 'webp' }
      if (blob.size <= MAX_BYTES[maat]) break
    }
    if (!blob || blob.size > MAX_BYTES[maat]) return { ok: false, code: 'teGroot' }
    uit[maat] = blob
  }
  return { ok: true, bestanden: uit as Record<FotoMaat, Blob> }
}
