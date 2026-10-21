'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUp, Trash2 } from 'lucide-react'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { LOGO_TYPES, MAX_LOGO_BYTES } from '@/lib/club/kern/organisatie-invoer'
import { stuur } from '@/components/club/leden/stuur'

// Logo uploaden of weghalen. Het logo wordt meteen opgeslagen (los van de knop
// Opslaan), zodat het voorbeeld en de balk het echte bestand tonen.

interface LogoBlokProps {
  logoUrl: string | null
  ingebouwd: boolean
  naam: string
}

async function upload(bestand: File): Promise<string | null> {
  const form = new FormData()
  form.append('logo', bestand)
  try {
    const res = await fetch('/api/club/organisatie/logo', { method: 'POST', body: form })
    if (res.ok) return null
    const data: unknown = await res.json().catch(() => null)
    return typeof data === 'object' && data !== null && 'fout' in data && typeof data.fout === 'string' ? data.fout : 'Uploaden lukte niet.'
  } catch {
    return 'Geen verbinding. Probeer het opnieuw.'
  }
}

export function LogoBlok({ logoUrl, ingebouwd, naam }: LogoBlokProps) {
  const router = useRouter()
  const invoer = useRef<HTMLInputElement>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function kies(bestand: File | undefined) {
    if (!bestand) return
    setFout(null)
    if (!LOGO_TYPES[bestand.type]) return setFout('Kies een PNG, WebP, JPG of SVG.')
    if (bestand.size > MAX_LOGO_BYTES) return setFout('Het logo mag maximaal 1 MB zijn.')
    setBezig(true)
    const melding = await upload(bestand)
    setBezig(false)
    if (melding) return setFout(melding)
    router.refresh()
  }

  async function weg() {
    setBezig(true)
    const uit = await stuur('/api/club/organisatie/logo', 'DELETE')
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    router.refresh()
  }

  const heeftLogo = ingebouwd || logoUrl !== null
  return (
    <div className="club-huisstijl-logo">
      <div className="club-huisstijl-logovlak">
        {ingebouwd ? (
          <FitFactoryLogo />
        ) : logoUrl ? (
          <img src={logoUrl} alt={`Logo van ${naam}`} />
        ) : (
          <span className="club-huisstijl-logoleeg">Nog geen logo: de naam wordt het woordmerk</span>
        )}
      </div>
      <div className="club-acties">
        <button type="button" className="club-knop" disabled={bezig} onClick={() => invoer.current?.click()}>
          <ImageUp aria-hidden size={16} /> {bezig ? 'Bezig...' : heeftLogo ? 'Ander logo' : 'Logo uploaden'}
        </button>
        {heeftLogo && (
          <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => void weg()}>
            <Trash2 aria-hidden size={16} /> Weghalen
          </button>
        )}
      </div>
      <p className="club-hint">PNG of SVG met een doorzichtige achtergrond werkt het mooist. Maximaal 1 MB.</p>
      <input
        ref={invoer}
        type="file"
        accept="image/png,image/webp,image/svg+xml,image/jpeg"
        hidden
        onChange={(e) => {
          void kies(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </div>
  )
}
