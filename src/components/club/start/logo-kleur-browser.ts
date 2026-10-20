// ─── Club startwizard: kleur uit een logo, in de browser (CLIENT) ───────────
// Tekent het logo klein (hooguit 64 pixels breed of hoog) op een canvas en
// geeft de pixels aan dominanteKleur. Geen pakketten, geen server: werkt met
// PNG, JPG, WebP en SVG. Lukt het niet (geen canvas, kapot bestand), dan null
// en houdt de eigenaar gewoon de kleur die er stond.

import { dominanteKleur } from '@/lib/club/start/logo-kleur'

const KANT = 64

function maat(b: number, h: number): { b: number; h: number } {
  const breed = b > 0 ? b : KANT
  const hoog = h > 0 ? h : KANT
  const schaal = KANT / Math.max(breed, hoog)
  return { b: Math.max(1, Math.round(breed * schaal)), h: Math.max(1, Math.round(hoog * schaal)) }
}

/** De merkkleur uit een bestand of een adres op dezelfde site; null als er geen is. */
export async function kleurUitAfbeelding(bron: Blob | string): Promise<string | null> {
  const url = typeof bron === 'string' ? bron : URL.createObjectURL(bron)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const { b, h } = maat(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = b
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, b, h)
    return dominanteKleur(ctx.getImageData(0, 0, b, h).data)
  } catch {
    return null
  } finally {
    if (typeof bron !== 'string') URL.revokeObjectURL(url)
  }
}
