// ─── Fit Factory Club, training: uitleg bij het schemavoorstel (PUUR) ───────
// "Waarom dit schema": 3 tot 5 korte zinnen die de regels uit
// voorstel-regels.ts in gewone taal uitleggen, voor de trainer en het lid.
// De uitleg staat bovenaan de notitie van het schema, zodat hij bewaard blijft
// en de editor hem kan tonen (waaromUitNotitie).

import { PARQ_VRAGEN, type Antwoorden } from './intake'
import { DOEL_LABEL, ZONE_LABEL, type Doel, type Niveau, type Zone } from './typen'
import { dosering, reserve, type Split } from './voorstel-regels'
import { toonHerhalingen, toonRust } from './weergave'

export const WAAROM_KOP = 'Waarom dit schema'
const LET_OP = 'Let op: '

const DOEL_REDEN: Record<Doel, string> = {
  kracht: 'Lange rust, zodat je elke set zwaar en strak kunt doen.',
  spiermassa: 'Genoeg sets dicht bij het falen: de prikkel voor spiergroei.',
  afvallen: 'Korte rust houdt je hartslag hoog en je spieren sterk terwijl je afvalt.',
  conditie: 'Veel herhalingen met korte rust bouwen je uithoudingsvermogen op.',
  gezondheid: 'Een gezonde basis voor kracht, houding en energie.',
  revalidatie: 'Licht en gecontroleerd, met veel herhalingen.',
  sport: 'Kracht die je snel kunt inzetten.',
}

function doelZin(doel: Doel, niveau: Niveau, klacht: boolean): string {
  const d = dosering(doel, 'squat', niveau, { klacht })
  const rir = reserve(doel, 'squat', niveau, klacht)
  const reserveTekst = rir === null ? '' : `, stop met ${rir} ${rir === 1 ? 'herhaling' : 'herhalingen'} over`
  const extra = doel === 'sport' && niveau > 1 ? ' Een explosieve oefening staat vooraan, als je nog fris bent.' : ''
  return `Doel ${DOEL_LABEL[doel].toLowerCase()}: ${d.sets} sets van ${toonHerhalingen(d.herhalingen)} herhalingen met ${toonRust(d.rustSec)} rust${reserveTekst}. ${DOEL_REDEN[doel]}${extra}`
}

function niveauZin(niveau: Niveau, thuis: boolean): string {
  const thuisTekst = thuis ? ' Je traint thuis: alleen lichaamsgewicht, elastiek, dumbbells en kettlebells.' : ''
  if (niveau === 1 && thuis) return 'Als beginner start je thuis met eenvoudige varianten met je lichaamsgewicht, elastiek en dumbbells: eerst de techniek, dan het gewicht.'
  if (niveau === 1) return `Als beginner start je op machines en met eenvoudige varianten: eerst de techniek, dan het gewicht.${thuisTekst}`
  if (niveau === 2) return `Je hebt ervaring: dumbbells en barbell vormen de basis, aangevuld met kabels en machines.${thuisTekst}`
  return `Gevorderd: vrije gewichten als basis, met de zwaarste oefening steeds vooraan.${thuisTekst}`
}

function rondAf(minuten: number): number {
  return Math.max(15, Math.round(minuten / 5) * 5)
}

export interface WaaromInvoer {
  split: Split
  doel: Doel
  niveau: Niveau
  thuis: boolean
  blessures: readonly Zone[]
  klachtenTekst: boolean
  /** Geschatte duur van de langste training, inclusief warming-up en cardio. */
  minuten: number
  /** Aantal krachtoefeningen per dag. */
  oefeningen: readonly number[]
  cardio: boolean
  compact: boolean
}

function aantalTekst(aantallen: readonly number[]): string {
  const min = Math.min(...aantallen)
  const max = Math.max(...aantallen)
  if (aantallen.length === 0 || max <= 0) return 'geen'
  return min === max ? `${max}` : `${min} tot ${max}`
}

function tijdZin(w: WaaromInvoer): string {
  const cardio = w.cardio ? ' en cardio als afsluiter' : ''
  const compact = w.compact ? ' Met een set minder per oefening, zodat het in je tijd past.' : ''
  return `Elke training gaat van groot naar klein met duwen en trekken in balans: 10 minuten warming-up, ${aantalTekst(w.oefeningen)} oefeningen${cardio}, samen ongeveer ${rondAf(w.minuten)} minuten.${compact}`
}

function klachtZin(w: WaaromInvoer): string | null {
  if (w.blessures.length > 0) {
    const zones = w.blessures.map((z) => ZONE_LABEL[z].toLowerCase()).join(' en ')
    return `Je hebt last van je ${zones}: oefeningen die dat belasten zijn vervangen of weggelaten, zonder zware lasten. Overleg met je trainer als iets pijn doet.`
  }
  if (w.klachtenTekst) return 'Je noemde klachten in de intake: overleg met je trainer voordat het gewicht omhoog gaat.'
  return null
}

/** De 3 tot 5 zinnen van "Waarom dit schema". */
export function waaromDitSchema(w: WaaromInvoer): string[] {
  const zinnen = [w.split.uitleg, doelZin(w.doel, w.niveau, w.blessures.length > 0), niveauZin(w.niveau, w.thuis), tijdZin(w)]
  const klacht = klachtZin(w)
  return klacht ? [...zinnen, klacht] : zinnen
}

/** Waarschuwingen uit de gezondheidsvragen (de blessures staan in de uitleg). Zonder toestemming (gezondheid null) zijn er geen. */
export function waarschuwingenVoor(intake: Pick<Antwoorden, 'gezondheid'>): string[] {
  const g = intake.gezondheid
  if (!g) return []
  const uit: string[] = []
  if (g.parqJa.length > 0) {
    const vragen = PARQ_VRAGEN.filter((v) => g.parqJa.includes(v.sleutel)).length
    uit.push(`Bij de gezondheidsvragen ${vragen === 1 ? 'is een keer' : `is ${vragen} keer`} ja geantwoord. Laat het lid eerst overleggen met de huisarts voordat de intensiteit omhoog gaat.`)
  }
  return uit
}

/** De notitie van het schema: de kop, een zin per regel, dan de waarschuwingen. Hooguit 1000 tekens. */
export function notitieMetWaarom(waarom: readonly string[], waarschuwingen: readonly string[]): string {
  const regels = [WAAROM_KOP, ...waarom, ...waarschuwingen.map((w) => `${LET_OP}${w}`)]
  let uit = ''
  for (const r of regels) {
    const volgende = uit ? `${uit}\n${r}` : r
    if (volgende.length > 1000) break
    uit = volgende
  }
  return uit
}

export interface WaaromUitleg {
  zinnen: string[]
  letOp: string[]
}

/**
 * Wat het lid van de schemanotitie ziet. Een eigen notitie van de trainer blijft
 * zoals hij is; bij de uitleg van het voorstel gaan de "Let op"-regels eruit
 * (die zijn voor de trainer, zoals het advies over de huisarts). Leeg wordt null.
 */
export function notitieVoorLid(notitie: string | null | undefined): string | null {
  const regels = (notitie ?? '').split('\n').map((r) => r.trim())
  const zicht = regels[0] === WAAROM_KOP ? regels.filter((r) => r && !r.startsWith(LET_OP)) : regels
  const tekst = zicht.join('\n').trim()
  return tekst && tekst !== WAAROM_KOP ? tekst : null
}

/** De uitleg terug uit de notitie, of null als de notitie niet met de kop begint (de trainer heeft hem aangepast). */
export function waaromUitNotitie(notitie: string | null | undefined): WaaromUitleg | null {
  const regels = (notitie ?? '').split('\n').map((r) => r.trim()).filter(Boolean)
  if (regels[0] !== WAAROM_KOP || regels.length < 2) return null
  const rest = regels.slice(1)
  return { zinnen: rest.filter((r) => !r.startsWith(LET_OP)), letOp: rest.filter((r) => r.startsWith(LET_OP)).map((r) => r.slice(LET_OP.length)) }
}
