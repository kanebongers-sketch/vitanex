// ─── LifeOS — actieve minuten per dag ───────────────────────────────────────
// Dit bestand bestaat voor precies één regel elders, en die regel is een mijn.
//
// `src/lib/vita/signalen.ts` heeft een beweging-regel die pas vuurt als er vijf
// dagen op rij een GEMETEN NUL staat. Vandaag kan hij niet vuren: `context.ts`
// geeft `actieveMinuten: null` omdat er nergens actieve minuten worden
// weggeschreven (README, "Bekende gaten"). Dit bestand is de bron die dat gat
// dicht.
//
// ─── DE REGEL. Lees dit voor je hieronder iets verandert. ───────────────────
//
//   null = "we weten het niet"
//   0    = "we weten het, en het was niets"
//
// Die twee zijn NIET hetzelfde en mogen nooit in elkaar overlopen. Geef je hier
// `0` terug waar `null` hoort, dan beschuldigt Vita Kane straks van luiheid op
// een dag dat hij simpelweg niets logde. Een wearable die niet synct mag nooit
// als luiheid gelezen worden. Dat is dezelfde fout als MentaForce's verzonnen
// `score: 50`, alleen met een verwijt erbovenop.
//
// Alle onwetendheid valt daarom naar `null`. Er is geen tak die een aanname doet.
//
// ─── Twee dingen die hier NIET gebeuren ─────────────────────────────────────
//
// 1. Actieve minuten worden nooit uit `duurMinuten` afgeleid. Een krachtsessie
//    van 60 minuten is grotendeels rust tussen sets; dat als 60 actieve minuten
//    lezen is een verzonnen cijfer met een plausibele bron. Wie zijn actieve
//    minuten niet mat, heeft ze niet gemeten — punt.
//
// 2. Een voornemen telt niet mee. `gepland = true` is wat je van plan wás;
//    Vita mag alleen op metingen af. Migratie 070 garandeert al dat een geplande
//    rij geen meetvelden draagt, dus dit filter is de tweede sluiting van
//    dezelfde deur — expres.
//
// PUUR. Geen fetch, geen DB, geen React, geen Date.now(). Dagen komen als
// argument binnen. Zo is dit testbaar zonder database en zonder de klok te mocken.

/**
 * Het minimum dat deze module van een training moet weten.
 *
 * Bewust smaller dan `Training`: zo kan `vita/context.ts` drie kolommen
 * ophalen (`datum, gepland, actieve_minuten`) in plaats van de hele tabel, en
 * hoeft Vita niets te weten over RPE of oefeningen.
 */
export interface TrainingLog {
  /** Dagsleutel (YYYY-MM-DD), lokale tijd. */
  datum: string
  /** true = voornemen. Telt niet mee — Vita mag alleen op metingen af. */
  gepland: boolean
  /** Gemeten actieve minuten, of null als er niets gemeten is. */
  actieveMinuten: number | null
}

/** Dagsleutel normaliseren. Postgres geeft 'YYYY-MM-DD'; de slice is een vangnet. */
function sleutel(datum: string): string {
  return datum.slice(0, 10)
}

/**
 * Is dit een meting?
 *
 * `0` telt mee (gemeten nul), `null` niet. Ook onzin — NaN, Infinity, een
 * negatief aantal minuten — telt níét als meting: dat is een kapotte bron, en
 * een kapotte bron weet niets. Hij mag dus geen `0` worden.
 */
function isMeting(v: number | null): v is number {
  return v !== null && Number.isFinite(v) && v >= 0
}

/**
 * De actieve minuten van één dag, of `null` als we het niet weten.
 *
 * Een dag is alleen een getal als élke gedane training van die dag zijn actieve
 * minuten heeft. Ontbreekt er één, dan is het DAGTOTAAL onbekend — ook al staat
 * er bij een andere training wel een getal. Een deeltotaal als totaal
 * presenteren zou een te laag cijfer in Vita's mond leggen, en dat is dezelfde
 * soort onwaarheid als een te hoog cijfer.
 *
 * Dat is dezelfde keuze als in `signalen.ts`, waar een afspraak zonder eindtijd
 * niet meetelt voor de vrije blokken: twijfel levert stilte op, geen advies.
 *
 *   geen enkele log            → null  ("niet gemeten", geen luiheid)
 *   alleen voornemens          → null  (een plan is geen meting)
 *   log zonder actieve minuten → null  (je trainde; hoevéél weten we niet)
 *   alles gemeten              → som   (0 alleen bij een échte gemeten nul)
 */
export function actieveMinutenOpDag(
  trainingen: readonly TrainingLog[],
  datum: string,
): number | null {
  const dag = sleutel(datum)
  const metingen = trainingen.filter((t) => !t.gepland && sleutel(t.datum) === dag)

  // Niets gelogd. Dit is het geval waar alles om draait: géén 0.
  if (metingen.length === 0) return null

  let totaal = 0
  for (const training of metingen) {
    // Eén onbekende maakt het dagtotaal onbekend. Geen floor, geen schatting.
    if (!isMeting(training.actieveMinuten)) return null
    totaal += training.actieveMinuten
  }
  return totaal
}

/**
 * Actieve minuten per dag, voor de dagen die je opgeeft.
 *
 * Elke gevraagde dag komt in het resultaat voor — ook een dag zonder logs. Die
 * krijgt `null`, niet niets: een ontbrekende sleutel zou de aanroeper dwingen
 * om zélf te bedenken wat afwezigheid betekent, en dat is precies de beslissing
 * die hier hoort en nergens anders.
 *
 * Zo sluit `vita/context.ts` hierop aan (die functie hoort bij de hoofdsessie,
 * niet hier):
 *
 *   const perDag = actieveMinutenPerDag(trainingLogs, dagen.map((d) => d.datum))
 *   // ...
 *   actieveMinuten: perDag.get(dag.datum) ?? null
 *
 * @param trainingen  Alle trainingen in het venster. Volgorde maakt niet uit.
 * @param dagen       De dagsleutels (YYYY-MM-DD) waarvoor je een antwoord wilt.
 */
export function actieveMinutenPerDag(
  trainingen: readonly TrainingLog[],
  dagen: readonly string[],
): Map<string, number | null> {
  const perDag = new Map<string, number | null>()
  for (const datum of dagen) {
    perDag.set(sleutel(datum), actieveMinutenOpDag(trainingen, datum))
  }
  return perDag
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

/**
 * Leest een rij uit `public.trainingen` als `TrainingLog`.
 *
 * Past op de `vertaal`-parameter van `haalVak` in `vita/context.ts`, zodat de
 * hoofdsessie er één query aan zijn `Promise.all` kan hangen:
 *
 *   haalVak(
 *     admin.from('trainingen')
 *       .select('datum, gepland, actieve_minuten')
 *       .eq('user_id', userId)
 *       .gte('datum', vanaf),
 *     leesTrainingLogRij,
 *   )
 *
 * Narrowen, niet casten: een kolom die van type verandert wordt hier `null`
 * ("niet gemeten") in plaats van een NaN die in een verwijt eindigt.
 */
export function leesTrainingLogRij(rij: unknown): TrainingLog | null {
  if (typeof rij !== 'object' || rij === null || Array.isArray(rij)) return null
  const velden = rij as Record<string, unknown>

  const datum = velden.datum
  if (typeof datum !== 'string' || datum.length < 10) return null

  const ruweMinuten = velden.actieve_minuten
  const actieveMinuten =
    typeof ruweMinuten === 'number' && Number.isFinite(ruweMinuten) && ruweMinuten >= 0
      ? ruweMinuten
      : null

  return {
    datum: sleutel(datum),
    // Alles wat geen expliciete `false` is, behandelen we als een voornemen.
    // Dat valt de veilige kant op: een onleesbare vlag mag nooit als meting
    // binnenkomen, want dan telt een plan mee als beweging.
    gepland: velden.gepland !== false,
    actieveMinuten,
  }
}
