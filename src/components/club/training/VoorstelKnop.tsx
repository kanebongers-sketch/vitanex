'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { idUit, stuur } from './api'

interface VoorstelKnopProps {
  intakeId: string
  /** Pad naar de editor met __id__ als plek voor het nieuwe schema. */
  editorHref: string
  primair?: boolean
}

/** Maakt uit de intake een conceptschema en opent de editor. Geen AI, geen kosten. */
export function VoorstelKnop({ intakeId, editorHref, primair = true }: VoorstelKnopProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function maak() {
    setBezig(true)
    setFout(null)
    const u = await stuur('/voorstel', 'POST', { intakeId })
    const id = u.ok ? idUit(u.data) : null
    if (!id) {
      setBezig(false)
      return setFout(u.ok ? 'Er kwam geen schema terug.' : u.fout)
    }
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <div className="club-training-voorstelknop">
      <button type="button" className={`club-knop ${primair ? 'club-knop--primair' : ''}`} onClick={maak} disabled={bezig}>
        <Sparkles aria-hidden size={16} />
        {bezig ? 'Voorstel maken...' : 'Maak schemavoorstel'}
      </button>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </div>
  )
}
