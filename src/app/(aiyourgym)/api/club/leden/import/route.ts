import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij, naamVan } from '@/lib/club/kern/vestigingen'
import { dagSleutel } from '@/lib/club/leden/tijd'
import { leesImportVerzoek, MAX_IMPORT_BYTES } from '@/lib/club/leden/import/verzoek'
import { planImport, voerImportUit } from '@/lib/club/leden/import/opslag'

// POST /api/club/leden/import  { vestiging, opslaan, rijen: [{ regel, voornaam, achternaam, ... }] }
// opslaan = false: alleen controleren en laten zien wat er gaat gebeuren.
// opslaan = true: nieuwe leden toevoegen en bestaande bijwerken. Er wordt nooit
// een lid verwijderd, en coach, tags en QR-code blijven altijd staan.

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const teGroot = () => clubFout('Dit bestand is te groot. Splits het in kleinere bestanden.', 413)
  // Eerst de opgegeven lengte: zo lezen we een te groot bericht niet eens in.
  if (Number(req.headers.get('content-length') ?? 0) > MAX_IMPORT_BYTES) return teGroot()
  const tekst = await req.text().catch(() => '')
  if (Buffer.byteLength(tekst) > MAX_IMPORT_BYTES) return teGroot()
  const body: unknown = (() => {
    try {
      return JSON.parse(tekst)
    } catch {
      return null
    }
  })()
  const verzoek = leesImportVerzoek(body, dagSleutel(new Date()))
  if (!verzoek.ok) return clubFout(verzoek.fout, 400)
  const { vestiging, opslaan, regels, fouten, waarschuwingen } = verzoek.waarde
  if (!hoortBij(t.vestigingen, vestiging)) return clubFout('Onbekende vestiging.', 400)

  const plan = await planImport(t.admin, t.userId, regels, vestiging)
  if (!plan) return clubFout('De bestaande leden konden niet worden gelezen. Probeer het opnieuw.', 500)

  if (!opslaan) {
    return clubJson({ telling: plan.telling, nietInBestand: plan.nietInBestand, fouten, waarschuwingen, rijen: plan.rijen })
  }

  const uit = await voerImportUit(t.admin, t.userId, regels, plan, vestiging)
  await logActie(
    t,
    'Ledenbestand ingelezen',
    `${uit.toegevoegd} nieuw, ${uit.bijgewerkt} bijgewerkt${uit.mislukt.length ? `, ${uit.mislukt.length} mislukt` : ''}`,
    vestiging,
  )
  return clubJson({ ...uit, vestiging: naamVan(t.vestigingen, vestiging) })
}
