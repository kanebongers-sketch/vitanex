import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesIntake } from '@/lib/club/training/intake'
import { lidVestiging } from '@/lib/club/training/schrijven'
import { medewerkerBestaat } from '@/lib/club/kern/medewerker'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'

// POST /api/club/training/intakes: een nieuwe intake voor een lid.
// Gezondheidsgegevens alleen met expliciete toestemming (zie leesIntake).

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const body: unknown = await req.json().catch(() => null)
  const invoer = leesIntake(body, dagSleutelNl(new Date()))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const i = invoer.waarde

  const vestiging = await lidVestiging(t.admin, t.userId, i.lidId)
  if (!vestiging) return clubFout('Dit lid bestaat niet (meer).', 404)
  if (!(await medewerkerBestaat(t.admin, t.userId, i.medewerkerId))) return clubFout('Onbekende trainer.', 400)

  const { data, error } = await t.admin
    .from('club_intakes')
    .insert({
      user_id: t.userId,
      lid_id: i.lidId,
      medewerker_id: i.medewerkerId,
      datum: i.datum,
      antwoorden: i.antwoorden,
      metingen: i.metingen,
      toestemming_gezondheid: i.toestemmingGezondheid,
      notitie: i.notitie,
    })
    .select('id')
    .single()
  if (error || typeof data?.id !== 'string') {
    if (error) console.error('[club/training] intake opslaan mislukt', error.message)
    return clubFout('De intake kon niet worden opgeslagen.', 500)
  }

  await logActie(t, 'Intake opgeslagen', i.toestemmingGezondheid ? 'met gezondheidsgegevens' : 'zonder gezondheidsgegevens', vestiging)
  return clubJson({ id: data.id }, 201)
}
