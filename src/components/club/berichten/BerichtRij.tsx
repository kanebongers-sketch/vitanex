'use client'

import { useState } from 'react'
import { Pencil, Pin, PinOff, Square, Trash2 } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { SOORT_CHIP, SOORT_LABEL, type Bericht } from '@/lib/club/berichten/model'
import { voorproef } from '@/lib/club/berichten/opmaak'
import { STATUS_LABEL, berichtStatus } from '@/lib/club/berichten/regels'
import { vensterTekst } from '@/lib/club/berichten/tijd'
import { doelgroepTekst } from '@/lib/club/berichten/weergave'

// Een bericht in de beheerlijst: soort en status, titel, voorproef, voor wie
// en wanneer, met de acties. Verwijderen vraagt eerst om bevestiging.

export type RijActie = 'vastpinnen' | 'losmaken' | 'stoppen' | 'verwijderen'

interface Props {
  bericht: Bericht
  vestigingen: readonly VestigingInfo[]
  nu: Date
  bezig: boolean
  onBewerk: () => void
  onActie: (actie: RijActie) => void
}

const STATUS_CHIP = { actief: 'ok', gepland: 'merk', verlopen: 'uit' } as const

export function BerichtRij({ bericht: b, vestigingen, nu, bezig, onBewerk, onActie }: Props) {
  const [bevestig, setBevestig] = useState(false)
  const status = berichtStatus(b, nu)
  return (
    <li className={`club-bericht-rij club-bericht-rij--${SOORT_CHIP[b.soort]}${status === 'verlopen' ? ' club-bericht-rij--uit' : ''}`}>
      <div className="club-bericht-rij-hoofd">
        <div className="club-bericht-rij-chips">
          <span className={`club-chip club-chip--${SOORT_CHIP[b.soort]}`}>{SOORT_LABEL[b.soort]}</span>
          <span className={`club-chip club-chip--${STATUS_CHIP[status]}`}>{STATUS_LABEL[status]}</span>
          {b.vastgepind && (
            <span className="club-chip club-chip--geen club-bericht-pinchip">
              <Pin size={12} aria-hidden /> Vastgepind
            </span>
          )}
          {b.demo && <span className="club-chip club-chip--uit club-chip--geen">Demo</span>}
        </div>
        <h3 className="club-bericht-rij-titel">{b.titel}</h3>
        {b.tekst && <p className="club-bericht-rij-tekst">{voorproef(b.tekst, 160)}</p>}
        <p className="club-bericht-rij-meta">
          <span>{doelgroepTekst(b, vestigingen)}</span>
          <span>{vensterTekst(b.zichtbaarVan, b.zichtbaarTot, nu)}</span>
          {b.aangemaaktDoor && <span>Door {b.aangemaaktDoor}</span>}
        </p>
      </div>

      {bevestig ? (
        <div className="club-bericht-rij-acties club-bericht-bevestig" role="group" aria-label="Verwijderen bevestigen">
          <span>Definitief verwijderen?</span>
          <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => onActie('verwijderen')}>
            Ja, verwijderen
          </button>
          <button type="button" className="club-knop club-knop--klein" onClick={() => setBevestig(false)} autoFocus>
            Annuleren
          </button>
        </div>
      ) : (
        <div className="club-bericht-rij-acties">
          <button type="button" className="club-knop club-knop--klein" onClick={onBewerk}>
            <Pencil size={14} aria-hidden /> Bewerken
          </button>
          <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => onActie(b.vastgepind ? 'losmaken' : 'vastpinnen')}>
            {b.vastgepind ? <PinOff size={14} aria-hidden /> : <Pin size={14} aria-hidden />}
            {b.vastgepind ? 'Losmaken' : 'Vastpinnen'}
          </button>
          {status !== 'verlopen' && (
            <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => onActie('stoppen')}>
              <Square size={14} aria-hidden /> Nu stoppen
            </button>
          )}
          <button type="button" className="club-knop club-knop--klein club-knop--stil club-bericht-weg" onClick={() => setBevestig(true)} aria-label={`${b.titel} verwijderen`}>
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      )}
    </li>
  )
}
