// POST /api/club/lid/voeding/ai/foto  (FormData: foto)  een foto van een maaltijd naar een voorstel
// Betaalde AI: alleen met CLUB_VOEDING_AI_ACTIEF=1 en ANTHROPIC_API_KEY, anders 404; alleen
// na toestemming van het lid (403). De browser verkleint de foto eerst (langste zijde 1024 px).
// De foto wordt niet bewaard en niet gelogd; het lid controleert en bevestigt het voorstel zelf.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { alsAiAntwoord, vereisLidAi } from '@/lib/club/voeding/dagboek/ai/route-hulp'
import { analyseerFoto, isFotoType } from '@/lib/club/voeding/dagboek/ai/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Verkleind is een foto zo'n 100 tot 300 kB; dit is een ruime grens. */
const MAX_BYTES = 3 * 1024 * 1024

export async function POST(req: NextRequest) {
  const l = await vereisLidAi(req, 'foto')
  if (l instanceof NextResponse) return l
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES + 10_000) return clubFout('De foto is te groot.', 413)
  const form = await req.formData().catch(() => null)
  const foto = form?.get('foto')
  if (!(foto instanceof File) || foto.size === 0) return clubFout('Geen foto gevonden.', 400)
  if (foto.size > MAX_BYTES) return clubFout('De foto is te groot.', 413)
  if (!isFotoType(foto.type)) return clubFout('Kies een foto (jpg, png of webp).', 400)
  return alsAiAntwoord(await analyseerFoto(await foto.arrayBuffer(), foto.type, await getTaal()))
}
