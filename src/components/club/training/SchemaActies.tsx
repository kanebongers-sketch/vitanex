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
  /** Hoofdactie van het scherm (merkkleur) of een gewone knop ernaast. */
  primair?: boolean
}

/** Een nieuw leeg schema (met lid) of sjabloon (zonder lid), daarna de editor. */
export function NieuwSchemaKnop({ lidId, editorHref, label, primair = true }: NieuwSchemaKnopProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function maak() {
    setBezig(true)
    setFout(null)
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
      <button type="button" className={`club-knop${primair ? ' club-knop--primair' : ''}`} onClick={maak} disabled={bezig} aria-busy={bezig || undefined}>
        <Plus aria-hidden size={16} /> {bezig ? 'Even geduld...' : label}
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
  /** Kleine knop (in een lijst) of een gewone (werkbalk). */
  klein?: boolean
}

/** Zet een sjabloon als concept op een lid en open het in de editor. */
export function SjabloonToepassen({ sjabloonId, sjabloonNaam, vestiging, lid, editorHref, klein = true }: ToepassenProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const sluit = useCallback(() => setOpen(false), [])

  async function pasToe(doel: GekozenLid | { id: string; naam: string }) {
    setFout(null)
    setBezig(true)
    const u = await stuur(`/schemas/${sjabloonId}/kopie`, 'POST', { lidId: doel.id })
    const id = u.ok ? idUit(u.data) : null
    if (!id) {
      setBezig(false)
      return setFout(u.ok ? 'Er kwam geen schema terug.' : u.fout)
    }
    router.push(editorHref.replace('__id__', id))
  }

  return (
    <span className="club-training-actie">
      <button
        type="button"
        className={`club-knop${klein ? ' club-knop--klein club-training-knop-merk' : ''}`}
        onClick={() => (lid ? pasToe(lid) : setOpen(true))}
        disabled={bezig}
        aria-busy={bezig || undefined}
        aria-label={lid ? `${sjabloonNaam} toepassen op ${lid.naam}` : `${sjabloonNaam} toepassen op een lid`}
      >
        <UserPlus aria-hidden size={15} /> {bezig ? 'Even geduld...' : lid ? `Op ${lid.naam.split(' ')[0]}` : 'Op een lid'}
      </button>
      {fout && !open && <span className="club-fout" role="alert">{fout}</span>}
      {open && (
        <Zijpaneel titel={sjabloonNaam} boventitel="Sjabloon toepassen" onSluit={sluit}>
          <p className="club-hint">Kies het lid. Het krijgt een kopie als concept, die je daarna aanpast en activeert in de editor.</p>
          <LidKiezer vestiging={vestiging} onKies={pasToe} autoFocus />
          {bezig && <p className="club-hint" role="status">Schema maken...</p>}
          {fout && <p className="club-fout" role="alert">{fout}</p>}
        </Zijpaneel>
      )}
    </span>
  )
}
