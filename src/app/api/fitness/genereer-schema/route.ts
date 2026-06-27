import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 300
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import { getAuthenticatedUser } from "@/lib/api-auth"
import { berekenLeeftijd, type FitnessDoel } from "@/lib/gezondheid-berekeningen"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Doel = "spiermassa" | "afvallen" | "conditie" | "flexibiliteit" | "kracht"
type Niveau = "beginner" | "gemiddeld" | "gevorderd"
type DiscProfiel = "D" | "I" | "S" | "C"

/** Persoonlijke context uit het intake-profiel, gebruikt om schema's af te stemmen. */
interface IntakeProfiel {
  fitness_doel: FitnessDoel | null
  activiteitsniveau: string | null
  gewicht_kg: number | null
  streefgewicht_kg: number | null
  lengte_cm: number | null
  leeftijd: number | null
  geslacht: string | null
}

interface RequestBody {
  userId: string
  doel: Doel
  niveau: Niveau
  sessies_per_week: number
  beschikbare_tijd: number
  benodigdheden: string[]
  blessures?: string
  disc_profiel?: DiscProfiel
}

interface Oefening {
  naam: string
  naam_en: string
  sets: number
  herhalingen: string
  rusttijd_sec: number
  heeft_gewicht: boolean
  gewicht_tip: string
  uitvoering_tip: string
}

interface Trainingsdag {
  dag: number
  naam: string
  spiergroepen: string[]
  coaching_tekst: string
  geschatte_duur: number
  oefeningen: Oefening[]
}

interface DagPlanning {
  dag: number
  naam: string
  spiergroepen: string[]
}

interface PlannerOutput {
  splits_type: string
  dagen: DagPlanning[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Supabase omgevingsvariabelen ontbreken")
  }
  return createClient(url, key)
}

function extractJson<T>(text: string): T {
  // Probeer eerst ```json ... ``` blok
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) {
    return JSON.parse(codeBlock[1].trim()) as T
  }
  // Daarna eerste JSON object of array in de tekst
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) return JSON.parse(arrMatch[0]) as T
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) return JSON.parse(objMatch[0]) as T
  throw new Error(`Geen geldige JSON gevonden in AI respons. Tekst begint met: ${text.slice(0, 200)}`)
}

function buildDiscInstructie(disc_profiel?: DiscProfiel): string {
  const stijlen: Record<DiscProfiel, string> = {
    D: "Direct en uitdagend. Gebruik krachtige, actie-gerichte taal. Focus op resultaten en prestaties.",
    I: "Enthousiast en sociaal. Gebruik aanmoedigende, energieke taal. Vier kleine successen.",
    S: "Rustig en stap-voor-stap. Gebruik geruststellen taal. Benadruk consistentie en veiligheid.",
    C: "Precies en wetenschappelijk. Gebruik feitelijke, gedetailleerde taal. Leg de 'waarom' uit.",
  }
  if (!disc_profiel || !(disc_profiel in stijlen)) {
    return "Gebruik een bemoedigende, professionele toon."
  }
  return stijlen[disc_profiel]
}

/**
 * Mapt het intake fitness_doel naar een trainingsfocus-instructie voor de AI.
 * afvallen → vetverlies + conditie, aankomen → hypertrofie/kracht,
 * fitter → conditie/full-body, onderhouden → gebalanceerd.
 */
function trainingsfocusVoorDoel(fitnessDoel: FitnessDoel | null): string {
  const focus: Record<FitnessDoel, string> = {
    afvallen:
      "Focus op vetverlies en conditie: hoger volume, kortere rusttijden, supersets en cardio-elementen. Houd intensiteit hoog om de verbranding te stimuleren.",
    aankomen:
      "Focus op hypertrofie en kracht: samengestelde oefeningen, progressieve overload, 6–12 herhalingen met voldoende rust tussen sets.",
    fitter:
      "Focus op algehele conditie en full-body training: gevarieerde oefeningen, functionele bewegingen en een mix van kracht en uithoudingsvermogen.",
    onderhouden:
      "Gebalanceerde training: een evenwichtige mix van kracht, conditie en mobiliteit om het huidige niveau te onderhouden.",
  }
  if (!fitnessDoel || !(fitnessDoel in focus)) {
    return "Stem de training af op het gekozen doel met een gebalanceerde opbouw."
  }
  return focus[fitnessDoel]
}

/** Bouwt een leesbaar profielblok voor de AI-prompt. Lege wanneer er geen data is. */
function buildProfielContext(profiel: IntakeProfiel | null): string {
  if (!profiel) return ""
  const regels: string[] = []
  if (profiel.fitness_doel) regels.push(`- Intake-doel: ${profiel.fitness_doel}`)
  if (profiel.activiteitsniveau) regels.push(`- Activiteitsniveau: ${profiel.activiteitsniveau}`)
  if (profiel.geslacht) regels.push(`- Geslacht: ${profiel.geslacht}`)
  if (profiel.leeftijd !== null) regels.push(`- Leeftijd: ${profiel.leeftijd} jaar`)
  if (profiel.lengte_cm) regels.push(`- Lengte: ${profiel.lengte_cm} cm`)
  if (profiel.gewicht_kg) regels.push(`- Huidig gewicht: ${profiel.gewicht_kg} kg`)
  if (profiel.streefgewicht_kg) regels.push(`- Streefgewicht: ${profiel.streefgewicht_kg} kg`)
  if (regels.length === 0) return ""
  return `\nPersoonlijk profiel (uit intake — gebruik dit om het schema af te stemmen):\n${regels.join("\n")}`
}

function validateBody(body: unknown): body is RequestBody {
  if (typeof body !== "object" || body === null) return false
  const b = body as Record<string, unknown>

  const doelen: Doel[] = ["spiermassa", "afvallen", "conditie", "flexibiliteit", "kracht"]
  const niveaus: Niveau[] = ["beginner", "gemiddeld", "gevorderd"]

  if (typeof b.userId !== "string" || b.userId.trim() === "") return false
  if (!doelen.includes(b.doel as Doel)) return false
  if (!niveaus.includes(b.niveau as Niveau)) return false
  if (typeof b.sessies_per_week !== "number" || b.sessies_per_week < 2 || b.sessies_per_week > 5) return false
  if (typeof b.beschikbare_tijd !== "number" || b.beschikbare_tijd <= 0) return false
  if (!Array.isArray(b.benodigdheden)) return false

  return true
}

// ---------------------------------------------------------------------------
// Agent 1 — Schema Planner (claude-haiku-4-5)
// ---------------------------------------------------------------------------

async function runPlannerAgent(
  anthropic: Anthropic,
  body: RequestBody,
  profiel: IntakeProfiel | null,
): Promise<PlannerOutput> {
  const profielContext = buildProfielContext(profiel)
  const trainingsfocus = trainingsfocusVoorDoel(profiel?.fitness_doel ?? null)
  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: `Je bent een fitness schema planner. Maak een STRUCTUREEL trainingsplan (geen oefening details).

Gebruikersparameters:
- Doel: ${body.doel}
- Niveau: ${body.niveau}
- Sessies per week: ${body.sessies_per_week}
- Beschikbare tijd: ${body.beschikbare_tijd} minuten per sessie
- Beschikbaar materiaal: ${body.benodigdheden.join(", ")}
${body.blessures ? `- Blessures/beperkingen: ${body.blessures}` : ""}
${profielContext}

Trainingsfocus: ${trainingsfocus}

Bepaal:
1. Het beste splits type (bijv. push/pull/legs, upper/lower, full body, etc.)
2. Welke spiergroepen op welke dag getraind worden
3. Optimale herstelindeling

Geef ALLEEN de structuur terug als JSON in dit formaat:
\`\`\`json
{
  "splits_type": "string beschrijving",
  "dagen": [
    { "dag": 1, "naam": "Training A naam", "spiergroepen": ["spiergroep1", "spiergroep2"] }
  ]
}
\`\`\`

Gebruik maximaal ${body.sessies_per_week} trainingsdagen.`,
    },
  ]

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return extractJson<PlannerOutput>(text)
}

// ---------------------------------------------------------------------------
// Agent 2 — Oefening Specialist (claude-sonnet-4-6)
// ---------------------------------------------------------------------------

async function runOefeningAgent(
  anthropic: Anthropic,
  body: RequestBody,
  planning: PlannerOutput,
  profiel: IntakeProfiel | null,
): Promise<Trainingsdag[]> {
  const profielContext = buildProfielContext(profiel)
  const trainingsfocus = trainingsfocusVoorDoel(profiel?.fitness_doel ?? null)
  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: `Je bent een oefening specialist. Vul het trainingsplan in met concrete oefeningen.

Trainingsplan structuur:
${JSON.stringify(planning, null, 2)}

Gebruikersparameters:
- Doel: ${body.doel}
- Niveau: ${body.niveau}
- Beschikbare tijd: ${body.beschikbare_tijd} minuten per sessie
- Beschikbaar materiaal: ${body.benodigdheden.join(", ")}
${body.blessures ? `- Blessures/beperkingen: ${body.blessures} — vermijd oefeningen die deze belasten` : ""}
${profielContext}

Trainingsfocus: ${trainingsfocus}

Vul elke trainingsdag in. Geef ALLEEN de JSON terug:
\`\`\`json
[
  {
    "dag": 1,
    "naam": "Training naam",
    "spiergroepen": ["spiergroep1"],
    "coaching_tekst": "",
    "geschatte_duur": ${body.beschikbare_tijd},
    "oefeningen": [
      {
        "naam": "Nederlandse naam",
        "naam_en": "English exercise name (for ExerciseDB lookup)",
        "sets": 3,
        "herhalingen": "8-12",
        "rusttijd_sec": 90,
        "heeft_gewicht": true,
        "gewicht_tip": "Start met licht gewicht",
        "uitvoering_tip": "Korte uitvoeringstip"
      }
    ]
  }
]
\`\`\`

Richtlijnen:
- Kies oefeningen passend bij het beschikbare materiaal
- Pas volume en intensiteit aan op het niveau
- Stem oefeningen af op het doel (${body.doel})
- Houd de sessieduur binnen ~${body.beschikbare_tijd} minuten
- Laat coaching_tekst leeg (wordt later ingevuld)
- BELANGRIJK: heeft_gewicht = false voor bodyweight oefeningen (push-up, pull-up, dip, plank, etc.) of als materiaal = "geen". heeft_gewicht = true alleen als er daadwerkelijk gewichten nodig zijn.
- naam_en: gebruik de EXACTE Engelse naam uit de Free Exercise DB (github.com/yuhonas/free-exercise-db). Voorbeelden van correcte namen: "Barbell Squat", "Dumbbell Bicep Curl", "Push-Up", "Pull-Up", "Bench Press", "Romanian Deadlift", "Dumbbell Shoulder Press", "Plank", "Tricep Dip", "Cable Row". Schrijf altijd Title Case, gebruik "Barbell" of "Dumbbell" als prefix bij gewichtsoefeningen.`,
    },
  ]

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return extractJson<Trainingsdag[]>(text)
}

// ---------------------------------------------------------------------------
// Agent 3 — Coach Reviewer (claude-haiku-4-5)
// ---------------------------------------------------------------------------

interface CoachingOutput {
  dag: number
  coaching_tekst: string
}

async function runCoachAgent(
  anthropic: Anthropic,
  schema: Trainingsdag[],
  disc_profiel?: DiscProfiel,
): Promise<Trainingsdag[]> {
  const discInstructie = buildDiscInstructie(disc_profiel)

  // Stuur alleen samenvatting per dag — niet het volledige schema
  const dagSamenvattingen = schema.map(d => ({
    dag: d.dag,
    naam: d.naam,
    spiergroepen: d.spiergroepen,
    doel_van_sessie: d.oefeningen.map(o => o.naam).join(", "),
  }))

  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: `Je bent een persoonlijke coach. Schrijf een motiverende coaching_tekst per trainingsdag.

DISC communicatiestijl: ${discInstructie}

Trainingsdagen:
${JSON.stringify(dagSamenvattingen, null, 2)}

Schrijf per dag een coaching_tekst van 2-3 zinnen die:
- Motiveert voor deze training
- Past bij de DISC stijl
- Het doel van de sessie beschrijft

Geef ALLEEN dit JSON terug:
\`\`\`json
[
  { "dag": 1, "coaching_tekst": "..." },
  { "dag": 2, "coaching_tekst": "..." }
]
\`\`\``,
    },
  ]

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const coachingTexts = extractJson<CoachingOutput[]>(text)

  // Merge coaching_tekst terug in het volledige schema
  return schema.map(dag => {
    const coaching = coachingTexts.find(c => c.dag === dag.dag)
    return { ...dag, coaching_tekst: coaching?.coaching_tekst ?? "" }
  })
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const missingEnv: string[] = []
  if (!process.env.ANTHROPIC_API_KEY) missingEnv.push("ANTHROPIC_API_KEY")
  if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnv.push("SUPABASE_URL")
  if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push("SUPABASE_SERVICE_KEY")

  if (missingEnv.length > 0) {
    return NextResponse.json(
      { error: `Omgevingsvariabelen ontbreken: ${missingEnv.join(", ")}` },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON in request body" }, { status: 400 })
  }

  if (!validateBody(body)) {
    return NextResponse.json(
      {
        error:
          "Ongeldige invoer. Vereist: userId (string), doel, niveau, sessies_per_week (2-5), beschikbare_tijd, benodigdheden (array)",
      },
      { status: 400 },
    )
  }

  // Prevent users from generating schemas for other users
  if (body.userId !== user.id) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Haal het intake-profiel op zodat schema's persoonlijk worden afgestemd.
  // Faalt dit, dan vallen we netjes terug op de losse formulier-keuzes.
  let intakeProfiel: IntakeProfiel | null = null
  let bedrijfId: string | null = null
  try {
    const supabase = createSupabaseAdmin()
    const { data: profiel } = await supabase
      .from("profiles")
      .select(
        "bedrijf_id, fitness_doel, activiteitsniveau, gewicht_kg, streefgewicht_kg, lengte_cm, geboortedatum, geslacht",
      )
      .eq("id", body.userId)
      .maybeSingle()

    if (profiel) {
      bedrijfId = profiel.bedrijf_id ?? null
      intakeProfiel = {
        fitness_doel: (profiel.fitness_doel as FitnessDoel | null) ?? null,
        activiteitsniveau: profiel.activiteitsniveau ?? null,
        gewicht_kg: profiel.gewicht_kg ?? null,
        streefgewicht_kg: profiel.streefgewicht_kg ?? null,
        lengte_cm: profiel.lengte_cm ?? null,
        leeftijd: berekenLeeftijd(profiel.geboortedatum),
        geslacht: profiel.geslacht ?? null,
      }
    }
  } catch (err) {
    void err
    // Geen blokkering — schema wordt gegenereerd op basis van de formulier-keuzes.
  }

  // Agent 1 — Schema Planner
  let planning: PlannerOutput
  try {
    planning = await runPlannerAgent(anthropic, body, intakeProfiel)
  } catch (err) {
    console.error("[Agent 1] mislukt:", err)
    return NextResponse.json(
      { error: `Agent 1 (Schema Planner) mislukt: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    )
  }

  // Agent 2 — Oefening Specialist
  let schema: Trainingsdag[]
  try {
    schema = await runOefeningAgent(anthropic, body, planning, intakeProfiel)
  } catch (err) {
    console.error("[Agent 2] mislukt:", err)
    return NextResponse.json(
      { error: `Agent 2 (Oefening Specialist) mislukt: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    )
  }

  // Agent 3 — Coach Reviewer
  let finaalSchema: Trainingsdag[]
  try {
    finaalSchema = await runCoachAgent(anthropic, schema, body.disc_profiel)
  } catch (err) {
    console.error("[Agent 3] mislukt:", err)
    return NextResponse.json(
      { error: `Agent 3 (Coach Reviewer) mislukt: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    )
  }

  // Sla op in Supabase. Bewaar doel afgeleid van het intake fitness_doel
  // wanneer beschikbaar; val anders terug op de formulier-doelkeuze.
  const schemaNaam = `${body.doel.charAt(0).toUpperCase() + body.doel.slice(1)} schema — ${body.niveau} — ${body.sessies_per_week}x/week`
  const opgeslagenDoel = intakeProfiel?.fitness_doel ?? body.doel

  try {
    const supabase = createSupabaseAdmin()

    // Deactiveer alle bestaande schema's van deze gebruiker zodat maybeSingle()
    // in de training-pagina altijd precies 1 actief schema terugvindt.
    await supabase
      .from("fitness_schemas")
      .update({ actief: false })
      .eq("user_id", body.userId)
      .eq("actief", true)

    const { data, error } = await supabase
      .from("fitness_schemas")
      .insert({
        user_id: body.userId,
        company_id: bedrijfId,
        naam: schemaNaam,
        doel: opgeslagenDoel,
        niveau: body.niveau,
        sessies_per_week: body.sessies_per_week,
        schema_json: finaalSchema,
        ai_gegenereerd: true,
        actief: true,
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Database opslaan mislukt: ${error.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      schema_id: data.id,
      schema_json: finaalSchema,
      naam: schemaNaam,
    })
  } catch (err) {
    void err
    return NextResponse.json(
      { error: "Onverwachte fout bij opslaan van schema" },
      { status: 500 },
    )
  }
}
