'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, PinOff, Trash2 } from 'lucide-react'
import { MAX_NOTITIE } from '@/lib/club/leden/invoer'
import type { Notitie } from '@/lib/club/leden/rijen'
import { stuur } from './stuur'

// Notities bij een lid: toevoegen, vastpinnen en verwijderen. Vastgepinde
// notities staan bovenaan (bv. "Knieblessure, geen sprongen").

interface NotitiesProps {
  lidId: string
  notities: Notitie[]
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

function NotitieRegel({ notitie, bezig, onPin, onWeg }: { notitie: Notitie; bezig: boolean; onPin: () => void; onWeg: () => void }) {
  return (
    <li className={`club-leden-notitie${notitie.vastgepind ? ' club-leden-notitie--vast' : ''}`}>
      <p>{notitie.tekst}</p>
      <div className="club-leden-notitie-voet">
        <span>{notitie.vastgepind ? 'Vastgepind · ' : ''}{notitie.auteur ?? 'Onbekend'}, {DATUM.format(new Date(notitie.op))}</span>
        <span className="club-leden-notitie-acties">
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={onPin} disabled={bezig}
            aria-label={notitie.vastgepind ? 'Losmaken' : 'Vastpinnen'} title={notitie.vastgepind ? 'Losmaken' : 'Vastpinnen'}>
            {notitie.vastgepind ? <PinOff aria-hidden size={15} /> : <Pin aria-hidden size={15} />}
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein club-leden-weg" onClick={onWeg} disabled={bezig}
            aria-label="Notitie verwijderen" title="Verwijderen">
            <Trash2 aria-hidden size={15} />
          </button>
        </span>
      </div>
    </li>
  )
}

export function Notities({ lidId, notities }: NotitiesProps) {
  const router = useRouter()
  const [tekst, setTekst] = useState('')
  const [vast, setVast] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [, startTransition] = useTransition()
  const basis = `/api/club/leden/${lidId}/notities`

  async function voerUit(actie: () => ReturnType<typeof stuur>): Promise<boolean> {
    setBezig(true)
    setFout(null)
    const uit = await actie()
    setBezig(false)
    if (!uit.ok) {
      setFout(uit.fout)
      return false
    }
    startTransition(() => router.refresh())
    return true
  }

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    if (!tekst.trim()) return setFout('Schrijf eerst een notitie.')
    if (await voerUit(() => stuur(basis, 'POST', { tekst, vastgepind: vast }))) {
      setTekst('')
      setVast(false)
    }
  }

  function verwijder(n: Notitie) {
    if (!window.confirm('Deze notitie verwijderen? Dit kan niet ongedaan worden.')) return
    void voerUit(() => stuur(`${basis}/${n.id}`, 'DELETE'))
  }

  return (
    <section className="club-kaart" id="notities" aria-labelledby="notities-kop">
      <h2 id="notities-kop">Notities</h2>
      <form className="club-leden-notitieform" onSubmit={voegToe}>
        <label className="club-veld">
          <span className="club-sr">Nieuwe notitie</span>
          <textarea className="club-invoer" value={tekst} maxLength={MAX_NOTITIE} onChange={(e) => setTekst(e.target.value)}
            placeholder="Bijvoorbeeld: wil na de zomer PT proberen" rows={3} />
        </label>
        <div className="club-leden-notitieform-voet">
          <label className="club-leden-vink">
            <input type="checkbox" checked={vast} onChange={(e) => setVast(e.target.checked)} /> Vastpinnen
          </label>
          <button type="submit" className="club-knop club-knop--klein" disabled={bezig || !tekst.trim()}>Opslaan</button>
        </div>
        {fout ? <p className="club-fout" role="alert">{fout}</p> : null}
      </form>
      {notities.length ? (
        <ul className="club-leden-notities">
          {notities.map((n) => (
            <NotitieRegel key={n.id} notitie={n} bezig={bezig}
              onPin={() => void voerUit(() => stuur(`${basis}/${n.id}`, 'PATCH', { vastgepind: !n.vastgepind }))}
              onWeg={() => verwijder(n)} />
          ))}
        </ul>
      ) : <p className="club-hint">Nog geen notities.</p>}
    </section>
  )
}
