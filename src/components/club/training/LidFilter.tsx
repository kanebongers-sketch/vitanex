'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UserRound, X } from 'lucide-react'
import { LidKiezer } from './LidKiezer'

interface LidFilterProps {
  vestiging: string
  /** Het gekozen lid, of null voor de hele vestiging. */
  lid: { id: string; naam: string; initialen: string } | null
  /** Pad zonder lid (voor het kruisje) en een pad-sjabloon met __lid__. */
  zonderLidHref: string
  metLidHref: string
}

/** Filter alles op een lid. Leeg: zoek een lid. Gekozen: het lid met een kruisje. */
export function LidFilter({ vestiging, lid, zonderLidHref, metLidHref }: LidFilterProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (lid) {
    return (
      <div className="club-training-lidfilter">
        <span className="club-avatar" aria-hidden>{lid.initialen}</span>
        <span className="club-training-lidfilter-naam">{lid.naam}</span>
        <Link href={zonderLidHref} className="club-knop club-knop--stil club-knop--klein" aria-label={`Filter op ${lid.naam} weghalen`}>
          <X aria-hidden size={16} />
        </Link>
      </div>
    )
  }

  if (!open) {
    return (
      <button type="button" className="club-knop club-knop--klein" onClick={() => setOpen(true)}>
        <UserRound aria-hidden size={16} /> Filter op lid
      </button>
    )
  }

  return (
    <div className="club-training-lidfilter club-training-lidfilter--zoek">
      <LidKiezer
        vestiging={vestiging}
        label="Toon alles van een lid"
        autoFocus
        onKies={(l) => router.push(metLidHref.replace('__lid__', encodeURIComponent(l.id)))}
      />
      <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setOpen(false)}>
        Annuleren
      </button>
    </div>
  )
}
