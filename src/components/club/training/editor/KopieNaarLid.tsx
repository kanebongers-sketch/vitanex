'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { idUit, stuur } from '../api'
import { LidKiezer, type GekozenLid } from '../LidKiezer'
import { Zijpaneel } from '../Zijpaneel'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'

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
  const t = useTekst(SCHEMA_EDITOR).kopie
  const [metGewicht, setMetGewicht] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  // Een ref, geen state: een snelle tweede klik op een lid komt voor de volgende render
  // binnen en zou anders een tweede kopie maken.
  const loopt = useRef(false)

  async function kopieer(lid: GekozenLid) {
    if (loopt.current) return
    loopt.current = true
    setFout(null)
    setBezig(true)
    const u = await stuur(`/schemas/${schemaId}/kopie`, 'POST', { lidId: lid.id, metGewicht })
    const id = u.ok ? idUit(u.data) : null
    if (!id) {
      loopt.current = false
      setBezig(false)
      return setFout(u.ok ? t.geenSchema : u.fout)
    }
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <Zijpaneel titel={naam} boventitel={t.boventitel} onSluit={onSluit}>
      <p className="club-hint">{t.uitleg}</p>
      <label className="club-training-vink">
        <input type="checkbox" checked={metGewicht} onChange={(e) => setMetGewicht(e.target.checked)} />
        <span>{t.metGewicht}</span>
      </label>
      <LidKiezer vestiging={vestiging} onKies={kopieer} autoFocus />
      {bezig && <p className="club-hint" role="status">{t.bezig}</p>}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </Zijpaneel>
  )
}
