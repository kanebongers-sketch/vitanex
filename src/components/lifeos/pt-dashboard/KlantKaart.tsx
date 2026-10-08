'use client'

import Link from 'next/link'
import { FolderOpen, Pencil } from 'lucide-react'
import {
  KLANT_STATUS_LABEL, abonnementRegel, eindeVastePeriode, isLopend, laatsteDag, type PtKlant,
} from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagKort } from '@/lib/lifeos/pt-dashboard/datum'
import { ContactActies } from './velden'

// Eén PT-klant: abonnement, looptijd en status (prijs alleen met `toonPrijs`:
// eigenaren en Kane — PT'ers zien geen bedragen). Met `onBewerk`
// bewerkbaar (PT'er), zonder alleen-lezen (Kane, eigenaar).

function badge(k: PtKlant, vandaag: string): string {
  if (k.status === 'actief') return 'ptd-badge ptd-badge--accent'
  if (k.status === 'opgezegd' && isLopend(k, vandaag)) return 'ptd-badge ptd-badge--let-op'
  return 'ptd-badge ptd-badge--stil'
}

/** De statusbadge van een klant (ook gebruikt in het dossier). */
export function KlantBadge({ klant: k, vandaag }: { klant: PtKlant; vandaag: string }) {
  return <span className={badge(k, vandaag)}>{k.startdatum > vandaag ? 'Start binnenkort' : KLANT_STATUS_LABEL[k.status]}</span>
}

interface Props {
  klant: PtKlant
  vandaag: string
  onBewerk?: () => void
  /** Link naar het klantdossier (PT'er zelf, of de eigenaar alleen-lezen). */
  dossierHref?: string
  /** Bij wie de klant traint — in lijsten van het hele team. */
  trainer?: string
  /** De maandprijs tonen (eigenaar/Kane). */
  toonPrijs?: boolean
}

export function KlantKaart({ klant: k, vandaag, onBewerk, dossierHref, trainer, toonPrijs = false }: Props) {
  const vastTot = eindeVastePeriode(k.startdatum)
  const inVast = vastTot >= vandaag && k.startdatum <= vandaag
  return (
    <li className="ptd-rij">
      <div className="ptd-rij-kop">
        <span className="ptd-naam">
          {k.naam}
          {k.duoPartner ? <span className="ptd-zacht"> &amp; {k.duoPartner}</span> : null}
        </span>
        <KlantBadge klant={k} vandaag={vandaag} />
      </div>
      <div className="ptd-meta">
        {trainer ? <span className="ptd-trainer">PT {trainer}</span> : null}
        <span>{abonnementRegel(k, toonPrijs)}</span>
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
      {onBewerk || dossierHref ? (
        <div className="ptd-acties ptd-acties--rij">
          {dossierHref ? (
            <Link className="ptd-knop ptd-knop--klein" href={dossierHref} aria-label={`Dossier van ${k.naam}`}>
              <FolderOpen size={14} aria-hidden /> Dossier
            </Link>
          ) : null}
          {onBewerk ? (
            <>
              <ContactActies contact={k.contact} naam={k.naam} />
              <button type="button" className="ptd-knop ptd-knop--klein" onClick={onBewerk} aria-label={`${k.naam} bewerken`}>
                <Pencil size={14} aria-hidden /> Bewerk
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
