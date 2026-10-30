// ─── AI Your Gym: de foto van Kane op de voorpagina (PUUR) ──────────────────
// Zonder foto toont het blok "Gebouwd vanaf de vloer" een citaat in plaats van
// een portret (geen initialen of lege plek). De foto komt vanzelf zodra het
// bestand public/aiyourgym/kane.jpg bestaat (kane-foto-server.ts kijkt dat na
// en leest de echte maten uit het bestand). Liefst staand, minstens 1200 px
// hoog, rechtop opgeslagen (de draaiing uit de camera telt niet mee).

export interface KaneFoto {
  /** Pad vanaf public/, bijvoorbeeld '/aiyourgym/kane.jpg'. */
  src: string
  breedte: number
  hoogte: number
}

/** De vaste plek van de foto: zet hier een JPEG neer en het blok toont hem. */
export const KANE_FOTO_PAD = '/aiyourgym/kane.jpg'

/** Start-of-frame-markers van JPEG (niet C4 Huffman, C8 gereserveerd, CC rekenkundig). */
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])

/** Breedte en hoogte uit de kop van een JPEG, of null als het geen leesbare JPEG is. */
export function jpegMaat(bytes: Uint8Array): { breedte: number; hoogte: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return null
    const marker = bytes[i + 1]
    if (marker === 0xff) {
      i += 1
      continue
    }
    const lengte = (bytes[i + 2] << 8) | bytes[i + 3]
    if (SOF.has(marker)) {
      const hoogte = (bytes[i + 5] << 8) | bytes[i + 6]
      const breedte = (bytes[i + 7] << 8) | bytes[i + 8]
      return breedte > 0 && hoogte > 0 ? { breedte, hoogte } : null
    }
    if (lengte < 2) return null
    i += 2 + lengte
  }
  return null
}
