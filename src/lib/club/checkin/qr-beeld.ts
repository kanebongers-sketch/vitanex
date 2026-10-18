// ─── Club, check-in: een QR-code als plaatje (SERVER-ONLY) ──────────────────
// Op de server, zodat de app geen QR-bibliotheek hoeft te laden. Donker op wit
// met een rustige rand: zo lezen camera's en scanners hem het snelst.

import QRCode from 'qrcode'
import { FIT_FACTORY } from '@/components/marketing/theme'

const QR_LICHT = '#ffffff'

/** De tekst als QR-code in een SVG-data-URL voor een gewone <img>, of null bij een fout. */
export async function qrDataUrl(tekst: string): Promise<string | null> {
  try {
    const svg = await QRCode.toString(tekst, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: FIT_FACTORY.zwart, light: QR_LICHT } })
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
  } catch (e) {
    console.error('[club/checkin] QR maken mislukt', e instanceof Error ? e.message : e)
    return null
  }
}
