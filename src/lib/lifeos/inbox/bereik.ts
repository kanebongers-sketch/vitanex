// ─── LifeOS — heeft deze koppeling genoeg rechten? ──────────────────────────
// Puur: twee lijsten erin, een antwoord eruit. Geen DB, geen fetch.
//
// ─── WAAROM DIT BESTAAT ─────────────────────────────────────────────────────
// `koppeling.ts` schrijft `bereik` al netjes weg bij elke koppeling — en las het
// daarna nooit terug. Een dood veld, tot het moment dat de scope veranderde:
// Kane's bestaande koppeling heeft `gmail.readonly`, en Google verhoogt
// toestemming niet vanzelf. Zonder deze check klikt hij op "concept maken",
// wacht hij op Google, en krijgt hij een 403 met "insufficientPermissions" —
// technisch correct, en volstrekt onbruikbaar als aanwijzing.
//
// Met deze check krijgt hij vóór de round-trip: "koppel opnieuw voor schrijfrecht".
// Dat is dezelfde soort eerlijkheid als "niet gekoppeld" ≠ "geen mail": het
// verschil tussen een storing en een instructie.

/**
 * Heeft `gekregen` alles wat `vereist` vraagt?
 *
 * Exacte string-vergelijking, geen prefix-truc. Google's scopes zijn URL's die
 * elkaar in naam bevatten (`gmail.modify` vs `gmail.metadata`) maar niet in
 * betekenis; "bevat" zou hier stilletjes het verkeerde antwoord geven.
 */
export function heeftBereik(
  gekregen: readonly string[],
  vereist: readonly string[],
): boolean {
  const set = new Set(gekregen)
  return vereist.every((v) => set.has(v))
}

/** Wat er mist. Leeg = niets. Voor een melding die zegt wát er ontbreekt. */
export function ontbrekendBereik(
  gekregen: readonly string[],
  vereist: readonly string[],
): string[] {
  const set = new Set(gekregen)
  return vereist.filter((v) => !set.has(v))
}

export type BereikOordeel =
  /** De koppeling heeft aantoonbaar genoeg rechten. */
  | { soort: 'genoeg' }
  /** De koppeling heeft aantoonbaar te weinig: opnieuw koppelen is de weg terug. */
  | { soort: 'te_weinig'; ontbreekt: string[] }
  /**
   * We weten het niet — er staat geen bereik opgeslagen.
   *
   * NIET hetzelfde als 'te_weinig'. Een leeg `bereik`-veld is geen bewijs van
   * afwezige rechten; het is afwezigheid van bewijs. Zie `beoordeelBereik`.
   */
  | { soort: 'onbekend' }

/**
 * Beoordeelt een opgeslagen bereik tegen wat een actie nodig heeft.
 *
 * De drie takken zijn het hele punt, en `onbekend` is de belangrijkste. Google
 * stuurt `scope` altijd mee bij het inwisselen van de autorisatiecode, dus in de
 * praktijk staat er iets. Maar bij een refresh doet hij dat niet altijd (zie
 * `koppeling.ts`), en een oude rij kan uit een tijd komen waarin we het veld nog
 * niet vulden. Dan is de eerlijke conclusie "ik weet het niet" — en dan laten we
 * Google beslissen in plaats van te gokken. Zijn 403 komt alsnog als
 * `geen_schrijfrecht` terug met dezelfde nette melding; we hebben dan alleen één
 * round-trip meer gebruikt om iets te weten te komen dat we niet wisten.
 *
 * De omgekeerde keuze — "leeg dus geen rechten" — zou Kane naar het
 * koppelscherm sturen voor een koppeling die prima werkt. Dat is de duurdere fout.
 */
export function beoordeelBereik(
  gekregen: readonly string[],
  vereist: readonly string[],
): BereikOordeel {
  if (gekregen.length === 0) return { soort: 'onbekend' }
  if (heeftBereik(gekregen, vereist)) return { soort: 'genoeg' }
  return { soort: 'te_weinig', ontbreekt: ontbrekendBereik(gekregen, vereist) }
}
