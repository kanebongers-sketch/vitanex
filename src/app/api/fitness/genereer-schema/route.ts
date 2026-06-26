import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 300
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import { getAuthenticatedUser } from "@/lib/api-auth"

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
- naam_en: geef de standaard Engelse naam zoals gebruikt in fitness apps (bijv. "push-up", "barbell squat", "dumbbell curl")`,
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

  // Agent 1 — Schema Planner
  let planning: PlannerOutput
  try {
    planning = await runPlannerAgent(anthropic, body)
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
    schema = await runOefeningAgent(anthropic, body, planning)
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

  // Sla op in Supabase
  const schemaNaam = `${body.doel.charAt(0).toUpperCase() + body.doel.slice(1)} schema — ${body.niveau} — ${body.sessies_per_week}x/week`

  try {
    const supabase = createSupabaseAdmin()
    // Haal company_id op uit profiles (nullable voor zelfstandigen)
    const { data: profiel } = await supabase
      .from("profiles")
      .select("bedrijf_id")
      .eq("id", body.userId)
      .maybeSingle()

    const { data, error } = await supabase
      .from("fitness_schemas")
      .insert({
        user_id: body.userId,
        company_id: profiel?.bedrijf_id ?? null,
        naam: schemaNaam,
        doel: body.doel,
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
