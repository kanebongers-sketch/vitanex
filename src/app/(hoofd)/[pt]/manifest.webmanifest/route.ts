// GET /<naam>/manifest.webmanifest — het web-app-manifest van één PT'er (zie
// `pt-dashboard/manifest.ts`). Openbaar zoals de begroeting op /<naam>: alleen de
// voornaam en de start-URL, geen gegevens. Onbekende of inactieve code → 404.

import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { vindLink } from '@/lib/lifeos/leads/links'
import { ptManifest } from '@/lib/lifeos/pt-dashboard/manifest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Ctx {
  params: Promise<{ pt: string }>
}

export async function GET(_req: Request, ctx: Ctx) {
  const { pt } = await ctx.params
  const link = await vindLink(createLifeosAdminClient(), pt)
  if (!link) return new Response('Niet gevonden', { status: 404 })
  return new Response(JSON.stringify(ptManifest(link.code, link.naam)), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex',
    },
  })
}
