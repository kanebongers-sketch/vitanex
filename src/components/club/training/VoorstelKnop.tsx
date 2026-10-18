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
  /** Kleine knop, bijvoorbeeld in een rij van een lijst. */
  klein?: boolean
  groot?: boolean
  label?: string
}

/** Maakt uit de intake een conceptschema en opent de editor. Een vaste opbouw, zonder kosten. */
export function VoorstelKnop({ intakeId, editorHref, primair = true, klein = false, groot = false, label = 'Maak schemavoorstel' }: VoorstelKnopProps) {
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

  // Klein en niet primair (een rij in een lijst): getint in de merkkleur, rustiger dan de hoofdactie.
  const klassen = ['club-knop', primair ? 'club-knop--primair' : '', klein ? 'club-knop--klein' : '', klein && !primair ? 'club-training-knop-merk' : '', groot ? 'club-knop--groot' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className="club-training-voorstelknop">
      <button type="button" className={klassen} onClick={maak} disabled={bezig} aria-busy={bezig || undefined}>
        <Sparkles aria-hidden size={klein ? 14 : 16} />
        {bezig ? 'Voorstel maken...' : label}
      </button>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </div>
  )
}
