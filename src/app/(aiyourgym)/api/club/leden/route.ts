// POST /api/club/leden  { voornaam, achternaam, email, telefoon?, vestiging, vormId?, uitnodigen? }
// Snel een lid toevoegen (besluit Kane 30-10-2026): naam en e-mail zijn genoeg.
// Daarna meteen de uitnodiging voor de ledenapp: de link voor de QR aan de
// balie, en een mail in de wachtrij als de mails aan staan. Onderdeel Leden
// (bewerken). Alleen in een vestiging die deze persoon ziet. Een lid met
// hetzelfde e-mailadres: 409 met het id, zodat de medewerker dat lid opent.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { leesSnelToevoegen, vormenVoorVestiging } from '@/lib/club/nieuwe-leden/regels'
import { maakSnelLid, nodigUit, zoekZelfdeAdres } from '@/lib/club/nieuwe-leden/toevoegen-opslag'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const w = NIEUWE_LEDEN[await getTaal()]
  const gelezen = await leesJsonOfTeGroot(req, 2000)
  if (gelezen instanceof NextResponse) return gelezen
  const vormen = await haalVormen(t.admin, t.userId)
  if (!vormen) return clubFout(w.fouten.laden, 500)
  const ruw = typeof gelezen.body === 'object' && gelezen.body !== null ? (gelezen.body as Record<string, unknown>) : {}
  const vestiging = typeof ruw.vestiging === 'string' ? ruw.vestiging : ''
  const invoer = leesSnelToevoegen(gelezen.body, t.vestigingen.map((v) => v.sleutel), vormenVoorVestiging(vormen, vestiging).map((v) => v.id))
  if (!invoer.ok) return clubFout(w.fouten[invoer.fout], 400)
  const i = invoer.waarde

  const dubbel = await zoekZelfdeAdres(t.admin, t.userId, i.email)
  if (dubbel === undefined) return clubFout(w.fouten.laden, 500)
  if (dubbel) return clubJson({ fout: w.toevoegen.dubbel, dubbel }, 409)

  const nu = new Date()
  const vormNaam = vormen.find((v) => v.id === i.vormId)?.naam ?? null
  const id = await maakSnelLid(t.admin, t.userId, i, vormNaam, nu)
  if (!id) return clubFout(w.fouten.opslaan, 500)
  await logActie(t, 'Lid toegevoegd', `${i.voornaam} ${i.achternaam}`, i.vestiging)

  const appKan = CLUB_LEDEN_LOGIN && moduleAan(t.organisatie, 'app') && !t.organisatie.demo
  const uitnodiging = i.uitnodigen && appKan ? await nodigUit(t.admin, t.organisatie, { id, voornaam: i.voornaam }, nu) : null
  return clubJson({ id, uitnodiging: uitnodiging?.staat === 'ok' ? { url: uitnodiging.url, mail: uitnodiging.mail } : null, appUit: !appKan }, 201)
}
