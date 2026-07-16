// ─── LifeOS — dagtotalen voor voeding & water ───────────────────────────────
// Puur bestand: geen fetch, geen DB, geen React, geen klok. De tijd komt erín
// als parameter waar hij nodig is. Daardoor volledig testbaar — zie
// `totalen.test.ts`.
//
// ─── DE BELANGRIJKSTE BESLISSING VAN FUNCTIE 5 ──────────────────────────────
// Wat doe je met een dag waarop je drie maaltijden logde en bij één de eiwitten
// invulde?
//
// Het makkelijke antwoord is `??  0`: tel de ontbrekende velden als nul en toon
// "42g eiwit". Dat is fout, en niet zo'n beetje ook. Die 42 leest als een
// dagtotaal, terwijl het een derde van je dag is. Je zou concluderen dat je
// veel te weinig eiwit at, terwijl je in werkelijkheid alleen te weinig getypt
// hebt. Een verzonnen 0 is geen ontbrekende meting — het is een meting die
// beweert dat je niets at.
//
// Het andere makkelijke antwoord is `null` zodra er íéts mist: geen totaal, want
// het is onvolledig. Ook fout — dan gooi je de 42 gram die je wél weet weg, en
// dan is invullen zinloos geworden.
//
// Dit bestand doet geen van beide. Een `Totaal` draagt zijn eigen dekking mee:
//
//     { waarde: 42, gemeten: 1, vanTotaal: 3 }
//
// De som ís 42 — dat is geen schatting maar precies wat er in de logs stond.
// En de UI weet dat het uit 1 van 3 maaltijden komt, dus ze kan "42g uit 1 van
// 3 maaltijden" tonen in plaats van "42g" te laten liegen. Het getal en zijn
// dekking zijn onafscheidelijk, omdat ze in hetzelfde object zitten: je kúnt de
// 42 niet lezen zonder de 1-van-3 tegen te komen.
//
// Geen enkele log met dat veld → `waarde: null`. Nooit 0. Dat onderscheid is de
// kern van dit project (README §Definition of done).

/**
 * Alleen wat een totaal nodig heeft.
 *
 * Bewust structureel en niet `VoedingLog`: zo heeft deze module nul imports en
 * is ze te testen met kale objectliteralen. `VoedingLog` voldoet er vanzelf aan.
 */
export interface Meetbaar {
  kcal: number | null
  eiwitG: number | null
  koolhydratenG: number | null
  vetG: number | null
}

/** Alleen wat een watertotaal nodig heeft. */
export interface Slok {
  ml: number
}

/**
 * Een dagtotaal mét zijn dekking. De drie velden horen bij elkaar en reizen
 * daarom samen — zie de kop van dit bestand.
 */
export interface Totaal {
  /**
   * De som van de logs die dit veld invulden.
   * `null` = geen enkele log had een waarde. Nooit 0 — dat betekent "je at
   * gemeten nul", en dat is iets heel anders dan "je vulde het niet in".
   */
  waarde: number | null
  /** Hoeveel logs dit veld invulden. */
  gemeten: number
  /** Hoeveel logs er in totaal waren. */
  vanTotaal: number
}

export interface DagTotalen {
  /** Hoeveel dingen je die dag logde. */
  logs: number
  kcal: Totaal
  eiwit: Totaal
  koolhydraten: Totaal
  vet: Totaal
}

/**
 * Rondt af op één decimaal.
 *
 * Nodig omdat 12.5 + 3.3 in floating point 15.799999999999999 oplevert, en een
 * dagtotaal met veertien decimalen ziet eruit als een bug. Één decimaal is ook
 * wat de database bewaart (`numeric(6,1)`).
 */
function afrond1(v: number): number {
  return Math.round(v * 10) / 10
}

/**
 * Telt één veld op over alle logs, en houdt bij hoeveel logs het misten.
 *
 * Logs zonder waarde worden overgeslagen — niet als 0 meegeteld. Dat is de hele
 * truc: `gemeten` blijft dan achter bij `vanTotaal`, en dát is het signaal dat
 * de UI nodig heeft.
 */
function telVeld(logs: readonly Meetbaar[], kies: (log: Meetbaar) => number | null): Totaal {
  let som = 0
  let gemeten = 0

  for (const log of logs) {
    const waarde = kies(log)
    // `null` én NaN/Infinity overslaan: een kapot getal is geen meting.
    // Let op de volgorde — `0` is een geldige waarde en moet hier dóór.
    if (waarde === null || !Number.isFinite(waarde)) continue
    som += waarde
    gemeten += 1
  }

  return {
    waarde: gemeten === 0 ? null : afrond1(som),
    gemeten,
    vanTotaal: logs.length,
  }
}

/**
 * De dagtotalen. Geen logs → alles null (niet 0): je hebt niets gelogd, dus we
 * weten niets. Dat is een antwoord.
 */
export function dagTotalen(logs: readonly Meetbaar[]): DagTotalen {
  return {
    logs: logs.length,
    kcal: telVeld(logs, (l) => l.kcal),
    eiwit: telVeld(logs, (l) => l.eiwitG),
    koolhydraten: telVeld(logs, (l) => l.koolhydratenG),
    vet: telVeld(logs, (l) => l.vetG),
  }
}

/** Elke log vulde dit veld in — het totaal dekt de hele dag. */
export function isVolledig(t: Totaal): boolean {
  return t.vanTotaal > 0 && t.gemeten === t.vanTotaal
}

/**
 * Er is een waarde, maar niet uit alle logs. Dít is het geval waar de UI iets
 * bij moet zeggen; zonder die zin leest het getal als een dagtotaal.
 */
export function isOnvolledig(t: Totaal): boolean {
  return t.gemeten > 0 && t.gemeten < t.vanTotaal
}

// ─── Water ──────────────────────────────────────────────────────────────────

/**
 * Wat je vandaag dronk, in ml.
 *
 * Geen logs → `null`, niet 0. "Je hebt niets gelogd" en "je dronk nul" zijn
 * verschillende uitspraken, en alleen de eerste is er een die wij kunnen doen.
 */
export function waterTotaalMl(logs: readonly Slok[]): number | null {
  const geldig = logs.filter((l) => Number.isFinite(l.ml))
  if (geldig.length === 0) return null
  return geldig.reduce((som, l) => som + l.ml, 0)
}

export interface WaterVoortgang {
  totaalMl: number
  doelMl: number
  /**
   * Percentage van je doel. NIET geklemd op 100: 120% is wat er gebeurde, en
   * een balk die op 100 blijft staan verzwijgt dat.
   */
  pct: number
}

/**
 * Voortgang t.o.v. je waterdoel, of `null` als er geen doel is.
 *
 * `null` is hier geen foutgeval maar de normale toestand: geen doel gesteld =
 * geen percentage. LifeOS vult daar geen 2 liter in — dat is een claim over
 * jouw lichaam die niemand hier gemeten heeft (zie migratie 060).
 */
export function waterVoortgang(totaalMl: number | null, doelMl: number | null): WaterVoortgang | null {
  if (totaalMl === null || doelMl === null) return null
  if (!Number.isFinite(totaalMl) || !Number.isFinite(doelMl) || doelMl <= 0) return null

  return {
    totaalMl,
    doelMl,
    pct: Math.round((totaalMl / doelMl) * 100),
  }
}
