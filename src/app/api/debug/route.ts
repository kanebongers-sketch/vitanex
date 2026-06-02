import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    has_tg_token:    !!process.env.TELEGRAM_BOT_TOKEN,
    has_tg_chat:     !!process.env.TELEGRAM_CHAT_ID,
    has_anthropic:   !!process.env.ANTHROPIC_API_KEY,
    tg_token_prefix: process.env.TELEGRAM_BOT_TOKEN?.slice(0, 10) ?? 'NIET INGESTELD',
    node_env:        process.env.NODE_ENV,
  })
}
