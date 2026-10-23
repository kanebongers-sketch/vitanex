// ─── Club, betalen: lidgeld aan of uit voor een sportschool (SERVER-ONLY) ───
// Alleen Kane en de eigenaar (de route gebruikt vereisBetalenBeheer), en alleen
// met CLUB_LIDGELD_ACTIEF aan. Schrijft alleen lidgeld_aan: schaduw blijft zoals
// hij is (standaard aan, dan wordt er niets geincasseerd) en incasso_aan ook.

import type { NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, type ClubToegang } from '@/lib/club/toegang'
import { haalLidgeldStand } from './toegang'

export async function zetLidgeld(t: ClubToegang, aan: unknown): Promise<NextResponse> {
  if (typeof aan !== 'boolean') return clubFout('Kies aan of uit.', 400)
  const { error } = await t.admin
    .from('club_betalen_accounts')
    .upsert({ user_id: t.userId, lidgeld_aan: aan, bijgewerkt_op: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) {
    console.error('[club/betalen] lidgeldschakelaar bewaren mislukt', error.code ?? '', error.message)
    return clubFout('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, aan ? 'Lidgeld aangezet' : 'Lidgeld uitgezet', null, null)
  const stand = await haalLidgeldStand(t.admin, t.userId)
  return clubJson({ stand: stand ?? { lidgeldAan: aan, schaduw: true, incassoAan: false } })
}
