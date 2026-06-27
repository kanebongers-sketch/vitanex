import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import type { Activiteitsniveau, FitnessDoel } from '@/lib/gezondheid-berekeningen'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BaselineAntwoorden {
  energie_niveau: number | null
  stemming: number | null
  interesse_plezier: number | null
  lichaam_gevoel: number | null
  slaap_kwaliteit: number | null
  slaap_duur: number | null
  slaperigheid_overdag: number | null
  stress_controle: number | null
  stress_overweldigd: number | null
  herstel_ontspanning: number | null
  beweging_dagen: number | null
  voeding_kwaliteit: number | null
  gewoontes: string[]
  motivatoren: string[]
  zelfvertrouwen_verandering: number | null
}

export interface BaselineAntropometrie {
  geslacht: 'man' | 'vrouw' | 'anders' | 'zeg_ik_niet' | null
  geboortedatum: string | null
  lengte_cm: number | null
  gewicht_kg: number | null
  activiteitsniveau: Activiteitsniveau | null
  fitness_doel: FitnessDoel | null
  streefgewicht_kg: number | null
}

export interface OnboardingAnalyseRequest {
  antwoorden: BaselineAntwoorden
  antropometrie: BaselineAntropometrie
}

export type Pijler = 'energie' | 'slaap' | 'stress' | 'stemming' | 'beweging' | 'voeding'

export interface PijlerScores {
  vitality: number
  energie: number
  slaap: number
  stress: number
  stemming: number
  beweging: number
  voeding: number
}

export interface Verbeterpunt {
  pijler: Pijler
  waarom: string
  eerste_stap: string
}

export interface DoelSuggestie {
  pijler: Pijler
  titel: string
  streefwaarde: string
  ambitie: 'micro' | 'gemiddeld' | 'stretch'
  reden: string
}

export interface OnboardingAiAnalyse {
  vitality_score: number
  scores: PijlerScores
  narratief: string
  sterke_punten: string[]
  top_verbeterpunten: Verbeterpunt[]
  voorgestelde_doelen: DoelSuggestie[]
  activiteitsniveau_suggestie: Activiteitsniveau | null
  fitness_doel_suggestie: FitnessDoel | null
  toon_signaal: 'neutraal' | 'zacht'
  zorgflag: boolean
  gegenereerd_op: string
}

// ─── Constanten ───────────────────────────────────────────────────────────────

const SLAAP_DUUR_LABELS = ['minder dan 5 uur', '5-6 uur', '6-7 uur', '7-8 uur', '8-9 uur', 'meer dan 9 uur']
const BEWEGING_LABELS = ['0 dagen', '1 dag', '2 dagen', '3 dagen', '4 dagen', '5+ dagen']

// Slaap-duur index → score (0-100): index 3 (7-8u) = 100, randen lager
const SLAAP_DUUR_SCORES = [20, 45, 70, 100, 85, 60]
// Beweging-dagen index → score
const BEWEGING_SCORES = [0, 20, 40, 60, 80, 100]

// ─── Rate limiter ─────────────────────────────────────────────────────────────

const rateMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW = 60 * 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const data = rateMap.get(userId)
  if (!data || now > data.reset) {
    rateMap.set(userId, { count: 1, reset: now + RATE_WINDOW })
    return true
  }
  if (data.count >= RATE_LIMIT) return false
  data.count++
  return true
}

// ─── Deterministische scoreberekening ────────────────────────────────────────

function emojiNaar100(v: number | null): number | null {
  if (v === null) return null
  return Math.round(((v - 1) / 4) * 100)
}

function gemiddeld(waarden: (number | null)[]): number {
  const ingevuld = waarden.filter((v): v is number => v !== null)
  if (ingevuld.length === 0) return 50
  return Math.round(ingevuld.reduce((a, b) => a + b, 0) / ingevuld.length)
}

function klem(v: number): number {
  return Math.max(0, Math.min(100, v))
}

function berekenPijlerScores(a: BaselineAntwoorden): PijlerScores {
  const energie = klem(gemiddeld([
    emojiNaar100(a.energie_niveau),
    emojiNaar100(a.lichaam_gevoel),
  ]))

  const slaapKwal = emojiNaar100(a.slaap_kwaliteit)
  const slaapDuur = a.slaap_duur !== null ? (SLAAP_DUUR_SCORES[a.slaap_duur] ?? 50) : null
  const slaperigheid = a.slaperigheid_overdag !== null ? klem(100 - ((a.slaperigheid_overdag - 1) / 4) * 100) : null
  const slaap = klem(gemiddeld([slaapKwal, slaapDuur, slaperigheid]))

  const controle = emojiNaar100(a.stress_controle)
  const overweldigd = a.stress_overweldigd !== null ? klem(100 - ((a.stress_overweldigd - 1) / 4) * 100) : null
  const herstel = emojiNaar100(a.herstel_ontspanning)
  const stress = klem(gemiddeld([controle, overweldigd, herstel]))

  const stemming = klem(gemiddeld([
    emojiNaar100(a.stemming),
    emojiNaar100(a.interesse_plezier),
  ]))

  const bewegingScore = a.beweging_dagen !== null ? (BEWEGING_SCORES[a.beweging_dagen] ?? 50) : null
  const beweging = klem(gemiddeld([bewegingScore]))

  const voeding = klem(gemiddeld([emojiNaar100(a.voeding_kwaliteit)]))

  const vitality = klem(Math.round(
    energie * 0.20 +
    slaap   * 0.20 +
    stress  * 0.20 +
    stemming * 0.15 +
    beweging * 0.15 +
    voeding * 0.10,
  ))

  return { vitality, energie, slaap, stress, stemming, beweging, voeding }
}

// ─── Type-guard ───────────────────────────────────────────────────────────────

const PIJLERS: Pijler[] = ['energie', 'slaap', 'stress', 'stemming', 'beweging', 'voeding']
const AMBITIES = ['micro', 'gemiddeld', 'stretch'] as const
const TOON_SIGNALEN = ['neutraal', 'zacht'] as const
const ACTIVITEITSNIVEAUS: Activiteitsniveau[] = ['sedentair', 'licht', 'gemiddeld', 'actief', 'zeer_actief']
const FITNESS_DOELEN: FitnessDoel[] = ['afvallen', 'onderhouden', 'aankomen', 'fitter']

function isGeldigeAiOutput(v: unknown): v is {
  narratief: string
  sterke_punten: string[]
  top_verbeterpunten: { pijler: Pijler; waarom: string; eerste_stap: string }[]
  voorgestelde_doelen: { pijler: Pijler; titel: string; streefwaarde: string; ambitie: string; reden: string }[]
  activiteitsniveau_suggestie: string | null
  fitness_doel_suggestie: string | null
  toon_signaal: string
} {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (typeof o.narratief !== 'string') return false
  if (!Array.isArray(o.sterke_punten)) return false
  if (!Array.isArray(o.top_verbeterpunten) || o.top_verbeterpunten.length !== 3) return false
  if (!Array.isArray(o.voorgestelde_doelen) || o.voorgestelde_doelen.length < 3) return false
  for (const vp of o.top_verbeterpunten as unknown[]) {
    const item = vp as Record<string, unknown>
    if (!PIJLERS.includes(item.pijler as Pijler)) return false
  }
  for (const doel of o.voorgestelde_doelen as unknown[]) {
    const item = doel as Record<string, unknown>
    if (!PIJLERS.includes(item.pijler as Pijler)) return false
    if (!AMBITIES.includes(item.ambitie as typeof AMBITIES[number])) return false
  }
  if (!TOON_SIGNALEN.includes(o.toon_signaal as typeof TOON_SIGNALEN[number])) return false
  return true
}

function bouwFallback(scores: PijlerScores, zorgflag: boolean): Omit<OnboardingAiAnalyse, 'vitality_score' | 'scores' | 'zorgflag' | 'gegenereerd_op'> {
  const gesorteerd = (Object.entries(scores) as [string, number][])
    .filter(([k]) => k !== 'vitality')
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([k]) => k as Pijler)

  return {
    narratief: 'Je baseline is opgeslagen. We stellen je persoonlijk vitaliteitsplan samen naarmate je meer bijhoudt.',
    sterke_punten: ['Stap gezet om je vitaliteit inzichtelijk te maken'],
    top_verbeterpunten: gesorteerd.map(pijler => ({
      pijler,
      waarom: `Je ${pijler}-score biedt ruimte voor verbetering.`,
      eerste_stap: 'Begin vandaag met één kleine actie.',
    })),
    voorgestelde_doelen: gesorteerd.map(pijler => ({
      pijler,
      titel: `Verbeter je ${pijler}`,
      streefwaarde: 'Stap voor stap',
      ambitie: 'micro' as const,
      reden: 'Kleine stappen leiden tot grote verandering.',
    })),
    activiteitsniveau_suggestie: null,
    fitness_doel_suggestie: null,
    toon_signaal: zorgflag ? 'zacht' as const : 'neutraal' as const,
  }
}

// ─── Leeftijd helper ──────────────────────────────────────────────────────────

function berekenLeeftijd(geboortedatum: string | null): number | null {
  if (!geboortedatum) return null
  const geb = new Date(geboortedatum)
  const nu = new Date()
  const leeftijd = nu.getFullYear() - geb.getFullYear()
  const maandVerschil = nu.getMonth() - geb.getMonth()
  if (maandVerschil < 0 || (maandVerschil === 0 && nu.getDate() < geb.getDate())) {
    return leeftijd - 1
  }
  return leeftijd
}

// ─── Anthropic client ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: 'Te veel verzoeken. Probeer het over een uur opnieuw.' }, { status: 429 })
  }

  let body: OnboardingAnalyseRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldig JSON verzoek.' }, { status: 400 })
  }

  const { antwoorden: a, antropometrie: p } = body

  if (!a || typeof a !== 'object' || !Array.isArray(a.gewoontes) || !Array.isArray(a.motivatoren)) {
    return NextResponse.json({ error: 'Onvolledig verzoek: antwoorden ontbreken.' }, { status: 400 })
  }

  const scores = berekenPijlerScores(a)
  const zorgflag = (a.stemming ?? 5) <= 2 && (a.interesse_plezier ?? 5) <= 2
  const leeftijd = berekenLeeftijd(p.geboortedatum)

  const prompt = `Je bent de vitaliteitscoach van Vitaal. Je schrijft warm, concreet en in het Nederlands (je-vorm), nooit klinisch of betuttelend. Je bent GEEN arts en stelt GEEN diagnoses. Je werkt evidence-based (slaap-, stress- en gedragswetenschap) maar verbergt het jargon.

Je krijgt reeds BEREKENDE pijlerscores (0-100), de ruwe antwoorden, en antropometrie. Je HERBEREKENT niets — je interpreteert en motiveert.

REEDS BEREKENDE SCORES (deze zijn definitief, neem ze over, herbereken niet):
Vitality: ${scores.vitality}/100
Energie: ${scores.energie} · Slaap: ${scores.slaap} · Stress: ${scores.stress} · Stemming: ${scores.stemming} · Beweging: ${scores.beweging} · Voeding: ${scores.voeding}

RUWE ANTWOORDEN (schaal 1-5 tenzij anders vermeld):
Energie laatste 2 weken: ${a.energie_niveau ?? 'n.v.t.'}
Stemming: ${a.stemming ?? 'n.v.t.'} · Plezier in dingen: ${a.interesse_plezier ?? 'n.v.t.'}
Lichaam fit/uitgeput: ${a.lichaam_gevoel ?? 'n.v.t.'}
Slaapkwaliteit: ${a.slaap_kwaliteit ?? 'n.v.t.'} · Slaapduur: ${SLAAP_DUUR_LABELS[a.slaap_duur ?? -1] ?? 'onbekend'} · Slaperigheid overdag: ${a.slaperigheid_overdag ?? 'n.v.t.'}
Stress-controle (regie): ${a.stress_controle ?? 'n.v.t.'} · Overweldigd: ${a.stress_overweldigd ?? 'n.v.t.'} · Kan ontspannen: ${a.herstel_ontspanning ?? 'n.v.t.'}
Intensieve bewegingsdagen/week: ${BEWEGING_LABELS[a.beweging_dagen ?? -1] ?? 'onbekend'} · Eet gezond: ${a.voeding_kwaliteit ?? 'n.v.t.'}
Gewoontes die meespelen: ${a.gewoontes.length ? a.gewoontes.join(', ') : 'geen opgegeven'}
Motivatoren (waarom): ${a.motivatoren.length ? a.motivatoren.join(', ') : 'geen opgegeven'}
Vertrouwen om vol te houden (self-efficacy): ${a.zelfvertrouwen_verandering ?? 'n.v.t.'}

ANTROPOMETRIE: geslacht ${p.geslacht ?? '?'}, leeftijd ${leeftijd ?? '?'}, lengte ${p.lengte_cm ?? '?'} cm, gewicht ${p.gewicht_kg ?? '?'} kg, huidig gekozen activiteitsniveau ${p.activiteitsniveau ?? 'nog niet gekozen'}, doel ${p.fitness_doel ?? 'nog niet gekozen'}.

ZORGFLAG: ${zorgflag ? 'JA — stemming en plezier zijn beide laag.' : 'nee'}

OPDRACHT:
- Verbind ELKE doelsuggestie expliciet aan een MOTIVATOR die de gebruiker koos (of, als er geen is, aan de laagst scorende pijler).
- Ambitieniveau volgt zelfvertrouwen_verandering: 1-2 = "micro", 3 = "gemiddeld", 4-5 = "stretch".
- top_verbeterpunten: exact 3, de drie laagst scorende pijlers, met een 'eerste_stap' die VANDAAG haalbaar is.
- voorgestelde_doelen: 3 tot 5 stuks, pijlers uit top_verbeterpunten eerst.
- activiteitsniveau_suggestie: kies uit sedentair|licht|gemiddeld|actief|zeer_actief op basis van bewegingsdagen, of null als onduidelijk.
- fitness_doel_suggestie: kies uit afvallen|onderhouden|aankomen|fitter op basis van motivatoren + antropometrie, of null.
- toon_signaal: "zacht" als ZORGFLAG JA, anders "neutraal". Bij "zacht": geen prestatietaal, voeg in het narratief één zin toe dat het oké is om met de huisarts of 113 te praten. Geen alarmtaal, geen diagnose.
- Noem nooit een ruwe score zonder betekenis. Max 1 emoji per veld.

Geef UITSLUITEND geldige JSON terug, zonder markdown of extra tekst:
{
  "narratief": "2-3 zinnen persoonlijke startfoto",
  "sterke_punten": ["concreet sterk punt", "nog een"],
  "top_verbeterpunten": [
    { "pijler": "slaap", "waarom": "1 zin gekoppeld aan hun antwoord", "eerste_stap": "1 micro-actie vandaag" }
  ],
  "voorgestelde_doelen": [
    { "pijler": "slaap", "titel": "kort doel", "streefwaarde": "bv. 7,5 uur", "ambitie": "micro", "reden": "verbindt aan gekozen motivator" }
  ],
  "activiteitsniveau_suggestie": "gemiddeld",
  "fitness_doel_suggestie": "fitter",
  "toon_signaal": "neutraal"
}`

  let resultaat: OnboardingAiAnalyse

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''
    const schoon = tekst.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(schoon)
    } catch {
      parsed = null
    }

    if (isGeldigeAiOutput(parsed)) {
      const actNiv = ACTIVITEITSNIVEAUS.includes(parsed.activiteitsniveau_suggestie as Activiteitsniveau)
        ? (parsed.activiteitsniveau_suggestie as Activiteitsniveau)
        : null
      const fitDoel = FITNESS_DOELEN.includes(parsed.fitness_doel_suggestie as FitnessDoel)
        ? (parsed.fitness_doel_suggestie as FitnessDoel)
        : null

      resultaat = {
        vitality_score: scores.vitality,
        scores,
        narratief: parsed.narratief,
        sterke_punten: parsed.sterke_punten as string[],
        top_verbeterpunten: parsed.top_verbeterpunten as Verbeterpunt[],
        voorgestelde_doelen: parsed.voorgestelde_doelen as DoelSuggestie[],
        activiteitsniveau_suggestie: actNiv,
        fitness_doel_suggestie: fitDoel,
        toon_signaal: parsed.toon_signaal as 'neutraal' | 'zacht',
        zorgflag,
        gegenereerd_op: new Date().toISOString(),
      }
    } else {
      const fallback = bouwFallback(scores, zorgflag)
      resultaat = { vitality_score: scores.vitality, scores, zorgflag, gegenereerd_op: new Date().toISOString(), ...fallback }
    }
  } catch {
    const fallback = bouwFallback(scores, zorgflag)
    resultaat = { vitality_score: scores.vitality, scores, zorgflag, gegenereerd_op: new Date().toISOString(), ...fallback }
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('profiles').update({ onboarding_ai_analyse: resultaat }).eq('id', user.id)
    if (error) console.error('[onboarding/analyse] DB write fout:', error)
  } catch (err) {
    console.error('[onboarding/analyse] DB write exception:', err)
  }

  return NextResponse.json({ analyse: resultaat })
}
