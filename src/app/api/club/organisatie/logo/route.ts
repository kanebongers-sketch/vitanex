import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, clubToegang, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { LOGO_PAD } from '@/lib/club/kern/organisatie'
import { MAX_LOGO_BYTES, controleerLogo, heeftJuisteKop, isVeiligeSvg } from '@/lib/club/kern/organisatie-invoer'
import { LOGO_BUCKET, bewaarLogo, verwijderLogo } from '@/lib/club/kern/organisatie-opslag'

// GET    /api/club/organisatie/logo?pad=<org>/<bestand>  het logo tonen
// POST   /api/club/organisatie/logo  (multipart, veld "logo")  nieuw logo
// DELETE /api/club/organisatie/logo  logo weghalen (de naam wordt het woordmerk)
//
// Het logo komt via onze eigen server, zodat de CSP niet hoeft te veranderen.
// Een SVG krijgt een eigen strenge CSP (sandbox): ook direct geopend kan er
// niets in uitgevoerd worden. Alleen logo's van de eigen sportscholen.

const TYPE: Record<string, string> = { png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', jpg: 'image/jpeg' }

export async function GET(req: NextRequest) {
  const t = await clubToegang()
  if (!t) return clubFout('Niet gevonden.', 404)
  const pad = req.nextUrl.searchParams.get('pad') ?? ''
  const org = pad.split('/')[0]
  if (!LOGO_PAD.test(pad) || !t.organisaties.some((o) => o.id === org)) return clubFout('Niet gevonden.', 404)
  const { data, error } = await t.admin.storage.from(LOGO_BUCKET).download(pad)
  if (error || !data) return clubFout('Niet gevonden.', 404)
  const extensie = pad.slice(pad.lastIndexOf('.') + 1)
  return new NextResponse(data, {
    headers: {
      'Content-Type': TYPE[extensie] ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  })
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  // Eerst de grootte: niet een hele grote body in het geheugen lezen.
  const lengte = Number(req.headers.get('content-length') ?? NaN)
  if (!Number.isFinite(lengte) || lengte > MAX_LOGO_BYTES + 64 * 1024) return clubFout('Het logo mag maximaal 1 MB zijn.', 413)
  const form = await req.formData().catch(() => null)
  const bestand = form?.get('logo')
  if (!(bestand instanceof File)) return clubFout('Kies een logo.', 400)
  const controle = controleerLogo(bestand.type, bestand.size)
  if (!controle.ok) return clubFout(controle.fout, 400)
  const bytes = await bestand.arrayBuffer()
  if (!heeftJuisteKop(new Uint8Array(bytes), controle.waarde)) return clubFout('Dit bestand is geen echte afbeelding van dit type.', 400)
  if (controle.waarde === 'svg' && !isVeiligeSvg(new TextDecoder().decode(bytes))) {
    return clubFout('Deze SVG bevat scripts of verwijzingen naar buiten. Exporteer hem opnieuw of kies een PNG.', 400)
  }
  const pad = await bewaarLogo(t, bytes, bestand.type, controle.waarde)
  if (!pad) return clubFout('Het logo kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  await logActie(t, 'Logo vervangen', t.organisatie.naam, null)
  return clubJson({ pad })
}

export async function DELETE(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!(await verwijderLogo(t))) return clubFout('Het logo kon niet worden weggehaald.', 500)
  await logActie(t, 'Logo weggehaald', t.organisatie.naam, null)
  return clubJson({ ok: true })
}
