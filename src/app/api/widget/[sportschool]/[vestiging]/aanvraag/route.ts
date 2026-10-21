// POST /api/widget/<sportschool>/<vestiging>/aanvraag
// Een proefles of kennismaking aanvragen vanuit de boekingswidget op de website
// van een sportschool (src/app/(hoofd)/widget). Wordt een lead in Club, geen reservering.
//
// Beveiliging: alleen met CLUB_WIDGET_ACTIEF=1 en de widget aan voor deze
// vestiging, anders een gewone 404 (geen verschil tussen onbekend en uit). De
// widget draait in een iframe op ons eigen domein, dus het verzoek komt altijd
// van dezelfde oorsprong. Begrensde body (4 kB), honeypot, invoercontrole en
// een rem per IP en e-mailadres in de database (migratie 448).

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { GEEN_CACHE, ipVan, isZelfdeOorsprong } from '@/lib/lifeos/leads/toegang'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { widgetActief } from '@/lib/club/widget/schakelaar'
import { MAX_AANVRAAG_BYTES, leesWidgetAanvraag } from '@/lib/club/widget/invoer'
import { haalWidgetContext } from '@/lib/club/widget/opslag'
import { haalGekozenLes, remToestaan, verwerkAanvraag } from '@/lib/club/widget/aanvraag'

interface Context {
  params: Promise<{ sportschool: string; vestiging: string }>
}

function antwoord(data: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(data, { status, headers: GEEN_CACHE })
}

const NIET_GEVONDEN = { fout: 'Niet gevonden.' }

export async function POST(req: NextRequest, ctx: Context) {
  if (!widgetActief()) return antwoord(NIET_GEVONDEN, 404)
  if (!isZelfdeOorsprong(req.headers)) return antwoord({ fout: 'Dit verzoek komt niet van de widget.' }, 403)

  const body = await leesJsonBegrensd(req, MAX_AANVRAAG_BYTES)
  if (body === 'te-groot') return antwoord({ fout: 'Het verzoek is te groot.' }, 413)

  let admin: SupabaseClient
  try {
    admin = createLifeosAdminClient()
  } catch {
    return antwoord({ fout: 'Er ging iets mis. Probeer het later opnieuw.' }, 503)
  }
  const { sportschool, vestiging } = await ctx.params
  const c = await haalWidgetContext(admin, sportschool, vestiging)
  if (!c || !c.instellingen.aan) return antwoord(NIET_GEVONDEN, 404)

  const invoer = leesWidgetAanvraag(body)
  // Een bot (honeypot ingevuld) krijgt hetzelfde antwoord als een echte aanvraag.
  if (invoer.ok === 'spam') return antwoord({ ok: true }, 201)
  if (!invoer.ok) return antwoord({ fout: invoer.fout }, 400)
  const a = invoer.waarde

  const nu = new Date()
  const les = a.lesId ? await haalGekozenLes(admin, c.organisatie.id, c.vestiging, a.lesId, c.instellingen.lestypeIds, nu) : null
  if (a.lesId && !les) return antwoord({ fout: 'Deze les is niet meer te kiezen. Kies een andere les of vraag een kennismaking aan.' }, 400)

  if (!(await remToestaan(admin, c.organisatie.id, ipVan(req), a.email))) {
    return antwoord({ fout: 'We hebben je aanvraag al ontvangen. We nemen zo snel mogelijk contact met je op.' }, 429)
  }

  const gelukt = await verwerkAanvraag({ admin, userId: c.organisatie.id, vestiging: c.vestiging }, a, les)
  if (!gelukt) return antwoord({ fout: 'Je aanvraag kon niet worden verstuurd. Probeer het opnieuw.' }, 500)
  return antwoord({ ok: true }, 201)
}
