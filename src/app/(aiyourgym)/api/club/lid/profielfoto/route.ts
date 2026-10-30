import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { bewaarProfielfoto, verwijderProfielfoto } from '@/lib/club/profielfoto/opslag'
import { leesFotoUpload, uploadFout } from '@/lib/club/profielfoto/upload'

// POST   /api/club/lid/profielfoto  multipart: f256, f512 (WebP)
// DELETE /api/club/lid/profielfoto
// Het lid zet of haalt de eigen profielfoto weg in de ledenapp. Het lid komt
// altijd uit de sessie. In de voorvertoning van Kane verandert er niets: een
// foto "van het lid zelf" zet alleen het lid.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  if (l.voorvertoning) return clubFout('In de voorvertoning zet alleen het lid zelf een foto.', 403)
  const upload = await leesFotoUpload(req)
  if (!upload.ok) {
    const f = uploadFout(upload.code)
    return clubJson({ fout: f.fout, code: f.code }, f.status)
  }
  const versie = await bewaarProfielfoto(l.admin, { userId: l.userId, soort: 'lid', id: l.lid.id }, upload.bestanden, { bron: 'zelf', demo: l.lid.demo })
  if (!versie) {
    const f = uploadFout('opslaan')
    return clubJson({ fout: f.fout, code: f.code }, f.status)
  }
  return clubJson({ ok: true, versie })
}

export async function DELETE(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  if (l.voorvertoning) return clubFout('In de voorvertoning haalt alleen het lid zelf de foto weg.', 403)
  if (!(await verwijderProfielfoto(l.admin, { userId: l.userId, soort: 'lid', id: l.lid.id }))) return clubFout('De foto kon niet worden weggehaald. Probeer het opnieuw.', 500)
  return clubJson({ ok: true })
}
