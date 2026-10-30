import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { MAX_NAAM, leesHuisstijl } from '@/lib/club/kern/organisatie-invoer'
import { bewaarHuisstijl } from '@/lib/club/kern/organisatie-opslag'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'

// PATCH /api/club/organisatie  { naam, slogan, kleurAccent, kleurTweede, kleurTint, variant, uit: Module[] }
// De naam, huisstijl en onderdelen van de sportschool die nu open staat. Alleen
// Kane en de eigenaar (onderdeel huisstijl; nooit een clubmanager of medewerker).
// Het adres (slug) verandert hier nooit mee: dat is PATCH /api/club/organisatie/adres.
// Fouten in de naam komen terug in de taal van de gebruiker.

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const f = (await clubTekst(HUISSTIJL)).fouten
  const invoer = leesHuisstijl(await req.json().catch(() => null))
  if (!invoer.ok) {
    const fout = invoer.code === 'naamTeLang' ? f.naamTeLang(MAX_NAAM) : invoer.code ? f[invoer.code] : invoer.fout
    return clubFout(fout, 400)
  }
  const oud = t.organisatie.naam
  const uit = await bewaarHuisstijl(t, invoer.waarde)
  if (!uit.ok) return uit.code === 'naamBezet' ? clubFout(f.naamBezet, 409) : clubFout(f.opslaan, 500)
  if (uit.naamGewijzigd) await logActie(t, 'Naam sportschool aangepast', `${oud} wordt ${invoer.waarde.naam}`, null)
  await logActie(t, 'Huisstijl aangepast', invoer.waarde.naam, null)
  return clubJson({ ok: true, naam: invoer.waarde.naam })
}
