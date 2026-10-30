import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { leesBalieToestemming } from '@/lib/club/profielfoto/model'
import { bewaarProfielfoto, verwijderProfielfoto } from '@/lib/club/profielfoto/opslag'
import { leesFotoUpload, uploadFout } from '@/lib/club/profielfoto/upload'

// POST   /api/club/leden/[id]/profielfoto  multipart: f256, f512 (WebP), toestemming=true
//        De sportschool zet een foto bij een lid (bijvoorbeeld aan de balie).
//        Alleen met toestemming van het lid op dat moment: zonder vinkje weigert
//        de server. Moment, versie van de tekst en de medewerker gaan mee
//        (club_profielfotos, migratie 473). Het lid ziet dit in de ledenapp en
//        kan de foto daar altijd zelf weghalen.
// DELETE /api/club/leden/[id]/profielfoto
//        Foto weghalen (kan altijd).
// Voor wie Leden mag bewerken (vereisClubToegang: map leden).

async function eisLid(req: NextRequest, params: Promise<{ id: string }>): Promise<{ t: ClubToegang; lid: Lid } | NextResponse> {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_leden', id)
  if (buiten) return buiten
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid) return clubFout('Dit lid bestaat niet (meer).', 404)
  return { t, lid }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gevonden = await eisLid(req, params)
  if (gevonden instanceof NextResponse) return gevonden
  const { t, lid } = gevonden
  const upload = await leesFotoUpload(req)
  if (!upload.ok) {
    const f = uploadFout(upload.code)
    return clubJson({ fout: f.fout, code: f.code }, f.status)
  }
  if (!leesBalieToestemming(upload.velden.get('toestemming')).ok) {
    const f = uploadFout('toestemming')
    return clubJson({ fout: f.fout, code: f.code }, f.status)
  }
  const versie = await bewaarProfielfoto(t.admin, { userId: t.userId, soort: 'lid', id: lid.id }, upload.bestanden, { bron: 'sportschool', door: t.naam, demo: lid.demo })
  if (!versie) {
    const f = uploadFout('opslaan')
    return clubJson({ fout: f.fout, code: f.code }, f.status)
  }
  await logActie(t, 'Profielfoto gezet met toestemming van het lid', volledigeNaam(lid), lid.vestiging)
  return clubJson({ ok: true, versie })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gevonden = await eisLid(req, params)
  if (gevonden instanceof NextResponse) return gevonden
  const { t, lid } = gevonden
  if (!(await verwijderProfielfoto(t.admin, { userId: t.userId, soort: 'lid', id: lid.id }))) return clubFout('De foto kon niet worden weggehaald. Probeer het opnieuw.', 500)
  await logActie(t, 'Profielfoto weggehaald', volledigeNaam(lid), lid.vestiging)
  return clubJson({ ok: true })
}
