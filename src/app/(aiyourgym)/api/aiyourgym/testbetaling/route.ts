import type { NextRequest } from 'next/server'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isGeremd } from '@/lib/club/kern/rem-db'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { welkomPad } from '@/lib/aiyourgym/links'
import { rondTestbetalingAf } from '@/lib/aiyourgym/testbetaling-opslag'
import { standaardDeps } from '@/lib/aiyourgym/welkom-mail'
import { adminOfNull, aygFout, aygJson, poortOpen, publiekeHost } from '@/lib/aiyourgym/api'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { startSessie, vindBeheerderOpEmail } from '@/lib/club/beheerders/beheerder-opslag'
import { zetClubSessie } from '@/lib/club/kern/sessie-cookie'

// POST /api/aiyourgym/testbetaling  { sessie: 'test_...' }
// Rondt een nagespeelde betaling af (zolang Stripe er niet is, besluit Kane
// 23-10-2026): de sportschool wordt ingericht zoals na een echte betaling en
// de eigenaar is meteen ingelogd (sessiecookie), zodat de startwizard direct
// begint. Er wordt niets afgeschreven. Het geheime sessie-id is het enige
// bewijs, net als bij Stripe, en inloggen gebeurt alleen bij de eerste
// geslaagde afronding (een tweede klik gaat naar de welkomstpagina).

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await poortOpen())) return aygFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return aygFout('Dit verzoek komt niet van de website zelf.', 403)
  if (await isGeremd({ soort: 'ayg-testbetaling', max: 10, vensterMs: 10 * 60_000, bijStoring: 'geheugen' }, ipVan(req))) return aygFout('Te veel pogingen. Probeer het over een paar minuten opnieuw.', 429)
  const body = await leesJsonBegrensd(req, 1024)
  if (body === 'te-groot') return aygFout('Het verzoek is te groot.', 413)
  const sessie = typeof body === 'object' && body !== null ? (body as { sessie?: unknown }).sessie : null
  const admin = adminOfNull()
  if (!admin) return aygFout('Afronden lukt nu niet. Probeer het later opnieuw.', 503)

  const uit = await rondTestbetalingAf(admin, sessie, standaardDeps())
  if (uit.staat === 'onbekend') return aygFout('Deze betaling kennen we niet (meer). Meld je opnieuw aan.', 404)
  if (uit.staat === 'fout') {
    await meldFout({ fout: 'Testbetaling: inrichten mislukt', route: '/api/aiyourgym/testbetaling', methode: 'POST', soort: 'handmatig' })
    return aygFout('Je sportschool klaarzetten lukte niet. Probeer het opnieuw.', 502)
  }
  const welkom = aygJson({ staat: 'klaar', url: welkomPad(publiekeHost(req), siteActief(), String(sessie)) })
  if (uit.staat !== 'ingericht') return welkom
  const nu = new Date()
  const eigenaar = await vindBeheerderOpEmail(admin, uit.email)
  const login = eigenaar && eigenaar.organisatieId === uit.organisatieId ? await startSessie(admin, eigenaar, nu) : null
  if (!login) return welkom
  return zetClubSessie(aygJson({ staat: 'ingelogd', url: '/club' }), 'beheerder', login.token, login.verlooptOp)
}
