import { type NextRequest } from 'next/server'
import { clubFout, clubJson, clubToegang } from '@/lib/club/toegang'
import { isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { bewaarProfielfoto, verwijderProfielfoto } from '@/lib/club/profielfoto/opslag'
import { eigenProfielId } from '@/lib/club/profielfoto/toegang'
import { leesFotoUpload, uploadFout } from '@/lib/club/profielfoto/upload'

// POST   /api/club/profielfoto/ik  multipart: f256, f512 (WebP)
// DELETE /api/club/profielfoto/ik
// De eigen profielfoto van wie in Club werkt (medewerker, eigenaar, clubmanager).
// Iedereen die binnen is mag dit voor zichzelf, los van de rechten per onderdeel:
// het gaat alleen over de eigen foto. Wie het is komt altijd uit de sessie.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function wie(req: NextRequest) {
  const t = await clubToegang()
  if (!t) return { fout: clubFout('Niet gevonden.', 404) }
  if (!isZelfdeOorsprong(req.headers)) return { fout: clubFout('Dit verzoek komt niet van de app zelf.', 403) }
  const id = await eigenProfielId(t)
  if (!id) return { fout: clubFout('Je hebt hier geen eigen profiel.', 404) }
  return { t, id }
}

export async function POST(req: NextRequest) {
  const w = await wie(req)
  if ('fout' in w) return w.fout
  const upload = await leesFotoUpload(req)
  if (!upload.ok) {
    const f = uploadFout(upload.code)
    return clubJson({ fout: f.fout, code: f.code }, f.status)
  }
  const versie = await bewaarProfielfoto(w.t.admin, { userId: w.t.userId, soort: 'mw', id: w.id }, upload.bestanden, { bron: 'zelf' })
  if (!versie) {
    const f = uploadFout('opslaan')
    return clubJson({ fout: f.fout, code: f.code }, f.status)
  }
  return clubJson({ ok: true, versie })
}

export async function DELETE(req: NextRequest) {
  const w = await wie(req)
  if ('fout' in w) return w.fout
  if (!(await verwijderProfielfoto(w.t.admin, { userId: w.t.userId, soort: 'mw', id: w.id }))) return clubFout('De foto kon niet worden weggehaald. Probeer het opnieuw.', 500)
  return clubJson({ ok: true })
}
