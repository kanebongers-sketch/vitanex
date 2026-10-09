// ─── PT-coaching — een opgeslagen verslag compleet opbouwen voor de pdf ─────
// SERVER-ONLY. Bij het afronden gaat het volledige verslag (met lead tracker,
// klanten en voorbereiding) per mail; wie 'm later downloadt kreeg tot nu toe
// alleen de scores en de notitie. Hier bouwen we 'm opnieuw op uit de database:
//   • leads die tussen het vorige en dít verslag bijkwamen (de lead tracker),
//   • wat er nú eerst opgepakt moet worden (stand van vandaag, zo gelabeld),
//   • de lopende abonnementen (stand van vandaag),
//   • de weekcheck-in die de PT'er vóór dat gesprek invulde.
// De oordelen over de vorige aandachtspunten worden niet per verslag bewaard en
// staan daarom niet in een later gedownloade pdf.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { haalLeadsVoor } from '@/lib/lifeos/leads/opslag'
import { dagSleutelNl, vatLeadsSamen } from '@/lib/lifeos/leads/leads'
import { haalKlantenVoorStrikt } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { klantRegel, vatKlantenSamen } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { kiesCheckin, weekVan } from '@/lib/lifeos/pt-dashboard/checkin'
import { haalCheckinsVanafVoor } from '@/lib/lifeos/pt-dashboard/checkin-opslag'
import { ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { RITME_DAGEN } from '@/lib/lifeos/pt-gesprek/ritme'
import { NextResponse } from 'next/server'
import { haalEvaluatie, haalEvaluaties } from './opslag'
import { maakVerslagPdf, verslagBestandsnaam, type VerslagPdfInvoer } from './pdf'

const DAG_MS = 24 * 60 * 60 * 1000

export interface GebouwdVerslag {
  persoonId: string
  naam: string
  op: Date
  invoer: VerslagPdfInvoer
}

export type VerslagBouw = { ok: true; waarde: GebouwdVerslag } | { ok: false; reden: 'niet_gevonden' | 'db' }

/** Alleen wat bij het gesprek hoort: leads die vóór (of op) het verslagmoment zijn ingevuld. */
function totMoment<T extends { aangemaaktOp: string }>(lijst: readonly T[], op: Date): T[] {
  return lijst.filter((l) => new Date(l.aangemaaktOp).getTime() <= op.getTime())
}

export async function bouwVerslag(admin: SupabaseClient, userId: string, id: string, nu: Date): Promise<VerslagBouw> {
  const evaluatie = await haalEvaluatie(admin, userId, id)
  if (!evaluatie.ok) return { ok: false, reden: 'db' }
  if (!evaluatie.waarde) return { ok: false, reden: 'niet_gevonden' }
  const ev = evaluatie.waarde
  const op = new Date(ev.aangemaaktOp)
  const ids = [ev.persoonId]

  const [personen, alle, leads, klanten, checkins] = await Promise.all([
    haalPersonen(admin, userId, 'pt_team'),
    haalEvaluaties(admin, userId, ev.persoonId),
    haalLeadsVoor(admin, userId, ids),
    haalKlantenVoorStrikt(admin, userId, ids),
    haalCheckinsVanafVoor(admin, userId, ids, weekVan(dagSleutelNl(new Date(op.getTime() - 7 * DAG_MS)))),
  ])
  const naam = personen.ok ? personen.waarde.find((p) => p.id === ev.persoonId)?.naam ?? 'PT-teamlid' : 'PT-teamlid'
  // Het verslag vóór dit verslag: vanaf daar telt de lead tracker. Zonder vorige: één ritme terug.
  const vorige = alle.ok ? alle.waarde.find((e) => e.aangemaaktOp < ev.aangemaaktOp) ?? null : null
  const sinds = vorige ? new Date(vorige.aangemaaktOp) : new Date(op.getTime() - RITME_DAGEN * DAG_MS)

  // Klanten niet leesbaar: liever een eerlijke fout dan een verslag met €0 en 0 abonnementen.
  if (!klanten) return { ok: false, reden: 'db' }
  const vandaag = dagSleutelNl(nu)
  const eigenLeads = leads.get(ev.persoonId) ?? []
  const eigenKlanten = klanten.get(ev.persoonId) ?? []
  const o = ptOverzicht(eigenLeads, eigenKlanten, vandaag)

  return {
    ok: true,
    waarde: {
      persoonId: ev.persoonId,
      naam,
      op,
      invoer: {
        naam,
        op,
        scores: ev.scores,
        notitie: ev.notitie,
        aandachtspunt: ev.aandachtspunt,
        leads: vatLeadsSamen(totMoment(eigenLeads, op), sinds, vandaag),
        opTePakken: { teLaat: o.teLaat, vandaag: o.vandaag, zonderPlan: o.zonderPlan },
        klanten: klantRegel(vatKlantenSamen(eigenKlanten, vandaag)),
        voorbereiding: kiesCheckin(checkins.get(ev.persoonId) ?? [], weekVan(dagSleutelNl(op)), vorige?.aangemaaktOp ?? null),
      },
    },
  }
}

/**
 * De pdf als HTTP-antwoord. `inline` opent in de browser (PT-app), anders een
 * download (LifeOS). Lukt het maken niet, dan een nette 500 zonder details.
 */
export async function verslagPdfAntwoord(
  v: GebouwdVerslag,
  { inline, headers }: { inline: boolean; headers: Record<string, string> },
): Promise<Response> {
  try {
    const pdf = await maakVerslagPdf(v.invoer)
    return new Response(new Uint8Array(pdf), {
      headers: {
        ...headers,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${verslagBestandsnaam(v.naam, v.op)}"`,
      },
    })
  } catch (oorzaak) {
    console.error('[coach-verslag] pdf maken mislukt', oorzaak instanceof Error ? oorzaak.message : oorzaak)
    return NextResponse.json({ fout: 'Kon de pdf niet maken.' }, { status: 500, headers })
  }
}
