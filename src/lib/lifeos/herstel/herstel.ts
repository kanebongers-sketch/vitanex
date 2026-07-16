// ─── LifeOS — herstelbronnen ────────────────────────────────────────────────
// Normaliseert Whoop / Oura / Garmin / Samsung Health naar één vorm die de
// pijler-engine (`@/lib/lifeos/pijlers/score`) kan voeden.
//
// DE KERNREGEL — hier gaat het in elk gezondheidsproduct mis:
// deze vier meten NIET hetzelfde. Whoop geeft een herstelpercentage uit HRV +
// rusthartslag. Oura geeft een eigen readiness-score met een andere formule.
// Garmin geeft Body Battery (0-100, maar een energie-budget, geen herstel).
// Samsung Health geeft in de praktijk vooral slaap. Ze op één hoop gooien maakt
// het cijfer gladder en onwaar.
//
// Daarom: elke bron levert alleen wat hij ÉCHT meet. Ontbreekt iets, dan is het
// `null` — nooit een ingevulde 0 of 50. Dat is dezelfde regel als in
// `pijlers/score.ts`, en hij is daar duur geleerd: een verzonnen basislijn van
// 50 maakte van "ik weet niets van je" een cijfer dat op een meting leek.
//
// Puur bestand: geen React, geen fetch, geen DB. Zo blijft het testbaar zonder
// een van de vier accounts.

/** De wearables die LifeOS kan lezen. */
export type HerstelBron = 'whoop' | 'oura' | 'garmin' | 'samsung' | 'handmatig'

/**
 * Eén dag herstel, bron-agnostisch. Elk veld is optioneel omdat geen enkele
 * bron ze allemaal levert — en dat verzwijgen we niet.
 */
export interface HerstelMeting {
  bron: HerstelBron
  /** ISO-datum (YYYY-MM-DD) in lokale tijd van de gebruiker. */
  datum: string
  /** Hartslagvariabiliteit in ms (RMSSD). Whoop/Oura/Garmin. */
  hrvMs: number | null
  /** Rusthartslag in slagen/min. */
  rustHartslag: number | null
  /** Slaapduur in minuten. */
  slaapMinuten: number | null
  /** Slaapefficiëntie 0-100 (% van tijd in bed daadwerkelijk geslapen). */
  slaapEfficientie: number | null
  /**
   * De eigen samengestelde score van de leverancier, 0-100, ALS hij er een
   * geeft. Whoop recovery, Oura readiness, Garmin body battery.
   *
   * LET OP: niet onderling vergelijkbaar. Een Whoop-70 en een Oura-70 zijn niet
   * hetzelfde getal. Gebruik `leverancierScoreVergelijkbaar` voor je 'm ergens
   * naast een andere bron zet.
   */
  leverancierScore: number | null
}

/**
 * Of de leverancier-score van deze bron als herstelmaat gebruikt mag worden.
 *
 * Body Battery is bewust `false`: het is een energie-BUDGET dat door de dag
 * leegloopt, geen herstelmeting. 's Avonds is hij per definitie laag — dat als
 * "slecht herstel" lezen zou elke avond vals alarm geven.
 */
export function leverancierScoreVergelijkbaar(bron: HerstelBron): boolean {
  return bron === 'whoop' || bron === 'oura'
}

// ─── Ruwe payloads ──────────────────────────────────────────────────────────
// Bewust `unknown`-velden: dit zijn externe API's (systeemgrens). We narrowen
// hier in plaats van te casten, zodat een veldwijziging bij de leverancier een
// lege waarde geeft en geen NaN die door de hele app lekt.

function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Klem op een bereik, of null als er niets te klemmen valt. */
function klem(v: number | null, min: number, max: number): number | null {
  if (v === null) return null
  return Math.min(max, Math.max(min, v))
}

/**
 * Whoop v2 — `/developer/v2/recovery` + `/developer/v2/activity/sleep`.
 * Levert recovery% (0-100) uit HRV + RHR. De rijkste bron van de vier.
 *
 * ── Twee valkuilen die hier duur waren ────────────────────────────────────
 *
 * 1. Whoop heeft TWEE slaapcijfers die op elkaar lijken:
 *      • sleep_performance_percentage — geslapen t.o.v. je slaapBEHOEFTE
 *      • sleep_efficiency_percentage  — geslapen t.o.v. tijd IN BED
 *    `slaapEfficientie` is het tweede (zie de interface). Deze functie las
 *    eerst het eerste onder die naam: een ander getal onder een gedocumenteerd
 *    label, dus een cijfer in de UI dat iets anders betekent dan wat erbij
 *    staat. Precies de stille onwaarheid die dit project niet maakt.
 *
 * 2. `slaapMinuten` stond hier hard op `null` ("komt uit de sleep-call").
 *    Gevolg: wie alleen Whoop koppelt, zag nooit zijn slaapduur — en opende de
 *    Whoop-app dus alsnog. Dat is de gouden regel van LifeOS breken in één
 *    veld. Whoop levert het wél, in `score.stage_summary`; de sync-adapter
 *    geeft dat blok nu door.
 */
export function vanWhoop(datum: string, ruw: Record<string, unknown>): HerstelMeting {
  const score = (ruw.score ?? {}) as Record<string, unknown>
  const fasen = (score.stage_summary ?? {}) as Record<string, unknown>

  // Slaapduur = tijd in bed minus wakker liggen. Beide velden moeten er zijn:
  // alleen "in bed" zou wakker liggen als slaap tellen, en dat is een te
  // gunstig getal. Ontbreekt er één → null, geen schatting.
  const inBedMs = getal(fasen.total_in_bed_time_milli)
  const wakkerMs = getal(fasen.total_awake_time_milli)
  const slaapMinuten =
    inBedMs !== null && wakkerMs !== null && inBedMs > wakkerMs
      ? Math.round((inBedMs - wakkerMs) / 60_000)
      : null

  return {
    bron: 'whoop',
    datum,
    hrvMs: getal(score.hrv_rmssd_milli),
    rustHartslag: getal(score.resting_heart_rate),
    slaapMinuten,
    slaapEfficientie: klem(getal(score.sleep_efficiency_percentage), 0, 100),
    leverancierScore: klem(getal(score.recovery_score), 0, 100),
  }
}

/**
 * Oura v2 — `/v2/usercollection/daily_readiness` + `daily_sleep`.
 * Readiness is Oura's eigen formule; niet gelijk aan Whoop recovery.
 */
export function vanOura(datum: string, ruw: Record<string, unknown>): HerstelMeting {
  const bijdragen = (ruw.contributors ?? {}) as Record<string, unknown>
  return {
    bron: 'oura',
    datum,
    hrvMs: getal(ruw.average_hrv),
    rustHartslag: getal(ruw.lowest_heart_rate) ?? getal(ruw.average_heart_rate),
    slaapMinuten: (() => {
      const sec = getal(ruw.total_sleep_duration)
      return sec === null ? null : Math.round(sec / 60)
    })(),
    slaapEfficientie: klem(getal(bijdragen.efficiency), 0, 100),
    leverancierScore: klem(getal(ruw.score), 0, 100),
  }
}

/**
 * Garmin Health API — daily summaries.
 * Body Battery is GEEN herstelscore (zie `leverancierScoreVergelijkbaar`), maar
 * HRV en rusthartslag zijn wel echte metingen — die nemen we dus wél mee.
 */
export function vanGarmin(datum: string, ruw: Record<string, unknown>): HerstelMeting {
  return {
    bron: 'garmin',
    datum,
    hrvMs: getal(ruw.hrvWeeklyAverage) ?? getal(ruw.lastNightAvgHrv),
    rustHartslag: getal(ruw.restingHeartRateInBeatsPerMinute),
    slaapMinuten: (() => {
      const sec = getal(ruw.sleepTimeInSeconds)
      return sec === null ? null : Math.round(sec / 60)
    })(),
    slaapEfficientie: null, // Garmin geeft dit niet direct — niet afleiden
    leverancierScore: klem(getal(ruw.bodyBatteryMostRecentValue), 0, 100),
  }
}

/**
 * Samsung Health — sleep sessions.
 * De magerste bron: in de praktijk alleen slaap. Dat is prima; hij vult de
 * slaap-pijler en doet verder geen claims.
 */
export function vanSamsung(datum: string, ruw: Record<string, unknown>): HerstelMeting {
  const start = getal(ruw.start_time)
  const eind = getal(ruw.end_time)
  const minuten = start !== null && eind !== null && eind > start
    ? Math.round((eind - start) / 60_000)
    : null

  return {
    bron: 'samsung',
    datum,
    hrvMs: null,
    rustHartslag: null,
    slaapMinuten: minuten,
    slaapEfficientie: klem(getal(ruw.efficiency), 0, 100),
    leverancierScore: null, // Samsung geeft geen herstelscore — dus null
  }
}

// ─── Samenvoegen ────────────────────────────────────────────────────────────

/**
 * Rangorde bij meerdere bronnen op één dag. Wie het meest écht meet, wint.
 * Handmatig staat bovenaan: als jij het zelf invult, overrulet dat een sensor.
 */
const BRON_RANG: Record<HerstelBron, number> = {
  handmatig: 4,
  whoop: 3,
  oura: 2,
  garmin: 1,
  samsung: 0,
}

/**
 * Voegt metingen van meerdere wearables voor één dag samen.
 *
 * Per veld wint de hoogst gerangschikte bron die dat veld ÉCHT heeft. Zo levert
 * een Whoop+Samsung-combinatie Whoop's HRV én Samsung's slaap, zonder ergens
 * een gemiddelde te verzinnen tussen twee dingen die niet hetzelfde meten.
 *
 * Geen enkele bron een waarde? Dan blijft het veld `null`. Dat is een antwoord.
 */
export function voegSamen(metingen: readonly HerstelMeting[]): HerstelMeting | null {
  if (metingen.length === 0) return null

  const eerste = metingen[0]
  if (!eerste) return null

  const opRang = [...metingen].sort((a, b) => BRON_RANG[b.bron] - BRON_RANG[a.bron])

  const beste = <K extends keyof HerstelMeting>(veld: K): HerstelMeting[K] | null => {
    for (const m of opRang) {
      const v = m[veld]
      if (v !== null && v !== undefined) return v
    }
    return null
  }

  const leidend = opRang[0]
  if (!leidend) return null

  // De leverancier-score mag alleen van een bron komen die er een vergelijkbare
  // geeft — anders zou Garmin's body battery hier als herstel binnenkomen.
  const scoreBron = opRang.find(
    (m) => m.leverancierScore !== null && leverancierScoreVergelijkbaar(m.bron),
  )

  return {
    bron: leidend.bron,
    datum: eerste.datum,
    hrvMs: beste('hrvMs') as number | null,
    rustHartslag: beste('rustHartslag') as number | null,
    slaapMinuten: beste('slaapMinuten') as number | null,
    slaapEfficientie: beste('slaapEfficientie') as number | null,
    leverancierScore: scoreBron?.leverancierScore ?? null,
  }
}
