// ─── LifeOS — de dagbriefing ────────────────────────────────────────────────
// Wat Vita 's ochtends uit zichzelf stuurt, vóórdat Kane iets opent. Dit is waar
// "proactief" ophoudt een woord te zijn: de rest van Vita wacht tot je de pagina
// laadt, dit niet.
//
// PUUR. Geen fetch, geen DB, geen model, geen `Date.now()`. `nu` komt als
// argument binnen — zoals in `signalen.ts` en `taken/prioriteit.ts`, en om
// dezelfde reden: een functie die zelf de klok leest kun je niet testen zonder de
// tijd te mocken, en juist een ochtendbriefing hangt volledig aan het uur.
//
// ─── GEEN LLM ───────────────────────────────────────────────────────────────
// Deze tekst wordt niet geschreven door een taalmodel maar samengesteld uit de
// deterministische motor (`bepaalSignalen`) en de deterministische taakvolgorde
// (`ordenTaken`). Dat is met opzet: een bericht dat ongevraagd je telefoon laat
// trillen moet je woord voor woord kunnen navertellen. Een model dat 's ochtends
// uit zichzelf iets mag verzinnen over je slaap is geen stafchef maar een risico
// dat je niet ziet aankomen — en het valt pas op als het al gestuurd is.
//
// ─── DE REGEL ───────────────────────────────────────────────────────────────
// Elke zin hieronder komt uit iets dat er écht is. Er is geen tak die op
// afwezigheid vuurt: niets te melden → `null` → geen bericht. Een dagelijkse
// "goedemorgen, er is niets" is precies de meldingsruis waardoor je binnen twee
// weken over Vita heen leest.

import { lokaleTijd, TIJDZONE, type AgendaEvent, type Signaal } from './signalen'
import { ordenTaken, type SlimmeTaak, type TaakOordeel } from '@/lib/lifeos/taken/prioriteit'

// ─── Grenzen ────────────────────────────────────────────────────────────────
// Beleidskeuzes, geen metingen. Bij elkaar, zodat ze te verantwoorden zijn.

/** Zoveel taken noemt Vita. Meer is geen briefing maar je hele takenlijst. */
const MAX_TAKEN = 3
/**
 * Zoveel afspraken toont de briefing voluit. Bij meer volgt één eerlijke regel
 * dat er nog wat achteraan komt — nooit stil afkappen: dan mist de afspraak van
 * 17:00 en denk je dat je vrij bent.
 */
const MAX_AGENDA = 8

// ─── Invoer & uitvoer ───────────────────────────────────────────────────────

export interface BriefingInvoer {
  /** De uitkomst van `bepaalSignalen`. Al gerangschikt en al afgekapt op 3. */
  signalen: readonly Signaal[]
  /** De afspraken van vandaag. */
  agendaVandaag: readonly AgendaEvent[]
  /** Alle taken; deze module filtert zelf op open. */
  taken: readonly SlimmeTaak[]
  /** Het huidige moment. Expliciet, nooit een verborgen Date.now(). */
  nu: Date
}

export interface Briefing {
  /** De lokale dag (YYYY-MM-DD) waarvoor deze briefing geldt. */
  datum: string
  /** De tekst zoals hij verstuurd wordt. Platte tekst — geen HTML, geen Markdown. */
  tekst: string
}

// ─── Taal ───────────────────────────────────────────────────────────────────

const DATUM_FMT = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIJDZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const TIJD_FMT = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIJDZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function metHoofdletter(zin: string): string {
  return zin.charAt(0).toUpperCase() + zin.slice(1)
}

/**
 * De groet hoort bij het uur waarop het bericht áánkomt, niet bij het uur waarop
 * de cron bedoeld was te draaien. Een briefing die om 13:00 binnenkomt (uitgestelde
 * runner, handmatige trigger) en "goedemorgen" zegt, is een klein bewijs dat het
 * ding niet weet wanneer het praat.
 */
function groet(minutenVanDag: number): string {
  if (minutenVanDag < 12 * 60) return 'Goedemorgen'
  if (minutenVanDag < 18 * 60) return 'Goedemiddag'
  return 'Goedenavond'
}

// ─── Secties ────────────────────────────────────────────────────────────────
// Elke sectie geeft `null` als er niets te zeggen valt. Geen kop zonder inhoud:
// "Vandaag: (niets)" is ruis met een titel erboven.

/** Wat de motor opmerkte. Staat vooraan: je leest een briefing niet twee keer. */
function schrijfSignalen(signalen: readonly Signaal[]): string | null {
  if (signalen.length === 0) return null
  return ['Wat opvalt:', ...signalen.map((s) => `- ${s.tekst}`)].join('\n')
}

function agendaRegel(event: AgendaEvent): string {
  if (event.heleDag) return `- hele dag — ${event.titel}`
  const start = TIJD_FMT.format(event.startOp)
  // Geen gegokte eindtijd: "duurt vast een uur" is een verzinsel dat er in een
  // briefing precies zo uitziet als een gemeten feit.
  if (event.eindOp === null) return `- ${start} — ${event.titel} (eindtijd onbekend)`
  return `- ${start}–${TIJD_FMT.format(event.eindOp)} — ${event.titel}`
}

function schrijfAgenda(agenda: readonly AgendaEvent[]): string | null {
  if (agenda.length === 0) return null

  // Immutable: sorteren op een kopie. De aanroeper geeft zijn lijst niet weg.
  const opTijd = [...agenda].sort((a, b) => a.startOp.getTime() - b.startOp.getTime())
  const getoond = opTijd.slice(0, MAX_AGENDA)
  const rest = opTijd.length - getoond.length

  const regels = ['Vandaag:', ...getoond.map(agendaRegel)]
  if (rest > 0) regels.push(`- en nog ${rest} ${rest === 1 ? 'afspraak' : 'afspraken'} daarna.`)
  return regels.join('\n')
}

/**
 * Waarom deze taak hier staat. Eén reden, niet drie.
 *
 * De top-3 krijgt "jouw top-3" en géén score-reden: dat is Kane's wil, en die
 * hoeft zich niet te verantwoorden tegenover de formule (zie `prioriteit.ts`).
 * Een taak zonder oordeel krijgt hier `null` — dan zegt Vita niets in plaats van
 * een reden te verzinnen voor een volgorde die hij zelf niet kan onderbouwen.
 */
function taakReden(oordeel: TaakOordeel): string | null {
  if (oordeel.isTop3) return 'jouw top-3'
  if (oordeel.score === null) return null
  return oordeel.redenen[0] ?? null
}

function taakRegel(oordeel: TaakOordeel, positie: number): string {
  const reden = taakReden(oordeel)
  const staart = reden === null ? '' : ` — ${reden}`
  return `${positie}. ${oordeel.taak.titel}${staart}`
}

/**
 * Waar je aan begint. De volgorde komt uit `ordenTaken`: top-3 eerst (Kane's wil),
 * daarna op score, daarna wat niet te wegen is. Die volgorde wordt hier niet
 * overgedaan — één bron van waarheid, en die staat in `prioriteit.ts`.
 */
function schrijfTaken(taken: readonly SlimmeTaak[], vandaag: string): string | null {
  const open = taken.filter((t) => !t.klaar)
  if (open.length === 0) return null

  const eerste = ordenTaken(open, vandaag).slice(0, MAX_TAKEN)
  if (eerste.length === 0) return null

  return ['Als eerste:', ...eerste.map((o, i) => taakRegel(o, i + 1))].join('\n')
}

// ─── De briefing ────────────────────────────────────────────────────────────

/**
 * Stelt de dagbriefing samen.
 *
 * Geeft `null` als er niets te melden is — geen signalen, geen afspraken, geen
 * open taken. Dan stuurt de cron niets. Dat is geen storing en geen gat: het is
 * het verschil tussen een assistent en een wekker.
 *
 * Let op: `null` betekent hier "er valt niets te zeggen", NIET "er is niets
 * gemeten". Dat tweede onderscheid hoort bij de aanroeper — die weet welke bron
 * viel (zie `vakkenMetFout` in context.ts) en hoort géén briefing te sturen die
 * op een gevallen bron gebaseerd is.
 */
export function stelBriefingSamen(invoer: BriefingInvoer): Briefing | null {
  const { datum, minutenVanDag } = lokaleTijd(invoer.nu)

  const secties = [
    schrijfSignalen(invoer.signalen),
    schrijfAgenda(invoer.agendaVandaag),
    schrijfTaken(invoer.taken, datum),
  ].filter((s): s is string => s !== null)

  if (secties.length === 0) return null

  const kop = `${groet(minutenVanDag)}. ${metHoofdletter(DATUM_FMT.format(invoer.nu))}.`
  return { datum, tekst: [kop, '', ...intersperse(secties)].join('\n') }
}

/** Lege regel tussen de secties. Los, zodat er nooit één aan het eind blijft plakken. */
function intersperse(secties: readonly string[]): string[] {
  return secties.flatMap((sectie, i) => (i === 0 ? [sectie] : ['', sectie]))
}
