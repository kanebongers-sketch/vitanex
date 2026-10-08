'use client'

import { Pencil } from 'lucide-react'
import {
  KLANT_STATUS_LABEL, abonnementRegel, eindeVastePeriode, isLopend, laatsteDag, type PtKlant,
} from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { ContactActies } from './velden'

// Eén PT-klant: abonnement + prijs, looptijd en status. Met `onBewerk`
// bewerkbaar (PT'er), zonder alleen-lezen (Kane).

function badge(k: PtKlant, vandaag: string): string {
  if (k.status === 'actief') return 'ptd-badge ptd-badge--accent'
  if (k.status === 'opgezegd' && isLopend(k, vandaag)) return 'ptd-badge ptd-badge--let-op'
  return 'ptd-badge ptd-badge--stil'
}

export function KlantKaart({ klant: k, vandaag, onBewerk }: { klant: PtKlant; vandaag: string; onBewerk?: () => void }) {
  const vastTot = eindeVastePeriode(k.startdatum)
  const inVast = vastTot >= vandaag && k.startdatum <= vandaag
  return (
    <li className="ptd-rij">
      <div className="ptd-rij-kop">
        <span className="ptd-naam">
          {k.naam}
          {k.duoPartner ? <span className="ptd-zacht"> &amp; {k.duoPartner}</span> : null}
        </span>
        <span className={badge(k, vandaag)}>{k.startdatum > vandaag ? 'Start binnenkort' : KLANT_STATUS_LABEL[k.status]}</span>
      </div>
      <div className="ptd-meta">
        <span>{abonnementRegel(k)}</span>
      </div>
      <div className="ptd-meta">
        <span>Start {dagKort(k.startdatum)}</span>
        {k.status === 'opgezegd' && k.opgezegdOp ? (
          <span>Opgezegd {dagKort(k.opgezegdOp)} · loopt t/m {dagKort(laatsteDag(k.startdatum, k.opgezegdOp))}</span>
        ) : k.status === 'gestopt' && k.opgezegdOp ? (
          <span>Gestopt {dagKort(k.opgezegdOp)}</span>
        ) : inVast ? (
          <span>Vaste periode t/m {dagKort(vastTot)}</span>
        ) : k.startdatum <= vandaag ? (
          <span>Maandelijks opzegbaar</span>
        ) : null}
        {k.contact ? <span>{k.contact}</span> : null}
      </div>
      {k.notitie ? <p className="ptd-tekst">{k.notitie}</p> : null}
      {onBewerk ? (
        <div className="ptd-acties ptd-acties--rij">
          <ContactActies contact={k.contact} naam={k.naam} />
          <button type="button" className="ptd-knop ptd-knop--klein" onClick={onBewerk} aria-label={`${k.naam} bewerken`}>
            <Pencil size={14} aria-hidden /> Bewerk
          </button>
        </div>
      ) : null}
    </li>
  )
}
