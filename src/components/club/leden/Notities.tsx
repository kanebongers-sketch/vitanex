'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, PinOff, Trash2 } from 'lucide-react'
import { MAX_NOTITIE } from '@/lib/club/leden/invoer'
import type { Notitie } from '@/lib/club/leden/rijen'
import { stuur } from './stuur'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LOCALE } from '@/lib/aiyourgym/taal/taal'
import { LIDKAART_BLOKKEN } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'

// Notities bij een lid: toevoegen, vastpinnen en verwijderen. Vastgepinde
// notities staan bovenaan (bv. "Knieblessure, geen sprongen").

interface NotitiesProps {
  lidId: string
  notities: Notitie[]
  /** Rollen v2, alleen zien: lezen zonder schrijven, vastpinnen of verwijderen. */
  alleenLezen?: boolean
}

const DATUM_OPTIES: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }

function NotitieRegel({ notitie, bezig, onPin, onWeg, alleenLezen }: { notitie: Notitie; bezig: boolean; onPin: () => void; onWeg: () => void; alleenLezen: boolean }) {
  const t = useTekst(LIDKAART_BLOKKEN).notities
  const datum = new Intl.DateTimeFormat(LOCALE[useTaal()], DATUM_OPTIES).format(new Date(notitie.op))
  return (
    <li className={`club-leden-notitie${notitie.vastgepind ? ' club-leden-notitie--vast' : ''}`}>
      <p>{notitie.tekst}</p>
      <div className="club-leden-notitie-voet">
        <span>{notitie.vastgepind ? `${t.vastgepind} · ` : ''}{notitie.auteur ?? t.onbekend}, {datum}</span>
        {!alleenLezen && <span className="club-leden-notitie-acties">
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={onPin} disabled={bezig}
            aria-label={notitie.vastgepind ? t.losmaken : t.vastpinnen} title={notitie.vastgepind ? t.losmaken : t.vastpinnen}>
            {notitie.vastgepind ? <PinOff aria-hidden size={15} /> : <Pin aria-hidden size={15} />}
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein club-leden-weg" onClick={onWeg} disabled={bezig}
            aria-label={t.notitieVerwijderen} title={t.verwijderen}>
            <Trash2 aria-hidden size={15} />
          </button>
        </span>}
      </div>
    </li>
  )
}

export function Notities({ lidId, notities, alleenLezen = false }: NotitiesProps) {
  const router = useRouter()
  const t = useTekst(LIDKAART_BLOKKEN).notities
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
    if (!tekst.trim()) return setFout(t.eerstSchrijven)
    if (await voerUit(() => stuur(basis, 'POST', { tekst, vastgepind: vast }))) {
      setTekst('')
      setVast(false)
    }
  }

  function verwijder(n: Notitie) {
    if (!window.confirm(t.vraagVerwijderen)) return
    void voerUit(() => stuur(`${basis}/${n.id}`, 'DELETE'))
  }

  return (
    <section className="club-kaart" id="notities" aria-labelledby="notities-kop">
      <h2 id="notities-kop">{t.kop}</h2>
      {!alleenLezen && <form className="club-leden-notitieform" onSubmit={voegToe}>
        <label className="club-veld">
          <span className="club-sr">{t.nieuw}</span>
          <textarea className="club-invoer" value={tekst} maxLength={MAX_NOTITIE} onChange={(e) => setTekst(e.target.value)}
            placeholder={t.voorbeeld} rows={3} />
        </label>
        <div className="club-leden-notitieform-voet">
          <label className="club-leden-vink">
            <input type="checkbox" checked={vast} onChange={(e) => setVast(e.target.checked)} /> {t.vastpinnen}
          </label>
          <button type="submit" className="club-knop club-knop--klein" disabled={bezig || !tekst.trim()}>{t.opslaan}</button>
        </div>
        {fout ? <p className="club-fout" role="alert">{fout}</p> : null}
      </form>}
      {notities.length ? (
        <ul className="club-leden-notities">
          {notities.map((n) => (
            <NotitieRegel key={n.id} notitie={n} bezig={bezig} alleenLezen={alleenLezen}
              onPin={() => void voerUit(() => stuur(`${basis}/${n.id}`, 'PATCH', { vastgepind: !n.vastgepind }))}
              onWeg={() => verwijder(n)} />
          ))}
        </ul>
      ) : <p className="club-hint">{t.geen}</p>}
    </section>
  )
}
