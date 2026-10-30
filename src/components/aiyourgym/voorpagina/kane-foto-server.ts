// ─── AI Your Gym: staat de foto van Kane klaar? (SERVER) ────────────────────
// Kijkt of public/aiyourgym/kane.jpg bestaat en leest de maten uit het bestand.
// Geen bestand of geen leesbare JPEG: null, en het blok toont alleen het citaat.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { KANE_FOTO_PAD, jpegMaat, type KaneFoto } from './kane-foto'

export function kaneFoto(): KaneFoto | null {
  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(readFileSync(join(process.cwd(), 'public', ...KANE_FOTO_PAD.split('/').filter(Boolean))))
  } catch {
    // Nog geen foto: dat is de normale stand tot Kane er een aanlevert.
    return null
  }
  const maat = jpegMaat(bytes)
  if (!maat) {
    console.error('[aiyourgym] invalid JPEG', KANE_FOTO_PAD)
    return null
  }
  return { src: KANE_FOTO_PAD, ...maat }
}
