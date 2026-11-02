import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { clubFout, clubJson, vereisPlatformEigenaar } from '@/lib/club/toegang'
import { huidigPlatformAccount } from '@/lib/club/platform-login/huidig'
import { isRateLimited } from '@/lib/utils/rate-limit'

// POST /api/club/platform/testmail  { soort: 'club' | 'ayg' }
// Een proefmail naar het master account zelf, om te zien of mailen werkt
// (Systeem, koppelingen). 'club' = de meldingen aan leden (CLUB_RESEND_API_KEY,
// CLUB_RESEND_FROM), 'ayg' = welkom, uitnodigingen en codes (RESEND_API_KEY,
// AIYOURGYM_RESEND_FROM). De schakelaar CLUB_MAILS_ACTIEF telt hier bewust niet:
// zo test je de sleutel voordat je de mails voor leden aanzet. Alleen naar het
// eigen adres, hooguit 5 per 10 minuten. De fout van Resend komt terug als naam
// (zoals validation_error), nooit met de sleutel.

const SOORTEN = {
  club: { sleutel: 'CLUB_RESEND_API_KEY', van: 'CLUB_RESEND_FROM' },
  ayg: { sleutel: 'RESEND_API_KEY', van: 'AIYOURGYM_RESEND_FROM' },
} as const

export async function POST(req: NextRequest) {
  const t = await vereisPlatformEigenaar(req)
  if (t instanceof NextResponse) return t
  const body: unknown = await req.json().catch(() => null)
  const soort = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).soort : null
  if (soort !== 'club' && soort !== 'ayg') return clubFout('Onbekende soort mail.', 400)
  const account = await huidigPlatformAccount()
  if (!account) return clubFout('Niet gevonden.', 404)
  if (isRateLimited(`testmail:${account.id}`, 5, 10 * 60_000)) return clubJson({ ok: false, fout: 'te_vaak' }, 429)
  const sleutel = process.env[SOORTEN[soort].sleutel]?.trim() ?? ''
  const van = process.env[SOORTEN[soort].van]?.trim() ?? ''
  if (!sleutel || !van) return clubJson({ ok: false, fout: 'niet_ingesteld' }, 400)
  try {
    const { error } = await new Resend(sleutel).emails.send({
      from: van,
      to: account.email,
      subject: soort === 'club' ? 'Proefmail: meldingen van Club' : 'Proefmail: AI Your Gym',
      text: `Deze proefmail komt van de Systeem-pagina in Club (${soort === 'club' ? 'meldingen aan leden' : 'welkom, uitnodigingen en codes'}). Mailen werkt.`,
    })
    if (error) return clubJson({ ok: false, fout: 'resend', naam: String(error.name ?? 'onbekend').slice(0, 60) }, 502)
    return clubJson({ ok: true, aan: account.email })
  } catch (err) {
    return clubJson({ ok: false, fout: 'resend', naam: err instanceof Error ? err.name.slice(0, 60) : 'onbekend' }, 502)
  }
}
