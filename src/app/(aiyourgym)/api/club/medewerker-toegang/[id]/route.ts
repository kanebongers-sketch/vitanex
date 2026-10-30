// PATCH /api/club/medewerker-toegang/[id]  { actie: uitnodigen, email, mailen? } | { actie: intrekken }
// [id] is het id van de medewerker (club_medewerkers). Kane, de eigenaar of de
// clubmanager met Instellingen nodigt een medewerker uit met zijn e-mailadres
// (antwoord: het pad van de eenmalige uitnodigingslink, alleen nu te zien) of
// trekt zijn login in. Altijd binnen de eigen sportschool en alleen voor
// medewerkers van een vestiging die je zelf ziet. Een medewerker krijgt een 404.
// Met `mailen: true` (de startwizard) gaat de link ook per e-mail naar de
// medewerker, als er een afzender is ingesteld; `gemaild` zegt wat er gebeurde
// (verstuurd, niet_ingesteld of mislukt), het pad komt altijd mee als reserve.
// Het logboek krijgt de actie en de naam, nooit het e-mailadres of de link.

import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesLoginActie, uitnodigingPad, type LoginActie } from '@/lib/club/medewerker-login/medewerker-login'
import { beheerMedewerkerLogin } from '@/lib/club/medewerker-login/opslag'
import { magMedewerkerLoginsBeheren } from '@/lib/club/medewerker-login/rechten'
import { stuurUitnodigMail, type MailUitkomst } from '@/lib/club/medewerker-login/uitnodig-mail'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/aiyourgym/schakelaar'
import { isEigenaar } from '@/lib/club/rollen/wie'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'

const LOG: Record<LoginActie, string> = {
  uitnodigen: 'Medewerker uitgenodigd',
  intrekken: 'Login medewerker ingetrokken',
}

/** Uitnodigen per sportschool: ruim voor een team, te weinig om e-mailadressen af te tasten. */
const UITNODIGEN_MAX = 40
const UITNODIGEN_VENSTER_MS = 60 * 60_000

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
  const zichtbaar = eigen.length === 0 ? isEigenaar(t) : t.vestigingen.some((v) => eigen.includes(v.sleutel))
  return zichtbaar ? rij.naam : null
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!magMedewerkerLoginsBeheren(t)) return clubFout('Niet gevonden.', 404)
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const body: unknown = await req.json().catch(() => null)
  const invoer = leesLoginActie(body)
  const mailen = typeof body === 'object' && body !== null && (body as { mailen?: unknown }).mailen === true
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const naam = await naamBinnenBereik(t, id)
  if (naam === 'db') return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  if (naam === null) return clubFout('Deze medewerker bestaat niet (meer).', 404)

  if (invoer.waarde.actie === 'uitnodigen' && isRateLimited(`club-mw-uitnodigen:${t.userId}`, UITNODIGEN_MAX, UITNODIGEN_VENSTER_MS)) {
    return clubFout('Te veel uitnodigingen in korte tijd. Probeer het over een uur opnieuw.', 429)
  }

  const uit = await beheerMedewerkerLogin(t.admin, t.userId, id, invoer.waarde, new Date())
  // Fase 2 van de rollen (een account voor meerdere sportscholen) komt nog: zeg dat eerlijk (docs/club/ROLLEN-PLAN.md).
  if (uit.staat === 'email_bezet') return clubFout((await clubTekst(ROLLEN_TEKST)).fouten.emailElders, 409)
  if (uit.staat === 'niet_gevonden') return clubFout('Deze medewerker heeft geen login om in te trekken, of is niet meer in dienst.', 404)
  if (uit.staat === 'db') return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, LOG[invoer.waarde.actie], naam, null)
  const pad = uit.token ? uitnodigingPad(uit.token) : null
  let gemaild: MailUitkomst | null = null
  if (mailen && pad && invoer.waarde.actie === 'uitnodigen') {
    const link = t.organisatie.slug ? sportschoolUrl(t.organisatie.slug, subdomeinenActief(), pad) : `${req.nextUrl.origin}${pad}`
    gemaild = await stuurUitnodigMail({ naar: invoer.waarde.email, naam, sportschool: t.organisatie.naam, link })
  }
  return clubJson({ ok: true, pad, gemaild })
}
