// ─── LifeOS — de Orchestrator-dagbriefing ───────────────────────────────────
// De "COO"-laag: één ochtendbriefing die de échte data van de founder samenvat
// tot een korte samenvatting + prioriteiten, risico's en kansen. Dit bestand
// verbindt de losse domeinen (taken, CRM, agenda, welzijn) tot één verhaal.
//
// ─── PUUR EN INJECTEERBAAR ──────────────────────────────────────────────────
// Geen fetch, geen DB, geen Date.now(). Dit bestand krijgt een KANT-EN-KLAAR
// feiten-object en een injecteerbaar `BriefingModel` binnen — precies zoals
// `intentie.ts`/`concept.ts`. Zo is de hele briefing zonder netwerk te testen met
// een nep-model, en `dagbriefing-model.ts` levert apart de echte Anthropic-call.
//
// ─── EERLIJKHEID (niet onderhandelbaar, dezelfde regel als overal in LifeOS) ─
// Elke zin komt uit een feit dat er ÉCHT is. Een leeg domein is "geen data" — dat
// benoemen we of laten we weg, we vullen het NOOIT op met een verzonnen getal.
// Kane's voorbeeld ("omzet 8% achter") mag alleen met een echte bron; die is er
// nu niet voor finance, dus dat komt hier niet in.
//
// ─── DE FALLBACK IS GEEN BIJZAAK ────────────────────────────────────────────
// `stelDagbriefingSamen` faalt nooit: valt het model of de sleutel weg, dan bouwt
// het uit exact dezelfde feiten een nette deterministische briefing. Een kaart
// die bij een modelstoring leeg blijft, is erger dan een kaart die het rustig
// zelf samenvat.

// ─── De feiten ──────────────────────────────────────────────────────────────
// Compact en feitelijk: getallen + kernnamen. Dit is de ENIGE input voor de
// briefing. Elk domein mag `null` zijn ("niet meegenomen / geen data") — dan
// blijft de briefing eerlijk stil over dat domein.

export interface TakenFeiten {
  /** Aantal open taken dat vandaag gepland staat. */
  vandaagAantal: number
  /** De eerste (top-3-)titels van vandaag, hooguit een handvol. */
  vandaagTitels: string[]
  /** Aantal open taken dat over tijd is. */
  teLaatAantal: number
  /** Een paar titels van de te-late taken. */
  teLaatTitels: string[]
}

export interface CrmFeiten {
  /** Aantal mensen dat deze week (nog) gesproken moet worden. */
  teSprekenAantal: number
  /** Een paar namen daarvan. */
  teSprekenNamen: string[]
}

export interface AgendaFeiten {
  /** Aantal afspraken vandaag. */
  aantal: number
  /** De eerstvolgende afspraak (titel + voorgevormde lokale tijd), of null. */
  eerstvolgende: { titel: string; tijd: string } | null
}

export interface WelzijnFeiten {
  /** Overall welzijnsscore 0–100, of null als er niets gemeten is. */
  wellbeingScore: number | null
  /** De laagst scorende pijler MÉT data, of null. */
  laagstePijler: { label: string; score: number } | null
}

export interface DagbriefingFeiten {
  taken: TakenFeiten | null
  crm: CrmFeiten | null
  agenda: AgendaFeiten | null
  welzijn: WelzijnFeiten | null
  /** Het huidige moment. Expliciet, nooit een verborgen Date.now(). */
  nu: Date
}

// ─── De uitvoer (het API-contract) ──────────────────────────────────────────

export interface Dagbriefing {
  /** Bv. "Goedemorgen". De frontend plakt de naam erachter. */
  groet: string
  /** 2–3 zinnen eerlijke samenvatting. */
  briefing: string
  /** 0–4 korte actie-bullets. */
  prioriteiten: string[]
  /** 0–3 risico's. */
  risicos: string[]
  /** 0–3 kansen. */
  kansen: string[]
  /** ISO-moment waarop de briefing gemaakt is. */
  gegenereerdOp: string
}

/** De kern die het model (of de fallback) levert; groet en tijd zet de wrapper. */
interface BriefingKern {
  briefing: string
  prioriteiten: string[]
  risicos: string[]
  kansen: string[]
}

// ─── Het model (injecteerbaar) ──────────────────────────────────────────────
// Spiegelt `IntentieModel`/`ConceptModel`: één methode, een `unknown` terug (het
// gedwongen-JSON-antwoord). `dagbriefing-model.ts` levert de echte implementatie.

export interface BriefingModel {
  schrijf(systeem: string, feiten: string): Promise<unknown>
}

/** Het schema dat het model MOET invullen (tool-use). Eén bron van waarheid. */
export const DAGBRIEFING_SCHEMA = {
  type: 'object',
  properties: {
    briefing: {
      type: 'string',
      description: '2–3 zinnen, eerlijke samenvatting van de dag. Alleen uit de feiten.',
    },
    prioriteiten: {
      type: 'array',
      items: { type: 'string' },
      description: '0–4 korte, imperatieve actie-bullets.',
    },
    risicos: {
      type: 'array',
      items: { type: 'string' },
      description: '0–3 dingen die misgaan als je niets doet.',
    },
    kansen: {
      type: 'array',
      items: { type: 'string' },
      description: '0–3 kansen die vandaag openliggen.',
    },
  },
  required: ['briefing', 'prioriteiten', 'risicos', 'kansen'],
  additionalProperties: false,
} as const

// ─── Grenzen ────────────────────────────────────────────────────────────────
// Beleidskeuzes, geen metingen. Bij elkaar zodat ze te verantwoorden zijn.

const MAX_PRIORITEITEN = 4
const MAX_RISICOS = 3
const MAX_KANSEN = 3
/** Zoveel titels/namen noemt de briefing per domein. Meer is geen briefing. */
const MAX_TITELS = 3
/** Onder deze pijlerscore heet een pijler "vraagt aandacht" (spiegelt scoreNiveau). */
const LAGE_PIJLER_DREMPEL = 40
/** Vanaf deze welzijnsscore noemt de briefing het een sterk moment. */
const STERK_WELZIJN_DREMPEL = 70

// ─── Tijd ───────────────────────────────────────────────────────────────────
// De tijdzone staat vast: Vercel draait op UTC, en een "goedemorgen" die op de
// procesklok leunt zegt 's zomers twee uur mis. Zelfde reden als in `signalen.ts`.

const TIJDZONE = 'Europe/Amsterdam'

const UUR_FMT = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIJDZONE,
  hour: '2-digit',
  hourCycle: 'h23',
})

const KLOK_FMT = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIJDZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function amsterdamUur(nu: Date): number {
  const uur = Number(UUR_FMT.format(nu))
  // Geen stille terugval op UTC: bij een onparsbare klok kies je liever een
  // neutrale groet dan een verkeerde. 12 valt in "goedemiddag".
  return Number.isFinite(uur) ? uur : 12
}

/** De groet hoort bij het uur waarop de briefing gemaakt wordt, niet bij de cron. */
export function groetVoor(nu: Date): string {
  const uur = amsterdamUur(nu)
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

// ─── Taal ───────────────────────────────────────────────────────────────────

function meervoud(aantal: number, enkel: string, meer: string): string {
  return aantal === 1 ? enkel : meer
}

/** "Ruben, Jan en Sanne" — hooguit MAX_TITELS, met "…" als er meer zijn. */
function benoem(titels: readonly string[]): string {
  const getoond = titels.slice(0, MAX_TITELS)
  const rest = titels.length - getoond.length
  const lijst = getoond.join(', ')
  return rest > 0 ? `${lijst}…` : lijst
}

// ─── De feiten als tekst (de enige input voor het model) ─────────────────────

function takenBlok(taken: TakenFeiten | null): string {
  if (taken === null) return 'Geen taken-data beschikbaar.'
  const regels: string[] = []
  if (taken.vandaagAantal > 0) {
    const titels = taken.vandaagTitels.length > 0 ? ` (${benoem(taken.vandaagTitels)})` : ''
    regels.push(`- Vandaag gepland: ${taken.vandaagAantal} open ${meervoud(taken.vandaagAantal, 'taak', 'taken')}${titels}.`)
  } else {
    regels.push('- Vandaag gepland: geen taken.')
  }
  if (taken.teLaatAantal > 0) {
    const titels = taken.teLaatTitels.length > 0 ? ` (${benoem(taken.teLaatTitels)})` : ''
    regels.push(`- Te laat: ${taken.teLaatAantal} ${meervoud(taken.teLaatAantal, 'taak', 'taken')} over tijd${titels}.`)
  } else {
    regels.push('- Te laat: niets over tijd.')
  }
  return regels.join('\n')
}

function crmBlok(crm: CrmFeiten | null): string {
  if (crm === null) return 'Geen contact-data beschikbaar.'
  if (crm.teSprekenAantal === 0) return 'Iedereen is deze week al gesproken.'
  const namen = crm.teSprekenNamen.length > 0 ? ` (${benoem(crm.teSprekenNamen)})` : ''
  return `- Deze week te spreken: ${crm.teSprekenAantal} ${meervoud(crm.teSprekenAantal, 'contact', 'contacten')}${namen}.`
}

function agendaBlok(agenda: AgendaFeiten | null): string {
  if (agenda === null) return 'Geen agenda-data beschikbaar.'
  if (agenda.aantal === 0) return 'Geen afspraken vandaag.'
  const volgende = agenda.eerstvolgende
    ? ` Eerstvolgende: ${agenda.eerstvolgende.titel} om ${agenda.eerstvolgende.tijd}.`
    : ''
  return `- ${agenda.aantal} ${meervoud(agenda.aantal, 'afspraak', 'afspraken')} vandaag.${volgende}`
}

function welzijnBlok(welzijn: WelzijnFeiten | null): string {
  if (welzijn === null) return 'Geen welzijnsdata gemeten.'
  const regels: string[] = []
  if (welzijn.wellbeingScore !== null) {
    regels.push(`- Welzijnsscore: ${welzijn.wellbeingScore}/100.`)
  }
  if (welzijn.laagstePijler !== null) {
    regels.push(`- Laagste pijler: ${welzijn.laagstePijler.label} (${welzijn.laagstePijler.score}/100).`)
  }
  return regels.length > 0 ? regels.join('\n') : 'Geen welzijnsdata gemeten.'
}

/** De feiten als één compact, feitelijk tekstblok. */
export function feitenTekst(feiten: DagbriefingFeiten): string {
  return [
    `# Feiten voor de dagbriefing (opgebouwd op ${KLOK_FMT.format(feiten.nu)}, ${TIJDZONE})`,
    '',
    '## Taken',
    takenBlok(feiten.taken),
    '',
    '## Contacten (CRM)',
    crmBlok(feiten.crm),
    '',
    '## Agenda vandaag',
    agendaBlok(feiten.agenda),
    '',
    '## Welzijn',
    welzijnBlok(feiten.welzijn),
  ].join('\n')
}

// ─── De systeemprompt ───────────────────────────────────────────────────────

export function dagbriefingSysteem(nu: Date): string {
  return [
    'Je bent de stafchef (COO) van Kane\'s persoonlijke systeem LifeOS. Je schrijft',
    'een korte, nuchtere ochtendbriefing die de losse domeinen verbindt.',
    `Nu is het: ${KLOK_FMT.format(nu)} (${TIJDZONE}).`,
    '',
    'Je krijgt een blok FEITEN. Schrijf UITSLUITEND op basis daarvan:',
    '- briefing: 2–3 zinnen, een eerlijke samenvatting van de dag.',
    '- prioriteiten: 0–4 korte, imperatieve actie-bullets.',
    '- risicos: 0–3 dingen die misgaan als je niets doet.',
    '- kansen: 0–3 kansen die vandaag openliggen.',
    '',
    'HARDE REGELS (niet onderhandelbaar):',
    '- Verzin NOOIT cijfers, percentages, namen, taken of afspraken die niet in de feiten staan.',
    '- Een vak dat "geen data" zegt is leeg: benoem dat eerlijk of laat het weg. Vul het nooit op.',
    '- Gebruik alleen de exacte titels, namen en getallen uit de feiten.',
    '- Geen valse urgentie, geen motivatie-cliché, geen vleierij. Concreet en rustig.',
    '- Nederlands, helder en menselijk.',
    '- Is er nergens data? Zeg dat het rustig is; verzin geen drukte.',
  ].join('\n')
}

// ─── Systeemgrens: het antwoord van het model ───────────────────────────────
// Ook een gedwongen-JSON-antwoord is externe input: we narrowen, we casten niet.
// Een onbruikbaar antwoord wordt `null`, en dan valt de wrapper op de fallback.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/** Een lijst getrimde, niet-lege strings, afgekapt op `max`. */
function leesLijst(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return []
  const uit: string[] = []
  for (const item of v) {
    const s = tekst(item)
    if (s !== null) uit.push(s)
    if (uit.length >= max) break
  }
  return uit
}

/** Modelantwoord → kern, of null als er niet eens een briefing-zin is. */
export function leesModelBriefing(raw: unknown): BriefingKern | null {
  if (!isObject(raw)) return null
  const briefing = tekst(raw.briefing)
  if (briefing === null) return null
  return {
    briefing,
    prioriteiten: leesLijst(raw.prioriteiten, MAX_PRIORITEITEN),
    risicos: leesLijst(raw.risicos, MAX_RISICOS),
    kansen: leesLijst(raw.kansen, MAX_KANSEN),
  }
}

// ─── De deterministische fallback ───────────────────────────────────────────
// Zonder model, uit exact dezelfde feiten. Elke zin komt uit een feit; er is geen
// tak die iets verzint. Zo breekt de kaart nooit als het model of de sleutel valt.

function fallbackBriefing(feiten: DagbriefingFeiten): string {
  const zinnen: string[] = []

  const { taken, agenda, crm } = feiten
  if (agenda && agenda.aantal > 0) {
    const volgende = agenda.eerstvolgende
      ? ` De eerste is ${agenda.eerstvolgende.titel} om ${agenda.eerstvolgende.tijd}.`
      : ''
    zinnen.push(`Je hebt ${agenda.aantal} ${meervoud(agenda.aantal, 'afspraak', 'afspraken')} op de agenda.${volgende}`)
  }
  if (taken && taken.vandaagAantal > 0) {
    zinnen.push(`Er ${meervoud(taken.vandaagAantal, 'staat', 'staan')} ${taken.vandaagAantal} ${meervoud(taken.vandaagAantal, 'taak', 'taken')} gepland voor vandaag.`)
  }
  if (crm && crm.teSprekenAantal > 0) {
    zinnen.push(`${crm.teSprekenAantal} ${meervoud(crm.teSprekenAantal, 'contact wacht', 'contacten wachten')} deze week op een gesprek.`)
  }

  if (zinnen.length === 0) {
    return 'Rustige dag: geen taken, afspraken of contacten die nu om aandacht vragen.'
  }
  // Hooguit drie zinnen — een briefing, geen verslag.
  return zinnen.slice(0, 3).join(' ')
}

function fallbackPrioriteiten(taken: TakenFeiten | null): string[] {
  if (taken === null) return []
  // Vandaag eerst (top-3 vooraan). Zijn er geen dag-taken maar wél te-late, dan
  // zijn díé het werk van vandaag.
  const bron = taken.vandaagTitels.length > 0 ? taken.vandaagTitels : taken.teLaatTitels
  return bron.slice(0, MAX_PRIORITEITEN)
}

function fallbackRisicos(feiten: DagbriefingFeiten): string[] {
  const risicos: string[] = []
  const { taken, welzijn } = feiten

  if (taken && taken.teLaatAantal > 0) {
    const titels = taken.teLaatTitels.length > 0 ? `: ${benoem(taken.teLaatTitels)}` : ''
    risicos.push(`${taken.teLaatAantal} ${meervoud(taken.teLaatAantal, 'taak is', 'taken zijn')} over tijd${titels}.`)
  }
  if (welzijn && welzijn.laagstePijler && welzijn.laagstePijler.score < LAGE_PIJLER_DREMPEL) {
    risicos.push(`${welzijn.laagstePijler.label} vraagt aandacht (${welzijn.laagstePijler.score}/100).`)
  }
  return risicos.slice(0, MAX_RISICOS)
}

function fallbackKansen(feiten: DagbriefingFeiten): string[] {
  const kansen: string[] = []
  const { crm, agenda, welzijn } = feiten

  if (crm && crm.teSprekenAantal > 0) {
    const namen = crm.teSprekenNamen.length > 0 ? `: ${benoem(crm.teSprekenNamen)}` : ''
    kansen.push(`${crm.teSprekenAantal} ${meervoud(crm.teSprekenAantal, 'contact', 'contacten')} deze week spreken${namen}.`)
  }
  if (agenda && agenda.aantal === 0) {
    kansen.push('Geen afspraken vandaag — ruimte voor geconcentreerd werk.')
  }
  if (welzijn && welzijn.wellbeingScore !== null && welzijn.wellbeingScore >= STERK_WELZIJN_DREMPEL) {
    kansen.push(`Je welzijn staat sterk (${welzijn.wellbeingScore}/100) — goed moment voor iets uitdagends.`)
  }
  return kansen.slice(0, MAX_KANSEN)
}

/** De volledige kern, deterministisch uit de feiten. */
export function deterministischeKern(feiten: DagbriefingFeiten): BriefingKern {
  return {
    briefing: fallbackBriefing(feiten),
    prioriteiten: fallbackPrioriteiten(feiten.taken),
    risicos: fallbackRisicos(feiten),
    kansen: fallbackKansen(feiten),
  }
}

// ─── De briefing ────────────────────────────────────────────────────────────

/**
 * Stelt de dagbriefing samen. Probeert het model; valt bij een storing, een
 * ontbrekende sleutel (`model === null`) of een onbruikbaar antwoord terug op de
 * deterministische briefing. Faalt dus NOOIT — de kaart krijgt altijd inhoud.
 *
 * `groet` en `gegenereerdOp` zet deze wrapper zelf: de groet hangt aan de klok,
 * en die laten we niet door het model gokken.
 */
export async function stelDagbriefingSamen(
  feiten: DagbriefingFeiten,
  model: BriefingModel | null,
): Promise<Dagbriefing> {
  const groet = groetVoor(feiten.nu)
  const gegenereerdOp = feiten.nu.toISOString()

  const kern = await bepaalKern(feiten, model)
  return { groet, ...kern, gegenereerdOp }
}

async function bepaalKern(
  feiten: DagbriefingFeiten,
  model: BriefingModel | null,
): Promise<BriefingKern> {
  if (model === null) return deterministischeKern(feiten)
  try {
    const raw = await model.schrijf(dagbriefingSysteem(feiten.nu), feitenTekst(feiten))
    return leesModelBriefing(raw) ?? deterministischeKern(feiten)
  } catch {
    // Eén kapotte modelaanroep mag de briefing niet opblazen: val terug op de
    // feiten. Zelfde keuze als `schrijfConcept` — een storing wordt geen leegte.
    return deterministischeKern(feiten)
  }
}
