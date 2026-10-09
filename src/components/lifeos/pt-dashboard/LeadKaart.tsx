'use client'

import Link from 'next/link'
import { CalendarClock, Check, Pencil } from 'lucide-react'
import {
  BRON_LABEL, INTERESSE_LABEL, LEAD_STATUSSEN, STAP_LABEL, STATUS_LABEL, isStatus, moetOpvolgen, type Lead, type LeadStatus,
} from '@/lib/lifeos/leads/leads'
import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import { geleden, relatief } from '@/lib/lifeos/pt-dashboard/datum'
import { ContactActies } from './velden'

// Eén lead in de lijst. Met `onBewerk`/`onStatus` is hij bewerkbaar (PT'er);
// zonder is hij alleen-lezen (Kane in LifeOS, de eigenaar in de PT-app).

interface Props {
  lead: Lead
  vandaag: string
  onBewerk?: () => void
  onStatus?: (s: LeadStatus) => void
  /** Link om van deze klant-geworden lead een abonnement te maken. */
  klantHref?: string
  /** Welke PT'er de lead sprak — in lijsten van het hele team. */
  trainer?: string
  /** De status wordt opgeslagen: keuzelijst even dicht (geen dubbele wijziging). */
  bezig?: boolean
}

export function statusBadge(status: LeadStatus): string {
  if (status === 'klant') return 'ptd-badge ptd-badge--accent'
  if (status === 'geen_interesse') return 'ptd-badge ptd-badge--stil'
  return 'ptd-badge'
}

export function LeadKaart({ lead, vandaag, onBewerk, onStatus, klantHref, trainer, bezig = false }: Props) {
  const teLaat = moetOpvolgen(lead, vandaag) && lead.opvolgdatum !== vandaag
  const opvolgVandaag = moetOpvolgen(lead, vandaag) && lead.opvolgdatum === vandaag
  return (
    <li className="ptd-rij" id={`lead-${lead.id}`}>
      <div className="ptd-rij-kop">
        <span className="ptd-naam">{lead.naam}</span>
        <span className={statusBadge(lead.status)}>{STATUS_LABEL[lead.status]}</span>
      </div>
      <div className="ptd-meta">
        {trainer ? <span className="ptd-trainer">PT {trainer}</span> : null}
        <span>Gesproken {geleden(lead.gesprokenOp, vandaag)}</span>
        {lead.club ? <span>{CLUB_LABEL[lead.club]}</span> : null}
        <span>{BRON_LABEL[lead.bron]}</span>
        {lead.interesse ? <span>{INTERESSE_LABEL[lead.interesse]}</span> : null}
        {lead.contact ? <span>{lead.contact}</span> : null}
      </div>
      {lead.opvolgdatum || lead.volgendeStap ? (
        <div className="ptd-meta">
          <span className={teLaat ? 'ptd-badge ptd-badge--let-op' : opvolgVandaag ? 'ptd-badge ptd-badge--accent' : 'ptd-badge'}>
            <CalendarClock size={13} aria-hidden />
            {lead.volgendeStap ? STAP_LABEL[lead.volgendeStap] : 'Opvolgen'}
            {lead.opvolgdatum ? ` · ${relatief(lead.opvolgdatum, vandaag)}` : ''}
          </span>
        </div>
      ) : null}
      {lead.notitie ? <p className="ptd-tekst">{lead.notitie}</p> : null}
      {lead.reviewGevraagd || lead.referralGevraagd || lead.kentIemand ? (
        <div className="ptd-meta">
          {lead.reviewGevraagd ? <span className="ptd-vink"><Check size={13} aria-hidden /> Review gevraagd</span> : null}
          {lead.referralGevraagd ? <span className="ptd-vink"><Check size={13} aria-hidden /> Referral gevraagd</span> : null}
          {lead.kentIemand ? <span>Kent: {lead.kentIemand}</span> : null}
        </div>
      ) : null}
      {onBewerk || onStatus || klantHref ? (
        <div className="ptd-acties ptd-acties--rij">
          <ContactActies contact={lead.contact} naam={lead.naam} />
          {onStatus ? (
            <label>
              <span className="sr-only">Status van {lead.naam}</span>
              <select
                className="ptd-invoer ptd-invoer--klein"
                value={lead.status}
                disabled={bezig}
                onChange={(e) => isStatus(e.target.value) && onStatus(e.target.value)}
              >
                {LEAD_STATUSSEN.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </label>
          ) : null}
          {onBewerk ? (
            <button type="button" className="ptd-knop ptd-knop--klein" onClick={onBewerk} aria-label={`${lead.naam} bewerken`}>
              <Pencil size={14} aria-hidden /> Bewerk
            </button>
          ) : null}
          {klantHref && lead.status === 'klant' ? (
            <Link className="ptd-knop ptd-knop--klein ptd-knop--primair" href={klantHref}>Abonnement vastleggen</Link>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
