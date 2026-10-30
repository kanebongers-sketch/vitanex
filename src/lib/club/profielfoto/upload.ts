// ─── Club: een upload van een profielfoto lezen (SERVER) ────────────────────
// De browser stuurt een formulier (multipart) met twee WebP-bestanden: f256 en
// f512. Hier controleren we de grootte van het verzoek en de bytes zelf; de
// rest (wie mag dit) doet de route.

import { FOTO_MATEN, MAX_BYTES, keurFoto, type FotoMaat } from './model'

export type GelezenUpload =
  | { ok: true; bestanden: Readonly<Record<FotoMaat, Uint8Array>>; velden: FormData }
  | { ok: false; code: 'formulier' | 'geenWebp' | 'maat' | 'teGroot' }

/** Het hele verzoek: beide bestanden plus wat ruimte voor de formulierkoppen. */
const MAX_VERZOEK = MAX_BYTES[256] + MAX_BYTES[512] + 8_000

export async function leesFotoUpload(req: Request): Promise<GelezenUpload> {
  const lengte = Number(req.headers.get('content-length') ?? '0')
  if (lengte > MAX_VERZOEK) return { ok: false, code: 'teGroot' }
  if (!(req.headers.get('content-type') ?? '').startsWith('multipart/form-data')) return { ok: false, code: 'formulier' }
  let velden: FormData
  try {
    velden = await req.formData()
  } catch {
    return { ok: false, code: 'formulier' }
  }
  const uit: Partial<Record<FotoMaat, Uint8Array>> = {}
  for (const maat of FOTO_MATEN) {
    const bestand = velden.get(`f${maat}`)
    if (!(bestand instanceof Blob)) return { ok: false, code: 'formulier' }
    if (bestand.size > MAX_BYTES[maat]) return { ok: false, code: 'teGroot' }
    const bytes = new Uint8Array(await bestand.arrayBuffer())
    const keuring = keurFoto(bytes, maat)
    if (!keuring.ok) return { ok: false, code: keuring.code }
    uit[maat] = bytes
  }
  return { ok: true, bestanden: uit as Record<FotoMaat, Uint8Array>, velden }
}

/** HTTP-status en vaste melding per fout (de pagina toont zijn eigen vertaalde tekst op code). */
export function uploadFout(code: 'formulier' | 'geenWebp' | 'maat' | 'teGroot' | 'toestemming' | 'opslaan'): { status: number; fout: string; code: string } {
  const lijst = {
    formulier: { status: 400, fout: 'Ongeldige upload.' },
    geenWebp: { status: 415, fout: 'Alleen een foto die de app zelf heeft verkleind.' },
    maat: { status: 400, fout: 'De foto heeft niet de juiste maat.' },
    teGroot: { status: 413, fout: 'De foto is te groot.' },
    toestemming: { status: 400, fout: 'Zonder toestemming van het lid kan de sportschool geen foto zetten.' },
    opslaan: { status: 500, fout: 'De foto kon niet worden bewaard. Probeer het opnieuw.' },
  } as const
  return { ...lijst[code], code }
}
