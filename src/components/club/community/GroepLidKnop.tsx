'use client'

import { useRouter } from 'next/navigation'
import { LogOut, UserPlus } from 'lucide-react'
import { useActie } from './useActie'
import { Terugkoppeling } from './Terugkoppeling'

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
  const url = `/api/club/lid/community/groepen/${encodeURIComponent(groepId)}`

  async function verlaat() {
    const vraag = besloten ? `${groepNaam} verlaten? Alleen de sportschool kan je weer toevoegen.` : `${groepNaam} verlaten?`
    if (!window.confirm(vraag)) return
    if (await doe('uit', url, 'DELETE', undefined)) router.push(terug, { scroll: false })
  }

  return (
    <div className="club-cm-lidknop">
      {isLid ? (
        <button type="button" className="club-cm-tekstknop" disabled={bezig === 'uit'} onClick={() => void verlaat()}>
          <LogOut size={14} aria-hidden /> Groep verlaten
        </button>
      ) : (
        <button type="button" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig === 'mee'} onClick={() => void doe('mee', url, 'POST', undefined, `Welkom in ${groepNaam}.`)}>
          <UserPlus size={18} aria-hidden /> {bezig === 'mee' ? 'Even geduld...' : 'Word lid van de groep'}
        </button>
      )}
      <Terugkoppeling melding={melding} />
    </div>
  )
}
