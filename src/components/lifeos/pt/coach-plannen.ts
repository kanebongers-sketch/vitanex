import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { coachgesprekTitel, type PtStatus } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { GESPREK_DUUR_MIN } from '@/lib/lifeos/pt-gesprek/ritme'

// Een coachgesprek in de agenda zetten (browser): titel volgens de afspraak, de
// vaste duur en een uitnodiging als de PT'er een mailadres heeft. Gebruikt door het
// inplanformulier en door "volgens patroon inplannen".

export type PlanUitkomst = { ok: true } | { ok: false; fout: string }

/** `datum` YYYY-MM-DD en `tijd` HH:MM in de tijd van de browser (Nederland). */
export async function planCoachgesprek(pt: Pick<PtStatus, 'naam' | 'email'>, datum: string, tijd: string): Promise<PlanUitkomst> {
  const start = new Date(`${datum}T${tijd}`)
  if (Number.isNaN(start.getTime())) return { ok: false, fout: 'Kies een geldige datum en tijd.' }
  const eind = new Date(start.getTime() + GESPREK_DUUR_MIN * 60_000)
  const uitkomst = await haalJson('/api/lifeos/agenda/events', leesNiets, {
    method: 'POST',
    body: JSON.stringify({
      titel: coachgesprekTitel(pt.naam),
      startOp: start.toISOString(),
      eindOp: eind.toISOString(),
      genodigden: pt.email ? [pt.email] : [],
    }),
  })
  return uitkomst.ok ? { ok: true } : { ok: false, fout: uitkomst.fout }
}
