// ─── Club, voedingsdagboek: gedeelde poort voor de AI-routes (SERVER-ONLY) ──
// Met CLUB_VOEDING_AI_ACTIEF uit (standaard) of zonder sleutel bestaat de route
// niet (404). Daarna: een lid dat het dagboek gestart heeft, geen voorvertoning,
// uitdrukkelijke toestemming voor de AI-schatting (403 zonder), en twee remmen
// per lid: per minuut en per dag (elke aanroep kost geld).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { teVaak, vereisLidVoeding, type LidVoeding } from '../server'
import { aiFuncties, type AiFuncties } from './schakelaar'
import type { AiUitslag } from './server'

/** Per lid per minuut; ruim voor een maaltijd, te weinig om kosten op te jagen. */
export const MAX_PER_MINUUT = 6
/** Per lid per 24 uur (foto en schatten samen). Ruim voor een dag eten, een plafond voor de kosten. */
export const MAX_PER_DAG = 30
const DAG_MS = 24 * 60 * 60 * 1000

/** Codes die de ledenapp naar een eigen tekst vertaalt (de server-tekst is alleen Nederlands). */
export const AI_CODE = { toestemming: 'toestemming', daglimiet: 'daglimiet' } as const

function foutMetCode(fout: string, code: string, status: number): NextResponse {
  return NextResponse.json({ fout, code }, { status, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * De daglimiet. Best-effort per serverinstantie (geheugen, net als de minuutrem);
 * na een herstart begint de telling opnieuw. Als kostenplafond is dat genoeg.
 */
export function overDaglimiet(lidId: string, nu: number = Date.now()): boolean {
  return isRateLimited(`club-voeding-ai-dag:${lidId}`, MAX_PER_DAG, DAG_MS, nu)
}

export async function vereisLidAi(req: NextRequest, functie: keyof AiFuncties): Promise<LidVoeding | NextResponse> {
  if (!aiFuncties()[functie]) return clubFout('Niet gevonden.', 404)
  const l = await vereisLidVoeding(req, { schrijft: true, gestart: true })
  if (l instanceof NextResponse) return l
  if (!l.instellingen.aiToestemmingOp) return foutMetCode('Geef eerst toestemming voor de AI-schatting.', AI_CODE.toestemming, 403)
  if (teVaak('ai', l.lid.id, MAX_PER_MINUUT)) return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  if (overDaglimiet(l.lid.id)) return foutMetCode('Je hebt vandaag het maximum bereikt. Vul het zelf in of probeer het morgen opnieuw.', AI_CODE.daglimiet, 429)
  return l
}

const FOUT: Readonly<Record<number, string>> = {
  422: 'Dit kon niet worden ingeschat. Vul het zelf in.',
  503: 'Deze functie is nu niet beschikbaar.',
}

export function alsAiAntwoord(u: AiUitslag): NextResponse {
  if (u.ok) return clubJson(u.respons)
  return clubFout(FOUT[u.status] ?? 'Dat lukte even niet. Probeer het opnieuw of vul het zelf in.', u.status)
}
