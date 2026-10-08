'use client'

import { useState, type FormEvent } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import {
  BRON_LABEL, INTERESSE_LABEL, INTERESSES, LEAD_BRONNEN, LEAD_STATUSSEN, STAP_LABEL, STAPPEN, STATUS_LABEL,
  isStap, isStatus, leesLead, type Lead, type NieuweLead,
} from '@/lib/lifeos/leads/leads'
import { CLUBS, CLUB_LABEL, isClub, type Club } from '@/lib/lifeos/pt-dashboard/clubs'
import { plusDagen } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { Keuzes, Veld } from './velden'
import { leesLeeg, ptApi } from './api'

// Eén lead toevoegen of bijwerken. Snel: naam + bron is genoeg; de rest
// (interesse, volgende stap, opvolgdatum, review/referral) staat erbij maar hoeft
// niet. Zelfde velden als de Excel-tracker die het team eerst gebruikte.

interface Props {
  code: string
  vandaag: string
  standaardClub: Club | null
  lead?: Lead
  onOpgeslagen: (lead: Lead) => void
  onVerwijderd?: (id: string) => void
  onAnnuleer: () => void
}

function leeg(vandaag: string, club: Club | null): NieuweLead {
  return {
    naam: '', contact: null, club, bron: 'vloer', interesse: null, status: 'nieuw', volgendeStap: null, opvolgdatum: null,
    reviewGevraagd: false, referralGevraagd: false, kentIemand: null, notitie: null, gesprokenOp: vandaag,
  }
}

const SNEL = [
  { label: 'Morgen', dagen: 1 },
  { label: 'Over 3 dagen', dagen: 3 },
  { label: 'Over een week', dagen: 7 },
] as const

export function LeadFormulier({ code, vandaag, standaardClub, lead, onOpgeslagen, onVerwijderd, onAnnuleer }: Props) {
  const [v, setV] = useState<NieuweLead>(() => (lead ? { ...lead } : leeg(vandaag, standaardClub)))
  const [meer, setMeer] = useState(Boolean(lead))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const zet = <K extends keyof NieuweLead>(k: K, w: NieuweLead[K]) => setV((x) => ({ ...x, [k]: w }))
  const id = lead?.id ?? 'nieuw'

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!v.naam.trim()) return setFout('Vul de naam in van wie je gesproken hebt.')
    setBezig(true)
    setFout(null)
    const uit = lead
      ? await ptApi(code, `leads/${lead.id}`, 'PUT', v, leesLead)
      : await ptApi(code, 'leads', 'POST', v, leesLead)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onOpgeslagen(uit.waarde)
  }

  async function verwijder() {
    if (!lead || !window.confirm(`${lead.naam} verwijderen? Dit kan niet ongedaan worden.`)) return
    setBezig(true)
    const uit = await ptApi(code, `leads/${lead.id}`, 'DELETE', undefined, leesLeeg)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onVerwijderd?.(lead.id)
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-labelledby={`lf-${id}`}>
      <h3 id={`lf-${id}`}>{lead ? `${lead.naam} bijwerken` : 'Nieuwe lead'}</h3>
      <div className="ptd-raster">
        <Veld label="Naam *" id={`naam-${id}`}>
          <input id={`naam-${id}`} className="ptd-invoer" value={v.naam} onChange={(e) => zet('naam', e.target.value)} maxLength={120} autoComplete="off" required autoFocus={!lead} />
        </Veld>
        <Veld label="Telefoon / contact" id={`contact-${id}`}>
          <input id={`contact-${id}`} className="ptd-invoer" value={v.contact ?? ''} onChange={(e) => zet('contact', e.target.value || null)} maxLength={160} inputMode="tel" autoComplete="off" />
        </Veld>
        <Veld label="Club" id={`club-${id}`}>
          <select id={`club-${id}`} className="ptd-invoer" value={v.club ?? ''} onChange={(e) => zet('club', isClub(e.target.value) ? e.target.value : null)}>
            <option value="">Kies…</option>
            {CLUBS.map((c) => <option key={c} value={c}>{CLUB_LABEL[c]}</option>)}
          </select>
        </Veld>
        <Veld label="Status" id={`status-${id}`}>
          <select id={`status-${id}`} className="ptd-invoer" value={v.status} onChange={(e) => isStatus(e.target.value) && zet('status', e.target.value)}>
            {LEAD_STATUSSEN.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </Veld>
      </div>

      <Keuzes label="Bron *" opties={LEAD_BRONNEN.map((b) => ({ waarde: b, label: BRON_LABEL[b] }))} waarde={v.bron} onKies={(b) => b && zet('bron', b)} />
      <Keuzes label="Interesse" leegToegestaan opties={INTERESSES.map((i) => ({ waarde: i, label: INTERESSE_LABEL[i] }))} waarde={v.interesse} onKies={(i) => zet('interesse', i)} />

      <div className="ptd-raster">
        <Veld label="Volgende stap" id={`stap-${id}`}>
          <select id={`stap-${id}`} className="ptd-invoer" value={v.volgendeStap ?? ''} onChange={(e) => zet('volgendeStap', isStap(e.target.value) ? e.target.value : null)}>
            <option value="">Nog niet bepaald</option>
            {STAPPEN.map((s) => <option key={s} value={s}>{STAP_LABEL[s]}</option>)}
          </select>
        </Veld>
        <Veld label="Opvolgdatum" id={`opvolg-${id}`}>
          <input id={`opvolg-${id}`} type="date" className="ptd-invoer" value={v.opvolgdatum ?? ''} onChange={(e) => zet('opvolgdatum', e.target.value || null)} />
        </Veld>
      </div>
      <div className="ptd-keuzes" aria-label="Snel een opvolgdatum kiezen">
        {SNEL.map((s) => (
          <button key={s.dagen} type="button" className="ptd-chip" aria-pressed={v.opvolgdatum === plusDagen(vandaag, s.dagen)} onClick={() => zet('opvolgdatum', plusDagen(vandaag, s.dagen))}>
            {s.label}
          </button>
        ))}
      </div>

      {meer ? (
        <>
          <div className="ptd-raster">
            <Veld label="Gesproken op" id={`datum-${id}`}>
              <input id={`datum-${id}`} type="date" className="ptd-invoer" max={vandaag} value={v.gesprokenOp} onChange={(e) => e.target.value && zet('gesprokenOp', e.target.value)} />
            </Veld>
            <Veld label="Kent iemand die openstaat?" id={`kent-${id}`}>
              <input id={`kent-${id}`} className="ptd-invoer" value={v.kentIemand ?? ''} onChange={(e) => zet('kentIemand', e.target.value || null)} maxLength={200} placeholder="Naam of 'nee'" />
            </Veld>
          </div>
          <div className="ptd-raster">
            <label className="ptd-vinkje"><input type="checkbox" checked={v.reviewGevraagd} onChange={(e) => zet('reviewGevraagd', e.target.checked)} /> Google review gevraagd</label>
            <label className="ptd-vinkje"><input type="checkbox" checked={v.referralGevraagd} onChange={(e) => zet('referralGevraagd', e.target.checked)} /> Referral gevraagd</label>
          </div>
          <Veld label="Notities" id={`notitie-${id}`}>
            <textarea id={`notitie-${id}`} className="ptd-invoer" value={v.notitie ?? ''} onChange={(e) => zet('notitie', e.target.value || null)} maxLength={1000} placeholder="Doel, situatie, afspraken…" />
          </Veld>
        </>
      ) : (
        <button type="button" className="ptd-tekstknop" onClick={() => setMeer(true)}>
          + Meer details (notities, datum, review, referral)
        </button>
      )}

      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : lead ? 'Opslaan' : 'Lead opslaan'}</button>
        <button type="button" className="ptd-knop" onClick={onAnnuleer} disabled={bezig}>Annuleren</button>
        {lead && onVerwijderd ? (
          <button type="button" className="ptd-knop ptd-knop--gevaar ptd-rechts" onClick={() => void verwijder()} disabled={bezig}>Verwijderen</button>
        ) : null}
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
