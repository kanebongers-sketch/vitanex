'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Check, Mail, NotebookPen, Phone, SkipForward } from 'lucide-react'
import { NOTITIE_MAX } from '@/lib/club/automatisering/taken'
import type { OpvolgItem } from '@/lib/club/automatisering/weergave'
import { KopieerKnop } from './KopieerKnop'
import { stuur, taakUrl } from './stuur'

// Een lid op de opvolglijst: wie, waarom, de voorbeeldtekst en de knoppen.
// Bellen en mailen openen de eigen telefoon of mail van de medewerker.

type Actie = 'gedaan' | 'overgeslagen' | 'notitie'

interface Props {
  item: OpvolgItem
  ledenkaart: string
  onKlaar: (tekst: string, ok: boolean, weg?: string) => void
}

export function OpvolgTaak({ item, ledenkaart, onKlaar }: Props) {
  const [bezig, setBezig] = useState<Actie | null>(null)
  const [notitieOpen, setNotitieOpen] = useState(false)
  const [notitie, setNotitie] = useState(item.notitie ?? '')
  const id = useId()

  async function doe(actie: Actie) {
    setBezig(actie)
    const body = notitieOpen || actie === 'notitie' ? { actie, notitie } : { actie }
    const uit = await stuur(taakUrl(item.id), 'PATCH', body)
    setBezig(null)
    if (!uit.ok) return onKlaar(uit.fout, false)
    if (actie === 'notitie') {
      setNotitieOpen(false)
      return onKlaar(`Notitie bij ${item.naam} opgeslagen.`, true)
    }
    onKlaar(actie === 'gedaan' ? `${item.naam} staat op gedaan.` : `${item.naam} is overgeslagen.`, true, item.id)
  }

  function slaNotitieOp(e: FormEvent) {
    e.preventDefault()
    void doe('notitie')
  }

  return (
    <li className="club-opvolg-taak">
      <div className="club-opvolg-taak-kop">
        <span className="club-avatar" aria-hidden>{item.initialen}</span>
        <div className="club-opvolg-wie">
          <Link href={ledenkaart} className="club-opvolg-naam">{item.naam}</Link>
          <p className="club-opvolg-reden">{item.reden}</p>
        </div>
        <span className="club-chip club-chip--geen club-opvolg-oppakker" title="Wie dit oppakt">{item.wie}</span>
      </div>

      <details className="club-opvolg-tekst">
        <summary>Voorbeeldtekst</summary>
        <blockquote>{item.tekst}</blockquote>
        <KopieerKnop tekst={item.tekst} />
      </details>

      {item.notitie && !notitieOpen && <p className="club-opvolg-notitie"><span>Notitie</span> {item.notitie}</p>}

      {notitieOpen && (
        <form className="club-opvolg-notitieform" onSubmit={slaNotitieOp}>
          <label className="club-veld" htmlFor={`${id}-notitie`}>
            <span>Notitie</span>
            <textarea id={`${id}-notitie`} className="club-invoer" value={notitie} maxLength={NOTITIE_MAX} onChange={(e) => setNotitie(e.target.value)} placeholder="Bijvoorbeeld: gebeld, komt dinsdag weer." />
          </label>
          <div className="club-acties">
            <button type="submit" className="club-knop club-knop--klein" disabled={bezig !== null}>Notitie opslaan</button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setNotitieOpen(false)}>Annuleren</button>
          </div>
        </form>
      )}

      <div className="club-opvolg-acties">
        <div className="club-opvolg-contact">
          {item.telefoon && <a className="club-knop club-knop--klein club-knop--stil" href={`tel:${item.telefoon.replace(/[^\d+]/g, '')}`}><Phone size={14} aria-hidden /> Bellen</a>}
          {item.email && <a className="club-knop club-knop--klein club-knop--stil" href={`mailto:${item.email}`}><Mail size={14} aria-hidden /> Mailen</a>}
        </div>
        <div className="club-opvolg-knoppen">
          {!notitieOpen && (
            <button type="button" className="club-knop club-knop--klein" onClick={() => setNotitieOpen(true)}>
              <NotebookPen size={14} aria-hidden /> Notitie
            </button>
          )}
          <button type="button" className="club-knop club-knop--klein" onClick={() => doe('overgeslagen')} disabled={bezig !== null} aria-busy={bezig === 'overgeslagen'}>
            <SkipForward size={14} aria-hidden /> Overslaan
          </button>
          <button type="button" className="club-knop club-knop--klein club-knop--primair" onClick={() => doe('gedaan')} disabled={bezig !== null} aria-busy={bezig === 'gedaan'}>
            <Check size={14} aria-hidden /> Gedaan
          </button>
        </div>
      </div>
    </li>
  )
}
