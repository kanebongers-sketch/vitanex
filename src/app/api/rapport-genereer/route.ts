import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createAdminClient } from "@/lib/supabase-admin"
import { getAuthenticatedUser } from "@/lib/api-auth"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI niet beschikbaar" }, { status: 503 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })

  try {
    const body = await req.json() as { type: string; context: string; titel: string; bedrijf_id?: string }
    const { type, context, titel, bedrijf_id } = body

    if (!type || !context || !titel) {
      return NextResponse.json({ error: "type, context en titel zijn verplicht" }, { status: 400 })
    }

    const prompt = `Je bent welzijnscoach bij MentaForce. Schrijf een professioneel rapport in het Nederlands op basis van de volgende context:

Type rapport: ${type}
Context: ${context}

Schrijf een warm, persoonlijk en constructief rapport van 250-400 woorden. Gebruik een directe toon (je/jij).`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    })

    const inhoud = response.content[0].type === "text" ? response.content[0].text : ""

    const admin = createAdminClient()
    await admin.from("ai_rapporten").insert({
      user_id: user.id,
      bedrijf_id: bedrijf_id ?? null,
      type,
      titel,
      inhoud,
      metadata: { context },
    })

    return NextResponse.json({ ok: true, inhoud })
  } catch (err) {
    void err
    return NextResponse.json({ error: "Rapport genereren mislukt" }, { status: 500 })
  }
}
