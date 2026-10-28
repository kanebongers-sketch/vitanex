import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { connection } from 'next/server'
import { EMBLEEM_LETTER_PAD, EMBLEEM_RASTER_PAD, EMBLEEM_Y_PAD, LOGO_BREEDTE, LOGO_HOOGTE, MERK_KLEUR, WOORD_PAD, WOORD_TRANSFORM } from '@/components/aiyourgym/merk/merk-paden'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { siteTekst } from '@/lib/aiyourgym/taal/server'
import { SCHERM } from '@/lib/aiyourgym/taal/woorden/website/scherm'

// De deelafbeelding van de website (Open Graph en X, 1200 x 630), Obsidian Luxury
// (28-10-2026): obsidiaan vlak met een zacht champagne licht, het logo met het
// champagne embleem, de kop in de serif, en rechts groot en afgesneden het embleem
// in antraciet (toon op toon). Met de schakelaar uit een 404: dan mag niets over AI
// Your Gym uitlekken.
// Letters: Instrument Serif en Geist (beide SIL OFL 1.1), zie merk/letters/.
// Het logo is vector (de paden uit merk-paden.ts) en wordt pas bij het maken van de
// PNG getekend; plaat, kruis en vak Y met crispEdges, dus zonder zachte naden.
// De tekst volgt de taalcookie (SCHERM; zonder cookie, zoals bij de meeste
// deeldiensten, Nederlands). De alt-tekst is een vaste waarde voor beide talen,
// daarom alleen de merknaam.

export const alt = 'AI Your Gym'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LETTERS = path.join(process.cwd(), 'src/components/aiyourgym/merk/letters')
const K = MERK_KLEUR

/**
 * Het embleem als losse delen, voor in een svg (viewBox 0 0 100 100). Een gewone
 * functie die elementen teruggeeft, geen component: in een svg accepteert de
 * tekenaar van next/og alleen echte svg-elementen.
 */
function embleemDelen(plaat: string, teken: string) {
  return [
    <rect key="plaat" width="100" height="100" fill={plaat} shapeRendering="crispEdges" />,
    <path key="raster" d={EMBLEEM_RASTER_PAD} fill={teken} shapeRendering="crispEdges" />,
    <path key="letters" d={EMBLEEM_LETTER_PAD} fill={teken} />,
    <path key="y" d={EMBLEEM_Y_PAD} fill={plaat} />,
  ]
}

function Embleem({ plaat, teken, maat }: { plaat: string; teken: string; maat: number }) {
  return (
    <svg width={maat} height={maat} viewBox="0 0 100 100">
      {embleemDelen(plaat, teken)}
    </svg>
  )
}

export default async function Afbeelding() {
  await connection()
  if (!siteActief()) return new Response(null, { status: 404 })
  const [kop, tekst, t] = await Promise.all([readFile(path.join(LETTERS, 'instrument-serif-og.ttf')), readFile(path.join(LETTERS, 'geist-og.ttf')), siteTekst(SCHERM)])
  const logoHoogte = 64

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: K.obsidiaan, backgroundImage: 'radial-gradient(circle at 85% 10%, rgba(212, 191, 150, 0.22), transparent 55%)', color: K.ivoor, fontFamily: 'Geist' }}>
        <div style={{ position: 'absolute', right: -150, top: 120, display: 'flex' }}>
          <Embleem plaat={K.antraciet} teken={K.obsidiaan} maat={620} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', width: '100%' }}>
          <svg width={(LOGO_BREEDTE / LOGO_HOOGTE) * logoHoogte} height={logoHoogte} viewBox={`0 0 ${LOGO_BREEDTE} ${LOGO_HOOGTE}`}>
            {embleemDelen(K.champagne, K.obsidiaan)}
            <path d={WOORD_PAD} transform={WOORD_TRANSFORM} fill={K.ivoor} />
          </svg>
          <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontSize: 96, lineHeight: 1, letterSpacing: -1.5, maxWidth: 780 }}>
            {t.deelKop}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 24, color: K.champagne }}>
            <div style={{ width: 40, height: 1, background: K.champagne }} />
            aiyourgym.com
            <div style={{ width: 1, height: 22, background: K.antraciet }} />
            {t.deelEu}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Instrument Serif', data: kop, weight: 400, style: 'normal' },
        { name: 'Geist', data: tekst, weight: 400, style: 'normal' },
      ],
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    },
  )
}
