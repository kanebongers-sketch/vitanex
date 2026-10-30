'use client'

import { useState } from 'react'
import { clubFotoUrl, initialenVanNaam, lidFotoUrl, type FotoSoort } from '@/lib/club/profielfoto/model'

// De profielfoto van het designsysteem: een rondje met vaste maat. Is er een
// foto (versie uit club_leden.profielfoto of club_medewerkers.profielfoto), dan
// laden we hem lui in de maat die past (256, of 512 voor retina en grote
// weergaven); anders, of als hij niet laadt, de initialen in de huisstijl.
// De foto komt altijd via een eigen route die de toegang controleert (in Club
// /api/club/profielfoto, in de ledenapp /api/club/lid/profielfoto).

export interface AvatarFoto {
  soort: FotoSoort
  id: string
  /** De versie; null of leeg = geen foto. */
  versie: string | null | undefined
}

interface AvatarProps {
  /** De naam: voor de initialen en (als hij niet decoratief is) de alt-tekst. */
  naam: string
  /** Initialen als ze er al zijn (bijvoorbeeld van een lid); anders uit de naam. */
  initialen?: string
  foto?: AvatarFoto | null
  /** Weergavemaat in CSS-pixels (breedte en hoogte zijn gelijk). */
  maat?: number
  /** Club (medewerkers) of de ledenapp (met ledensessie). */
  waar?: 'club' | 'lid'
  /** In de voorvertoning van de ledenapp: het lid-id voor ?voor=. */
  voor?: string | null
  /** Klassen van het rondje; standaard club-avatar. */
  className?: string
  /** Naast de naam staat de naam al: dan verbergen we het rondje voor schermlezers. */
  decoratief?: boolean
  /** false: de klasse bepaalt de maat (bijvoorbeeld kleiner op de telefoon); maat geldt dan alleen voor de foto. */
  vasteMaat?: boolean
}

function bron(waar: 'club' | 'lid', foto: AvatarFoto, maat: 256 | 512, voor: string | null | undefined): string {
  const versie = foto.versie ?? ''
  return waar === 'lid' ? lidFotoUrl(foto.soort, foto.id, versie, maat, voor) : clubFotoUrl(foto.soort, foto.id, versie, maat)
}

export function Avatar({ naam, initialen, foto, maat = 36, waar = 'club', voor, className = 'club-avatar', decoratief = true, vasteMaat = true }: AvatarProps) {
  const [mislukt, setMislukt] = useState<string | null>(null)
  const [geladen, setGeladen] = useState<string | null>(null)
  const letters = initialen ?? initialenVanNaam(naam)
  const heeftFoto = Boolean(foto?.versie) && mislukt !== foto?.versie
  const klein = heeftFoto && foto ? bron(waar, foto, 256, voor) : null
  const groot = heeftFoto && foto ? bron(waar, foto, 512, voor) : null
  const isGeladen = heeftFoto && geladen === foto?.versie
  return (
    <span
      className={`${className} club-foto`}
      data-foto={heeftFoto ? (isGeladen ? 'geladen' : 'laadt') : undefined}
      style={vasteMaat ? { width: maat, height: maat, fontSize: Math.max(11, Math.round(maat * 0.4)) } : undefined}
      aria-hidden={decoratief || undefined}
      role={decoratief ? undefined : 'img'}
      aria-label={decoratief ? undefined : naam}
    >
      <span className="club-foto-letters">{letters}</span>
      {klein && groot ? (
        <img
          src={maat > 128 ? groot : klein}
          srcSet={maat > 128 ? undefined : `${klein} 1x, ${groot} 2x`}
          width={maat}
          height={maat}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setGeladen(foto?.versie ?? null)}
          onError={() => setMislukt(foto?.versie ?? null)}
        />
      ) : null}
    </span>
  )
}
