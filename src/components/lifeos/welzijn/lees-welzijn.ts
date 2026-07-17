import { isObject, getalOfNull } from '@/lib/lifeos/api/http'

// ─── Het `wellbeing`-blok van `GET /api/pijlers` ────────────────────────────
// Eén eigenaar, omdat twee schermen ditzelfde blok lezen: `WelzijnScoreKaart`
// (de score + de zes ringen) en het Gezondheid-domein in "Mijn leven" (alleen de
// samenvatting). Twee kopieën van dezelfde drie velden op een systeemgrens is
// hoe je uiteindelijk twee verschillende antwoorden op één vraag krijgt.

export interface WellbeingView {
  /** `null` = niets gemeten. Nooit 0 — dat zou een gemeten nul zijn. */
  score: number | null
  /** Aantal pijlers mét data. */
  gemeten: number
  /** Totaal aantal pijlers (6). */
  totaal: number
}

/**
 * Narrowt het `wellbeing`-blok. `null` = onverwachte vorm → foutstaat.
 *
 * `score` mag ontbreken (dan is er niets gemeten), maar `gemeten`/`totaal` niet:
 * zonder die twee kunnen we "x van y gemeten" niet eerlijk opschrijven, en dan
 * is het antwoord kapot en geen lege staat.
 */
export function leesWellbeing(ruw: unknown): WellbeingView | null {
  if (!isObject(ruw)) return null

  const wb = ruw.wellbeing
  if (!isObject(wb)) return null

  const gemeten = getalOfNull(wb.gemeten)
  const totaal = getalOfNull(wb.totaal)
  if (gemeten === null || totaal === null) return null

  return { score: getalOfNull(wb.score), gemeten, totaal }
}
