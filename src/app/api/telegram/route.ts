import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const TG_TOKEN  = process.env.TELEGRAM_BOT_TOKEN!
const TG_BASE   = `https://api.telegram.org/bot${TG_TOKEN}`
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID!
const AI_CLIENT = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Gespreksgeheugen per chat (in-memory, max 20 berichten)
const geheugen = new Map<number, { role: 'user'|'assistant'; content: string }[]>()

const SYSTEEM = `Je bent een slimme assistent voor Kane Bongers, Manager Personal Training bij Fit Factory Personal Training in Eersel.

Kane gebruikt jou via Telegram voor twee dingen:
1. Algemene vragen beantwoorden (planning, teksten schrijven, ideeën, strategie)
2. Zijn outreach agent beheren (10 bedrijven per dag benaderen voor vitaliteitstrajecten)

Over de outreach agent:
- De agent selecteert dagelijks 10 bedrijven in 15km rond Eersel
- Elke batch gaat door 3 rondes: ronde 1 (dag 1), ronde 2 (dag 3), ronde 3 (dag 5)
- Kane keurt bedrijven en emails goed via Telegram of het dashboard op mentaforce.nl/agent
- Emails gaan over vitaliteitstrajecten voor bedrijven: personal training, app, HR-dashboard

Speciale commando's die Kane kan gebruiken:
/status - campagne status opvragen
/batches - overzicht van actieve batches
/help - deze uitleg tonen

Toon, stijl en gedrag:
- Spreek Kane aan in het Nederlands, informeel (je/jij)
- Wees direct en bondig — Kane heeft het druk
- Als Kane een email, tekst of bericht wil schrijven: doe het direct zonder vragen
- Als je iets niet weet, zeg dat eerlijk`


async function tg_stuur(chat_id: number, tekst: string) {
  await fetch(`${TG_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text: tekst, parse_mode: 'HTML' }),
  })
}

async function haal_status(): Promise<string> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/agent_batches?status=eq.actief&order=aangemaakt_op.desc&limit=5`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` } }
    )
    const batches = await res.json()
    if (!batches.length) return 'Geen actieve batches.'

    let tekst = '📊 <b>Campagne status</b>\n\n'
    for (const b of batches) {
      tekst += `<b>${b.naam}</b>\nR1: ${b.start_datum} · R2: ${b.ronde_2_datum} · R3: ${b.ronde_3_datum}\n\n`
    }
    return tekst
  } catch {
    return 'Kon status niet ophalen.'
  }
}

export async function POST(req: Request) {
  try {
    // Verifieer de Telegram webhook signature
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (webhookSecret) {
      const incomingSecret = req.headers.get('x-telegram-bot-api-secret-token')
      if (incomingSecret !== webhookSecret) {
        return NextResponse.json({ ok: false }, { status: 401 })
      }
    }

    const body = await req.json()

    // ── Callback query (knop ingedrukt) ──
    const cb = body.callback_query
    if (cb) {
      await fetch(`${TG_BASE}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id }),
      })
      return NextResponse.json({ ok: true })
    }

    // ── Tekst bericht ──
    const msg = body.message
    if (!msg?.text) return NextResponse.json({ ok: true })

    const chat_id = msg.chat.id
    const tekst   = msg.text.trim()

    // Speciale commando's
    if (tekst === '/start') {
      await tg_stuur(chat_id,
        '👋 <b>Hoi Kane!</b>\n\nIk ben je AI assistent, aangedreven door Claude.\n\nStuur me gewoon een bericht — ik help je met alles:\n• Teksten schrijven\n• Vragen beantwoorden\n• Strategie bedenken\n• Je outreach campagne beheren\n\n<b>Commando\'s:</b>\n/status — campagne status\n/batches — batch overzicht\n/clear — gesprek wissen\n/help — uitleg'
      )
      return NextResponse.json({ ok: true })
    }

    if (tekst === '/status') {
      const s = await haal_status()
      await tg_stuur(chat_id, s)
      return NextResponse.json({ ok: true })
    }

    if (tekst === '/clear') {
      geheugen.delete(chat_id)
      await tg_stuur(chat_id, '🗑️ Gesprek gewist. Nieuwe start!')
      return NextResponse.json({ ok: true })
    }

    if (tekst === '/help') {
      await tg_stuur(chat_id,
        '🤖 <b>Wat kan ik voor je doen?</b>\n\n<b>Vragen:</b>\nStuur gewoon een bericht\n\n<b>Agent:</b>\n/status — campagne overzicht\n/batches — actieve batches\n\n<b>Teksten schrijven:</b>\n"Schrijf een email aan..."\n"Maak een LinkedIn post over..."\n\n<b>Overig:</b>\n/clear — gesprek wissen'
      )
      return NextResponse.json({ ok: true })
    }

    // ── Claude AI antwoord ──
    const historie = geheugen.get(chat_id) ?? []
    historie.push({ role: 'user', content: tekst })
    const context = historie.slice(-20)

    // Typing indicator
    await fetch(`${TG_BASE}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, action: 'typing' }),
    })

    let antwoord: string
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY niet ingesteld in Render')

      const response = await AI_CLIENT.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEEM,
        messages: context,
      })
      antwoord = response.content[0].type === 'text' ? response.content[0].text : '...'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[claude error]', msg)
      antwoord = `⚠️ Fout: ${msg.slice(0, 200)}`
    }

    // Sla op in geheugen
    historie.push({ role: 'assistant', content: antwoord })
    geheugen.set(chat_id, historie.slice(-20))

    await tg_stuur(chat_id, antwoord)
    return NextResponse.json({ ok: true })

  } catch (err: unknown) {
    console.error('[telegram webhook]', err)
    return NextResponse.json({ ok: false })
  }
}

// Telegram stuurt GET bij webhook verificatie
export async function GET() {
  return NextResponse.json({ ok: true, status: 'Telegram webhook actief' })
}
