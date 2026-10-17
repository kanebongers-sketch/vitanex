// ─── Club, afspraken: hulp voor de ledenapp-routes (SERVER-ONLY) ────────────
// De ledenapp is nu een voorvertoning voor de beheerder: het lid komt uit de
// vraag (?lid= of body) en moet bij deze sportschool en een eigen vestiging
// horen. Straks komt het lid uit de eigen inlog van het lid.

import type { NextResponse } from 'next/server'
import { clubFout, type ClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { haalLid, magTrainen, type Lid } from '@/lib/club/kern/lid'
import { isUuid } from './invoer'

/** Het lid voor de app, of een foutantwoord. */
export async function lidVoorApp(t: ClubToegang, lidId: unknown): Promise<Lid | NextResponse> {
  if (!isUuid(lidId)) return clubFout('Onbekend lid.', 400)
  const lid = await haalLid(t.admin, t.userId, lidId)
  if (!lid || !hoortBij(t.vestigingen, lid.vestiging)) return clubFout('Onbekend lid.', 404)
  if (!magTrainen(lid.status)) return clubFout('Met dit lidmaatschap kun je geen afspraken maken. Vraag het aan de balie.', 403)
  return lid
}
