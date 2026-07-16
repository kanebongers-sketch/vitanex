// GET /api/lifeos/herstel/[dienst]/callback — de leverancier stuurt de gebruiker
// terug. Valideert de state (CSRF), wisselt de code in voor tokens en slaat die
// op.
//
// Geen founder-gate hier, en dat kan niet anders: dit is een top-level
// browser-redirect vanaf WHOOP/Oura, zónder Authorization-header — er is dus
// niets om `vereisLifeosToegang` op te laten controleren. De CSRF-bescherming is
// de door ons getekende state: alleen onze eigen (wél founder-gated) koppel-route
// kan er een maken. De service-role client halen we daarom rechtstreeks op.

import { NextResponse, type NextRequest } from 'next/server'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { appBasis, dienstConfig, isKoppelbareDienst } from '@/lib/lifeos/herstel/diensten'
import { deEnigeGebruiker } from '@/lib/lifeos/herstel/gebruiker'
import { bewaarKoppeling } from '@/lib/lifeos/herstel/koppelingen'
import { KoppelFout, wisselCodeIn } from '@/lib/lifeos/herstel/oauth'
import { leesKoppelState } from '@/lib/lifeos/herstel/state'

export const dynamic = 'force-dynamic'

/**
 * Terug naar de app met een leesbare melding in de URL.
 *
 * Dit is een browser-redirect, dus een JSON-fout zou de gebruiker een kale
 * `{"fout": ...}` in beeld geven. Alleen voor fouten ná een geldige state —
 * een ongeldige state krijgt bewust géén nette terugweg (zie onder).
 */
function terug(dienst: string, reden: string | null) {
  const basis = appBasis()
  const url = new URL('/', basis ?? 'http://localhost:3100')
  url.searchParams.set(reden === null ? 'koppeling' : 'koppelfout', dienst)
  if (reden !== null) url.searchParams.set('reden', reden)
  return NextResponse.redirect(url.toString())
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dienst: string }> },
) {
  const { dienst } = await params
  if (!isKoppelbareDienst(dienst)) {
    return NextResponse.json({ fout: 'onbekende dienst' }, { status: 404 })
  }

  const zoek = request.nextUrl.searchParams

  // ── CSRF ────────────────────────────────────────────────────────────────
  // Eerst de state, vóór alle andere parameters. Een callback zonder geldige,
  // door ons getekende state is niet door onze koppel-route gestart — dan
  // wisselen we die code NIET in. Zo knoopt een aanvaller zijn eigen
  // WHOOP-account niet aan jouw LifeOS.
  //
  // Hard falen met een 400, geen vriendelijke redirect: hier hoort geen "probeer
  // het opnieuw"-knop, want een echte gebruiker komt hier nooit.
  const uitState = leesKoppelState(zoek.get('state'))
  if (uitState === null || uitState !== dienst) {
    return NextResponse.json({ fout: 'ongeldige state' }, { status: 400 })
  }

  // De gebruiker klikte "weigeren" bij de leverancier. Geen fout, maar een
  // keuze — en die verdient geen foutmelding.
  if (zoek.get('error') !== null) {
    return terug(dienst, 'geannuleerd')
  }

  const code = zoek.get('code')
  if (code === null || code.length === 0) {
    return terug(dienst, 'geen autorisatiecode ontvangen')
  }

  const config = dienstConfig(dienst)
  if (config === null) {
    return terug(dienst, 'deze koppeling is niet geconfigureerd')
  }

  // Dit request heeft geen Authorization-header (het is een redirect vanaf de
  // leverancier) en de state draagt geen user-id. Single-tenant: er is precies
  // één gebruiker. Kan dat niet eenduidig vastgesteld worden, dan slaan we
  // niets op — zie gebruiker.ts.
  const admin = createLifeosAdminClient()
  const userId = await deEnigeGebruiker(admin)
  if (userId === null) {
    return terug(dienst, 'kon het account niet vaststellen')
  }

  try {
    const token = await wisselCodeIn(config, code)
    await bewaarKoppeling(admin, userId, dienst, token)
  } catch (fout) {
    console.error(`[herstel] callback ${dienst} mislukt`, fout)
    return terug(dienst, fout instanceof KoppelFout ? fout.message : 'koppelen mislukt')
  }

  return terug(dienst, null)
}
