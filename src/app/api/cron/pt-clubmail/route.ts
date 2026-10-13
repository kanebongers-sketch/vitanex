// ─── GET /api/cron/pt-clubmail — wekelijkse clubmail per clubmanager ────────
// Maandag (pg_cron 'pt-clubmail', migratie 370): per actieve clubmanager met een
// e-mailadres een samenvatting van zijn club(s) — aantallen, geen namen van
// leads of klanten (zie clubmail.ts).
//
// Slot: het gedeelde CRON_SECRET (fail-closed). Versturen kan alleen met een
// afzender op een in Resend geverifieerd domein (PT_MAIL_VAN, bv.
// "Fit Factory PT <pt@fitfactorypt.nl>"); het testadres van Resend levert
// alleen bij de accounteigenaar af. Zonder afzender: 503 en er gebeurt niets.
// Idempotent: per manager per week één rij in pt_clubmail; wie die insert wint,
// verstuurt. Mislukt het versturen, dan gaat de claim terug.

import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { leesClubs } from '@/lib/lifeos/leads/links'
import { haalPtTeamGegevens } from '@/lib/lifeos/pt-dashboard/team-opslag'
import { voorClub } from '@/lib/lifeos/pt-dashboard/club-filter'
import { bouwClubmail, clubWeek } from '@/lib/lifeos/pt-dashboard/clubmail'
import { clubsLabel } from '@/lib/lifeos/pt-dashboard/clubs'
import { maandagVan } from '@/lib/lifeos/pt-dashboard/analyse'
import { ptUrl } from '@/lib/fit-factory/domein'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function antwoord(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(req: NextRequest): Promise<Response> {
  const gegeven = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!geheimGelijk(process.env.CRON_SECRET ?? '', gegeven)) return antwoord({ fout: 'Unauthorized' }, 401)
  const afzender = process.env.PT_MAIL_VAN?.trim()
  if (!process.env.RESEND_API_KEY || !afzender) {
    return antwoord({ fout: 'Geen afzender ingesteld (PT_MAIL_VAN op een geverifieerd domein, en RESEND_API_KEY).' }, 503)
  }

  const admin = createLifeosAdminClient()
  const userId = lifeosUserId()
  const vandaag = dagSleutelNl(new Date())
  const week = maandagVan(vandaag)

  const { data: links, error } = await admin
    .from('pt_lead_links')
    .select('persoon_id, code, clubs, persoon:crm_personen(naam, email, status)')
    .eq('user_id', userId)
    .eq('rol', 'clubmanager')
    .eq('actief', true)
  if (error || !Array.isArray(links)) return antwoord({ fout: 'Clubmanagers konden niet gelezen worden.' }, 502)
  const managers = (links as unknown[]).flatMap((ruw) => {
    const l = ruw as { persoon_id: string; code: string; clubs: unknown; persoon: unknown }
    const p = (Array.isArray(l.persoon) ? l.persoon[0] : l.persoon) as { naam?: string; email?: string | null; status?: string } | null
    const clubs = leesClubs(l.clubs)
    const email = p?.email?.trim() ?? ''
    return p?.naam && p.status !== 'inactief' && clubs.length > 0 && EMAIL.test(email) ? [{ id: l.persoon_id, code: l.code, naam: p.naam.split(' ')[0], email, clubs }] : []
  })
  if (managers.length === 0) return antwoord({ verstuurd: 0, reden: 'geen clubmanagers met een e-mailadres' })

  const team = await haalPtTeamGegevens(admin, userId)
  if (!team) return antwoord({ fout: 'Het PT-team kon niet gelezen worden.' }, 502)

  const resend = new Resend(process.env.RESEND_API_KEY)
  let verstuurd = 0
  const mislukt: string[] = []
  for (const m of managers) {
    // Claim: alleen wie de insert wint, verstuurt (twee aanroepen tegelijk = één mail).
    const claim = await admin.from('pt_clubmail').insert({ persoon_id: m.id, week })
    if (claim.error) continue
    const mail = bouwClubmail(m.naam, clubsLabel(m.clubs), clubWeek(voorClub(team, m.clubs), vandaag), ptUrl(`/${m.code}`))
    const { error: fout } = await resend.emails.send({ from: afzender, to: m.email, subject: mail.onderwerp, text: mail.tekst, html: mail.html })
    if (fout) {
      console.error('[pt-clubmail] versturen mislukt voor', m.code, fout)
      await admin.from('pt_clubmail').delete().eq('persoon_id', m.id).eq('week', week)
      mislukt.push(m.code)
    } else verstuurd++
  }
  return antwoord({ verstuurd, mislukt, week })
}
