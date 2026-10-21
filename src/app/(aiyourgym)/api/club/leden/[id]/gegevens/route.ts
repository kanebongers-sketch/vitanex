import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { GEEN_CACHE } from '@/lib/club/kern/verzoek'
import { bouwExport, bouwSamenvatting, exportBestandsnaam } from '@/lib/club/leden/avg/export'
import { haalExportRuw } from '@/lib/club/leden/avg/opslag'

// GET /api/club/leden/[id]/gegevens?vorm=json|tekst
// Inzage (AVG): alles wat Club over dit lid bewaart, als download. Voor wie
// Leden mag (de poort regelt dat per rol) en alleen in de eigen vestigingen.
// Het logboek krijgt alleen dat er gedownload is, nooit de inhoud.

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_leden', id)
  if (buiten) return buiten
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid) return clubFout('Dit lid bestaat niet (meer).', 404)

  const uit = await haalExportRuw(t.admin, t.userId, lid.id)
  if (!uit.ok) return clubFout(uit.fout === 'niet gevonden' ? 'Dit lid bestaat niet (meer).' : 'De gegevens konden niet worden verzameld. Probeer het opnieuw.', uit.fout === 'niet gevonden' ? 404 : 500)

  const nu = new Date()
  const meta = { sportschool: t.organisatie.naam, gemaaktOp: nu, vestigingNaam: naamVan(t.vestigingen, lid.vestiging) }
  const tekst = req.nextUrl.searchParams.get('vorm') === 'tekst'
  const inhoud = tekst ? bouwSamenvatting(uit.ruw, meta) : JSON.stringify(bouwExport(uit.ruw, uit.medewerkers, meta), null, 2)
  await logActie(t, tekst ? 'Samenvatting gegevens lid gedownload' : 'Gegevens lid gedownload (AVG)', volledigeNaam(lid), lid.vestiging)

  return new NextResponse(inhoud, {
    headers: {
      ...GEEN_CACHE,
      'Content-Type': tekst ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exportBestandsnaam(uit.ruw.lid, nu, tekst ? 'txt' : 'json')}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
