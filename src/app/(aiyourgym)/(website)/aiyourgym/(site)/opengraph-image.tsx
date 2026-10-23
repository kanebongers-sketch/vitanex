import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { connection } from 'next/server'
import { EMBLEEM_TEKEN_PAD, EMBLEEM_Y_PAD, LOGO_BREEDTE, LOGO_HOOGTE, MERK_KLEUR, WOORD_PAD, WOORD_TRANSFORM } from '@/components/aiyourgym/merk/merk-paden'
import { siteActief } from '@/lib/aiyourgym/schakelaar'

// De deelafbeelding van de website (Open Graph en X, 1200 x 630). Racegroen vlak,
// het logo met het creme embleem, de kop, en rechts groot en afgesneden het
// embleem in flessengroen (toon op toon). Met de schakelaar uit een 404: dan mag
// niets over AI Your Gym uitlekken.
// Letters: Bricolage Grotesque en Geist (beide SIL OFL 1.1), zie merk/letters/.

export const alt = 'AI Your Gym: alles voor je sportschool, in een systeem.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LETTERS = path.join(process.cwd(), 'src/components/aiyourgym/merk/letters')
const K = MERK_KLEUR

function Embleem({ plaat, teken, maat }: { plaat: string; teken: string; maat: number }) {
  return (
    <svg width={maat} height={maat} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={plaat} />
      <path d={EMBLEEM_TEKEN_PAD} fill={teken} />
      <path d={EMBLEEM_Y_PAD} fill={plaat} />
    </svg>
  )
}

export default async function Afbeelding() {
  await connection()
  if (!siteActief()) return new Response('Niet gevonden', { status: 404 })
  const [kop, tekst] = await Promise.all([readFile(path.join(LETTERS, 'bricolage-og.ttf')), readFile(path.join(LETTERS, 'geist-og.ttf'))])
  const logoHoogte = 64

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: K.racegroen, color: K.creme, fontFamily: 'Geist' }}>
        <div style={{ position: 'absolute', right: -150, top: 120, display: 'flex' }}>
          <Embleem plaat={K.flessengroen} teken={K.racegroen} maat={620} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', width: '100%' }}>
          <svg width={(LOGO_BREEDTE / LOGO_HOOGTE) * logoHoogte} height={logoHoogte} viewBox={`0 0 ${LOGO_BREEDTE} ${LOGO_HOOGTE}`}>
            <rect width="100" height="100" fill={K.creme} />
            <path d={EMBLEEM_TEKEN_PAD} fill={K.racegroen} />
            <path d={EMBLEEM_Y_PAD} fill={K.creme} />
            <path d={WOORD_PAD} transform={WOORD_TRANSFORM} fill={K.creme} />
          </svg>
          <div style={{ display: 'flex', fontFamily: 'Bricolage', fontSize: 84, lineHeight: 1.02, letterSpacing: -2.8, maxWidth: 760 }}>
            Alles voor je sportschool, in een systeem.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 24, color: K.salie }}>
            <div style={{ width: 40, height: 2, background: K.salie }} />
            aiyourgym.com
            <div style={{ width: 1, height: 22, background: K.flessengroen }} />
            Database binnen de EU
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Bricolage', data: kop, weight: 700, style: 'normal' },
        { name: 'Geist', data: tekst, weight: 400, style: 'normal' },
      ],
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    },
  )
}
