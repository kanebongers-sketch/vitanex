// ─── Club: automatiseringen voor ledenbehoud, de regels (PUUR) ──────────────
// Zeven vaste regels die bepalen wie het team vandaag even aanspreekt, belt of
// een berichtje stuurt. Per sportschool zet je een regel aan of uit, stel je de
// drempel in, kies je wie het oppakt en pas je de voorbeeldtekst aan.
// Club verstuurt zelf (nog) niets: de regels vullen alleen de opvolglijst.

import { MEDEWERKER_ROLLEN, ROL_LABEL, type MedewerkerRol } from '@/lib/club/kern/medewerker'

export const REGEL_SLEUTELS = ['welkom', 'proefles_opvolgen', 'niet_gezien', 'risico', 'verjaardag', 'opzegging', 'mijlpaal'] as const
export type RegelSleutel = (typeof REGEL_SLEUTELS)[number]

export const SJABLOON_MAX = 600

export interface DrempelInfo {
  /** Het label boven het invoerveld. */
  label: string
  eenheid: string
  min: number
  max: number
  standaard: number
}

export interface RegelDefinitie {
  sleutel: RegelSleutel
  titel: string
  /** Wat de regel doet, in gewone taal; {n} is de drempel. */
  uitleg: string
  /** Waarom dit helpt, voor de beheerpagina. */
  waarom: string
  drempel: DrempelInfo | null
  rol: MedewerkerRol
  sjabloon: string
}

export const REGEL_DEFINITIES: Record<RegelSleutel, RegelDefinitie> = {
  welkom: {
    sleutel: 'welkom',
    titel: 'Welkomstgesprek',
    uitleg: 'Elk nieuw lid komt in de eerste {n} dagen op de lijst voor een kort welkomstgesprek.',
    waarom: 'De eerste weken bepalen of iemand blijft. Een persoonlijk woord maakt het verschil.',
    drempel: { label: 'Eerste zoveel dagen', eenheid: 'dagen', min: 1, max: 30, standaard: 7 },
    rol: 'trainer',
    sjabloon: 'Hoi {voornaam}, welkom bij {vestiging}! Fijn dat je erbij bent. Hoe bevallen je eerste trainingen? Als je ergens hulp bij wilt, spreek gerust een trainer aan.',
  },
  proefles_opvolgen: {
    sleutel: 'proefles_opvolgen',
    titel: 'Proeflid opvolgen',
    uitleg: 'Een proeflid komt {n} dagen na de start op de lijst, zodat je vraagt hoe het bevalt.',
    waarom: 'Wie tijdens de proefperiode gesproken wordt, wordt vaker lid.',
    drempel: { label: 'Na zoveel dagen', eenheid: 'dagen', min: 1, max: 30, standaard: 3 },
    rol: 'trainer',
    sjabloon: 'Hoi {voornaam}, je traint nu {dagen} dagen bij ons in {vestiging}. Hoe bevalt het tot nu toe? Ik vertel je graag welk lidmaatschap bij je past.',
  },
  niet_gezien: {
    sleutel: 'niet_gezien',
    titel: 'Lang niet gezien',
    uitleg: 'Een actief lid dat {n} dagen of langer niet is geweest, komt op de lijst.',
    waarom: 'Hoe eerder je iemand mist, hoe makkelijker hij of zij weer begint.',
    drempel: { label: 'Dagen niet geweest', eenheid: 'dagen', min: 5, max: 90, standaard: 14 },
    rol: 'trainer',
    sjabloon: 'Hoi {voornaam}, we hebben je al {dagen} dagen niet gezien in {vestiging}. Alles goed? Als we je ergens mee kunnen helpen, bijvoorbeeld met een nieuw schema of een vaste trainingstijd, laat het weten.',
  },
  risico: {
    sleutel: 'risico',
    titel: 'Risico op afhaken',
    uitleg: 'Een lid met een behoudsscore onder {n} komt op de lijst. Staat iemand al op "Lang niet gezien", dan niet dubbel.',
    waarom: 'De behoudsscore ziet een dalende lijn vaak al voordat iemand wegblijft.',
    drempel: { label: 'Behoudsscore onder', eenheid: 'punten', min: 10, max: 90, standaard: 45 },
    rol: 'manager',
    sjabloon: 'Hoi {voornaam}, hoe gaat het met trainen? We merken dat je wat minder komt dan eerst. Zullen we samen kijken wat je weer op gang helpt? Je bent altijd welkom in {vestiging}.',
  },
  verjaardag: {
    sleutel: 'verjaardag',
    titel: 'Verjaardag',
    uitleg: 'Wie vandaag jarig is, komt op de lijst voor een felicitatie.',
    waarom: 'Een klein gebaar dat laat zien dat je leden kent.',
    drempel: null,
    rol: 'trainer',
    sjabloon: 'Gefeliciteerd met je verjaardag, {voornaam}! Een hele fijne dag gewenst namens iedereen van {vestiging}.',
  },
  opzegging: {
    sleutel: 'opzegging',
    titel: 'Exitgesprek',
    uitleg: 'Wie heeft opgezegd, komt op de lijst voor een exitgesprek: vraag waarom en of je nog iets kunt doen.',
    waarom: 'Je leert waarom leden gaan, en soms blijft iemand toch.',
    drempel: null,
    rol: 'manager',
    sjabloon: 'Hoi {voornaam}, we zagen dat je je lidmaatschap hebt opgezegd. Jammer dat je gaat! Mogen we vragen waarom? Je antwoord helpt ons beter te worden. En als we nog iets voor je kunnen doen, horen we het graag.',
  },
  mijlpaal: {
    sleutel: 'mijlpaal',
    titel: 'Mijlpaal',
    uitleg: 'Bij elk {n}e bezoek (en elk veelvoud daarvan) komt een lid op de lijst voor een felicitatie.',
    waarom: 'Vieren wat goed gaat, houdt mensen gemotiveerd.',
    drempel: { label: 'Elke zoveel bezoeken', eenheid: 'bezoeken', min: 10, max: 500, standaard: 50 },
    rol: 'trainer',
    sjabloon: 'Wauw {voornaam}, dit is al je {bezoeken}e bezoek aan {vestiging}! Knap volgehouden. Op naar de volgende!',
  },
}

/** Wie een taak oppakt: een functie, een vaste medewerker of iedereen. */
export type Wie = { soort: 'rol'; rol: MedewerkerRol } | { soort: 'medewerker'; id: string } | { soort: 'iedereen' }

export interface Regel {
  sleutel: RegelSleutel
  aan: boolean
  /** Null voor regels zonder drempel (verjaardag, opzegging). */
  drempel: number | null
  wie: Wie
  sjabloon: string
}

export function isRegelSleutel(v: unknown): v is RegelSleutel {
  return typeof v === 'string' && (REGEL_SLEUTELS as readonly string[]).includes(v)
}

function isRol(v: unknown): v is MedewerkerRol {
  return typeof v === 'string' && (MEDEWERKER_ROLLEN as readonly string[]).includes(v)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

/** Een drempel binnen de grenzen van de regel; buiten de grenzen of ongeldig = de standaard. */
export function geldigeDrempel(sleutel: RegelSleutel, ruw: unknown): number | null {
  const info = REGEL_DEFINITIES[sleutel].drempel
  if (!info) return null
  const n = typeof ruw === 'number' ? ruw : typeof ruw === 'string' ? Number(ruw) : Number.NaN
  if (!Number.isInteger(n) || n < info.min || n > info.max) return info.standaard
  return n
}

/** De regel zoals hij standaard staat: aan, met de standaardwaarden. */
export function standaardRegel(sleutel: RegelSleutel): Regel {
  const d = REGEL_DEFINITIES[sleutel]
  return { sleutel, aan: true, drempel: d.drempel?.standaard ?? null, wie: { soort: 'rol', rol: d.rol }, sjabloon: d.sjabloon }
}

function wieUitRij(r: Record<string, unknown>, sleutel: RegelSleutel): Wie {
  if (isUuid(r.medewerker_id)) return { soort: 'medewerker', id: r.medewerker_id }
  if (isRol(r.rol)) return { soort: 'rol', rol: r.rol }
  if (r.rol === 'iedereen') return { soort: 'iedereen' }
  return { soort: 'rol', rol: REGEL_DEFINITIES[sleutel].rol }
}

/** Systeemgrens: een rij uit club_automatiseringen naar een Regel, of null. */
export function regelUitRij(rij: unknown): Regel | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (!isRegelSleutel(r.regel)) return null
  const sjabloon = typeof r.sjabloon === 'string' && r.sjabloon.trim() ? r.sjabloon.slice(0, SJABLOON_MAX) : REGEL_DEFINITIES[r.regel].sjabloon
  return { sleutel: r.regel, aan: r.aan !== false, drempel: geldigeDrempel(r.regel, r.drempel), wie: wieUitRij(r, r.regel), sjabloon }
}

/** Alle zeven regels in vaste volgorde; wat niet in de database staat, krijgt de standaard. */
export function regelsCompleet(rijen: readonly unknown[]): Regel[] {
  const gevonden = new Map<RegelSleutel, Regel>()
  for (const rij of rijen) {
    const regel = regelUitRij(rij)
    if (regel) gevonden.set(regel.sleutel, regel)
  }
  return REGEL_SLEUTELS.map((s) => gevonden.get(s) ?? standaardRegel(s))
}

/** De kolommen voor opslag van een regel. */
export function regelNaarRij(regel: Regel): { regel: RegelSleutel; aan: boolean; drempel: number | null; rol: string | null; medewerker_id: string | null; sjabloon: string } {
  const rol = regel.wie.soort === 'rol' ? regel.wie.rol : regel.wie.soort === 'iedereen' ? 'iedereen' : null
  const medewerker = regel.wie.soort === 'medewerker' ? regel.wie.id : null
  return { regel: regel.sleutel, aan: regel.aan, drempel: regel.drempel, rol, medewerker_id: medewerker, sjabloon: regel.sjabloon }
}

/** "Trainer", "Sanne" of "Iedereen". */
export function wieTekst(wie: Wie, medewerkers: ReadonlyMap<string, string>): string {
  if (wie.soort === 'iedereen') return 'Iedereen'
  if (wie.soort === 'rol') return ROL_LABEL[wie.rol]
  return medewerkers.get(wie.id) ?? 'Onbekende medewerker'
}

/** De uitleg van een regel met de ingestelde drempel erin. */
export function uitlegMetDrempel(regel: Regel): string {
  return REGEL_DEFINITIES[regel.sleutel].uitleg.replace('{n}', String(regel.drempel ?? ''))
}

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function leesWie(ruw: unknown): Wie | null {
  if (ruw === 'iedereen') return { soort: 'iedereen' }
  if (typeof ruw !== 'string') return null
  const [soort, waarde] = ruw.split(':')
  if (soort === 'rol' && isRol(waarde)) return { soort: 'rol', rol: waarde }
  if (soort === 'mw' && isUuid(waarde)) return { soort: 'medewerker', id: waarde }
  return null
}

/** De keuze in een select: "rol:trainer", "mw:<id>" of "iedereen". */
export function wieWaarde(wie: Wie): string {
  if (wie.soort === 'iedereen') return 'iedereen'
  return wie.soort === 'rol' ? `rol:${wie.rol}` : `mw:${wie.id}`
}

/** Systeemgrens: de body van PUT /api/club/automatisering/regels. */
export function leesRegelInvoer(ruw: unknown): Uitkomst<Regel> {
  if (typeof ruw !== 'object' || ruw === null) return { ok: false, fout: 'Onleesbare invoer.' }
  const r = ruw as Record<string, unknown>
  if (!isRegelSleutel(r.sleutel)) return { ok: false, fout: 'Onbekende regel.' }
  const info = REGEL_DEFINITIES[r.sleutel].drempel
  let drempel: number | null = null
  if (info) {
    const n = typeof r.drempel === 'number' ? r.drempel : Number(r.drempel)
    if (!Number.isInteger(n) || n < info.min || n > info.max) {
      return { ok: false, fout: `Kies bij "${info.label.toLowerCase()}" een heel getal van ${info.min} tot ${info.max}.` }
    }
    drempel = n
  }
  const wie = leesWie(r.wie)
  if (!wie) return { ok: false, fout: 'Kies wie deze taken oppakt.' }
  const sjabloon = typeof r.sjabloon === 'string' ? r.sjabloon.trim() : ''
  if (!sjabloon) return { ok: false, fout: 'De voorbeeldtekst mag niet leeg zijn.' }
  if (sjabloon.length > SJABLOON_MAX) return { ok: false, fout: `De voorbeeldtekst mag hoogstens ${SJABLOON_MAX} tekens zijn.` }
  return { ok: true, waarde: { sleutel: r.sleutel, aan: r.aan === true, drempel, wie, sjabloon } }
}
