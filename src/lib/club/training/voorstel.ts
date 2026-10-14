// ─── Fit Factory Club, training: het schemavoorstel (PUUR) ──────────────────
// Uit een intake en de oefeningenbibliotheek een verstandig startschema, zonder
// AI-kosten. De trainer past het daarna aan in de editor: dit is een begin,
// geen eindoordeel.

import type { Antwoorden } from './intake'
import { PARQ_VRAGEN } from './intake'
import type { Oefening } from './rijen'
import { hoofdspieren, type Spier } from './spieren'
import { DOEL_LABEL, NIVEAU_LABEL, ZONE_LABEL, type Doel, type Materiaal, type Niveau, type Zone } from './typen'
import {
  aantalOefeningen, beschikbaarMateriaal, dosering, hoofddoel, kiesSplit, MATERIAAL_VOORKEUR, type Slot,
} from './voorstel-regels'

export interface VoorstelRegel {
  oefeningId: string
  sets: number
  herhalingen: string
  rustSec: number
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
  notitie: string
  dagen: VoorstelDag[]
  waarschuwingen: string[]
}

export type VoorstelIntake = Pick<Antwoorden, 'doelen' | 'niveau' | 'dagenPerWeek' | 'minutenPerSessie' | 'voorkeuren' | 'gezondheid'>

interface Context {
  niveau: Niveau
  doel: Doel
  materiaal: readonly Materiaal[]
  blessures: readonly Zone[]
  kandidaten: readonly Oefening[]
}

/** Kan deze oefening voor dit lid? Actief, materiaal aanwezig, niveau haalbaar, geen geblesseerde zone. */
function past(o: Oefening, ctx: Omit<Context, 'kandidaten'>): boolean {
  return (
    o.actief &&
    o.niveau <= ctx.niveau &&
    ctx.materiaal.includes(o.materiaal) &&
    !o.belast.some((z) => ctx.blessures.includes(z))
  )
}

/** Lager = beter. Eerst het juiste niveau, dan het materiaal dat bij het niveau past, dan de naam. */
function score(o: Oefening, niveau: Niveau): number {
  const niveauAfstand = niveau - o.niveau
  const materiaalRang = MATERIAAL_VOORKEUR[niveau].indexOf(o.materiaal)
  return niveauAfstand * 100 + materiaalRang
}

function vergelijk(niveau: Niveau) {
  return (a: Oefening, b: Oefening) => score(a, niveau) - score(b, niveau) || a.naam.localeCompare(b.naam, 'nl')
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

function kiesVoorSlot(slot: Slot, ctx: Context, gebruikt: ReadonlySet<string>, dag: DagStaat): Oefening | null {
  const opties = ctx.kandidaten.filter((o) => pastInSlot(o, slot) && !dag.ids.has(o.id))
  // Liever een oefening die nog nergens in het schema staat, zodat de dagen verschillen.
  // Daarbinnen de oefening die de meeste nieuwe hoofdspieren toevoegt, zodat een dag in balans is.
  // Bij gelijke stand blijft de volgorde van de kandidaten (niveau, materiaal, naam) beslissen.
  let beste: Oefening | null = null
  let besteScore = -Infinity
  for (const o of opties) {
    const score = (gebruikt.has(o.id) ? 0 : 100) + nieuweSpieren(o, dag.spieren)
    if (score > besteScore) {
      beste = o
      besteScore = score
    }
  }
  return beste
}

interface DagStaat {
  ids: Set<string>
  spieren: Set<Spier>
}

function regelVoor(o: Oefening, ctx: Context): VoorstelRegel {
  const d = dosering(ctx.doel, o.patroon, ctx.niveau)
  return { oefeningId: o.id, sets: d.sets, herhalingen: d.herhalingen, rustSec: d.rustSec, notitie: null }
}

function cardioAfsluiter(ctx: Context, opDag: ReadonlySet<string>, dagIndex: number): Oefening | null {
  const cardio = ctx.kandidaten.filter((o) => o.patroon === 'cardio' && !opDag.has(o.id))
  return cardio.length === 0 ? null : cardio[dagIndex % cardio.length]
}

function bouwDag(slots: readonly Slot[], ctx: Context, gebruikt: Set<string>, aantal: number, metCardio: boolean, dagIndex: number): VoorstelRegel[] {
  const dag: DagStaat = { ids: new Set(), spieren: new Set() }
  const regels: VoorstelRegel[] = []
  const kracht = metCardio ? aantal - 1 : aantal
  for (const slot of slots) {
    if (regels.length >= kracht) break
    const o = kiesVoorSlot(slot, ctx, gebruikt, dag)
    if (!o) continue
    dag.ids.add(o.id)
    for (const sp of hoofdspieren(o)) dag.spieren.add(sp)
    gebruikt.add(o.id)
    regels.push(regelVoor(o, ctx))
  }
  const cardio = metCardio ? cardioAfsluiter(ctx, dag.ids, dagIndex) : null
  if (cardio) regels.push(regelVoor(cardio, ctx))
  return regels
}

function waarschuwingenVoor(intake: VoorstelIntake): string[] {
  const uit: string[] = []
  const g = intake.gezondheid
  if (g && g.parqJa.length > 0) {
    const vragen = PARQ_VRAGEN.filter((v) => g.parqJa.includes(v.sleutel)).length
    uit.push(`Bij de gezondheidsvragen ${vragen === 1 ? 'is een keer' : `is ${vragen} keer`} ja geantwoord. Laat het lid eerst overleggen met de huisarts voordat de intensiteit omhoog gaat.`)
  }
  if (g && g.blessures.length > 0) {
    uit.push(`Oefeningen die ${g.blessures.map((z) => ZONE_LABEL[z].toLowerCase()).join(', ')} belasten zijn weggelaten. Controleer de keuze met het lid.`)
  }
  return uit
}

/** Het voorstel. Pure functie: zelfde invoer, zelfde schema. */
export function stelSchemaVoor(intake: VoorstelIntake, oefeningen: readonly Oefening[]): Voorstel {
  const revalidatie = intake.doelen.includes('revalidatie')
  const niveau: Niveau = revalidatie ? 1 : intake.niveau
  const doel = hoofddoel(intake.doelen)
  const blessures = intake.gezondheid?.blessures ?? []
  const basis = { niveau, doel, materiaal: beschikbaarMateriaal(intake.voorkeuren), blessures }
  const kandidaten = oefeningen.filter((o) => past(o, basis)).sort(vergelijk(niveau))
  const ctx: Context = { ...basis, kandidaten }

  const split = kiesSplit(intake.dagenPerWeek, niveau)
  const aantal = aantalOefeningen(intake.minutenPerSessie)
  const metCardio = intake.doelen.includes('afvallen') || intake.doelen.includes('conditie')
  const gebruikt = new Set<string>()
  const dagen = split.dagen.map((sjabloon, i) => ({
    dag: i + 1,
    titel: sjabloon.titel,
    regels: bouwDag(sjabloon.slots, ctx, gebruikt, aantal, metCardio, i),
  }))

  const waarschuwingen = waarschuwingenVoor(intake)
  const notitie = [
    `${split.naam}. ${split.uitleg}`,
    `Doel: ${DOEL_LABEL[doel].toLowerCase()}, niveau: ${NIVEAU_LABEL[niveau].toLowerCase()}, ongeveer ${intake.minutenPerSessie} minuten per training inclusief 10 minuten warming-up.`,
    ...waarschuwingen,
  ].join(' ')

  return {
    naam: `${split.naam} · ${DOEL_LABEL[doel]}`.slice(0, 80),
    doel,
    niveau,
    weken: niveau === 1 ? 6 : 8,
    notitie: notitie.slice(0, 1000),
    dagen,
    waarschuwingen,
  }
}
