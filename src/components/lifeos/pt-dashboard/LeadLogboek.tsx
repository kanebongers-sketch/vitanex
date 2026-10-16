'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, MessageSquare, Plus, X } from 'lucide-react'
import {
  LEAD_STATUSSEN, MAX_LEADNOTITIE, OPEN_STATUSSEN, STATUS_LABEL, isStatus, leesLead, leesLeadNotitie,
  type Lead, type LeadNotitie, type LeadStatus,
} from '@/lib/lifeos/leads/leads'
import { plusDagen } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagKort, geleden } from '@/lib/lifeos/pt-dashboard/datum'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { leesLeeg, ptApi } from './api'
import { SNEL } from './LeadFormulier'

// Het logboek van een lead, zoals in MyLeads: elk contactmoment legt in één keer
// vast wat er gebeurde, de status daarna en wanneer je weer opvolgt (met tijd).
// De laatste notitie staat altijd op de kaart. Met `code` (de PT'er zelf, of
// Kane) leg je een moment vast en haal je een typfout weg; zonder is het alleen
// lezen (eigenaren, clubmanagers).

interface Props {
  lead: Lead
  vandaag: string
  /** De link-code voor de API; weglaten = alleen lezen. */
  code?: string
  /** De lead na een contactmoment (nieuwe status/opvolging), voor de lijst eromheen. */
  onLead?: (l: Lead) => void
}

function leesAntwoord(ruw: unknown): { notitie: LeadNotitie; lead: Lead } | null {
  const o = typeof ruw === 'object' && ruw !== null ? (ruw as Record<string, unknown>) : null
  const notitie = leesLeadNotitie(o?.notitie)
  const lead = leesLead(o?.lead)
  return notitie && lead ? { notitie, lead } : null
}

export const opvolgLabel = (datum: string, tijd: string | null) => `${dagKort(datum)}${tijd ? ` ${tijd}` : ''}`

function Regel({ n, vandaag }: { n: LeadNotitie; vandaag: string }) {
  return (
    <>
      <span className="ll-wanneer">{geleden(n.datum, vandaag)}{n.door ? ` · ${n.door}` : ''}</span>
      {n.status ? <span className="ptd-badge">{STATUS_LABEL[n.status]}</span> : null}
      <span className="ll-tekst">{n.tekst}</span>
      {n.opvolgdatum ? (
        <span className="ll-volgende"><ArrowRight size={12} aria-hidden /><span className="sr-only">volgende opvolging </span>{opvolgLabel(n.opvolgdatum, n.opvolgtijd)}</span>
      ) : null}
    </>
  )
}

export function LeadLogboek({ lead, vandaag, code, onLead }: Props) {
  const logboek = lead.logboek ?? []
  const [notities, setNotities] = useState<readonly LeadNotitie[]>(logboek)
  const [bron, setBron] = useState(lead.logboek)
  const [open, setOpen] = useState(false)
  const [tekst, setTekst] = useState('')
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [datum, setDatum] = useState(lead.opvolgdatum ?? '')
  const [tijd, setTijd] = useState(lead.opvolgtijd ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  // Nieuwe lead van de server (bv. na bewerken): het logboek volgt.
  if (lead.logboek !== bron) {
    setBron(lead.logboek)
    setNotities(lead.logboek ?? [])
  }
  const laatste = notities[0]
  const pad = `leads/${lead.id}/notities`
  const blijftOpen = OPEN_STATUSSEN.includes(status)

  function openForm() {
    setStatus(lead.status)
    setDatum(lead.opvolgdatum ?? '')
    setTijd(lead.opvolgtijd ?? '')
    setOpen((x) => !x)
  }

  async function legVast(e: FormEvent) {
    e.preventDefault()
    if (!code || bezig || !tekst.trim()) return
    setBezig(true)
    setFout(null)
    const body = { tekst, status, opvolgdatum: blijftOpen ? datum || null : null, opvolgtijd: blijftOpen && datum ? tijd || null : null }
    const uit = await ptApi(code, pad, 'POST', body, leesAntwoord)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setNotities(uit.waarde.lead.logboek ?? [uit.waarde.notitie, ...notities])
    setBron(uit.waarde.lead.logboek)
    setTekst('')
    setOpen(false)
    onLead?.(uit.waarde.lead)
  }

  async function haalWeg(n: LeadNotitie) {
    if (!code || bezig) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, `${pad}/${n.id}`, 'DELETE', undefined, leesLeeg)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setNotities((nu) => nu.filter((x) => x.id !== n.id))
  }

  const panelId = `logboek-${lead.id}`
  return (
    <div className="ll">
      <div className="ll-kop">
        {laatste ? (
          <p className="ll-laatste"><MessageSquare size={14} aria-hidden /><Regel n={laatste} vandaag={vandaag} /></p>
        ) : (
          <p className="ll-laatste ll-leeg"><MessageSquare size={14} aria-hidden />Nog geen contactmomenten</p>
        )}
        {code || notities.length > 1 ? (
          <button type="button" className="ptd-knop ptd-knop--klein" aria-expanded={open} aria-controls={panelId} onClick={openForm}>
            {code ? <><Plus size={14} aria-hidden /> Contactmoment</> : 'Logboek'}
            {notities.length > 0 ? ` (${notities.length})` : ''}
            <span className="sr-only"> bij {lead.naam}</span>
          </button>
        ) : null}
      </div>
      {open ? (
        <div id={panelId} className="ll-paneel">
          {code ? (
            <form className="ll-form" onSubmit={(e) => void legVast(e)}>
              <label className="ptd-veld">
                <span>Wat is er gebeurd? *</span>
                <textarea
                  className="ptd-invoer"
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value)}
                  maxLength={MAX_LEADNOTITIE}
                  placeholder="bv. gebeld, komt dinsdag om 18:00 voor een proefles"
                  rows={2}
                  autoFocus
                  required
                />
              </label>
              <div className="ptd-raster">
                <label className="ptd-veld">
                  <span>Status</span>
                  <select className="ptd-invoer" value={status} onChange={(e) => isStatus(e.target.value) && setStatus(e.target.value)}>
                    {LEAD_STATUSSEN.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </label>
                {blijftOpen ? (
                  <>
                    <label className="ptd-veld">
                      <span>Volgende opvolging</span>
                      <input type="date" className="ptd-invoer" value={datum} onChange={(e) => setDatum(e.target.value)} />
                    </label>
                    <label className="ptd-veld">
                      <span>Tijd</span>
                      <input type="time" step={300} className="ptd-invoer" value={tijd} disabled={!datum} onChange={(e) => setTijd(e.target.value)} />
                    </label>
                  </>
                ) : null}
              </div>
              {blijftOpen ? (
                <div className="ptd-keuzes" aria-label="Snel een opvolgdatum kiezen">
                  {SNEL.map((s) => (
                    <button key={s.dagen} type="button" className="ptd-chip" aria-pressed={datum === plusDagen(vandaag, s.dagen)} onClick={() => setDatum(plusDagen(vandaag, s.dagen))}>
                      {s.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="ptd-hint">Afgesloten: er staat daarna geen opvolging meer.</p>
              )}
              <div className="ptd-acties">
                <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig || !tekst.trim()}>{bezig ? 'Bezig…' : 'Vastleggen'}</button>
                <button type="button" className="ptd-knop" onClick={() => setOpen(false)} disabled={bezig}>Annuleren</button>
              </div>
            </form>
          ) : null}
          {fout ? <Foutmelding bericht={fout} /> : null}
          {notities.length > 0 ? (
            <ol className="ll-lijst" aria-label={`Logboek van ${lead.naam}`}>
              {notities.map((n) => (
                <li key={n.id}>
                  <Regel n={n} vandaag={vandaag} />
                  {code ? (
                    <button type="button" className="ll-weg" onClick={() => void haalWeg(n)} disabled={bezig} aria-label={`Notitie van ${geleden(n.datum, vandaag)} weghalen`}>
                      <X size={14} aria-hidden />
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
