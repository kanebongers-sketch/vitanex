'use client'

import { useRouter } from 'next/navigation'
import { LogOut, UserPlus } from 'lucide-react'
import { useActie } from './useActie'
import { Terugkoppeling } from './Terugkoppeling'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

// Lid worden van een open groep, of de groep verlaten (met een bevestiging).

interface Props {
  groepId: string
  groepNaam: string
  isLid: boolean
  /** Waar het lid na het verlaten heen gaat (het overzicht). */
  terug: string
  /** Na verlaten van een besloten groep kan het lid niet zelf terug. */
  besloten: boolean
}

export function GroepLidKnop({ groepId, groepNaam, isLid, terug, besloten }: Props) {
  const router = useRouter()
  const { bezig, melding, doe } = useActie()
  const t = useTekst(COMMUNITY).lidKnop
  const url = `/api/club/lid/community/groepen/${encodeURIComponent(groepId)}`

  async function verlaat() {
    const vraag = besloten ? t.verlatenBesloten(groepNaam) : t.verlaten(groepNaam)
    if (!window.confirm(vraag)) return
    if (await doe('uit', url, 'DELETE', undefined)) router.push(terug, { scroll: false })
  }

  return (
    <div className="club-cm-lidknop">
      {isLid ? (
        <button type="button" className="club-cm-tekstknop" disabled={bezig === 'uit'} onClick={() => void verlaat()}>
          <LogOut size={14} aria-hidden /> {t.verlaat}
        </button>
      ) : (
        <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig === 'mee'} onClick={() => void doe('mee', url, 'POST', undefined, t.welkom(groepNaam))}>
          <UserPlus size={18} aria-hidden /> {bezig === 'mee' ? t.bezig : t.wordLid}
        </button>
      )}
      <Terugkoppeling melding={melding} />
    </div>
  )
}
