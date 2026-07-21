// ─── LifeOS — Telegram-webhook instellen (founder-gated) ────────────────────
// De webhook (`/telegram/webhook`) verwerkt binnenkomende berichten, maar Telegram
// weet pas dát hij moet pushen ná een setWebhook-call. Die call bevat het gedeelde
// secret en hoort dus NIET publiek: deze route zit achter dezelfde founder-gate
// als de rest van LifeOS, zodat alleen Kane (ingelogd) 'm kan aanroepen.
//
//   GET  → de huidige stand (getWebhookInfo): staat de webhook, hoeveel wachtrij,
//          en Telegram's laatste push-fout. Een secret-mismatch (401) zie je hier
//          meteen als `laatsteFout`.
//   POST → registreer/vernieuw de webhook met het secret uit de env.
//
// De bot-token blijft server-side (env) — hij komt nooit in de URL, de log of het
// antwoord. Zie `webhook-beheer.ts`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesWebhookStatus, zetWebhook } from '@/lib/lifeos/telegram/webhook-beheer'

// fetch naar Telegram + env-lezen: Node-runtime, nooit cachen.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NIET_INGERICHT = (ontbreekt: string) =>
  NextResponse.json(
    { fout: `Telegram is nog niet ingericht: ${ontbreekt} ontbreekt in de omgeving.` },
    { status: 503 },
  )

export async function GET(req: NextRequest): Promise<NextResponse> {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const uitkomst = await leesWebhookStatus()
  if (uitkomst.staat === 'niet_ingericht') return NIET_INGERICHT(uitkomst.ontbreekt)
  if (uitkomst.staat === 'fout') {
    return NextResponse.json({ fout: `Kon de webhook-stand niet lezen (${uitkomst.reden}).` }, { status: 502 })
  }

  const { url, wachtrij, laatsteFout } = uitkomst.status
  return NextResponse.json({
    gekoppeld: url.length > 0,
    url,
    wachtrij,
    laatsteFout,
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const uitkomst = await zetWebhook()
  if (uitkomst.staat === 'niet_ingericht') return NIET_INGERICHT(uitkomst.ontbreekt)
  if (uitkomst.staat === 'fout') {
    return NextResponse.json(
      { fout: `Telegram weigerde de registratie (${uitkomst.reden}).` },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    url: uitkomst.url,
    bericht: 'Webhook geregistreerd. Stuur je bot een bericht om het te testen.',
  })
}
