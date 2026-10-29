'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import type { OpvolgItem } from '@/lib/club/automatisering/weergave'
import { stuur, taakUrl } from './stuur'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'
import { LOCALE } from '@/lib/aiyourgym/taal/taal'

// Wat het team de laatste week afhandelde, met wie, wanneer en de notitie.
// Per ongeluk op gedaan gezet? Terugzetten zet de taak weer open.

const WANNEER_OPTIES: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }

interface Props {
  items: readonly OpvolgItem[]
  ledenkaarten: Readonly<Record<string, string>>
}

export function Afgehandeld({ items, ledenkaarten }: Props) {
  const router = useRouter()
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState<string | null>(null)
  const taal = useTaal()
  const t = useTekst(OPVOLGEN).afgehandeld
  const wanneer = new Intl.DateTimeFormat(LOCALE[taal], WANNEER_OPTIES)

  async function heropen(id: string) {
    setBezig(id)
    const uit = await stuur(taakUrl(id), 'PATCH', { actie: 'heropen' }, taal)
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    setFout(null)
    router.refresh()
  }

  if (items.length === 0) return <p className="club-hint">{t.leeg}</p>

  return (
    <>
      <div role="status" aria-live="polite">{fout && <p className="club-melding club-melding--fout">{fout}</p>}</div>
      <ul className="club-opvolg-historie">
        {items.map((i) => (
          <li key={i.id}>
            <span className={`club-chip ${i.status === 'gedaan' ? 'club-chip--ok' : 'club-chip--uit'}`}>{i.statusLabel}</span>
            <div className="club-opvolg-historie-tekst">
              <p>
                <Link href={ledenkaarten[i.lidId] ?? '/club/leden'}>{i.naam}</Link>
                <span className="club-zacht"> · {i.regelTitel}</span>
              </p>
              <p className="club-zacht">
                {[i.afgehandeldDoor, i.afgehandeldOp ? wanneer.format(new Date(i.afgehandeldOp)) : null].filter(Boolean).join(', ')}
                {i.notitie ? `. ${i.notitie}` : ''}
              </p>
            </div>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => heropen(i.id)} disabled={bezig !== null} aria-label={t.terugzettenLabel(i.naam)}>
              <RotateCcw size={14} aria-hidden /> {t.terugzetten}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
