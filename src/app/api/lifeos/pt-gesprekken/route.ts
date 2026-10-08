// GET /api/lifeos/pt-gesprekken — het wekelijkse PT-coachgesprek per PT'er.
//
// Voor elk PT-teamlid (CRM-groep `pt_team`): staat er binnen het komende ritme
// een afspraak "Coachgesprek PT - Kane (Naam)" in je agenda? Zo ja → geregeld;
// zo nee → nog inplannen. De detectie leest LIVE uit Google (de gekozen agenda,
// dezelfde waar de "Inplannen"-knop de afspraak in zet), zodat een net-gemaakte
// afspraak meteen afvinkt en er geen valse "nog inplannen" ontstaat door een
// cache die maar 7 dagen ver reikt.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { bepaalStatus, type PtEvent, type PtGesprekkenAntwoord } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { teamExtra, type AgendaBlok } from '@/lib/lifeos/pt-gesprek/team'
import { haalLaatsteEvaluaties, haalOpenPunten, haalRecenteEvaluaties } from '@/lib/lifeos/pt-coaching/opslag'
import { RITME_DAGEN } from '@/lib/lifeos/pt-gesprek/ritme'
import { haalLeadsVoor } from '@/lib/lifeos/leads/opslag'
import { zorgVoorLinks } from '@/lib/lifeos/leads/links'
import { dagSleutelNl, vatLeadsSamen } from '@/lib/lifeos/leads/leads'
import { haalKlantenVoor } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { klantRegel, vatKlantenSamen } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { huidigeWeek } from '@/lib/lifeos/pt-dashboard/checkin'
import { haalCheckinsVoor } from '@/lib/lifeos/pt-dashboard/checkin-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** "Ingepland" = binnen het komende ritme (een week) plus een paar dagen speling. */
const VENSTER_DAGEN = RITME_DAGEN + 2
/** Zoveel gesprekken toont het scoreverloop per PT'er. */
const VERLOOP_GESPREKKEN = 8
const TERUG_DAGEN = 21

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  // 1. Het PT-team uit het CRM.
  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_team')
  if (!personen.ok) {
    return NextResponse.json({ fout: 'Kon je PT-team niet lezen.' }, { status: 502 })
  }

  // 2. Het agenda-token. "Niet gekoppeld" is een eigen tak (de kaart toont dan de
  //    koppel-CTA), geen lege lijst die "alles geregeld" zou suggereren.
  const token = await geldigToken(toegang.admin, toegang.userId)
  if (token.staat === 'niet_gekoppeld') {
    const antwoord: PtGesprekkenAntwoord = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }
  if (token.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  // 3. De afspraken van de komende dagen uit de gekozen agenda.
  const kalenderId = await leesGekozenKalender(toegang.admin, toegang.userId)
  // Terug (voor "verslag invullen" en het voorstel) én vooruit (wat staat er gepland).
  // Vooruit tot ruim na het voorstel, zodat een botsing met iets anders zichtbaar is.
  const nu = new Date()
  const van = new Date(nu.getTime() - TERUG_DAGEN * 24 * 60 * 60 * 1000)
  const tot = new Date(nu.getTime() + (VENSTER_DAGEN + 7) * 24 * 60 * 60 * 1000)

  const events = await haalEvents(token.toegangstoken, van, tot, kalenderId)
  if (events.staat === 'verlopen') {
    const antwoord: PtGesprekkenAntwoord = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }
  if (events.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  // 4. De regel toepassen (puur, getest in pt-gesprek.test.ts).
  // "Ingepland" = een gesprek binnen het venster.
  const grens = nu.getTime() + VENSTER_DAGEN * 24 * 60 * 60 * 1000
  const ptEvents: PtEvent[] = events.events
    .filter((e) => e.startOp.getTime() >= nu.getTime() && e.startOp.getTime() <= grens)
    .map((e) => ({ titel: e.titel, startOp: e.startOp.toISOString() }))
  const team = personen.waarde.filter((p) => p.status !== 'inactief')
  const agenda: AgendaBlok[] = events.events.map((e) => ({ titel: e.titel, startOp: e.startOp, eindOp: e.eindOp, heleDag: e.heleDag }))
  const ids = team.map((p) => p.id)
  const [laatste, recent, punten, links, leads, klanten, checkins] = await Promise.all([
    haalLaatsteEvaluaties(toegang.admin, toegang.userId, ids),
    haalRecenteEvaluaties(toegang.admin, toegang.userId, ids, VERLOOP_GESPREKKEN),
    haalOpenPunten(toegang.admin, toegang.userId, ids),
    zorgVoorLinks(toegang.admin, toegang.userId, team),
    haalLeadsVoor(toegang.admin, toegang.userId, ids),
    haalKlantenVoor(toegang.admin, toegang.userId, ids),
    haalCheckinsVoor(toegang.admin, toegang.userId, ids, huidigeWeek(nu)),
  ])
  const vandaag = dagSleutelNl(nu)
  // Leads tellen vanaf het vorige verslag; zonder verslag de afgelopen week.
  const weekTerug = new Date(nu.getTime() - RITME_DAGEN * 24 * 60 * 60 * 1000)
  const pts = bepaalStatus(
    team.map((p) => ({ id: p.id, naam: p.naam, email: p.email })),
    ptEvents,
  ).map((s) => {
    const ev = laatste.get(s.id)
    const vorige = ev ? { id: ev.id, op: ev.aangemaaktOp, scores: ev.scores, notitie: ev.notitie, aandachtspunt: ev.aandachtspunt } : null
    const verloop = [...(recent.get(s.id) ?? [])].reverse().map((e) => ({ op: e.aangemaaktOp, scores: e.scores }))
    const link = links.get(s.id) ?? null
    const leadsSinds = vorige ? new Date(vorige.op) : weekTerug
    return {
      ...s,
      extra: {
        ...teamExtra(s.naam, agenda, vorige, nu),
        openPunten: punten.get(s.id) ?? [],
        verloop,
        leadLink: link,
        leads: link ? vatLeadsSamen(leads.get(s.id) ?? [], leadsSinds, vandaag) : null,
        klanten: link ? klantRegel(vatKlantenSamen(klanten.get(s.id) ?? [], vandaag)) : null,
        checkin: checkins.get(s.id) ?? null,
      },
    }
  })

  const antwoord: PtGesprekkenAntwoord = { gekoppeld: true, pts }
  return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
}
