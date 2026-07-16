// ─── LifeOS — Vita's proactieve motor ───────────────────────────────────────
// Dit is het hart van Vita, en daarmee van LifeOS. Hier wordt de keten gelegd
// die tien losse apps nooit kunnen leggen:
//
//   slechte slaap → training gepland → houd 'm lichter
//   drukke dag    → geen vrij blok   → train vanavond
//
// Vita is proactief, niet reactief: hij wacht niet op een vraag. Deze module
// bepaalt wat hij uit zichzelf zegt. Deterministisch, zonder LLM — een taalmodel
// dat zelf mag beslissen wanneer het je aantikt, is geen chief of staff maar een
// gokautomaat.
//
// PUUR. Geen fetch, geen DB, geen model, geen Date.now(). Alles komt als
// argument binnen, inclusief de tijd. Zo is dit testbaar zonder de klok te
// mocken en zonder één account.
//
// ─── DE REGEL DIE ALLES STUURT ──────────────────────────────────────────────
// Een signaal mag ALLEEN afgaan op data die er écht is. Geen slaapdata → geen
// slaapsignaal. Nooit "0 uur geslapen" omdat er niets binnenkwam.
//
// Dat is hier geen afspraak maar een eigenschap van de constructie: elke regel
// hieronder heeft POSITIEF BEWIJS nodig om te vuren.
//
//   afspraakNabij     → heeft een event nodig
//   korteSlaapTraining→ heeft slaapMinuten !== null én een training-event nodig
//   volleDagTraining  → heeft ≥ 3 events nodig
//   top3Open          → heeft een open top-3-taak nodig
//   geenBeweging      → heeft 5 dagen mét een gemeten 0 nodig
//
// Lege invoer levert dus per definitie nul signalen op. Er is geen tak die op
// afwezigheid vuurt. Voeg er ook nooit een toe: "je hebt vandaag niets gedaan"
// tegen iemand wiens wearable simpelweg niet synct, is precies de leugen die
// MentaForce jarenlang vertelde met een verzonnen `score: 50`.

// ─── Invoer ─────────────────────────────────────────────────────────────────

/** Eén dag herstel. Elk meetveld is nullable: `null` = niet gemeten. */
export interface HerstelDag {
  /** ISO-datum (YYYY-MM-DD), lokale tijd. Conventie: de dag waarop je wakker werd. */
  datum: string
  /** Slaapduur in minuten, of null als er niets gemeten is. */
  slaapMinuten: number | null
  /**
   * Actieve minuten die dag, of null als er niets gemeten is.
   *
   * `0` en `null` zijn hier NIET hetzelfde, en dat verschil draagt de hele
   * beweging-regel: `0` betekent "we weten het, en het was niets", `null`
   * betekent "we weten het niet". Alleen het eerste mag een signaal opleveren.
   */
  actieveMinuten: number | null
}

/** Eén agenda-afspraak. */
export interface AgendaEvent {
  titel: string
  startOp: Date
  /** null = de bron gaf geen eindtijd. Niet hetzelfde als "duurt 0 minuten". */
  eindOp: Date | null
  heleDag: boolean
}

/** Eén taak. */
export interface Taak {
  titel: string
  klaar: boolean
  /** ISO-datum (YYYY-MM-DD), of null als de taak niet op een dag staat. */
  datum: string | null
  /** 1–3 als de taak in de top-3 staat, anders null. */
  top3Positie: number | null
}

export interface SignaalInvoer {
  /** Herstel van de afgelopen ~7 dagen. Volgorde maakt niet uit. */
  herstel: readonly HerstelDag[]
  /** De afspraken van vandaag. */
  agendaVandaag: readonly AgendaEvent[]
  /** Open taken (inclusief de top-3). */
  taken: readonly Taak[]
  /** Het huidige moment. Expliciet, nooit een verborgen Date.now(). */
  nu: Date
}

// ─── Uitvoer ────────────────────────────────────────────────────────────────

export type SignaalSoort =
  | 'afspraak-nabij'
  | 'korte-slaap-training'
  | 'volle-dag-training'
  | 'top3-open'
  | 'geen-beweging'

export interface Signaal {
  soort: SignaalSoort
  /** Hoger = urgenter. Zie URGENTIE. */
  urgentie: number
  /** De zin zoals Vita hem zegt. Bevat alleen cijfers die écht gemeten zijn. */
  tekst: string
}

// ─── Drempels ───────────────────────────────────────────────────────────────
// Dit zijn beleidskeuzes, geen metingen. Ze staan hier bij elkaar zodat ze te
// verantwoorden en te verstellen zijn, in plaats van verstopt in een if.

/** Een afspraak "komt eraan" binnen dit venster. */
const AFSPRAAK_VENSTER_MINUTEN = 45
/** Onder deze slaapduur adviseert Vita een lichtere training. */
const KORTE_SLAAP_MINUTEN = 6 * 60
/** Vanaf dit aantal afspraken heet een dag vol. */
const VOLLE_DAG_AFSPRAKEN = 3
/** Een gat van minstens zoveel minuten telt als vrij blok. */
const VRIJ_BLOK_MINUTEN = 60
/** "Overdag" loopt van 09:00 tot 18:00 lokale tijd. */
const DAG_START_MINUUT = 9 * 60
const DAG_EIND_MINUUT = 18 * 60
/** Na dit uur herinnert Vita aan een openstaande top-3-taak. */
const TOP3_HERINNERING_UUR = 16
/** Zoveel dagen op rij zonder gemeten beweging levert een signaal op. */
const BEWEGING_DAGEN = 5

/**
 * Maximaal aantal signalen. Twintig signalen is ruis, en ruis is precies wat we
 * vermijden — dan leert Kane het paneel wegkijken en is Vita niets meer waard.
 */
export const MAX_SIGNALEN = 3

/** De rangorde. Urgenter staat bovenaan; alleen de top-3 haalt het scherm. */
const URGENTIE: Readonly<Record<SignaalSoort, number>> = Object.freeze({
  'afspraak-nabij': 100,
  'korte-slaap-training': 80,
  'volle-dag-training': 60,
  'top3-open': 40,
  'geen-beweging': 20,
})

/**
 * Titels die op een training wijzen. Bewust kort en bewust conservatief: een
 * gemiste training kost één signaal, een verkeerd herkende training levert
 * advies over een afspraak die geen training is. Het eerste is een gemis, het
 * tweede ondermijnt het vertrouwen in alles wat Vita zegt.
 */
const TRAINING_WOORDEN: readonly string[] = [
  'training',
  'workout',
  'gym',
  'sportschool',
  'fitness',
  'crossfit',
  'hardlopen',
  'hardloop',
]

// ─── Tijd ───────────────────────────────────────────────────────────────────
// De tijdzone staat hier vast in plaats van dat we op de zone van het proces
// vertrouwen. Vercel draait op UTC: `getHours()` zou daar in de zomer twee uur
// mis zitten, en dan tikt de top-3-herinnering om 14:00 aan. Ook de klok van de
// client vertrouwen we niet — die is te manipuleren en te verzetten.

export const TIJDZONE = 'Europe/Amsterdam'

const DEEL_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIJDZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

interface LokaleTijd {
  /** ISO-datum (YYYY-MM-DD) in TIJDZONE. */
  datum: string
  /** Minuten sinds middernacht in TIJDZONE (0–1439). */
  minutenVanDag: number
}

/** Leest een absoluut moment als lokale wandklok. */
export function lokaleTijd(moment: Date): LokaleTijd {
  const delen: Record<string, string> = {}
  for (const deel of DEEL_FMT.formatToParts(moment)) {
    delen[deel.type] = deel.value
  }
  const { year, month, day } = delen
  const uur = Number(delen.hour)
  const minuut = Number(delen.minute)

  if (!year || !month || !day || !Number.isFinite(uur) || !Number.isFinite(minuut)) {
    // Geen stille terugval op "nu" of op UTC: dan zou elke regel hieronder op
    // een verkeerde klok draaien zonder dat iemand het merkt.
    throw new Error(`Kan lokale tijd niet bepalen voor ${moment.toISOString()}`)
  }
  return { datum: `${year}-${month}-${day}`, minutenVanDag: uur * 60 + minuut }
}

const tweeCijfers = (n: number): string => String(n).padStart(2, '0')

/** ISO-datum, `dagen` dagen eerder. Rekent in UTC, dus zomertijd doet niets. */
export function datumMinDagen(isoDatum: string, dagen: number): string {
  const [jaar, maand, dag] = isoDatum.split('-').map(Number)
  if (jaar === undefined || maand === undefined || dag === undefined) {
    throw new Error(`Ongeldige datum: ${isoDatum}`)
  }
  const verschoven = new Date(Date.UTC(jaar, maand - 1, dag) - dagen * 86_400_000)
  return [
    verschoven.getUTCFullYear(),
    tweeCijfers(verschoven.getUTCMonth() + 1),
    tweeCijfers(verschoven.getUTCDate()),
  ].join('-')
}

// ─── Taal ───────────────────────────────────────────────────────────────────

const AANTAL_WOORD: readonly string[] = [
  'nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen',
]

/** "drie" t/m negen, daarboven het cijfer. Voorkomt "3 afspraken" in lopende tekst. */
function inWoorden(n: number): string {
  return AANTAL_WOORD[n] ?? String(n)
}

/** 372 → "6u12". Alleen voor écht gemeten minuten. */
function alsUren(minuten: number): string {
  return `${Math.floor(minuten / 60)}u${tweeCijfers(minuten % 60)}`
}

// ─── Regel 1: een afspraak komt eraan ───────────────────────────────────────

function afspraakNabij(invoer: SignaalInvoer): Signaal | null {
  const { agendaVandaag, nu } = invoer

  const aanstaand = agendaVandaag
    .filter((e) => !e.heleDag)
    .map((e) => ({ event: e, overMs: e.startOp.getTime() - nu.getTime() }))
    .filter((e) => e.overMs > 0 && e.overMs <= AFSPRAAK_VENSTER_MINUTEN * 60_000)
    .sort((a, b) => a.overMs - b.overMs)[0]

  if (!aanstaand) return null

  const minuten = Math.ceil(aanstaand.overMs / 60_000)
  const woord = minuten === 1 ? 'minuut' : 'minuten'
  return {
    soort: 'afspraak-nabij',
    urgentie: URGENTIE['afspraak-nabij'],
    tekst: `${aanstaand.event.titel} begint over ${minuten} ${woord}.`,
  }
}

// ─── Regel 2: kort geslapen én een training gepland ─────────────────────────

function isTraining(titel: string): boolean {
  const klein = titel.toLowerCase()
  return TRAINING_WOORDEN.some((woord) => klein.includes(woord))
}

function korteSlaapTraining(invoer: SignaalInvoer): Signaal | null {
  const { herstel, agendaVandaag, nu } = invoer
  const vandaag = lokaleTijd(nu).datum

  // "Vannacht" = de meting van de dag waarop je wakker werd, dus die van vandaag.
  const vannacht = herstel.find((d) => d.datum === vandaag)
  const slaap = vannacht?.slaapMinuten
  // Zonder meting geen signaal. Niet "0 uur", niet het gemiddelde van de week.
  if (slaap === null || slaap === undefined) return null
  if (slaap >= KORTE_SLAAP_MINUTEN) return null

  const training = agendaVandaag.find((e) => !e.heleDag && isTraining(e.titel))
  if (!training) return null

  // Bewust geen oorzakelijk verband: LifeOS meet niet dát korte slaap je training
  // slechter maakt. Dit is advies bij een feit, geen bewering over een mechanisme.
  return {
    soort: 'korte-slaap-training',
    urgentie: URGENTIE['korte-slaap-training'],
    tekst:
      `Je sliep ${alsUren(slaap)} en hebt ${training.titel} gepland. ` +
      `Overweeg 'm vandaag lichter te houden.`,
  }
}

// ─── Regel 3: volle dag zonder vrij blok ────────────────────────────────────

interface Blok {
  start: number
  eind: number
}

/** Afspraken van vandaag als bloktijden, geknipt op het dagvenster. */
function blokkenOverdag(events: readonly AgendaEvent[], vandaag: string): Blok[] {
  const blokken: Blok[] = []
  for (const event of events) {
    // De guard narrowt eindOp naar Date — geen cast nodig, want een `filter`
    // geeft die kennis niet door aan het type.
    if (event.heleDag || event.eindOp === null) continue
    const start = lokaleTijd(event.startOp)
    if (start.datum !== vandaag) continue

    const blok: Blok = {
      start: Math.max(DAG_START_MINUUT, start.minutenVanDag),
      eind: Math.min(DAG_EIND_MINUUT, lokaleTijd(event.eindOp).minutenVanDag),
    }
    if (blok.eind > blok.start) blokken.push(blok)
  }
  return blokken.sort((a, b) => a.start - b.start)
}

/**
 * Is er overdag een gat van minstens VRIJ_BLOK_MINUTEN?
 *
 * Afspraken zonder eindtijd tellen hier niet mee: we weten hun duur niet, en
 * gokken zou de dag voller maken dan bewezen is. Die onwetendheid valt dus naar
 * "er is wél ruimte" → geen signaal. Twijfel levert stilte op, geen advies.
 */
function heeftVrijBlokOverdag(events: readonly AgendaEvent[], vandaag: string): boolean {
  let cursor = DAG_START_MINUUT
  for (const blok of blokkenOverdag(events, vandaag)) {
    if (blok.start - cursor >= VRIJ_BLOK_MINUTEN) return true
    cursor = Math.max(cursor, blok.eind)
  }
  return DAG_EIND_MINUUT - cursor >= VRIJ_BLOK_MINUTEN
}

function volleDagTraining(invoer: SignaalInvoer): Signaal | null {
  const { agendaVandaag, nu } = invoer
  const vandaag = lokaleTijd(nu).datum

  const afspraken = agendaVandaag.filter(
    (e) => !e.heleDag && lokaleTijd(e.startOp).datum === vandaag,
  )
  if (afspraken.length < VOLLE_DAG_AFSPRAKEN) return null
  if (heeftVrijBlokOverdag(agendaVandaag, vandaag)) return null

  return {
    soort: 'volle-dag-training',
    urgentie: URGENTIE['volle-dag-training'],
    tekst:
      `${inWoorden(afspraken.length)} afspraken vandaag en geen vrij blok overdag. ` +
      `Zet je training op vanavond.`,
  }
}

// ─── Regel 4: top-3-taak nog open na 16:00 ──────────────────────────────────

function top3Open(invoer: SignaalInvoer): Signaal | null {
  const { taken, nu } = invoer
  const { datum: vandaag, minutenVanDag } = lokaleTijd(nu)
  if (minutenVanDag < TOP3_HERINNERING_UUR * 60) return null

  const open = taken
    .filter((t) => !t.klaar && t.top3Positie !== null && t.datum === vandaag)
    .sort((a, b) => (a.top3Positie ?? 0) - (b.top3Positie ?? 0))

  if (open.length === 0) return null

  const eerste = open[0]
  if (!eerste) return null

  const tekst =
    open.length === 1
      ? `Je top-3 heeft nog één taak open: ${eerste.titel}.`
      : `Nog ${inWoorden(open.length)} van je top-3 open: ` +
        `${open.map((t) => t.titel).join(', ')}.`

  return { soort: 'top3-open', urgentie: URGENTIE['top3-open'], tekst }
}

// ─── Regel 5: dagen op rij geen beweging gelogd ─────────────────────────────

function geenBeweging(invoer: SignaalInvoer): Signaal | null {
  const { herstel, nu } = invoer
  const vandaag = lokaleTijd(nu).datum

  // Vandaag telt niet mee: die dag is nog niet voorbij, en om 08:00 aantikken
  // dat je "vandaag niet bewogen hebt" is geen inzicht maar een verwijt.
  const dagen = Array.from({ length: BEWEGING_DAGEN }, (_, i) =>
    datumMinDagen(vandaag, i + 1),
  )

  // Élke dag moet een gemeten nul zijn. Eén ontbrekende dag → we weten het niet
  // → geen signaal. Zo kan een niet-synchroniserende wearable nooit als
  // "niet bewogen" gelezen worden.
  const allemaalStil = dagen.every((datum) => {
    const dag = herstel.find((d) => d.datum === datum)
    return dag?.actieveMinuten === 0
  })
  if (!allemaalStil) return null

  return {
    soort: 'geen-beweging',
    urgentie: URGENTIE['geen-beweging'],
    // "Staat er geen beweging gelogd" beschrijft het logboek, niet je lichaam.
    // Vita weet niet of je bewogen hebt; hij weet wat er geregistreerd is.
    tekst: `De afgelopen ${inWoorden(BEWEGING_DAGEN)} dagen staat er geen beweging gelogd.`,
  }
}

// ─── De motor ───────────────────────────────────────────────────────────────

const REGELS: readonly ((invoer: SignaalInvoer) => Signaal | null)[] = [
  afspraakNabij,
  korteSlaapTraining,
  volleDagTraining,
  top3Open,
  geenBeweging,
]

/**
 * Bepaalt wat Vita nu uit zichzelf zou zeggen.
 *
 * Gerangschikt op urgentie, maximaal MAX_SIGNALEN. Lege invoer → lege lijst;
 * er is geen regel die op afwezigheid van data vuurt (zie de kop van dit bestand).
 */
export function bepaalSignalen(invoer: SignaalInvoer): Signaal[] {
  const gevonden: Signaal[] = []
  for (const regel of REGELS) {
    const signaal = regel(invoer)
    if (signaal) gevonden.push(signaal)
  }
  // Array.prototype.sort is stabiel sinds ES2019, dus gelijke urgenties houden
  // de volgorde van REGELS. Geen willekeur in wat bovenaan staat.
  return gevonden.sort((a, b) => b.urgentie - a.urgentie).slice(0, MAX_SIGNALEN)
}
