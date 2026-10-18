'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { idUit, stuur } from '../api'
import { LidKiezer, type GekozenLid } from '../LidKiezer'
import { Zijpaneel } from '../Zijpaneel'

interface KopieNaarLidProps {
  schemaId: string
  naam: string
  vestiging: string
  editorHref: string
  onSluit: () => void
}

/** Kopieer dit schema als concept naar een ander lid, met of zonder de gewichten. Opent vanuit het menu Meer. */
export function KopieNaarLid({ schemaId, naam, vestiging, editorHref, onSluit }: KopieNaarLidProps) {
  const router = useRouter()
  const [metGewicht, setMetGewicht] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function kopieer(lid: GekozenLid) {
    setFout(null)
    setBezig(true)
    const u = await stuur(`/schemas/${schemaId}/kopie`, 'POST', { lidId: lid.id, metGewicht })
    const id = u.ok ? idUit(u.data) : null
    if (!id) {
      setBezig(false)
      return setFout(u.ok ? 'Er kwam geen schema terug.' : u.fout)
    }
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <Zijpaneel titel={naam} boventitel="Kopie naar een ander lid" onSluit={onSluit}>
      <p className="club-hint">Het lid krijgt een kopie als concept, met supersets, tempo en notities. Daarna pas je het schema aan en activeer je het.</p>
      <label className="club-training-vink">
        <input type="checkbox" checked={metGewicht} onChange={(e) => setMetGewicht(e.target.checked)} />
        <span>Gewichten meenemen (meestal niet: die zijn persoonlijk)</span>
      </label>
      <LidKiezer vestiging={vestiging} onKies={kopieer} autoFocus />
      {bezig && <p className="club-hint" role="status">Kopie maken...</p>}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </Zijpaneel>
  )
}
