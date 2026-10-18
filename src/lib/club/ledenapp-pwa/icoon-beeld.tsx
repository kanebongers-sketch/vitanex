// ─── Club ledenapp: het beeld van het app-icoon (voor ImageResponse) ────────
// Alleen flexbox en inline stijlen: ImageResponse (Satori) kent geen CSS-
// variabelen of klassen. Twee vormen:
//   letter: de eerste letter van de naam, groot en zwaar, op het accent;
//   logo:   het logo van de sportschool op de achtergrond van het thema (daar is
//           het logo voor gemaakt: zo staat het ook bovenin Club), met een
//           dunne streep in het accent als merkteken.
// Maskable: alles binnen de veilige cirkel (80 procent), want Android knipt
// het icoon in een cirkel, druppel of afgeronde vorm.

import type { ReactElement } from 'react'
import type { MerkKleuren } from './manifest'

export interface IcoonBeeldProps {
  px: number
  maskable: boolean
  letter: string
  kleuren: MerkKleuren
  logoDataUrl: string | null
}

export function icoonBeeld({ px, maskable, letter, kleuren, logoDataUrl }: IcoonBeeldProps): ReactElement {
  const vlak = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  }

  if (logoDataUrl) {
    const maat = Math.round(px * (maskable ? 0.52 : 0.66))
    return (
      <div style={{ ...vlak, background: kleuren.achtergrond }}>
        <img src={logoDataUrl} width={maat} height={maat} alt="" style={{ objectFit: 'contain' }} />
        <div
          style={{
            position: 'absolute',
            bottom: Math.round(px * (maskable ? 0.2 : 0.12)),
            width: Math.round(px * 0.16),
            height: Math.max(2, Math.round(px * 0.022)),
            borderRadius: px,
            background: kleuren.accent,
          }}
        />
      </div>
    )
  }

  // Geist Regular is het enige lettertype in next/og; de omlijning in dezelfde
  // kleur maakt de letter zwaar, zoals de kapitale koppen in Club.
  const grootte = Math.round(px * (maskable ? 0.42 : 0.56))
  return (
    <div
      style={{
        ...vlak,
        backgroundColor: kleuren.accent,
        // Zacht licht van linksboven en een iets diepere rand: diepte zonder glans.
        backgroundImage: 'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.22), rgba(255,255,255,0) 58%), radial-gradient(circle at 80% 100%, rgba(0,0,0,0.16), rgba(0,0,0,0) 60%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: grootte,
          lineHeight: 1,
          color: kleuren.inkt,
          letterSpacing: '-0.02em',
          WebkitTextStroke: `${Math.max(1, Math.round(px * 0.02))}px ${kleuren.inkt}`,
          // Optisch midden: kapitalen zitten iets boven het midden van het lijnvlak.
          marginTop: Math.round(grootte * 0.06),
        }}
      >
        {letter}
      </div>
    </div>
  )
}
