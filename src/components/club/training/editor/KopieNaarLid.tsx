'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { idUit, stuur } from '../api'
import { LidKiezer, type GekozenLid } from '../LidKiezer'
import { Zijpaneel } from '../Zijpaneel'

interface KopieNaarLidProps {
  schemaId: string
  naam: string
  vestiging: string
  gewijzigd: boolean
  editorHref: string
}

/** Kopieer dit schema als concept naar een ander lid, met of zonder de gewichten. */
export function KopieNaarLid({ schemaId, naam, vestiging, gewijzigd, editorHref }: KopieNaarLidProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [metGewicht, setMetGewicht] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const sluit = useCallback(() => setOpen(false), [])

  async function kopieer(lid: GekozenLid) {
    setFout(null)
    const u = await stuur(`/schemas/${schemaId}/kopie`, 'POST', { lidId: lid.id, metGewicht })
    const id = u.ok ? idUit(u.data) : null
    if (!id) return setFout(u.ok ? 'Er kwam geen schema terug.' : u.fout)
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <>
      <button type="button" className="club-knop" onClick={() => setOpen(true)} disabled={gewijzigd} title={gewijzigd ? 'Sla eerst je wijzigingen op' : undefined}>
        <UserPlus aria-hidden size={16} /> Naar ander lid
      </button>
      {open && (
        <Zijpaneel titel={naam} boventitel="Kopiëren naar een ander lid" onSluit={sluit}>
          <p className="club-hint">Het lid krijgt een kopie als concept, met supersets, tempo en notities. Daarna pas je het aan en zet je het op actief.</p>
          <label className="club-training-vink">
            <input type="checkbox" checked={metGewicht} onChange={(e) => setMetGewicht(e.target.checked)} />
            <span>Gewichten meenemen (meestal niet: die zijn persoonlijk)</span>
          </label>
          <LidKiezer vestiging={vestiging} onKies={kopieer} autoFocus />
          {fout && <p className="club-fout" role="alert">{fout}</p>}
        </Zijpaneel>
      )}
    </>
  )
}
