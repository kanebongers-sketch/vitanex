// PATCH /api/club/medewerker-toegang/[id]  { actie: maken | goedkeuren | afwijzen | reset | intrekken, controle? }
// [id] is het id van de medewerker (club_medewerkers). Kane, de eigenaar of de
// clubmanager deelt de persoonlijke inloglink uit (maken, ook opnieuw maken),
// keurt de gekozen pincode goed met de controlecode die de medewerker noemt,
// of trekt de link in. Altijd binnen de eigen sportschool en alleen voor
// medewerkers van een vestiging die je zelf ziet. Een medewerker krijgt een 404.

import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesLoginActie, type LoginActie } from '@/lib/club/medewerker-login/medewerker-login'
import { beheerMedewerkerLogin } from '@/lib/club/medewerker-login/opslag'
import { magMedewerkerLoginsBeheren } from '@/lib/club/medewerker-login/rechten'

const LOG: Record<LoginActie, string> = {
  maken: 'Inloglink medewerker gemaakt',
  goedkeuren: 'Pincode medewerker goedgekeurd',
  afwijzen: 'Pincode medewerker afgewezen',
  reset: 'Pincode medewerker gereset',
  intrekken: 'Inloglink medewerker ingetrokken',
}

interface Context {
  params: Promise<{ id: string }>
}

/** Hoort deze medewerker bij de sportschool en bij een vestiging die deze persoon ziet? Dan zijn naam. */
async function naamBinnenBereik(t: ClubToegang, id: string): Promise<string | null | 'db'> {
  const { data, error } = await t.admin.from('club_medewerkers').select('naam, vestigingen').eq('user_id', t.userId).eq('id', id).maybeSingle()
  if (error) return 'db'
  const rij = data as { naam?: unknown; vestigingen?: unknown } | null
  if (!rij || typeof rij.naam !== 'string') return null
  const eigen = Array.isArray(rij.vestigingen) ? rij.vestigingen : []
  // Een medewerker zonder vestiging kan alleen Kane of de eigenaar beheren.
  const zichtbaar = eigen.length === 0 ? t.isKane || t.rol === 'eigenaar' : t.vestigingen.some((v) => eigen.includes(v.sleutel))
  return zichtbaar ? rij.naam : null
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!magMedewerkerLoginsBeheren(t)) return clubFout('Niet gevonden.', 404)
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const invoer = leesLoginActie(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const naam = await naamBinnenBereik(t, id)
  if (naam === 'db') return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  if (naam === null) return clubFout('Deze medewerker bestaat niet (meer).', 404)

  const uit = await beheerMedewerkerLogin(t.admin, t.userId, id, invoer.waarde, new Date())
  if (uit === 'controle_fout') return clubFout('Deze controlecode klopt niet. Vraag de medewerker opnieuw, of wijs de pincode af.', 400)
  if (uit === 'niet_gevonden') return clubFout('Er is geen actieve link voor deze medewerker, of de pincode is al beoordeeld. Is de medewerker nog in dienst?', 404)
  if (uit === 'db') return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, LOG[invoer.waarde.actie], naam, null)
  return clubJson({ ok: true })
}
