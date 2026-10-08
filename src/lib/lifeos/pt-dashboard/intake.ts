// ─── Fit Factory PT — het intakeformulier als data (PUUR) ───────────────────
// De secties en velden volgen het papieren intakeformulier van Fit Factory
// Personal Training. Labels zijn korte eigen samenvattingen van de vragen.
// Wat al in pt_klanten staat (naam, contact, club, abonnement, startdatum)
// vragen we hier niet nog eens; de startmeting staat in pt_metingen.
// Antwoorden komen in pt_intakes.antwoorden (jsonb, migratie 356).

export const VELD_TYPES = ['tekst', 'getal', 'datum', 'keuze', 'meerkeuze', 'ja-nee'] as const
export type VeldType = (typeof VELD_TYPES)[number]

export interface Optie {
  waarde: string
  label: string
}

interface Basis {
  id: string
  label: string
  verplicht?: boolean
  hint?: string
}

export type IntakeVeld =
  | (Basis & { type: 'tekst'; lang?: boolean })
  | (Basis & { type: 'getal'; min: number; max: number; eenheid?: string })
  | (Basis & { type: 'datum' })
  | (Basis & { type: 'keuze'; opties: readonly Optie[] })
  | (Basis & { type: 'meerkeuze'; opties: readonly Optie[] })
  | (Basis & { type: 'ja-nee'; toelichtingBijJa?: boolean })

export interface IntakeSectie {
  id: string
  titel: string
  uitleg?: string
  velden: readonly IntakeVeld[]
}

export type Antwoord = string | number | boolean | readonly string[]
export type IntakeAntwoorden = Readonly<Record<string, Antwoord>>

export const MAX_KORT = 200
export const MAX_LANG = 1000
export const MAX_TOELICHTING = 300

/** Sleutel van de toelichting bij een ja-nee-vraag ("bij ja, licht toe"). */
export const toelichtingId = (veldId: string): string => `${veldId}_toelichting`

const ja = (id: string, label: string): IntakeVeld => ({ id, label, type: 'ja-nee', verplicht: true, toelichtingBijJa: true })

const STRESS_OPTIES: readonly Optie[] = [
  { waarde: '0', label: '0 · Nooit' },
  { waarde: '1', label: '1 · Af en toe' },
  { waarde: '2', label: '2 · Regelmatig' },
  { waarde: '3', label: '3 · Vaak' },
  { waarde: '4', label: '4 · Altijd' },
]
const stress = (id: string, label: string): IntakeVeld => ({ id, label, type: 'keuze', opties: STRESS_OPTIES })

const DAGEN: readonly Optie[] = [
  { waarde: 'ma', label: 'Ma' }, { waarde: 'di', label: 'Di' }, { waarde: 'wo', label: 'Wo' }, { waarde: 'do', label: 'Do' },
  { waarde: 'vr', label: 'Vr' }, { waarde: 'za', label: 'Za' }, { waarde: 'zo', label: 'Zo' },
]

export const INTAKE: readonly IntakeSectie[] = [
  {
    id: 'afspraak',
    titel: 'Afspraak en persoon',
    velden: [
      { id: 'datum_intake', label: 'Datum intake', type: 'datum', verplicht: true },
      { id: 'geholpen_door', label: 'Geholpen door', type: 'tekst' },
      {
        id: 'geslacht', label: 'Geslacht', type: 'keuze',
        opties: [{ waarde: 'man', label: 'Man' }, { waarde: 'vrouw', label: 'Vrouw' }, { waarde: 'anders', label: 'Anders of zeg ik liever niet' }],
      },
      { id: 'geboortedatum', label: 'Geboortedatum', type: 'datum' },
      { id: 'nood_naam', label: 'Noodcontact: naam', type: 'tekst' },
      { id: 'nood_relatie', label: 'Noodcontact: relatie', type: 'tekst' },
      { id: 'nood_telefoon', label: 'Noodcontact: telefoon', type: 'tekst' },
    ],
  },
  {
    id: 'planning',
    titel: 'Planning',
    velden: [
      { id: 'trainingsdagen', label: 'Vaste trainingsdagen', type: 'meerkeuze', opties: DAGEN },
      { id: 'trainingstijden', label: 'Vaste tijden', type: 'tekst', hint: 'Bijvoorbeeld: di 07:00, do 18:30' },
    ],
  },
  {
    id: 'doelen',
    titel: 'Doelen en motivatie',
    velden: [
      { id: 'motivatie', label: 'Motivatie om met PT te starten', type: 'tekst', lang: true, verplicht: true },
      { id: 'leefstijl', label: 'Huidige leefstijl: voeding en beweging', type: 'tekst', lang: true },
      { id: 'obstakels', label: 'Grootste obstakels richting het doel', type: 'tekst', lang: true },
      { id: 'verwachting_coach', label: 'Verwachting van de coach', type: 'tekst', lang: true },
      { id: 'doel_lang', label: 'Langetermijndoel gezondheid en welzijn', type: 'tekst', lang: true },
      {
        id: 'doel_meetbaar', label: 'Doel, concreet en meetbaar', type: 'tekst', lang: true, verplicht: true,
        hint: 'Vertaal het doel samen naar een cijfer of een gedrag.',
      },
    ],
  },
  {
    id: 'achtergrond',
    titel: 'Sport- en trainingsachtergrond',
    velden: [
      { id: 'sportervaring', label: 'Huidige sportervaring', type: 'tekst' },
      { id: 'jaren_actief', label: 'Aantal jaren actief', type: 'getal', min: 0, max: 80, eenheid: 'jaar' },
      { id: 'andere_sporten', label: 'Andere sporten naast PT', type: 'tekst' },
      { id: 'beroep', label: 'Beroep en werkbelasting', type: 'tekst' },
      { id: 'tijd_per_week', label: 'Tijd per week voor gezondheid', type: 'getal', min: 0, max: 60, eenheid: 'uur' },
    ],
  },
  {
    id: 'medisch',
    titel: 'Medische screening',
    uitleg: 'Elke vraag ja of nee; bij ja een korte toelichting. Bij twijfel: ja, en bespreken. Een of meer keer ja? Eerst overleggen met de huisarts. Een trainer stelt geen diagnose.',
    velden: [
      ja('med_arts', 'Sporten afgeraden door een arts, of alleen onder begeleiding'),
      ja('med_hart', 'Hart- of vaataandoening, hoge bloeddruk of diabetes'),
      ja('med_klachten', 'Hartkloppingen, pijn op de borst, duizeligheid of flauwvallen'),
      ja('med_beperking', 'Aandoening, blessure of pijn die beperkt bij bewegen'),
      ja('med_voorgeschiedenis', 'Voorgeschiedenis met gewrichten, rug of spieren'),
      ja('med_ziekenhuis', 'Operatie of ziekenhuisopname in het afgelopen jaar'),
      ja('med_medicijnen', 'Medicijnen of behandeling die sporten kan beïnvloeden'),
      ja('med_allergie', 'Allergie die het sporten beïnvloedt'),
      ja('med_mentaal', 'Mentale klachten die het sporten beïnvloedden'),
      ja('med_wandelen', 'Moeite met 30 minuten aaneengesloten wandelen'),
      ja('med_hulpmiddelen', 'Hulpmiddelen bij het sporten (brace, steunzool, inhalator)'),
      ja('med_zwanger', 'Zwanger of minder dan zes maanden geleden bevallen'),
      ja('med_familie', 'Hartaandoening of chronische ziekte in de directe familie'),
      { id: 'med_huisarts', label: 'Trainer: toestemming huisarts nodig', type: 'ja-nee' },
      { id: 'med_aanpassingen', label: 'Trainer: aanpassingen in het programma', type: 'tekst', lang: true },
    ],
  },
  {
    id: 'stress',
    titel: 'Stressvragenlijst',
    uitleg: 'Hoe vaak gold dit de afgelopen twee weken? Een gespreksinstrument, geen diagnose.',
    velden: [
      stress('stress_moe', 'Moe of uitgeput'),
      stress('stress_energie', 'Te weinig energie om de dag door te komen'),
      stress('stress_gedachten', 'Gedachten moeilijk uit te zetten'),
      stress('stress_concentratie', 'Slecht kunnen concentreren'),
      stress('stress_onrust', 'Opgejaagd of onrustig'),
      stress('stress_spieren', 'Gespannen spieren in nek, schouders of rug'),
      stress('stress_prikkelbaar', 'Snel geïrriteerd of prikkelbaar'),
      stress('stress_druk', 'Veel druk door werk of privé'),
      { id: 'stress_besproken', label: 'Besproken op', type: 'datum' },
    ],
  },
  {
    id: 'opmerkingen',
    titel: 'Aanvullende opmerkingen',
    velden: [{ id: 'opmerkingen', label: 'Bijzonderheden, afspraken of aandachtspunten', type: 'tekst', lang: true }],
  },
  {
    id: 'akkoord',
    titel: 'Akkoord en privacy',
    uitleg: 'Wat de klant op het formulier heeft aangevinkt.',
    velden: [
      { id: 'akkoord_verwerking', label: 'Akkoord met verwerking van gegevens voor de begeleiding', type: 'ja-nee', verplicht: true },
      { id: 'akkoord_fotos', label: 'Toestemming voor voortgangsfoto’s (intern)', type: 'ja-nee' },
      { id: 'akkoord_social', label: 'Toestemming om resultaten of foto’s op social media te delen', type: 'ja-nee' },
    ],
  },
]

const ALLE_VELDEN: ReadonlyMap<string, IntakeVeld> = new Map(INTAKE.flatMap((s) => s.velden.map((v) => [v.id, v] as const)))

export function vindVeld(id: string): IntakeVeld | undefined {
  return ALLE_VELDEN.get(id)
}

// ─── Inlezen (systeemgrens) ───────────────────────────────────────────────────

const DAG = /^\d{4}-\d{2}-\d{2}$/

function isDag(v: unknown): v is string {
  if (typeof v !== 'string' || !DAG.test(v)) return false
  const d = new Date(`${v}T12:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

function tekst(v: unknown, max: number, regels: boolean): string | null {
  if (typeof v !== 'string') return null
  const t = (regels ? v.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : v.replace(/\s+/g, ' ')).trim()
  return t.length === 0 ? null : t.slice(0, max)
}

function getal(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v.replace(',', '.')) : NaN
  if (!Number.isFinite(n) || n < min || n > max) return null
  return Math.round(n * 10) / 10
}

function leesWaarde(veld: IntakeVeld, v: unknown): Antwoord | null {
  switch (veld.type) {
    case 'tekst':
      return tekst(v, veld.lang ? MAX_LANG : MAX_KORT, veld.lang === true)
    case 'getal':
      return getal(v, veld.min, veld.max)
    case 'datum':
      return isDag(v) ? v : null
    case 'keuze':
      return typeof v === 'string' && veld.opties.some((o) => o.waarde === v) ? v : null
    case 'meerkeuze': {
      if (!Array.isArray(v)) return null
      const gekozen = veld.opties.map((o) => o.waarde).filter((w) => v.includes(w))
      return gekozen.length > 0 ? gekozen : null
    }
    case 'ja-nee':
      return typeof v === 'boolean' ? v : null
  }
}

/**
 * Ruwe invoer → schone antwoorden. Mild: onbekende sleutels en ongeldige
 * waarden vallen weg (een half ingevulde intake mag je gewoon opslaan), tekst
 * wordt ingekort. Een toelichting blijft alleen staan bij een "ja".
 */
export function leesIntakeAntwoorden(ruw: unknown): Record<string, Antwoord> {
  if (typeof ruw !== 'object' || ruw === null || Array.isArray(ruw)) return {}
  const o = ruw as Record<string, unknown>
  const uit: Record<string, Antwoord> = {}
  for (const veld of ALLE_VELDEN.values()) {
    const w = leesWaarde(veld, o[veld.id])
    if (w === null) continue
    uit[veld.id] = w
    if (veld.type === 'ja-nee' && veld.toelichtingBijJa && w === true) {
      const t = tekst(o[toelichtingId(veld.id)], MAX_TOELICHTING, true)
      if (t) uit[toelichtingId(veld.id)] = t
    }
  }
  return uit
}

/** De intakedatum (voor pt_intakes.ingevuld_op), als die is ingevuld. */
export function intakeDatum(a: IntakeAntwoorden): string | null {
  const d = a.datum_intake
  return typeof d === 'string' && isDag(d) ? d : null
}

// ─── Voortgang en afgeleiden ─────────────────────────────────────────────────

export interface SectieVoortgang {
  id: string
  titel: string
  beantwoord: number
  totaal: number
}

export interface IntakeVoortgang {
  beantwoord: number
  totaal: number
  /** 0–100, afgerond naar beneden (100 alleen als alles is ingevuld). */
  procent: number
  perSectie: SectieVoortgang[]
  /** Labels van verplichte velden die nog leeg zijn. */
  openVerplicht: string[]
  /** Labels van ja-antwoorden zonder de verplichte toelichting. */
  zonderToelichting: string[]
}

export function voortgang(a: IntakeAntwoorden, schema: readonly IntakeSectie[] = INTAKE): IntakeVoortgang {
  const perSectie = schema.map((s) => ({
    id: s.id,
    titel: s.titel,
    beantwoord: s.velden.filter((v) => a[v.id] !== undefined).length,
    totaal: s.velden.length,
  }))
  const velden = schema.flatMap((s) => s.velden)
  const beantwoord = perSectie.reduce((n, s) => n + s.beantwoord, 0)
  const totaal = perSectie.reduce((n, s) => n + s.totaal, 0)
  return {
    beantwoord,
    totaal,
    procent: totaal === 0 ? 0 : Math.floor((beantwoord / totaal) * 100),
    perSectie,
    openVerplicht: velden.filter((v) => v.verplicht && a[v.id] === undefined).map((v) => v.label),
    zonderToelichting: velden
      .filter((v) => v.type === 'ja-nee' && v.toelichtingBijJa && a[v.id] === true && !a[toelichtingId(v.id)])
      .map((v) => v.label),
  }
}

/** Hoe vaak "ja" in de medische screening (de 13 vragen met toelichting). */
export function aantalMedischJa(a: IntakeAntwoorden): number {
  const sectie = INTAKE.find((s) => s.id === 'medisch')
  return (sectie?.velden ?? []).filter((v) => v.type === 'ja-nee' && v.toelichtingBijJa && a[v.id] === true).length
}

export type StressNiveau = 'laag' | 'matig' | 'hoog'
export const STRESS_NIVEAU_LABEL: Record<StressNiveau, string> = { laag: 'Laag', matig: 'Matig', hoog: 'Hoog' }

export interface StressScore {
  score: number
  beantwoord: number
  totaal: number
  /** Alleen als alle stellingen zijn ingevuld; indeling van het formulier (0–8, 9–16, 17–32). */
  niveau: StressNiveau | null
}

export function stressScore(a: IntakeAntwoorden): StressScore {
  const stellingen = (INTAKE.find((s) => s.id === 'stress')?.velden ?? []).filter((v) => v.type === 'keuze')
  const waarden = stellingen.map((v) => a[v.id]).filter((w): w is string => typeof w === 'string')
  const score = waarden.reduce((s, w) => s + Number(w), 0)
  const compleet = waarden.length === stellingen.length && stellingen.length > 0
  return {
    score,
    beantwoord: waarden.length,
    totaal: stellingen.length,
    niveau: compleet ? (score <= 8 ? 'laag' : score <= 16 ? 'matig' : 'hoog') : null,
  }
}

// ─── Opgeslagen intake ────────────────────────────────────────────────────────

export interface Intake {
  antwoorden: IntakeAntwoorden
  ingevuldOp: string | null
  /** ISO-tijdstip van de laatste wijziging. */
  bijgewerktOp: string
}

/** API-antwoord → intake (client-kant), of null. */
export function leesIntake(ruw: unknown): Intake | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  if (typeof o.bijgewerktOp !== 'string') return null
  return { antwoorden: leesIntakeAntwoorden(o.antwoorden), ingevuldOp: isDag(o.ingevuldOp) ? o.ingevuldOp : null, bijgewerktOp: o.bijgewerktOp }
}
