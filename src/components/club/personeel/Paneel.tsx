'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

// Het zijpaneel van het personeelsrooster. Open via de URL; Escape, de
// sluitknop of klikken naast het paneel gaat terug naar het rooster.

interface Props {
  titel: string
  boventitel: string
  sub?: ReactNode
  sluitHref: string
  children: ReactNode
}

export function Paneel({ titel, boventitel, sub, sluitHref, children }: Props) {
  const router = useRouter()
  const sluitKnop = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    sluitKnop.current?.focus()
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(sluitHref, { scroll: false })
    }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [router, sluitHref])

  return (
    <div className="club-paneel-scherm" onClick={(e) => e.target === e.currentTarget && router.push(sluitHref, { scroll: false })}>
      <aside className="club-paneel club-personeel-paneel" role="dialog" aria-modal="true" aria-labelledby="club-personeel-paneel-titel">
        <header className="club-personeel-paneelkop">
          <div>
            <p className="club-boventitel">{boventitel}</p>
            <h2 id="club-personeel-paneel-titel">{titel}</h2>
            {sub && <div className="club-zacht">{sub}</div>}
          </div>
          <Link ref={sluitKnop} href={sluitHref} scroll={false} className="club-knop club-knop--stil" aria-label="Paneel sluiten">
            <X aria-hidden size={18} />
          </Link>
        </header>
        {children}
      </aside>
    </div>
  )
}
