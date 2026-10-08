// ─── PT-app — documenten uploaden (BROWSER) ─────────────────────────────────
// Drie stappen per bestand, elk met een eerlijke fout:
//   1. POST /api/lifeos/pt-documenten/upload-url → pad + signed upload URL
//   2. PUT het bestand rechtstreeks naar Supabase Storage (niet via Render)
//   3. POST /api/lifeos/pt-documenten → metadata vastleggen (server checkt het object)
//
// Stap 2 doet hetzelfde als `uploadToSignedUrl` uit @supabase/storage-js
// (v2.105, de tak voor een niet-Blob body): PUT naar
// `<storage>/object/upload/sign/<bucket>/<pad>?token=…` met `content-type`,
// `x-upsert: false` en `cache-control`. Bewust géén supabase-js-client: die zou
// een sleutel van het LifeOS-project in de browser nodig hebben, en het token in
// de URL is precies de autorisatie. Wél XMLHttpRequest i.p.v. fetch: alleen die
// meldt de uploadvoortgang (fetch kan dat niet in Safari/Firefox).
// De body is het bestand zelf (geen FormData), zodat de opslag de mime krijgt die
// de server afleidde — niet het soms lege `File.type` van de browser.

import { haalJson, type HaalUitkomst } from '@/lib/lifeos/api/http'
import { soortVanBestand } from './documenten'
import { leesDocument, leesUploadTicket, type DocumentInvoer, type PtDocument } from './documenten-lezers'

type Stap = { ok: true } | { ok: false; fout: string }

/** Een leesbare melding bij een mislukte PUT naar de opslag. */
export function opslagFout(status: number, tekst: string): string {
  let bericht = ''
  try {
    const ruw: unknown = JSON.parse(tekst)
    if (typeof ruw === 'object' && ruw !== null) {
      const r = ruw as Record<string, unknown>
      bericht = typeof r.message === 'string' ? r.message : typeof r.error === 'string' ? r.error : ''
    }
  } catch {
    bericht = ''
  }
  if (status === 413 || /maximum allowed size|too large/i.test(bericht)) {
    return 'Te groot voor de opslag. Verklein het bestand (max. 50 MB).'
  }
  if (status === 400 && /signature|jwt|token|expired/i.test(bericht)) {
    return 'De uploadlink is verlopen of ongeldig. Probeer het opnieuw.'
  }
  return `Uploaden naar de opslag mislukt (${status || 'geen antwoord'}${bericht ? `: ${bericht}` : ''}).`
}

function zetNaarOpslag(url: string, bestand: File, mime: string, opVoortgang: (fractie: number) => void): Promise<Stap> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('content-type', mime)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('cache-control', 'max-age=3600')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) opVoortgang(e.loaded / e.total)
    }
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300 ? { ok: true } : { ok: false, fout: opslagFout(xhr.status, xhr.responseText) })
    xhr.onerror = () => resolve({ ok: false, fout: 'Geen verbinding met de opslag. Controleer je internet en probeer het opnieuw.' })
    xhr.onabort = () => resolve({ ok: false, fout: 'Upload afgebroken.' })
    xhr.send(bestand)
  })
}

const JSON_POST = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

/** Upload één bestand + metadata. `opVoortgang` krijgt 0…1 tijdens stap 2. */
export async function uploadDocument(
  bestand: File,
  meta: Omit<DocumentInvoer, 'pad'>,
  opVoortgang: (fractie: number) => void,
): Promise<HaalUitkomst<PtDocument>> {
  const soort = soortVanBestand(bestand.name)
  if (!soort) return { ok: false, fout: 'Dit bestandstype kan niet.', status: 0 }

  const ticket = await haalJson(
    '/api/lifeos/pt-documenten/upload-url',
    leesUploadTicket,
    JSON_POST({ bestandsnaam: bestand.name, grootte: bestand.size, mime: soort.mime }),
  )
  if (!ticket.ok) return ticket

  const put = await zetNaarOpslag(ticket.waarde.signedUrl, bestand, soort.mime, opVoortgang)
  if (!put.ok) return { ok: false, fout: put.fout, status: 0 }
  opVoortgang(1)

  return haalJson('/api/lifeos/pt-documenten', leesDocument, JSON_POST({ ...meta, pad: ticket.waarde.pad }))
}
