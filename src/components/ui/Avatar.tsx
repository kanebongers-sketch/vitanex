'use client'

import { useEffect, useState } from 'react'
import { isOpslagPad, tekenAvatarUrl } from '@/lib/avatars/avatars'

type AvatarProps = {
  naam: string
  /**
   * Sinds migratie 047 een opslagpad (`<userId>/avatar.jpg`), niet meer een
   * publieke URL — de avatars-bucket is privé. Een volledige URL wordt nog
   * steeds geaccepteerd en ongemoeid doorgegeven, zodat externe of oude
   * waarden blijven werken.
   */
  avatarUrl?: string | null
  size?: number
  online?: boolean
  className?: string
  style?: React.CSSProperties
}

function initialen(naam: string) {
  const delen = naam.trim().split(' ')
  if (delen.length >= 2) return (delen[0][0] + delen[delen.length - 1][0]).toUpperCase()
  return naam.slice(0, 2).toUpperCase()
}

/**
 * Zet een pad om in een tijdelijke URL; laat een echte URL met rust.
 *
 * De tekenaar bundelt alles uit dezelfde tick, dus een lijst met dertig
 * Avatars kost één netwerkaanroep — zie lib/avatars/avatars.ts.
 */
function useAvatarBron(avatarUrl: string | null | undefined): string | null {
  // Een volledige URL is meteen bruikbaar: tijdens de render af te leiden, dus
  // geen state en geen effect. Alleen een pad moet getekend worden.
  const directeUrl = avatarUrl && !isOpslagPad(avatarUrl) ? avatarUrl : null
  const pad = avatarUrl && isOpslagPad(avatarUrl) ? avatarUrl : null

  // Het pad hoort bij de URL: een lijst die zijn rijen hergebruikt zou anders
  // de vorige persoon tonen tot de nieuwe binnen is.
  const [getekend, setGetekend] = useState<{ pad: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!pad) return
    let actueel = true
    void tekenAvatarUrl(pad).then(url => {
      if (actueel) setGetekend({ pad, url })
    })
    return () => { actueel = false }
  }, [pad])

  if (directeUrl) return directeUrl
  if (!pad) return null
  return getekend?.pad === pad ? getekend.url : null
}

export function Avatar({ naam, avatarUrl, size = 32, online, className = '', style }: AvatarProps) {
  const fontSize = Math.round(size * 0.36)
  const dotSize = Math.round(size * 0.28)
  const dotOffset = Math.round(size * 0.04)

  // Zolang er nog geen URL is (of RLS weigert) tonen we initialen. Dat is de
  // bestaande lege staat, dus een trage of geweigerde avatar ziet er niet uit
  // als een fout.
  const bron = useAvatarBron(avatarUrl)

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {bron ? (
        <img
          src={bron}
          alt={naam}
          className="rounded-full object-cover w-full h-full"
          draggable={false}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-medium w-full h-full select-none"
          style={{
            background: 'var(--mentaforce-primary-light)',
            color: 'var(--mentaforce-primary)',
            fontSize,
          }}
        >
          {initialen(naam || '?')}
        </div>
      )}

      {online !== undefined && (
        <span
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            border: '2px solid var(--bg-card)',
            background: online ? 'var(--mf-green)' : 'var(--text-4)',
            bottom: dotOffset,
            right: dotOffset,
          }}
        />
      )}
    </div>
  )
}
