import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { connection } from 'next/server'
import { EMBLEEM_LETTER_PAD, EMBLEEM_RASTER_PAD, EMBLEEM_Y_PAD, IRON_KLEUR, LOGO_BREEDTE, LOGO_HOOGTE, WOORD_PAD, WOORD_TRANSFORM } from '@/components/aiyourgym/merk/merk-paden'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { siteTekst } from '@/lib/aiyourgym/taal/server'
import { SCHERM } from '@/lib/aiyourgym/taal/woorden/website/scherm'

// De deelafbeelding van de website (Open Graph en X, 1200 x 630). Obsidian iron
// (besluit Kane 29-10-2026, geen groen meer): obsidiaan vlak, het logo met het iron
// embleem (metalen glans, obsidiaan tekens), de kop in gebroken wit, en rechts groot
// en afgesneden het embleem in een hogere laag obsidiaan (toon op toon). Iron als
// klein accent onderaan. Met de schakelaar uit een 404: dan mag
// niets over AI Your Gym uitlekken.
// Letters: Bricolage Grotesque en Geist (beide SIL OFL 1.1), zie merk/letters/.
// Het logo is vector (de paden uit merk-paden.ts) en wordt pas bij het maken van de
// PNG getekend; plaat, kruis en vak Y met crispEdges, dus zonder zachte naden.
// De tekst volgt de taalcookie (SCHERM; zonder cookie, zoals bij de meeste
// deeldiensten, Nederlands). De alt-tekst is een vaste waarde voor beide talen,
// daarom alleen de merknaam.

export const alt = 'AI Your Gym'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LETTERS = path.join(process.cwd(), 'src/components/aiyourgym/merk/letters')
const I = IRON_KLEUR
/** De lagen van de website (aiyourgym.css): basis, een hogere laag, lijn, tekst. */
const OBSIDIAAN = { basis: '#0E0F11', hoog: '#1C1F23', lijn: '#2A2E33', wit: '#ECEBE7' } as const

/**
 * Het embleem als losse delen, voor in een svg (viewBox 0 0 100 100). Een gewone
 * functie die elementen teruggeeft, geen component: in een svg accepteert de
 * tekenaar van next/og alleen echte svg-elementen.
 */
function embleemDelen(plaat: string, teken: string) {
  return [
    <defs key="glans">
      <linearGradient id="glans" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0" stopColor={I.licht} />
        <stop offset="0.55" stopColor={I.iron} />
        <stop offset="1" stopColor={I.diep} />
      </linearGradient>
    </defs>,
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
  const [kop, tekst, t] = await Promise.all([readFile(path.join(LETTERS, 'bricolage-og.ttf')), readFile(path.join(LETTERS, 'geist-og.ttf')), siteTekst(SCHERM)])
  const logoHoogte = 64

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: OBSIDIAAN.basis, color: OBSIDIAAN.wit, fontFamily: 'Geist' }}>
        <div style={{ position: 'absolute', right: -150, top: 120, display: 'flex' }}>
          <Embleem plaat={OBSIDIAAN.hoog} teken={OBSIDIAAN.basis} maat={620} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', width: '100%' }}>
          <svg width={(LOGO_BREEDTE / LOGO_HOOGTE) * logoHoogte} height={logoHoogte} viewBox={`0 0 ${LOGO_BREEDTE} ${LOGO_HOOGTE}`}>
            {embleemDelen('url(#glans)', I.obsidiaan)}
            <path d={WOORD_PAD} transform={WOORD_TRANSFORM} fill={OBSIDIAAN.wit} />
          </svg>
          <div style={{ display: 'flex', fontFamily: 'Bricolage', fontSize: 84, lineHeight: 1.02, letterSpacing: -2.8, maxWidth: 760 }}>
            {t.deelKop}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 24, color: I.iron }}>
            <div style={{ width: 40, height: 2, background: I.iron }} />
            aiyourgym.com
            <div style={{ width: 1, height: 22, background: OBSIDIAAN.lijn }} />
            {t.deelEu}
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
