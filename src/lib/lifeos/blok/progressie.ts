// ─── LifeOS — progressie-engine voor het 4-weken krachtblok ─────────────────
// Dit is het hart van de app: gegeven wat je vórige keer tilde, wat doe je
// vandaag? Alles wat de gebruiker in de sportschool ziet staan komt hier uit.
//
// Het model is DOUBLE PROGRESSION: eerst reps erbij binnen de bandbreedte
// (8→10), en pas als álle sets de bovengrens halen gaat het gewicht omhoog en
// val je terug naar de ondergrens. Dat is één regel met twee knoppen; wie hier
// een derde knop bijzet (percentages, e1RM-schattingen, RPE-tabellen) verandert
// het programma, niet alleen deze functie.
//
// ─── DE REGEL. Lees dit voor je hieronder iets verandert. ───────────────────
//
//   Een advies mag NOOIT een verzonnen getal bevatten.
//
// Zonder geschiedenis is er geen startgewicht — dan is het antwoord `onbekend`
// en kiest de gebruiker zelf. Een "slim" gegokt beginnetje van 40 kg is precies
// de fout die dit project overal weert: een plausibel cijfer zonder bron. Zelfde
// familie als de `null`-vs-`0`-regel in `training/actieve-minuten.ts`.
//
// Twee dingen die hier NIET gebeuren:
//
// 1. RIR wordt nooit geraden. Niet gelogd = geen bewijs, en geen bewijs is geen
//    bezwaar: we verhogen dan gewoon op de reps. Er een 2 van maken zou een
//    zware sessie als "makkelijk" boeken en de gebruiker de dag erna slopen.
// 2. Een set die niet gemaakt is telt niet mee. Geen reps, geen gewicht, of nul
//    herhalingen → volledig negeren. Een gewicht dat je niet één keer tilde is
//    geen werkgewicht, ook al staat het in je log.
//
// PUUR. Geen fetch, geen DB, geen React, geen Date.now(). Alles komt als
// argument binnen, dus dit is volledig testbaar zonder database en zonder klok.

/** Eén gelogde set uit een eerdere sessie. */
export interface GelogdeSet {
  herhalingen: number | null
  gewichtKg: number | null
  rir: number | null
}

/** Het doel van een oefening zoals het programma het voorschrijft. */
export interface OefeningDoel {
  sets: number
  repMin: number
  repMax: number
  /** Gewichtsstap voor deze oefening (bv 2.5 voor barbell, 5 voor been-machines, 1.25 voor kleine isolatie). */
  stap: number
  /** Beoogde RIR-bandbreedte (bv [1,3] voor compounds, [0,2] voor isolatie). */
  rirDoel: readonly [number, number]
}

export type Advies =
  /** Alle sets bovengrens gehaald binnen RIR-doel → gewicht omhoog. */
  | { soort: 'verhoog'; naarKg: number; uitleg: string }
  /** Nog niet alle sets aan de bovengrens → zelfde gewicht, meer reps. */
  | { soort: 'behoud'; kg: number; uitleg: string }
  /** Prestatie duidelijk gedaald → waarschuwing (herstel/deload overwegen). */
  | { soort: 'let_op'; kg: number; uitleg: string }
  /** Geen geschiedenis → laat de gebruiker een startgewicht kiezen. */
  | { soort: 'onbekend'; uitleg: string }

/**
 * Onder deze verhouding t.o.v. de vorige sessie noemen we het een daling.
 *
 * 15% is bewust ruim. Een set van tien die er negen worden is dagvorm — daar
 * moet niemand een waarschuwing over krijgen, want een engine die bij elke
 * rimpel "let op je herstel" roept wordt weggeklikt en dan mist hij ook de
 * echte inzinking.
 */
const DALING_DREMPEL = 0.85

/** Eén set die écht gemaakt is: reps en gewicht staan er, en er is getild. */
interface WerkSet {
  readonly herhalingen: number
  readonly gewichtKg: number
  readonly rir: number | null
}

/** Wat we uit één sessie afleiden. Doel-onafhankelijk: puur wat er gebeurd is. */
interface Sessie {
  /** Het hoogste gewicht dat in minstens één set gemaakt is. */
  readonly werkgewicht: number
  /** De sets óp dat werkgewicht. Warm-ups en afvallende sets zitten hier niet in. */
  readonly werkSets: readonly WerkSet[]
  /** Som van de reps op het werkgewicht — de volume-maat voor de daling-regel. */
  readonly totaalHerhalingen: number
  /** De laagste gelogde RIR op het werkgewicht, of null als niemand RIR logde. */
  readonly laagsteRir: number | null
}

/** Een gemeten terugval, met de cijfers die de uitleg nodig heeft. */
interface Daling {
  readonly vanReps: number
  readonly naarReps: number
}

/**
 * Afronden op 2 decimalen.
 *
 * Gewichten leven op een grid van 1.25 en 2.5 kg; binaire floats niet. Zonder
 * deze stap wordt 0.1 + 0.2 een 0.30000000000000004 en verschijnt er straks
 * "122,50000000000001 kg" op het scherm van iemand met een barbell in zijn
 * handen.
 */
function op2Decimalen(waarde: number): number {
  return Math.round(waarde * 100) / 100
}

/**
 * Een gewicht in NL-notatie: 120 → "120", 122.5 → "122,5".
 *
 * Bewust niet `format/getal.ts`: die dwingt een vast aantal decimalen af en zou
 * er "122,50" of "123" van maken. Een gewicht wil je precies zo strak zien als
 * het is.
 */
function kgTekst(kg: number): string {
  return kg.toLocaleString('nl-NL', { maximumFractionDigits: 2, useGrouping: false })
}

/**
 * Eén gelogde set omgezet naar een werkset, of `null` als hij niet meetelt.
 *
 * Narrowen, niet casten. Een set zonder reps of zonder gewicht is geen halve
 * meting die we kunnen aanvullen — hij is geen meting, en hij mag het advies
 * dus op geen enkele manier raken. Nul herhalingen valt daar bewust ook onder:
 * dan is het gewicht wél geladen maar niet getild.
 */
function leesSet(set: GelogdeSet): WerkSet | null {
  const { herhalingen, gewichtKg, rir } = set
  if (herhalingen === null || !Number.isFinite(herhalingen) || herhalingen < 1) return null
  if (gewichtKg === null || !Number.isFinite(gewichtKg) || gewichtKg < 0) return null

  return {
    // Reps zijn hele getallen; een 8.4 uit een kapot formulier ronden we af in
    // plaats van de set weg te gooien — anders kantelt één rare rij stil een
    // 'verhoog' naar een 'behoud'.
    herhalingen: Math.round(herhalingen),
    // 0 kg is een echte waarde (lichaamsgewicht); alleen `null` is "niet ingevuld".
    gewichtKg: op2Decimalen(gewichtKg),
    rir: rir !== null && Number.isFinite(rir) ? rir : null,
  }
}

/**
 * De samenvatting van één sessie, of `null` als er niets bruikbaars in staat.
 *
 * Het werkgewicht is het HOOGSTE gemaakte gewicht, en alleen de sets op dat
 * gewicht worden beoordeeld. Zo kan een warm-up van 60 kg of een afvallende set
 * van 100 kg het voorstel niet naar beneden trekken, en blokkeert hij ook niet
 * de verhoging: op 60 kg vijf reps halen zegt niets over je 120 kg.
 *
 * Muteert de invoer niet — `map`/`filter` leveren nieuwe arrays.
 */
function leesSessie(sets: readonly GelogdeSet[]): Sessie | null {
  const gemaakt = sets.map(leesSet).filter((s): s is WerkSet => s !== null)
  if (gemaakt.length === 0) return null

  const werkgewicht = gemaakt.reduce((hoogste, s) => Math.max(hoogste, s.gewichtKg), 0)
  const werkSets = gemaakt.filter((s) => s.gewichtKg >= werkgewicht)
  const gelogdeRirs = werkSets.map((s) => s.rir).filter((r): r is number => r !== null)

  return {
    werkgewicht,
    werkSets,
    totaalHerhalingen: werkSets.reduce((som, s) => som + s.herhalingen, 0),
    laagsteRir: gelogdeRirs.length === 0 ? null : Math.min(...gelogdeRirs),
  }
}

/** Haalde élke set op het werkgewicht de bovengrens van de bandbreedte? */
function haaldeBovengrens(doel: OefeningDoel, sessie: Sessie): boolean {
  return sessie.werkSets.every((s) => s.herhalingen >= doel.repMax)
}

/**
 * Mag het gewicht omhoog?
 *
 * Drie voorwaarden, en de derde is de subtiele: RIR mag het verhogen alleen
 * TEGENSPREKEN, nooit dragen. Wie 3×8 haalde maar RIR 0 logde zat aan zijn
 * plafond — die 8 kwam er met een schreeuw uit, en er 2,5 kg bovenop leggen
 * levert volgende week 3×5 op. Logde niemand RIR, dan gaan we op de reps af.
 */
function magVerhogen(doel: OefeningDoel, sessie: Sessie): boolean {
  if (sessie.werkSets.length < doel.sets) return false
  if (!haaldeBovengrens(doel, sessie)) return false
  if (sessie.laagsteRir === null) return true
  return sessie.laagsteRir >= doel.rirDoel[0]
}

/**
 * Is de prestatie duidelijk gezakt t.o.v. de sessie daarvóór?
 *
 * Zwaarder tillen is nóóit een daling, ook al staan er minder reps op de teller:
 * 3×10 op 100 kg → 3×6 op 110 kg is precies wat het programma wil. Alleen bij
 * hetzelfde of lager gewicht kijken we naar het volume.
 */
function leesDaling(vorige: Sessie, eerder?: readonly GelogdeSet[]): Daling | null {
  if (eerder === undefined) return null

  const basis = leesSessie(eerder)
  if (basis === null || basis.totaalHerhalingen <= 0) return null
  if (vorige.werkgewicht > basis.werkgewicht) return null
  if (vorige.totaalHerhalingen / basis.totaalHerhalingen > DALING_DREMPEL) return null

  return { vanReps: basis.totaalHerhalingen, naarReps: vorige.totaalHerhalingen }
}

/** De reps van een sessie zoals je ze zelf zou opschrijven: "3×8" of "10/9/7". */
function repsTekst(sets: readonly WerkSet[]): string {
  const reps = sets.map((s) => s.herhalingen)
  const eerste = reps[0]
  if (eerste !== undefined && reps.every((r) => r === eerste)) return `${reps.length}×${eerste}`
  return reps.join('/')
}

function verhoogUitleg(sessie: Sessie, naarKg: number): string {
  const reps = repsTekst(sessie.werkSets)
  return `${reps} gehaald op ${kgTekst(sessie.werkgewicht)} kg — ga naar ${kgTekst(naarKg)} kg.`
}

/**
 * Waaróm blijf je op dit gewicht? Drie verschillende antwoorden, want "blijf op
 * 120 kg tot alle sets 10 halen" tegen iemand die net 3×10 haalde is onzin.
 */
function behoudUitleg(doel: OefeningDoel, sessie: Sessie): string {
  const reps = repsTekst(sessie.werkSets)
  const kg = kgTekst(sessie.werkgewicht)

  if (!haaldeBovengrens(doel, sessie)) {
    return `${reps} — blijf op ${kg} kg tot alle ${doel.sets} sets ${doel.repMax} halen.`
  }
  if (sessie.werkSets.length < doel.sets) {
    return `${reps} op ${kg} kg — doe alle ${doel.sets} sets voor je verhoogt.`
  }
  if (sessie.laagsteRir !== null && sessie.laagsteRir < doel.rirDoel[0]) {
    return `${reps} op ${kg} kg, maar met RIR ${sessie.laagsteRir} — blijf op ${kg} kg tot het lichter voelt.`
  }
  return `${reps} op ${kg} kg — blijf op ${kg} kg.`
}

function letOpUitleg(sessie: Sessie, daling: Daling): string {
  const kg = kgTekst(sessie.werkgewicht)
  return `Volume gedaald (${daling.vanReps} → ${daling.naarReps} reps op ${kg} kg) — blijf op ${kg} kg en let op je herstel.`
}

/**
 * Geen geschiedenis, dus geen getal. De bandbreedte uit het programma is het
 * enige dat we hier eerlijk kunnen noemen — de gebruiker weet zelf wat 8 reps
 * met marge voelt, wij niet.
 */
function onbekendUitleg(doel: OefeningDoel): string {
  return `Nog geen gelogde sets — kies zelf een gewicht waarbij ${doel.repMin}-${doel.repMax} reps net lukken.`
}

/** Rond een gewicht af op een veelvoud van `stap` (bv 2.5). */
export function rondAfOpStap(kg: number, stap: number): number {
  // Onzin in, geen onzin uit: een niet-bestaand of negatief gewicht wordt 0,
  // want een voorstel onder de lege stang bestaat niet.
  if (!Number.isFinite(kg) || kg <= 0) return 0
  // Zonder bruikbare stap is er geen grid om op te vallen. Dan liever het
  // gewicht zelf dan een gedeeld-door-nul.
  if (!Number.isFinite(stap) || stap <= 0) return op2Decimalen(kg)

  const veelvouden = Math.round(op2Decimalen(kg / stap))
  return Math.max(0, op2Decimalen(veelvouden * stap))
}

/**
 * Het advies voor vandaag op basis van de VORIGE sessie (en optioneel die daarvóór,
 * om een echte daling te herkennen).
 */
export function bepaalAdvies(
  doel: OefeningDoel,
  vorige: readonly GelogdeSet[],
  eerder?: readonly GelogdeSet[],
): Advies {
  const sessie = leesSessie(vorige)
  // Niets bruikbaars gelogd. Hier wordt géén startgewicht verzonnen.
  if (sessie === null) return { soort: 'onbekend', uitleg: onbekendUitleg(doel) }

  const kg = sessie.werkgewicht

  if (magVerhogen(doel, sessie)) {
    const naarKg = rondAfOpStap(kg + doel.stap, doel.stap)
    // 'verhoog' moet ook écht hoger zijn. Bij een kapotte stap (0, NaN) rondt de
    // verhoging terug naar hetzelfde gewicht, en "ga naar 120 kg" terwijl je op
    // 120 kg staat is een leugen. Dan valt hij door naar behoud.
    if (naarKg > kg) return { soort: 'verhoog', naarKg, uitleg: verhoogUitleg(sessie, naarKg) }
  }

  // Na 'verhoog', vóór 'behoud': een stijging is nooit een waarschuwing.
  const daling = leesDaling(sessie, eerder)
  if (daling !== null) return { soort: 'let_op', kg, uitleg: letOpUitleg(sessie, daling) }

  return { soort: 'behoud', kg, uitleg: behoudUitleg(doel, sessie) }
}

/** Het voorgestelde werkgewicht voor vandaag (afgerond op de stap), of null als onbekend. */
export function voorgesteldGewicht(advies: Advies): number | null {
  switch (advies.soort) {
    case 'verhoog':
      return advies.naarKg
    case 'behoud':
    case 'let_op':
      return advies.kg
    // Onbekend blijft onbekend. Niet 0, niet een gemiddelde, niet een gok.
    case 'onbekend':
      return null
  }
}
