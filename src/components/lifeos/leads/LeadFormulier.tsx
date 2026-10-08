'use client'

import { useState, type FormEvent } from 'react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { LEAD_BRONNEN, LEAD_STATUSSEN, BRON_LABEL, STATUS_LABEL, isBron, isStatus, leesLead, type Lead, type LeadBron, type LeadStatus } from '@/lib/lifeos/leads/leads'
import { veldStijl } from './stijl'

// Eén gesprek toevoegen. Naam + waar gesproken zijn genoeg; de rest is optioneel,
// zodat invullen in de gym tussen twee klanten door geen klus wordt.

interface Props {
  code: string
  onToegevoegd: (lead: Lead) => void
}

function vandaag(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function LeadFormulier({ code, onToegevoegd }: Props) {
  const [naam, setNaam] = useState('')
  const [contact, setContact] = useState('')
  const [bron, setBron] = useState<LeadBron>('gym')
  const [status, setStatus] = useState<LeadStatus>('gesproken')
  const [notitie, setNotitie] = useState('')
  const [datum, setDatum] = useState(vandaag)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [gelukt, setGelukt] = useState<string | null>(null)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!naam.trim()) {
      setFout('Vul de naam in van wie je gesproken hebt.')
      return
    }
    setBezig(true)
    setFout(null)
    setGelukt(null)
    const res = await fetch(`/api/lead/${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ naam, contact, bron, status, notitie, gesprokenOp: datum }),
    }).catch(() => null)
    const body: unknown = res ? await res.json().catch(() => null) : null
    setBezig(false)
    const lead = res?.ok ? leesLead(body) : null
    if (!lead) {
      const melding = typeof body === 'object' && body !== null && typeof (body as Record<string, unknown>).fout === 'string'
        ? String((body as Record<string, unknown>).fout)
        : 'Opslaan mislukt. Controleer je verbinding en probeer het opnieuw.'
      setFout(melding)
      return
    }
    onToegevoegd(lead)
    setGelukt(`${lead.naam} staat erin.`)
    setNaam('')
    setContact('')
    setNotitie('')
    setStatus('gesproken')
  }

  return (
    <form
      onSubmit={(e) => void verstuur(e)}
      aria-labelledby="nieuw-gesprek"
      style={{ display: 'grid', gap: 12, padding: 16, borderRadius: 14, border: '1px solid var(--line-strong)', background: 'var(--bg-card)' }}
    >
      <h2 id="nieuw-gesprek" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}>Nieuw gesprek</h2>
      <Veld label="Naam" id="lead-naam">
        <input id="lead-naam" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={120} autoComplete="off" required style={veldStijl} />
      </Veld>
      <Veld label="Telefoon, e-mail of Instagram (optioneel)" id="lead-contact">
        <input id="lead-contact" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={160} autoComplete="off" style={veldStijl} />
      </Veld>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <Veld label="Waar gesproken" id="lead-bron">
          <select id="lead-bron" value={bron} onChange={(e) => isBron(e.target.value) && setBron(e.target.value)} style={kiesStijl}>
            {LEAD_BRONNEN.map((b) => <option key={b} value={b}>{BRON_LABEL[b]}</option>)}
          </select>
        </Veld>
        <Veld label="Status" id="lead-status">
          <select id="lead-status" value={status} onChange={(e) => isStatus(e.target.value) && setStatus(e.target.value)} style={kiesStijl}>
            {LEAD_STATUSSEN.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </Veld>
        <Veld label="Datum" id="lead-datum">
          <input id="lead-datum" type="date" value={datum} max={vandaag()} onChange={(e) => setDatum(e.target.value)} style={veldStijl} />
        </Veld>
      </div>
      <Veld label="Notitie (optioneel)" id="lead-notitie">
        <textarea id="lead-notitie" value={notitie} onChange={(e) => setNotitie(e.target.value)} maxLength={500} rows={2} style={{ ...veldStijl, resize: 'vertical' }} placeholder="Doel, wanneer terugbellen, …" />
      </Veld>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Knop type="submit" variant="primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Lead opslaan'}</Knop>
        <span role="status" aria-live="polite" style={{ fontSize: 13, color: 'var(--brand)' }}>{gelukt}</span>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}

function Veld({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-3)' }}>{label}</label>
      {children}
    </div>
  )
}

const kiesStijl: React.CSSProperties = { ...veldStijl, appearance: 'auto' }
