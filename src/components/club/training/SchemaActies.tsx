'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { idUit, stuur } from './api'
import { LidKiezer, type GekozenLid } from './LidKiezer'
import { Zijpaneel } from './Zijpaneel'

interface NieuwSchemaKnopProps {
  lidId: string | null
  editorHref: string
  label: string
}

/** Een nieuw leeg schema (met lid) of sjabloon (zonder lid), daarna de editor. */
export function NieuwSchemaKnop({ lidId, editorHref, label }: NieuwSchemaKnopProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function maak() {
    setBezig(true)
    const u = await stuur('/schemas', 'POST', { lidId })
    const id = u.ok ? idUit(u.data) : null
    if (!id) {
      setBezig(false)
      return setFout(u.ok ? 'Er kwam geen schema terug.' : u.fout)
    }
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <span className="club-training-actie">
      <button type="button" className="club-knop club-knop--primair" onClick={maak} disabled={bezig}>
        <Plus aria-hidden size={16} /> {label}
      </button>
      {fout && <span className="club-fout" role="alert">{fout}</span>}
    </span>
  )
}

interface ToepassenProps {
  sjabloonId: string
  sjabloonNaam: string
  vestiging: string
  /** Als er al een lid gekozen is (lidfilter), gaat het in een klik. */
  lid: { id: string; naam: string } | null
  editorHref: string
}

/** Zet een sjabloon als concept op een lid en open het in de editor. */
export function SjabloonToepassen({ sjabloonId, sjabloonNaam, vestiging, lid, editorHref }: ToepassenProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const sluit = useCallback(() => setOpen(false), [])

  async function pasToe(doel: GekozenLid | { id: string; naam: string }) {
    setFout(null)
    const u = await stuur(`/schemas/${sjabloonId}/kopie`, 'POST', { lidId: doel.id })
    const id = u.ok ? idUit(u.data) : null
    if (!id) return setFout(u.ok ? 'Er kwam geen schema terug.' : u.fout)
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <span className="club-training-actie">
      <button
        type="button"
        className="club-knop club-knop--klein"
        onClick={() => (lid ? pasToe(lid) : setOpen(true))}
        aria-label={lid ? `${sjabloonNaam} toepassen op ${lid.naam}` : `${sjabloonNaam} toepassen op een lid`}
      >
        <UserPlus aria-hidden size={15} /> {lid ? `Op ${lid.naam.split(' ')[0]}` : 'Toepassen'}
      </button>
      {fout && !open && <span className="club-fout" role="alert">{fout}</span>}
      {open && (
        <Zijpaneel titel={sjabloonNaam} boventitel="Sjabloon toepassen" onSluit={sluit}>
          <p className="club-hint">Het lid krijgt een kopie als concept. Daarna pas je het aan en zet je het op actief.</p>
          <LidKiezer vestiging={vestiging} onKies={pasToe} autoFocus />
          {fout && <p className="club-fout" role="alert">{fout}</p>}
        </Zijpaneel>
      )}
    </span>
  )
}
