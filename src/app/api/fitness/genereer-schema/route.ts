import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Doel = "spiermassa" | "afvallen" | "conditie" | "flexibiliteit" | "kracht"
type Niveau = "beginner" | "gemiddeld" | "gevorderd"
type DiscProfiel = "D" | "I" | "S" | "C"

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
  sets: number
  herhalingen: string
  rusttijd_sec: number
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
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw new Error("Supabase omgevingsvariabelen ontbreken")
  }
  return createClient(url, key)
}

function extractJson<T>(text: string): T {
  const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  const raw = match ? (match[1] ?? match[0]) : text
  return JSON.parse(raw.trim()) as T
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
): Promise<PlannerOutput> {
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
    model: "claude-haiku-4-5",
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
): Promise<Trainingsdag[]> {
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
        "naam": "Oefening naam",
        "sets": 3,
        "herhalingen": "8-12",
        "rusttijd_sec": 90,
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
- Laat coaching_tekst leeg (wordt later ingevuld)`,
    },
  ]

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return extractJson<Trainingsdag[]>(text)
}

// ---------------------------------------------------------------------------
// Agent 3 — Coach Reviewer (claude-haiku-4-5)
// ---------------------------------------------------------------------------

async function runCoachAgent(
  anthropic: Anthropic,
  schema: Trainingsdag[],
  disc_profiel?: DiscProfiel,
): Promise<Trainingsdag[]> {
  const discInstructie = buildDiscInstructie(disc_profiel)

  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: `Je bent een persoonlijke coach. Voeg motiverende coaching_tekst toe aan elk trainingsdag.

DISC communicatiestijl instructie: ${discInstructie}

Trainingsschema:
${JSON.stringify(schema, null, 2)}

Voeg voor elke training een coaching_tekst toe (2-3 zinnen) die:
- Motiveert voor deze specifieke training
- Past bij de genoemde DISC stijl
- Beschrijft het doel van deze sessie

Geef het VOLLEDIGE schema terug met ingevulde coaching_tekst per training als JSON:
\`\`\`json
[
  { ... volledig training object met coaching_tekst ingevuld ... }
]
\`\`\``,
    },
  ]

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return extractJson<Trainingsdag[]>(text)
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const missingEnv: string[] = []
  if (!process.env.ANTHROPIC_API_KEY) missingEnv.push("ANTHROPIC_API_KEY")
  if (!process.env.SUPABASE_URL) missingEnv.push("SUPABASE_URL")
  if (!process.env.SUPABASE_SERVICE_KEY) missingEnv.push("SUPABASE_SERVICE_KEY")

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

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Agent 1 — Schema Planner
  let planning: PlannerOutput
  try {
    planning = await runPlannerAgent(anthropic, body)
  } catch (err) {
    void err
    return NextResponse.json(
      { error: "Agent 1 (Schema Planner) mislukt. Probeer opnieuw." },
      { status: 500 },
    )
  }

  // Agent 2 — Oefening Specialist
  let schema: Trainingsdag[]
  try {
    schema = await runOefeningAgent(anthropic, body, planning)
  } catch (err) {
    void err
    return NextResponse.json(
      { error: "Agent 2 (Oefening Specialist) mislukt. Probeer opnieuw." },
      { status: 500 },
    )
  }

  // Agent 3 — Coach Reviewer
  let finaalSchema: Trainingsdag[]
  try {
    finaalSchema = await runCoachAgent(anthropic, schema, body.disc_profiel)
  } catch (err) {
    void err
    return NextResponse.json(
      { error: "Agent 3 (Coach Reviewer) mislukt. Probeer opnieuw." },
      { status: 500 },
    )
  }

  // Sla op in Supabase
  const schemaNaam = `${body.doel.charAt(0).toUpperCase() + body.doel.slice(1)} schema — ${body.niveau} — ${body.sessies_per_week}x/week`

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from("fitness_schemas")
      .insert({
        user_id: body.userId,
        naam: schemaNaam,
        doel: body.doel,
        niveau: body.niveau,
        sessies_per_week: body.sessies_per_week,
        schema_json: finaalSchema,
        ai_gegenereerd: true,
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
