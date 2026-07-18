// GET /api/lifeos/agenda/kalenders — de agenda's waaruit je kunt kiezen.
//
// Lijst alleen de agenda's op waarin je mag SCHRIJVEN (owner/writer): in een
// alleen-lezen agenda kun je geen afspraak of focusblok plannen, dus die hoort
// niet in de kiezer. `gekozen` is de huidige keuze (null = de primaire agenda).
//
// ─── OPNIEUW KOPPELEN BIJ ONTBREKENDE SCOPE ─────────────────────────────────
// Het oplijsten vraagt de `calendarlist.readonly`-scope. Een koppeling van vóór
// functie 2 mist die en geeft een 403; dan sturen we het `opnieuw_koppelen`-sein
// (in `fout`, herkenbaar voor de UI) i.p.v. een kale foutmelding, zodat de kaart
// een nette "koppel opnieuw"-knop kan tonen.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { forceerVernieuwing, geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalKalenders, type KalendersUitkomst } from '@/lib/lifeos/agenda/google'
import { OPNIEUW_KOPPELEN } from '@/lib/lifeos/agenda/agenda'

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const token = await geldigToken(toegang.admin, toegang.userId)
  if (token.staat === 'niet_gekoppeld') {
    return NextResponse.json({ fout: 'Je agenda is niet gekoppeld.' }, { status: 409 })
  }
  if (token.staat === 'fout') {
    // 502, niet "leeg": Google even niet bereikbaar is iets anders dan geen agenda's.
    return NextResponse.json({ fout: 'Google is niet bereikbaar.' }, { status: 502 })
  }

  const uitkomst = await haalMetTweedeKans(toegang.admin, toegang.userId, token.toegangstoken)

  if (uitkomst.staat === 'verlopen') {
    return NextResponse.json(
      { fout: 'De agendakoppeling is verlopen. Koppel opnieuw.' },
      { status: 409 },
    )
  }
  if (uitkomst.staat === 'scope_ontbreekt') {
    return NextResponse.json(
      { fout: OPNIEUW_KOPPELEN, bericht: 'Koppel je agenda opnieuw om een agenda te kunnen kiezen.' },
      { status: 409 },
    )
  }
  if (uitkomst.staat === 'fout') {
    return NextResponse.json({ fout: 'Google is niet bereikbaar.' }, { status: 502 })
  }

  const gekozen = await leesGekozenKalender(toegang.admin, toegang.userId)
  return NextResponse.json({ kalenders: uitkomst.kalenders, gekozen })
}

/**
 * De kalenders ophalen, met precies één tweede kans bij een 401 mid-flight —
 * exact hetzelfde patroon als `sync/route.ts`. `geldigToken` ververst proactief,
 * maar een intrekking of wachtwoordwijziging wacht niet op onze `verloopt_op`;
 * één geforceerde refresh lost dat op. Blijft het 401, dan is de toestemming echt
 * weg en is "koppel opnieuw" het juiste antwoord.
 */
async function haalMetTweedeKans(
  admin: SupabaseClient,
  userId: string,
  token: string,
): Promise<KalendersUitkomst> {
  const eerste = await haalKalenders(token)
  if (eerste.staat !== 'verlopen') return eerste

  const vers = await forceerVernieuwing(admin, userId)
  if (vers.staat === 'niet_gekoppeld') return { staat: 'verlopen' }
  if (vers.staat === 'fout') return { staat: 'fout', reden: vers.reden }

  return haalKalenders(vers.toegangstoken)
}
