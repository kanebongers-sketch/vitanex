import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { connection } from 'next/server'
import { FIGUUR_PAD, LOGO_BREEDTE, LOGO_HOOGTE, MERK_KLEUR, TEGEL_PAD, WOORD_PAD, WOORD_TRANSFORM } from '@/components/aiyourgym/merk/merk-paden'
import { siteActief } from '@/lib/aiyourgym/schakelaar'

// De deelafbeelding van de website (Open Graph, 1200 x 630). Inkt met het logo,
// een eerlijke kop en rechts de figuur uit het beeldmerk, groot en afgesneden.
// Met de schakelaar uit een 404: dan mag niets over AI Your Gym uitlekken.
// Letters: Bricolage Grotesque en Geist (beide SIL OFL 1.1), zie merk/letters/.

export const alt = 'AI Your Gym: clubsoftware voor sportscholen'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LETTERS = path.join(process.cwd(), 'src/components/aiyourgym/merk/letters')
// Satori kent geen css-variabelen: de waarden van --ayg-inkt-tekst-2 en --ayg-inkt-lijn.
const TEKST_2 = '#b8beb7'
const LIJN = '#2b322e'
// Zachte smaragdgloed achter de figuur (#1fa77a op 20%).
const GLOED = 'radial-gradient(circle at 83% 58%, rgba(31, 167, 122, 0.2), rgba(31, 167, 122, 0) 48%)'

export default async function Afbeelding() {
  await connection()
  if (!siteActief()) return new Response('Niet gevonden', { status: 404 })
  const [kop, tekst] = await Promise.all([readFile(path.join(LETTERS, 'bricolage-og.ttf')), readFile(path.join(LETTERS, 'geist-og.ttf'))])

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: MERK_KLEUR.inkt, backgroundImage: GLOED, color: MERK_KLEUR.kalk, fontFamily: 'Geist' }}>
        <svg width="820" height="820" viewBox="0 0 32 32" style={{ position: 'absolute', right: -170, top: 40 }}>
          <path d={FIGUUR_PAD} fill={MERK_KLEUR.smaragd} />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', width: '100%' }}>
          <svg width={(LOGO_BREEDTE / LOGO_HOOGTE) * 58} height="58" viewBox={`0 0 ${LOGO_BREEDTE} ${LOGO_HOOGTE}`}>
            <path d={TEGEL_PAD} fill={MERK_KLEUR.smaragd} />
            <path d={FIGUUR_PAD} fill={MERK_KLEUR.inkt} />
            <path d={WOORD_PAD} transform={WOORD_TRANSFORM} fill={MERK_KLEUR.kalk} />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 700 }}>
            <div style={{ fontFamily: 'Bricolage', fontSize: 78, lineHeight: 1.0, letterSpacing: -2.6 }}>Clubsoftware voor sportscholen.</div>
            <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.4, color: TEKST_2 }}>
              Leden, check-in, lessen, rooster, schema’s en een ledenapp in je eigen huisstijl.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 24, color: TEKST_2 }}>
            <div style={{ width: 40, height: 2, background: MERK_KLEUR.smaragd }} />
            aiyourgym.com
            <div style={{ width: 1, height: 22, background: LIJN }} />
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
