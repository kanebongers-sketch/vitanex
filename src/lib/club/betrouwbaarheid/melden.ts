// ─── Foutregistratie: opslaan in club_fouten (SERVER-ONLY) ──────────────────
// Twee ingangen:
//   1. src/instrumentation.ts (onRequestError): elke fout die Next zelf vangt
//      op een pagina, API-route of server action van Club, de ledenapp of
//      AI Your Gym.
//   2. meldFout(): voor fouten die een route zelf afvangt en netjes beantwoordt
//      (die ziet Next niet).
//
//   } catch (fout) {
//     await meldFout({ fout, route: '/api/aiyourgym/checkout', methode: 'POST', soort: 'route' })
//     return NextResponse.json({ fout: 'Er ging iets mis.' }, { status: 500 })
//   }
//
// Best-effort: melden mag nooit zelf een fout gooien of een verzoek breken.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { maakFoutRegel, maakRem, type FoutInvoer, type FoutRegel } from './fout'
import { regelUitVerzoek, type VerzoekContext, type VerzoekFout } from './verzoek'

/** Per server hooguit 60 meldingen per minuut; daarboven tellen we niet mee. */
const magMelden = maakRem(60, 60_000)

async function bewaar(regel: FoutRegel, admin?: SupabaseClient): Promise<void> {
  if (!magMelden()) return
  try {
    const db = admin ?? createLifeosAdminClient()
    const { error } = await db.rpc('club_fout_melden', {
      p_fingerprint: regel.fingerprint,
      p_gebied: regel.gebied,
      p_route: regel.route,
      p_methode: regel.methode,
      p_soort: regel.soort,
      p_sportschool: regel.sportschool,
      p_melding: regel.melding,
    })
    if (error) console.error('[betrouwbaarheid] fout opslaan mislukt', error.message)
  } catch (fout) {
    console.error('[betrouwbaarheid] fout opslaan mislukt', fout instanceof Error ? fout.message : 'onbekend')
  }
}

/** Een afgevangen fout vastleggen. Doet niets voor routes buiten Club en AI Your Gym. */
export async function meldFout(invoer: FoutInvoer, admin?: SupabaseClient): Promise<void> {
  const regel = maakFoutRegel(invoer)
  if (regel) await bewaar(regel, admin)
}

/** Voor onRequestError in src/instrumentation.ts. */
export async function meldVerzoekFout(fout: unknown, verzoek: VerzoekFout, context: VerzoekContext): Promise<void> {
  const regel = regelUitVerzoek(fout, verzoek, context)
  if (regel) await bewaar(regel)
}
