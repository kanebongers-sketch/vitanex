// ─── Fit Factory Club, training: het schemavoorstel (PUUR) ──────────────────
// Uit een intake en de oefeningenbibliotheek een verstandig startschema, met
// vaste regels zoals een personal trainer die toepast (zie voorstel-regels.ts),
// zonder kosten. De trainer past het daarna aan in de editor: dit is een begin,
// geen eindoordeel. Elke keuze staat uitgelegd in "Waarom dit schema".

import type { Antwoorden } from './intake'
import type { Oefening } from './rijen'
import { hoofdspieren, type Spier } from './spieren'
import { DOEL_LABEL, PATROON_LABEL, ZONE_LABEL, type Doel, type Materiaal, type Niveau, type Patroon, type Zone } from './typen'
import { notitieMetWaarom, waaromDitSchema, waarschuwingenVoor } from './voorstel-uitleg'
import {
  AANVUL_PATRONEN, alleenThuis, beschikbaarMateriaal, cardioDosering, dosering, hoofddoel, kiesSplit, MATERIAAL_VOORKEUR, MAX_OEFENINGEN, metExplosief,
  MIN_OEFENINGEN, minutenVoor, reserve, volgordeRang, WARMING_UP_MIN, type DagSjabloon, type Dosering, type Slot,
} from './voorstel-regels'

export interface VoorstelRegel {
  oefeningId: string
  sets: number
  herhalingen: string
  rustSec: number
  /** Herhalingen in reserve (RIR), of null bij romp, cardio en explosief. */
  rir: number | null
  notitie: string | null
}

export interface VoorstelDag {
  dag: number
  titel: string
  regels: VoorstelRegel[]
}

export interface Voorstel {
  naam: string
  doel: Doel
  niveau: Niveau
  weken: number
  /** Voor het schema: "Waarom dit schema" plus de waarschuwingen. */
  notitie: string
  dagen: VoorstelDag[]
  waarschuwingen: string[]
  /** 3 tot 5 korte zinnen: waarom het voorstel zo is opgebouwd. */
  waarom: string[]
}

export type VoorstelIntake = Pick<Antwoorden, 'doelen' | 'niveau' | 'dagenPerWeek' | 'minutenPerSessie' | 'voorkeuren' | 'gezondheid'>

export interface VoorstelOpties {
  /** Heeft deze oefening coaching (standaard of van de sportschool)? Zonder: elke oefening telt. */
  heeftCoaching?: (o: Oefening) => boolean
}

interface Context {
  niveau: Niveau
  doel: Doel
  blessures: readonly Zone[]
  klacht: boolean
  compact: boolean
  /** Alleen oefeningen zonder materiaal: niet zwaar te laden (dosering met lichaamsgewicht). */
  lichaamsgewicht: boolean
  /** Wat mag: actief, materiaal, niveau, coaching en geen geblesseerde zone. */
  kandidaten: readonly Oefening[]
  /** Zonder de blessures: om te zien wat een trainer zonder klacht gekozen had. */
  ruim: readonly Oefening[]
}

/** Wordt een gewricht met een klacht belast? */
const belastKlacht = (o: Oefening, blessures: readonly Zone[]) => o.belast.some((z) => blessures.includes(z))

/** Regel: lager = beter. Eerst het juiste niveau, dan het materiaal dat bij het niveau past. */
function score(o: Oefening, niveau: Niveau): number {
  return (niveau - o.niveau) * 100 + MATERIAAL_VOORKEUR[niveau].indexOf(o.materiaal)
}

function vergelijk(niveau: Niveau) {
  return (a: Oefening, b: Oefening) => score(a, niveau) - score(b, niveau) || a.naam.localeCompare(b.naam, 'nl') || a.id.localeCompare(b.id)
}

/**
 * Hoeveel hoofdspieren voegt deze oefening toe die vandaag nog niet geraakt zijn?
 * Hooguit twee: anders wint een hele-lichaamsoefening (thruster) altijd van een gewone squat.
 */
function nieuweSpieren(o: Oefening, geraakt: ReadonlySet<Spier>): number {
  return Math.min(hoofdspieren(o).filter((sp) => !geraakt.has(sp)).length, 2)
}

function pastInSlot(o: Oefening, slot: Slot): boolean {
  if (o.patroon !== slot.patroon) return false
  return !slot.spieren || hoofdspieren(o).some((sp) => slot.spieren?.includes(sp))
}

interface DagStaat {
  ids: Set<string>
  spieren: Set<Spier>
  minuten: number
}

/** Materiaal dat bij het niveau past: de eerste vier uit de voorkeur (beginner: machine, kabel, dumbbell, lichaamsgewicht). */
const passendMateriaal = (o: Oefening, niveau: Niveau) => MATERIAAL_VOORKEUR[niveau].indexOf(o.materiaal) < 4

/**
 * Regel: punten voor variatie (nog nergens in het schema: de dagen verschillen),
 * voor nieuwe hoofdspieren (een dag in balans) en voor materiaal dat bij het
 * niveau past. Variatie weegt even zwaar als passend materiaal: liever twee
 * keer de lat pulldown dan een elastiek in een volle sportschool. Bij gelijke
 * stand beslist de volgorde van de kandidaten: niveau, materiaal, naam.
 */
function kiesVoorSlot(slot: Slot, lijst: readonly Oefening[], gebruikt: ReadonlySet<string>, dag: DagStaat, niveau: Niveau): Oefening | null {
  let beste: Oefening | null = null
  let besteScore = -Infinity
  for (const o of lijst) {
    if (!pastInSlot(o, slot) || dag.ids.has(o.id)) continue
    const punten = (gebruikt.has(o.id) ? 0 : 3) + nieuweSpieren(o, dag.spieren) + (passendMateriaal(o, niveau) ? 3 : 0)
    if (punten > besteScore) {
      beste = o
      besteScore = punten
    }
  }
  return beste
}

function doseringVoor(o: Oefening, ctx: Context): Dosering {
  return dosering(ctx.doel, o.patroon, ctx.niveau, { klacht: ctx.klacht, compact: ctx.compact, lichaamsgewicht: ctx.lichaamsgewicht })
}

function klachtNotitie(gekozen: Oefening, ideaal: Oefening | null, blessures: readonly Zone[]): string | null {
  if (!ideaal || ideaal.id === gekozen.id || !belastKlacht(ideaal, blessures)) return null
  const zones = ideaal.belast.filter((z) => blessures.includes(z)).map((z) => ZONE_LABEL[z].toLowerCase())
  return `In plaats van ${ideaal.naam} (belast je ${zones.join(' en ')}). Overleg met je trainer als het pijn doet.`
}

function regelVoor(o: Oefening, ctx: Context, notitie: string | null): VoorstelRegel {
  const d = doseringVoor(o, ctx)
  return { oefeningId: o.id, sets: d.sets, herhalingen: d.herhalingen, rustSec: d.rustSec, rir: reserve(ctx.doel, o.patroon, ctx.niveau, ctx.klacht), notitie }
}

interface Gekozen {
  o: Oefening
  regel: VoorstelRegel
  i: number
}

interface Bouw {
  dag: DagStaat
  gekozen: Gekozen[]
  gebruikt: Set<string>
  budget: number
}

/** Zet de oefening op de dag als de tijd het toelaat (de eerste drie altijd). */
function voegToe(o: Oefening, ideaal: Oefening | null, ctx: Context, b: Bouw): boolean {
  const tijd = minutenVoor(doseringVoor(o, ctx), o.patroon)
  if (b.gekozen.length >= MIN_OEFENINGEN && b.dag.minuten + tijd > b.budget) return false
  b.dag.ids.add(o.id)
  b.dag.minuten += tijd
  for (const sp of hoofdspieren(o)) b.dag.spieren.add(sp)
  b.gebruikt.add(o.id)
  b.gekozen.push({ o, regel: regelVoor(o, ctx, klachtNotitie(o, ideaal, ctx.blessures)), i: b.gekozen.length })
  return true
}

/**
 * Regel 9 (voorstel-regels.ts): slots waar helemaal geen oefening voor is,
 * vullen we aan met wat er wel is, zolang de tijd het toelaat. Een slot dat
 * wegviel om een klacht wordt niet aangevuld: dat staat in de waarschuwing.
 */
function vulAan(leeg: number, ctx: Context, b: Bouw): void {
  let nog = leeg
  for (const patroon of AANVUL_PATRONEN) {
    if (nog <= 0 || b.gekozen.length >= MAX_OEFENINGEN) return
    const o = kiesVoorSlot({ patroon }, ctx.kandidaten, b.gebruikt, b.dag, ctx.niveau)
    if (o && voegToe(o, null, ctx, b)) nog -= 1
  }
}

interface DagUitslag {
  regels: VoorstelRegel[]
  minuten: number
  /** Patronen die wegvielen omdat er geen oefening is die de klacht spaart. */
  weggelaten: Patroon[]
}

/**
 * Een trainingsdag: slot voor slot zolang de tijd het toelaat. Altijd minstens
 * drie oefeningen; past een groot slot niet meer, dan mag een kleiner slot
 * (romp, isolatie) nog wel. Daarna van groot naar klein gezet.
 */
function bouwDag(sjabloon: DagSjabloon, ctx: Context, gebruikt: Set<string>, budget: number): DagUitslag {
  const dag: DagStaat = { ids: new Set(), spieren: new Set(), minuten: 0 }
  const gekozen: Gekozen[] = []
  const weggelaten: Patroon[] = []
  let leeg = 0
  for (const slot of sjabloon.slots) {
    if (gekozen.length >= MAX_OEFENINGEN) break
    const o = kiesVoorSlot(slot, ctx.kandidaten, gebruikt, dag, ctx.niveau)
    const ideaal = ctx.blessures.length > 0 ? kiesVoorSlot(slot, ctx.ruim, gebruikt, dag, ctx.niveau) : null
    if (!o) {
      if (ideaal) weggelaten.push(slot.patroon)
      else leeg += 1
      continue
    }
    voegToe(o, ideaal, ctx, { dag, gekozen, gebruikt, budget })
  }
  vulAan(leeg, ctx, { dag, gekozen, gebruikt, budget })
  gekozen.sort((a, b) => volgordeRang(a.o.patroon) - volgordeRang(b.o.patroon) || a.i - b.i)
  return { regels: gekozen.map((g) => g.regel), minuten: dag.minuten, weggelaten }
}

interface Cardio {
  dosering: Dosering
  kandidaten: readonly Oefening[]
}

function cardioAfsluiter(c: Cardio, ctx: Context, dagIndex: number): VoorstelRegel | null {
  if (c.kandidaten.length === 0) return null
  const o = c.kandidaten[dagIndex % c.kandidaten.length]
  return { oefeningId: o.id, sets: 1, herhalingen: c.dosering.herhalingen, rustSec: 0, rir: reserve(ctx.doel, 'cardio', ctx.niveau), notitie: null }
}

/** Kan deze oefening voor dit lid? Actief, materiaal aanwezig, niveau haalbaar en met coaching. */
function basisPast(o: Oefening, niveau: Niveau, materiaal: readonly Materiaal[], opties: VoorstelOpties): boolean {
  return o.actief && o.niveau <= niveau && materiaal.includes(o.materiaal) && (opties.heeftCoaching?.(o) ?? true)
}

/**
 * Regel: past het minimum (drie hoofdoefeningen) niet in de tijd, dan een set
 * minder per oefening. Liever drie goede oefeningen kort dan twee lange.
 */
function moetCompact(doel: Doel, niveau: Niveau, budget: number): boolean {
  return MIN_OEFENINGEN * minutenVoor(dosering(doel, 'squat', niveau), 'squat') > budget
}

function maakContext(intake: VoorstelIntake, oefeningen: readonly Oefening[], opties: VoorstelOpties, budget: number): Context {
  const niveau: Niveau = intake.doelen.includes('revalidatie') ? 1 : intake.niveau
  const doel = hoofddoel(intake.doelen)
  const blessures = intake.gezondheid?.blessures ?? []
  const materiaal = beschikbaarMateriaal(intake.voorkeuren)
  const ruim = oefeningen.filter((o) => basisPast(o, niveau, materiaal, opties)).sort(vergelijk(niveau))
  return {
    niveau,
    doel,
    blessures,
    klacht: blessures.length > 0,
    compact: moetCompact(doel, niveau, budget),
    lichaamsgewicht: ruim.length > 0 && ruim.every((o) => o.materiaal === 'geen'),
    kandidaten: ruim.filter((o) => !belastKlacht(o, blessures)),
    ruim,
  }
}

function weggelatenWaarschuwingen(dagen: readonly DagUitslag[], blessures: readonly Zone[]): string[] {
  const patronen = [...new Set(dagen.flatMap((d) => d.weggelaten))]
  if (patronen.length === 0) return []
  const zones = blessures.map((z) => ZONE_LABEL[z].toLowerCase()).join(' en ')
  const namen = patronen.map((p) => PATROON_LABEL[p].toLowerCase()).join(', ')
  return [`Geen oefening gevonden die je ${zones} spaart voor: ${namen}. Die zijn weggelaten; overleg met je trainer wat wel kan.`]
}

/** Het voorstel. Pure functie: zelfde invoer, zelfde schema. */
export function stelSchemaVoor(intake: VoorstelIntake, oefeningen: readonly Oefening[], opties: VoorstelOpties = {}): Voorstel {
  const wilCardio = intake.doelen.includes('afvallen') || intake.doelen.includes('conditie')
  const voorlopig = hoofddoel(intake.doelen)
  const cardioDos = cardioDosering(voorlopig, intake.minutenPerSessie)
  // Regel: de tijd voor cardio gaat er alleen af als er ook een cardio-oefening is
  // (thuis zonder materiaal niet). Anders krijgt de training minder oefeningen voor niets.
  const zonderCardio = maakContext(intake, oefeningen, opties, intake.minutenPerSessie - WARMING_UP_MIN)
  const metCardio = wilCardio && zonderCardio.kandidaten.some((o) => o.patroon === 'cardio')
  const budget = intake.minutenPerSessie - WARMING_UP_MIN - (metCardio ? minutenVoor(cardioDos, 'cardio') : 0)
  const ctx = metCardio ? maakContext(intake, oefeningen, opties, budget) : zonderCardio
  const split = metExplosief(kiesSplit(intake.dagenPerWeek, ctx.niveau), ctx.doel, ctx.niveau)
  const cardio: Cardio = { dosering: cardioDos, kandidaten: metCardio ? ctx.kandidaten.filter((o) => o.patroon === 'cardio') : [] }

  const gebruikt = new Set<string>()
  const uitslagen = split.dagen.map((sjabloon) => bouwDag(sjabloon, ctx, gebruikt, budget))
  const dagen: VoorstelDag[] = uitslagen.map((u, i) => {
    const afsluiter = cardioAfsluiter(cardio, ctx, i)
    return { dag: i + 1, titel: split.dagen[i].titel, regels: afsluiter ? [...u.regels, afsluiter] : u.regels }
  })

  const cardioMin = cardio.kandidaten.length > 0 ? minutenVoor(cardioDos, 'cardio') : 0
  const minuten = WARMING_UP_MIN + cardioMin + Math.max(0, ...uitslagen.map((u) => u.minuten))
  const waarschuwingen = [...waarschuwingenVoor(intake), ...weggelatenWaarschuwingen(uitslagen, ctx.blessures)]
  const waarom = waaromDitSchema({
    split, doel: ctx.doel, niveau: ctx.niveau, thuis: alleenThuis(intake.voorkeuren), blessures: ctx.blessures,
    klachtenTekst: Boolean(intake.gezondheid?.klachten), minuten, oefeningen: uitslagen.map((u) => u.regels.length),
    cardio: cardio.kandidaten.length > 0, compact: ctx.compact,
  })

  return {
    naam: `${split.naam} · ${DOEL_LABEL[ctx.doel]}`.slice(0, 80),
    doel: ctx.doel,
    niveau: ctx.niveau,
    weken: ctx.niveau === 1 ? 6 : 8,
    notitie: notitieMetWaarom(waarom, waarschuwingen),
    dagen,
    waarschuwingen,
    waarom,
  }
}
