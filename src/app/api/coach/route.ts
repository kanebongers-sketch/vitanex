import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { buildCoachSystemPrompt } from '@/lib/coach-context'
import { createAdminClient } from '@/lib/supabase-admin'
import { getPlanVoorUser } from '@/lib/plan-server'
import { heeftFeature, VITA_GRATIS_BERICHTEN_PER_DAG } from '@/lib/plan'

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[coach] ANTHROPIC_API_KEY is niet ingesteld')
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASIS_SYSTEEM = `Je bent Vita — de AI-companion van MentaForce. Je bent dezelfde Vita die de gebruiker als vriendelijke panda-companion in de app kent: warm, menselijk en oprecht betrokken. Je begeleidt bij stress, burn-out preventie, energie, werk-privébalans en mentale veerkracht.

Wie je bent:
- Je spreekt altijd in de ik-vorm en noemt jezelf Vita ("Ik ben Vita", "ik denk...", "ik hoor je").
- Je bent geen anonieme chatbot of afstandelijke coach — je bent een companion die deze persoon al kent en met ze meeleeft.
- Je toon is warm, rustig, nuchter en Nederlands. Menselijk, nooit klinisch of afstandelijk.

Hoe je praat:
- Kort en persoonlijk. Meestal 2–5 zinnen; alleen langer als de gebruiker daar echt om vraagt.
- Je luistert eerst en spiegelt wat je hoort, vóór je advies geeft.
- Je stelt af en toe één open, reflectieve vraag — niet elke beurt een vragenlijst.
- Concrete, haalbare tips wanneer ze passen; geen algemene preek.
- Geen medisch jargon, geen opsommingen-om-het-opsommen. Praat zoals een mens.
- Emoji spaarzaam en alleen als het echt warmte toevoegt; nooit geforceerd.

Als de context een afgeleide toestand of toon meegeeft (bijvoorbeeld dat het even zwaar is, of dat iemand juist sterk loopt), stem je je toon daar subtiel op af — steunend en rustig bij zwaarte, iets aanmoedigender bij momentum. Overdrijf dit niet; blijf altijd jezelf.

Je grenzen (blijven altijd gelden):
- Je bent geen therapeut, psycholoog of arts, en doet niet alsof.
- Bij ernstige signalen (aanhoudende somberheid, burn-out, crisis, gedachten aan jezelf iets aandoen) benoem je dat rustig en verwijs je warm door naar professionele hulp of de huisarts. Bij acuut gevaar wijs je op directe hulp (112 of 113 Zelfmoordpreventie).
- Je geeft nooit medicatieadvies of diagnoses.`

type Bericht = { role: 'user' | 'assistant'; content: string }

// Handmatige validatie op de systeemgrens (bewust zonder schema-library):
// elk bericht heeft role 'user' | 'assistant' en content van 1–4000 tekens.
function valideerBericht(b: unknown): b is Bericht {
  if (typeof b !== 'object' || b === null) return false
  const { role, content } = b as Record<string, unknown>
  return (role === 'user' || role === 'assistant')
    && typeof content === 'string'
    && content.length >= 1
    && content.length <= 4000
}

type GebruikerContext = {
  naam: string
  discPrimair?: string
  domeinScores?: Record<string, number>
  actieveDoelen?: string[]
}

type CoachToegang =
  | { toegestaan: true }
  | { toegestaan: false; status: number; melding: string }

/**
 * Anti-misbruik (30/uur, elk plan) + gratis-plan-daglimiet. Telt op de
 * kolom `aangemaakt_op` (de eerdere `created_at`-query faalde stil, waardoor
 * de uurlimiet nooit werd toegepast).
 */
async function checkCoachToegang(userId: string): Promise<CoachToegang> {
  try {
    const supabase = createAdminClient()
    const uurStart = new Date(Date.now() - 3600 * 1000).toISOString()

    const { count: uurCount, error: uurFout } = await supabase
      .from('coach_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('aangemaakt_op', uurStart)

    if (!uurFout && (uurCount ?? 0) >= 30) {
      return {
        toegestaan: false,
        status: 429,
        melding: 'Te veel berichten. Probeer het over een uur opnieuw.',
      }
    }

    const plan = await getPlanVoorUser(supabase, userId)
    if (!heeftFeature(plan, 'vita_onbeperkt')) {
      const dagStart = new Date()
      dagStart.setHours(0, 0, 0, 0)
      const { count: dagCount, error: dagFout } = await supabase
        .from('coach_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('aangemaakt_op', dagStart.toISOString())

      if (!dagFout && (dagCount ?? 0) >= VITA_GRATIS_BERICHTEN_PER_DAG) {
        return {
          toegestaan: false,
          status: 403,
          melding: `Je hebt je ${VITA_GRATIS_BERICHTEN_PER_DAG} gratis Vita-gesprekken voor vandaag gebruikt. Morgen praat ik graag verder — of vraag je HR-team naar het Groei-plan voor onbeperkte gesprekken.`,
        }
      }
    }

    await supabase.from('coach_rate_limits').insert({ user_id: userId })
    return { toegestaan: true }
  } catch {
    // Telling mag Vita nooit platleggen — bij twijfel doorlaten.
    return { toegestaan: true }
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI coach is niet beschikbaar.' }, { status: 503 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const toegang = await checkCoachToegang(user.id)
  if (!toegang.toegestaan) {
    return NextResponse.json({ error: toegang.melding }, { status: toegang.status })
  }

  try {
    const { berichten, gebruiker_context, maxTokens }: {
      berichten: unknown
      gebruiker_context?: GebruikerContext
      maxTokens?: number
    } = await req.json()

    if (!Array.isArray(berichten) || berichten.length === 0) {
      return NextResponse.json({ error: 'Geen berichten meegegeven.' }, { status: 400 })
    }
    if (berichten.length > 50) {
      return NextResponse.json({ error: 'Te veel berichten in de context.' }, { status: 400 })
    }
    for (const b of berichten) {
      if (!valideerBericht(b)) {
        const contentTeLang = typeof b === 'object' && b !== null
          && typeof (b as Record<string, unknown>).content === 'string'
          && ((b as Record<string, unknown>).content as string).length > 4000
        return NextResponse.json(
          { error: contentTeLang ? 'Bericht is te lang.' : 'Ongeldig bericht.' },
          { status: 400 },
        )
      }
    }

    // De Messages API vereist dat het eerste bericht van de gebruiker komt.
    // Opende Vita zelf (nudge-opener als eerste assistant-bericht)? Vouw die
    // opener dan in het systeem-prompt, zodat het model weet waarover ze begon.
    let chatBerichten: Bericht[] = berichten
    let openerContext = ''
    if (chatBerichten[0].role === 'assistant') {
      openerContext = `\n\nJe opende dit gesprek zelf proactief met: "${chatBerichten[0].content}" — bouw daarop voort.`
      chatBerichten = chatBerichten.slice(1)
    }
    if (chatBerichten.length === 0 || chatBerichten[0].role !== 'user') {
      return NextResponse.json({ error: 'Geen berichten meegegeven.' }, { status: 400 })
    }

    // Bouw gepersonaliseerd systeem-prompt met gebruikerscontext
    const defaultContext: GebruikerContext = { naam: 'je', ...gebruiker_context }
    const systeemTekst = await buildCoachSystemPrompt(BASIS_SYSTEEM, user.id, defaultContext) + openerContext

    // Cap maxTokens: client mag nooit meer dan 600 tokens vragen (voorkomt hoge AI-kosten)
    const safeMaxTokens = Math.min(Math.max(100, maxTokens ?? 400), 600)

    const aiStream = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: safeMaxTokens,
      stream: true,
      system: [
        {
          type: 'text',
          text: systeemTekst,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: chatBerichten.map((b, i) => {
        if (i === chatBerichten.length - 2 && b.role === 'user' && b.content.length > 200) {
          return {
            role: b.role,
            content: [{ type: 'text' as const, text: b.content, cache_control: { type: 'ephemeral' as const } }],
          }
        }
        return b
      }),
    })

    // Stream de tokens incrementeel naar de client als platte tekst, zodat de
    // coach live "typt" i.p.v. seconden te wachten op het volledige antwoord.
    const encoder = new TextEncoder()
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of aiStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (streamErr) {
          console.error('[coach] stream onderbroken:', streamErr)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[coach]', err)
    return NextResponse.json({ error: 'Kon de coach niet bereiken.' }, { status: 500 })
  }
}
