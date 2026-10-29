// Een maaltijdfoto in de browser verkleinen voor hij naar de server gaat: de
// langste zijde naar 1024 px, als JPEG. Dat scheelt upload, tijd en kosten bij
// de AI-dienst (minder beeldtokens). Telefoonfoto's van 3 tot 8 MB worden zo
// ongeveer 100 tot 300 kB. De foto blijft verder alleen in het geheugen.

export const MAX_ZIJDE = 1024
export const JPEG_KWALITEIT = 0.82

/** De nieuwe maat: nooit groter dan het origineel, verhouding gelijk, hele pixels. */
export function verkleinMaat(breedte: number, hoogte: number, max: number = MAX_ZIJDE): { breedte: number; hoogte: number } {
  if (!(breedte > 0) || !(hoogte > 0)) return { breedte: 0, hoogte: 0 }
  const f = Math.min(1, max / Math.max(breedte, hoogte))
  return { breedte: Math.max(1, Math.round(breedte * f)), hoogte: Math.max(1, Math.round(hoogte * f)) }
}

/** Verkleint een gekozen foto tot een JPEG-blob; null als de browser het beeld niet kan lezen. */
export async function verkleinFoto(bestand: Blob): Promise<Blob | null> {
  let beeld: ImageBitmap
  try {
    // from-image: draait de foto zoals de telefoon hem nam (EXIF-stand).
    beeld = await createImageBitmap(bestand, { imageOrientation: 'from-image' })
  } catch {
    return null
  }
  try {
    const maat = verkleinMaat(beeld.width, beeld.height)
    if (maat.breedte === 0) return null
    const doek = document.createElement('canvas')
    doek.width = maat.breedte
    doek.height = maat.hoogte
    const ctx = doek.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(beeld, 0, 0, maat.breedte, maat.hoogte)
    return await new Promise<Blob | null>((klaar) => doek.toBlob(klaar, 'image/jpeg', JPEG_KWALITEIT))
  } finally {
    beeld.close()
  }
}
