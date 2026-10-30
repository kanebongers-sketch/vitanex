import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { rollenV2Aan } from '@/lib/club/rollen/schakelaar'
import { activeerVoorWerk, haalProfiel, telEigenaren, zetAlleVestigingen, zetRollen } from '@/lib/club/rollen/opslag'
import { beoordeelRollen } from '@/lib/club/rollen/escalatie'
import { WERKROLLEN, isRol, type Rol } from '@/lib/club/rollen/typen'
import { schoneRollen } from '@/lib/club/rollen/model'
import { v2Minstens } from '@/lib/club/rollen/wie'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'

// PATCH /api/club/team/[id]  { rollen: Rol[], alleVestigingen?: boolean }
// De rollen van een profiel (rollen v2). Regels in src/lib/club/rollen/escalatie.ts:
// een clubmanager geeft alleen werkrollen, er blijft altijd een eigenaar.

interface Invoer {
  rollen: Rol[]
  alleVestigingen: boolean | null
}

function leesInvoer(body: unknown): Invoer | null {
  if (typeof body !== 'object' || body === null) return null
  const o = body as Record<string, unknown>
  if (!Array.isArray(o.rollen) || o.rollen.length > 6 || !o.rollen.every(isRol)) return null
  if (o.alleVestigingen !== undefined && typeof o.alleVestigingen !== 'boolean') return null
  return { rollen: schoneRollen(o.rollen), alleVestigingen: typeof o.alleVestigingen === 'boolean' ? o.alleVestigingen : null }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!rollenV2Aan(t.organisatie.id)) return clubFout('Niet gevonden.', 404)
  const fouten = (await clubTekst(ROLLEN_TEKST)).fouten
  const { id } = await params
  if (!isUuid(id)) return clubFout(fouten.onbekend, 404)
  const invoer = leesInvoer(await leesJsonBegrensd(req, 4096))
  if (!invoer) return clubFout(fouten.ongeldig, 400)

  const huidig = await haalProfiel(t.admin, t.userId, id)
  if (!huidig) return clubFout(fouten.onbekend, 404)
  const eigenaren = await telEigenaren(t.admin, t.userId)
  if (eigenaren === null) return clubFout(fouten.opslaan, 500)
  const eraf = huidig.rollen.includes('eigenaar') && !invoer.rollen.includes('eigenaar')
  const gever = { platform: t.isPlatformEigenaar, rollen: t.profiel?.rollen ?? [], teamBeheer: v2Minstens(t, 'team', 'beheren') === true }
  const oordeel = beoordeelRollen(gever, huidig.rollen, invoer.rollen, eigenaren - (eraf ? 1 : 0))
  if (!oordeel.ok) return clubFout(oordeel.reden === 'laatste_eigenaar' ? fouten.laatsteEigenaar : fouten.escalatie, oordeel.reden === 'laatste_eigenaar' ? 409 : 403)

  const ok = await zetRollen(t.admin, t.userId, id, huidig.rollen, invoer.rollen, t.naam)
  if (!ok) return clubFout(fouten.opslaan, 500)
  // Een werkrol erbij (ook voor de eigenaar die zelf traint): het profiel wordt personeel.
  if (invoer.rollen.some((r) => WERKROLLEN.includes(r) || r === 'manager') && !(await activeerVoorWerk(t.admin, t.userId, id, t.vestigingen.map((v) => v.sleutel)))) {
    return clubFout(fouten.opslaan, 500)
  }
  if (invoer.alleVestigingen !== null && invoer.alleVestigingen !== huidig.alleVestigingen) {
    if (!(await zetAlleVestigingen(t.admin, t.userId, id, invoer.alleVestigingen))) return clubFout(fouten.opslaan, 500)
  }
  await logActie(t, 'Rollen aangepast', invoer.rollen.join(', ') || 'geen rol', null)
  return clubJson({ ok: true, rollen: invoer.rollen })
}
