import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Niet beschikbaar.' }, { status: 404 })
  }

  return NextResponse.json({
    has_tg_token:  !!process.env.TELEGRAM_BOT_TOKEN,
    has_tg_chat:   !!process.env.TELEGRAM_CHAT_ID,
    has_anthropic: !!process.env.ANTHROPIC_API_KEY,
  })
}
