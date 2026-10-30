import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { rollenV2Aan } from '@/lib/club/rollen/schakelaar'
import { leesRolrechtenInvoer, rolrechtenNaarJson } from '@/lib/club/rollen/model'
import { rolrechtenVan } from '@/lib/club/rollen/profiel'
import { magRechtenWijzigen } from '@/lib/club/rollen/escalatie'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'

// PATCH /api/club/team/rechten  { rollen?: { <rol>: { <sleutel>: niveau } }, start?: { <rol>: sleutel } }
// Rechten per rol (rollen v2), in club_organisaties.instellingen.rolrechten.
// Alleen Kane en de eigenaar; wat alleen voor de eigenaar is, ligt vast (model.ts).

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!rollenV2Aan(t.organisatie.id)) return clubFout('Niet gevonden.', 404)
  if (!magRechtenWijzigen({ platform: t.isPlatformEigenaar, rollen: t.profiel?.rollen ?? [] })) return clubFout('Niet gevonden.', 404)
  const fouten = (await clubTekst(ROLLEN_TEKST)).fouten
  const invoer = leesRolrechtenInvoer(await leesJsonBegrensd(req, 16_384), rolrechtenVan(t.organisatie))
  if (!invoer.ok) return clubFout(fouten.ongeldig, 400)

  // Andere sleutels in de kolom (ledenapp, wizard, de oude rechten) blijven staan.
  const huidig = await t.admin.from('club_organisaties').select('instellingen').eq('id', t.organisatie.id).maybeSingle()
  if (huidig.error) {
    console.error('[club] instellingen lezen mislukt', huidig.error.message)
    return clubFout(fouten.opslaan, 500)
  }
  const ruw: unknown = (huidig.data as { instellingen?: unknown } | null)?.instellingen
  const overig = typeof ruw === 'object' && ruw !== null && !Array.isArray(ruw) ? ruw : {}
  const { error } = await t.admin
    .from('club_organisaties')
    .update({ instellingen: { ...overig, rolrechten: rolrechtenNaarJson(invoer.waarde) }, bijgewerkt_op: new Date().toISOString() })
    .eq('id', t.organisatie.id)
    .eq('beheerder_id', t.beheerderId)
  if (error) {
    console.error('[club] rechten opslaan mislukt', error.message)
    return clubFout(fouten.opslaan, 500)
  }
  await logActie(t, 'Rechten per rol aangepast', t.organisatie.naam, null)
  return clubJson({ ok: true })
}
