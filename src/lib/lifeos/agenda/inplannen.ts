// ─── LifeOS — van vrij blok naar afspraak ───────────────────────────────────
// De ontbrekende schakel. `vrije-blokken.ts` weet al wat er OVER is; `schrijven.ts`
// kan al een afspraak MAKEN. Tussen die twee zat niets — /agenda/vandaag gaf het
// zelf toe ("dáár kan Vita straks je training in plannen"). Dit bestand is die brug.
//
// Puur: geen fetch, geen DB, geen `Date.now()` binnenin. Blokken en wensen erin,
// toewijzingen eruit. Zelfde regel als `vrije-blokken.ts`, en om dezelfde reden.
//
// ─── WAT DIT BEWUST NIET DOET: SCOREN ───────────────────────────────────────
// De VOLGORDE van `wensen` is de prioriteit. Dit bestand herschikt niets, weegt
// niets en verzint geen eigen oordeel over wat belangrijker is — dat is het werk
// van `taken/prioriteit.ts` (`ordenTaken`, `passendInBlok`), en dat is canoniek.
// Wie hier ooit een tweede scoringsregel neerzet, heeft er twee die uit elkaar
// gaan lopen. Geef 'm een gesorteerde lijst; dit vult de gaten van vroeg naar laat.
//
// ─── EN OOK NIET: ENERGIE OP DE KLOK LEGGEN ─────────────────────────────────
// `PlanWens.energie` reist mee (het hoort bij de taak, en zo koppelt een dagplan
// er straks triviaal op), maar het kiest hier GEEN blok. De verleiding is groot:
// "hoge energie → ochtend" klinkt logisch. Het is alleen niet gemeten. LifeOS
// weet niet hoeveel energie Kane om 15:00 heeft, en een blok kiezen op basis van
// een aanname die als kennis oogt, is precies het soort verzonnen stelligheid dat
// dit product niet doet (zie .claude/CLAUDE.md → Eerlijkheid, en de kop van
// `prioriteit.ts`, dat om dezelfde reden `null` teruggeeft i.p.v. een gok).
//
// Waar energie WEL thuishoort: `passendInBlok(oordelen, minuten, energieNu)` in
// prioriteit.ts filtert op de energie die je NU hebt — een feit dat de aanroeper
// kan aanleveren. Komt er ooit een gemeten energie-per-uur (Whoop, een check-in),
// dán is dit de plek om blokken op te wegen. Tot die tijd: eerste passende blok.

import type { EnergieNiveau } from '@/lib/lifeos/taken/prioriteit'
import { isEnergieNiveau } from '@/lib/lifeos/taken/prioriteit'
import { MIN_BLOK_MINUTEN, type VrijBlok } from './vrije-blokken'
import { MAX_TITEL_LENGTE, type NieuwAgendaEvent } from './schrijven'

const MS_PER_MINUUT = 60_000

/**
 * Standaardduur van een focusblok.
 *
 * Een zichtbare, bij te stellen aanname — geen meting. Een uur is lang genoeg
 * voor echt werk en kort genoeg om in een gemiddeld gat te passen. Zelfde soort
 * keuze als `STANDAARD_AFSPRAAK_MINUTEN` in `inbox/suggestie-actie.ts`.
 */
export const STANDAARD_FOCUS_MINUTEN = 60

/** Hoe een focusblok heet als je zelf geen titel meegeeft. */
export const STANDAARD_FOCUS_TITEL = 'Focusblok'

/**
 * Boven de 8 uur is het geen blok meer maar een dag. Spiegelt `MAX_INSPANNING`
 * in `prioriteit.ts` — dezelfde grens, dezelfde reden.
 */
export const MAX_FOCUS_MINUTEN = 480

/**
 * Eén stuk werk dat een plek zoekt.
 *
 * Exact de vorm die `taken/dagplan.ts` straks oplevert (`{titel, minuten, energie}`),
 * zodat koppelen een `map` is en geen vertaalslag. `energie` mag `null`: niet elke
 * taak heeft dat feit, en een ontbrekend feit is hier geen bezwaar (zie kop).
 */
export interface PlanWens {
  titel: string
  minuten: number
  energie: EnergieNiveau | null
}

/** Een wens die een plek kreeg. */
export interface Toewijzing {
  wens: PlanWens
  startOp: Date
  eindOp: Date
}

export interface PlanResultaat {
  toewijzingen: Toewijzing[]
  /** Wat er niet paste. Eigen lijst, geen stille verdwijning — zie README §fout ≠ leeg. */
  nietGeplaatst: PlanWens[]
}

export interface PlanOpties {
  /**
   * Kijk alleen naar ruimte vanaf dit moment.
   *
   * Twee functies in één: "niet in het verleden plannen" (geef `nu` mee), en
   * "plan in dít blok" — geef de starttijd van het blok mee en het eerste
   * passende blok ís dat blok. De UI-knop gebruikt precies dat.
   */
  vanafOp?: Date
}

/** Een stuk vrije tijd, in ms. Intern; `VrijBlok` blijft de publieke vorm. */
interface Ruimte {
  readonly van: number
  readonly tot: number
}

/** Blokken → genormaliseerde, geklemde, oplopend gesorteerde ruimtes. */
function naarRuimtes(blokken: readonly VrijBlok[], vanafOp?: Date): Ruimte[] {
  const vanaf = vanafOp?.getTime()
  const ondergrens = vanaf !== undefined && Number.isFinite(vanaf) ? vanaf : null

  return blokken
    .map((b): Ruimte => {
      const van = b.startOp.getTime()
      return { van: ondergrens !== null ? Math.max(van, ondergrens) : van, tot: b.eindOp.getTime() }
    })
    .filter((r) => Number.isFinite(r.van) && Number.isFinite(r.tot) && r.tot > r.van)
    .sort((a, b) => a.van - b.van)
}

/**
 * Vult de vrije blokken met de wensen, in de volgorde waarin ze binnenkomen.
 *
 * Eerste passende blok wint, en een blok kan meerdere wensen achter elkaar
 * dragen: in een gat van twee uur passen een taak van 45 en een van 60 minuten,
 * rug aan rug. Dat is het hele punt van time-blocking — anders verspil je een
 * halve middag aan één taak van drie kwartier.
 *
 * Immutable: `blokken` en `wensen` blijven onaangeraakt; de resterende ruimte
 * wordt als nieuwe array doorgegeven, nooit ter plekke gemuteerd.
 */
export function planWensen(
  blokken: readonly VrijBlok[],
  wensen: readonly PlanWens[],
  opties: PlanOpties = {},
): PlanResultaat {
  const toewijzingen: Toewijzing[] = []
  const nietGeplaatst: PlanWens[] = []
  let ruimtes = naarRuimtes(blokken, opties.vanafOp)

  for (const wens of wensen) {
    const nodig = wens.minuten * MS_PER_MINUUT
    const index = nodig > 0 ? ruimtes.findIndex((r) => r.tot - r.van >= nodig) : -1
    const ruimte = index >= 0 ? ruimtes[index] : undefined

    if (ruimte === undefined) {
      nietGeplaatst.push(wens)
      continue
    }

    toewijzingen.push({
      wens,
      startOp: new Date(ruimte.van),
      eindOp: new Date(ruimte.van + nodig),
    })
    // Wat overblijft van dit blok blijft beschikbaar voor de volgende wens.
    ruimtes = [
      ...ruimtes.slice(0, index),
      { van: ruimte.van + nodig, tot: ruimte.tot },
      ...ruimtes.slice(index + 1),
    ]
  }

  return { toewijzingen, nietGeplaatst }
}

/**
 * De langste aaneengesloten vrije tijd, in minuten. `null` als er niets vrij is.
 *
 * Voor de eerlijke afwijzing: "je langste blok is 30 minuten" is een bruikbaar
 * antwoord, "past niet" is dat niet.
 */
export function langsteVrijeMinuten(
  blokken: readonly VrijBlok[],
  vanafOp?: Date,
): number | null {
  const ruimtes = naarRuimtes(blokken, vanafOp)
  if (ruimtes.length === 0) return null
  const langste = ruimtes.reduce((max, r) => Math.max(max, r.tot - r.van), 0)
  return Math.floor(langste / MS_PER_MINUUT)
}

/**
 * Toewijzing → de invoer voor `maakAgendaEvent`.
 *
 * De beschrijving zegt eerlijk waar de afspraak vandaan komt: dit blok is door
 * LifeOS ingepland, niet door Kane getypt. Als hij 'm over een week in Google
 * terugziet, moet dat te zien zijn.
 */
export function naarNieuwEvent(toewijzing: Toewijzing): NieuwAgendaEvent {
  return {
    titel: toewijzing.wens.titel,
    startOp: toewijzing.startOp.toISOString(),
    eindOp: toewijzing.eindOp.toISOString(),
    beschrijving: 'Door LifeOS in een vrij blok gepland.',
  }
}

// ─── Systeemgrens: het verzoek lezen ────────────────────────────────────────

export type FocusVerzoekUitkomst =
  | { ok: true; wens: PlanWens; vanafOp: Date | null }
  | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Titel: leeg → de standaard. Een focusblok heeft een natuurlijke naam. */
function leesTitel(v: unknown): { ok: true; waarde: string } | { ok: false; fout: string } {
  if (v === null || v === undefined) return { ok: true, waarde: STANDAARD_FOCUS_TITEL }
  if (typeof v !== 'string') return { ok: false, fout: 'Titel moet tekst zijn.' }
  const titel = v.trim()
  if (titel.length === 0) return { ok: true, waarde: STANDAARD_FOCUS_TITEL }
  if (titel.length > MAX_TITEL_LENGTE) {
    return { ok: false, fout: `Titel mag maximaal ${MAX_TITEL_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: titel }
}

/**
 * Minuten: weggelaten → de standaard; onzin → een fout.
 *
 * De ondergrens is `MIN_BLOK_MINUTEN`, want daaronder levert `vrijeBlokken` sowieso
 * geen blok op — een focusblok van 10 minuten aanbieden zou een belofte zijn die
 * de rest van het systeem niet kan waarmaken.
 */
function leesMinuten(v: unknown): { ok: true; waarde: number } | { ok: false; fout: string } {
  if (v === null || v === undefined) return { ok: true, waarde: STANDAARD_FOCUS_MINUTEN }
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    return { ok: false, fout: 'Duur moet een heel aantal minuten zijn.' }
  }
  if (v < MIN_BLOK_MINUTEN) {
    return { ok: false, fout: `Een focusblok is minimaal ${MIN_BLOK_MINUTEN} minuten.` }
  }
  if (v > MAX_FOCUS_MINUTEN) {
    return { ok: false, fout: `Een focusblok is maximaal ${MAX_FOCUS_MINUTEN} minuten.` }
  }
  return { ok: true, waarde: v }
}

/** Leest `POST /api/lifeos/agenda/focusblok`. Faalt met een leesbare NL-melding. */
export function leesFocusVerzoek(body: unknown): FocusVerzoekUitkomst {
  // Geen body = alles standaard. Dat is de knop "plan een focusblok", en dat mag.
  const invoer = body === null || body === undefined ? {} : body
  if (!isObject(invoer)) return { ok: false, fout: 'Ongeldige invoer.' }

  const titel = leesTitel(invoer.titel)
  if (!titel.ok) return titel
  const minuten = leesMinuten(invoer.minuten)
  if (!minuten.ok) return minuten

  if (invoer.energie !== null && invoer.energie !== undefined && !isEnergieNiveau(invoer.energie)) {
    return { ok: false, fout: 'Energie moet laag, midden of hoog zijn.' }
  }
  const energie: EnergieNiveau | null = isEnergieNiveau(invoer.energie) ? invoer.energie : null

  let vanafOp: Date | null = null
  if (invoer.vanafOp !== null && invoer.vanafOp !== undefined) {
    if (typeof invoer.vanafOp !== 'string') {
      return { ok: false, fout: 'Vanaf-moment moet een ISO-tijd zijn.' }
    }
    const d = new Date(invoer.vanafOp)
    if (Number.isNaN(d.getTime())) {
      return { ok: false, fout: 'Vanaf-moment is geen geldige datum/tijd.' }
    }
    vanafOp = d
  }

  return { ok: true, wens: { titel: titel.waarde, minuten: minuten.waarde, energie }, vanafOp }
}
