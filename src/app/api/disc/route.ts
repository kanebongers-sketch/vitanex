import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createAdminClient } from "@/lib/supabase/supabase-admin"
import { getAuthenticatedUser } from "@/lib/auth/api-auth"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI niet beschikbaar" }, { status: 503 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })

  try {
    const body = await req.json() as {
      d_score: number; i_score: number; s_score: number; c_score: number
      primair_profiel: string; antwoorden: Record<string, number>; bedrijf_id?: string
    }
    const { d_score, i_score, s_score, c_score, primair_profiel, antwoorden, bedrijf_id } = body

    const admin = createAdminClient()

    await admin.from("disc_inzendingen").insert({
      user_id: user.id,
      bedrijf_id: bedrijf_id ?? null,
      d_score, i_score, s_score, c_score,
      primair_profiel,
      antwoorden,
    })

    const prompt = `Je bent welzijnscoach. DISC-profiel: ${primair_profiel}, Scores D=${d_score}/30 I=${i_score}/30 S=${s_score}/30 C=${c_score}/30. Schrijf een persoonlijk rapport van 300 woorden: wat zegt dit over de persoon, sterke punten, ontwikkelpunten, samenwerkingstips. Warm en positief Nederlands.`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    })

    const inhoud = response.content[0].type === "text" ? response.content[0].text : ""

    await admin.from("ai_rapporten").insert({
      user_id: user.id,
      bedrijf_id: bedrijf_id ?? null,
      type: "disc",
      titel: "DISC Profiel Rapport",
      inhoud,
      metadata: { primair_profiel, d_score, i_score, s_score, c_score },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    void err
    return NextResponse.json({ error: "Verwerking mislukt" }, { status: 500 })
  }
}
