'use client'

import { useState } from 'react'
import { Pencil, Pin, PinOff, Square, Trash2 } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { SOORT_CHIP, type Bericht } from '@/lib/club/berichten/model'
import { voorproef } from '@/lib/club/berichten/opmaak'
import { berichtStatus } from '@/lib/club/berichten/regels'
import { vensterTekst } from '@/lib/club/berichten/tijd'
import { doelgroepTekst } from '@/lib/club/berichten/weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BERICHTEN } from '@/lib/aiyourgym/taal/woorden/club/berichten'

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
  const taal = useTaal()
  const tb = useTekst(BERICHTEN)
  const t = tb.rij
  return (
    <li className={`club-bericht-rij club-bericht-rij--${SOORT_CHIP[b.soort]}${status === 'verlopen' ? ' club-bericht-rij--uit' : ''}`}>
      <div className="club-bericht-rij-hoofd">
        <div className="club-bericht-rij-chips">
          <span className={`club-chip club-chip--${SOORT_CHIP[b.soort]}`}>{tb.soort[b.soort]}</span>
          <span className={`club-chip club-chip--${STATUS_CHIP[status]}`}>{tb.status[status]}</span>
          {b.vastgepind && (
            <span className="club-chip club-chip--geen club-bericht-pinchip">
              <Pin size={12} aria-hidden /> {t.vastgepind}
            </span>
          )}
          {b.demo && <span className="club-chip club-chip--uit club-chip--geen">{t.demo}</span>}
        </div>
        <h3 className="club-bericht-rij-titel">{b.titel}</h3>
        {b.tekst && <p className="club-bericht-rij-tekst">{voorproef(b.tekst, 160)}</p>}
        <p className="club-bericht-rij-meta">
          <span>{doelgroepTekst(b, vestigingen, taal)}</span>
          <span>{vensterTekst(b.zichtbaarVan, b.zichtbaarTot, nu, taal)}</span>
          {b.aangemaaktDoor && <span>{t.door(b.aangemaaktDoor)}</span>}
        </p>
      </div>

      {bevestig ? (
        <div className="club-bericht-rij-acties club-bericht-bevestig" role="group" aria-label={t.bevestigLabel}>
          <span>{t.definitief}</span>
          <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => onActie('verwijderen')}>
            {t.jaVerwijderen}
          </button>
          <button type="button" className="club-knop club-knop--klein" onClick={() => setBevestig(false)} autoFocus>
            {t.annuleren}
          </button>
        </div>
      ) : (
        <div className="club-bericht-rij-acties">
          <button type="button" className="club-knop club-knop--klein" onClick={onBewerk}>
            <Pencil size={14} aria-hidden /> {t.bewerken}
          </button>
          <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => onActie(b.vastgepind ? 'losmaken' : 'vastpinnen')}>
            {b.vastgepind ? <PinOff size={14} aria-hidden /> : <Pin size={14} aria-hidden />}
            {b.vastgepind ? t.losmaken : t.vastpinnen}
          </button>
          {status !== 'verlopen' && (
            <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => onActie('stoppen')}>
              <Square size={14} aria-hidden /> {t.stoppen}
            </button>
          )}
          <button type="button" className="club-knop club-knop--klein club-knop--stil club-bericht-weg" onClick={() => setBevestig(true)} aria-label={t.verwijderen(b.titel)}>
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      )}
    </li>
  )
}
