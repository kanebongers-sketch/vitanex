import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { GEEN_CACHE } from '@/lib/club/kern/verzoek'
import { isUuid } from '@/lib/club/rooster/invoer'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { bouwMedewerkerExport, medewerkerExportBestandsnaam } from '@/lib/club/personeel/avg'
import { haalMedewerkerExportRuw } from '@/lib/club/personeel/avg-opslag'

// GET /api/club/instellingen/medewerkers/[id]/gegevens
// Inzage (AVG): alles wat Club over een (oud-)medewerker bewaart, als JSON-download.
// Dezelfde poort als het bewerken van medewerkers (Instellingen, eigen vestigingen).
// Alleen voor de soort "medewerkers"; andere soorten bestaan hier niet.
// Het logboek krijgt alleen dat er gedownload is, nooit de inhoud.

export async function GET(req: NextRequest, { params }: { params: Promise<{ soort: string; id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { soort, id } = await params
  if (soort !== 'medewerkers' || !isUuid(id)) return clubFout('Niet gevonden.', 404)
  const buiten = await eisVestigingVanRecord(t, 'club_medewerkers', id)
  if (buiten) return buiten

  const uit = await haalMedewerkerExportRuw(t.admin, t.userId, id)
  if (!uit.ok) return clubFout(uit.fout === 'niet gevonden' ? 'Deze medewerker bestaat niet.' : 'De gegevens konden niet worden verzameld. Probeer het opnieuw.', uit.fout === 'niet gevonden' ? 404 : 500)

  const nu = new Date()
  const naam = typeof uit.ruw.medewerker.naam === 'string' ? uit.ruw.medewerker.naam : ''
  const vestigingen = new Map(t.vestigingen.map((v) => [v.sleutel, v.naam]))
  const bestand = bouwMedewerkerExport(uit.ruw, { sportschool: t.organisatie.naam, gemaaktOp: nu, vestigingen })
  await logActie(t, 'Gegevens medewerker gedownload (AVG)', naam || null, null)

  return new NextResponse(JSON.stringify(bestand, null, 2), {
    headers: {
      ...GEEN_CACHE,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${medewerkerExportBestandsnaam(naam, nu)}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
