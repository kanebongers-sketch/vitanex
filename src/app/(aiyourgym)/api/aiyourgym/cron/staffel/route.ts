// ─── GET/POST /api/aiyourgym/cron/staffel: actieve leden tellen per vestiging ─
// Besluit Kane (31-10-2026): de prijs per vestiging volgt een staffel op het
// aantal actieve leden. Eens per dag (bijvoorbeeld 03:00 via cron-job.org):
//   1. Per sportschool met een Stripe-abonnement: het hoofdabonnement aan de
//      eerste vestiging koppelen en ontbrekende vestigingen een eigen
//      abonnement geven (vangnet; normaal gebeurt dat meteen).
//   2. Per abonnement de actieve leden tellen en als hoeveelheid bij Stripe
//      zetten met proration_behavior=none (staffel-telling.ts): de nieuwe
//      staffel geldt vanaf de volgende factuur. Een logregel per dag
//      (ayg_staffel_log), dus twee keer draaien op een dag doet niets extra.
// Boven 5000 leden: niets automatisch, een melding voor Kane (club_fouten).
// Slot: CLUB_CRON_SECRET (zolang leeg: CRON_SECRET) in een kop, zie
// src/lib/club/kern/cron-geheim.ts. Zonder Stripe-sleutel doet de route niets.

import { type NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { clubCronToegestaan } from '@/lib/club/kern/cron-geheim'
import { dagInNederland } from '@/lib/club/leden/actief-tellen'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { eigenPrijzen, stripeSleutel } from '@/lib/aiyourgym/config'
import { leesAbonnementRegels } from '@/lib/aiyourgym/pakket-wijziging'
import { haalAbonnement, werkAbonnementBij } from '@/lib/aiyourgym/stripe-api'
import { hoeveelheidFormulier } from '@/lib/aiyourgym/vestiging-abonnement'
import { telAlles, type TelDeps } from '@/lib/aiyourgym/staffel-telling'
import { actieveLedenVan, alGeteld, schrijfLog, sportscholenMetStripe, telbareAbonnementen, vorigeWasOpMaat, werkTelRijBij } from '@/lib/aiyourgym/staffel-opslag'
import { zorgVoorVestigingAbonnementen } from '@/lib/aiyourgym/vestiging-abonnement-opslag'
import { stuurStaffelMail } from '@/lib/aiyourgym/staffel-mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function antwoord(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function deps(admin: SupabaseClient, sleutel: string, dag: string): TelDeps {
  return {
    dag,
    eigen: eigenPrijzen(),
    alGeteld: (id, d) => alGeteld(admin, id, d),
    telLeden: (org, vestiging, d) => actieveLedenVan(admin, org, vestiging, d),
    haalRegels: async (id) => {
      const json = await haalAbonnement(sleutel, id)
      const regels = leesAbonnementRegels(json)
      const status = (json as { status?: unknown } | null)?.status
      return regels ? { status: typeof status === 'string' ? status : null, regels } : null
    },
    zetHoeveelheid: (id, regels, n, idem) => werkAbonnementBij(sleutel, id, hoeveelheidFormulier(regels, eigenPrijzen(), n), idem),
    schrijfLog: (l) => schrijfLog(admin, l),
    werkRijBij: (id, velden) => werkTelRijBij(admin, id, velden),
    meldOpMaat: async (a, leden) => {
      if (await vorigeWasOpMaat(admin, a.abonnementId, dag)) return
      await meldFout({ fout: `Vestiging met ${leden} actieve leden (meer dan 5000): prijs op maat afspreken, niets automatisch gewijzigd (${a.abonnementId})`, route: '/api/aiyourgym/cron/staffel', methode: 'POST', soort: 'handmatig' }, admin)
    },
    mailWissel: (w) => stuurStaffelMail(admin, w),
  }
}

async function verwerk(req: NextRequest): Promise<NextResponse> {
  if (!clubCronToegestaan(req)) return antwoord({ fout: 'Unauthorized' }, 401)
  const sleutel = stripeSleutel()
  if (!sleutel) return antwoord({ aan: false })
  try {
    const admin = clubDatabase()
    const sportscholen = await sportscholenMetStripe(admin)
    if (!sportscholen) return antwoord({ fout: 'De abonnementen konden niet gelezen worden.' }, 502)
    const koppelen: Record<string, number> = {}
    for (const id of sportscholen) {
      const uit = await zorgVoorVestigingAbonnementen(admin, id).catch(() => 'fout' as const)
      koppelen[uit] = (koppelen[uit] ?? 0) + 1
    }
    const abonnementen = await telbareAbonnementen(admin)
    if (!abonnementen) return antwoord({ fout: 'De abonnementen per vestiging konden niet gelezen worden.' }, 502)
    const dag = dagInNederland(new Date())
    const telling = await telAlles(abonnementen, deps(admin, sleutel, dag))
    return antwoord({ aan: true, dag, koppelen, telling })
  } catch (err) {
    console.error('[aiyourgym] staffel cron mislukt', err instanceof Error ? err.message : 'onbekend')
    return antwoord({ fout: 'Verwerken mislukt.' }, 500)
  }
}

export const GET = verwerk
export const POST = verwerk
