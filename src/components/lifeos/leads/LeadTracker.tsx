'use client'

import { useState } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { LeadFormulier } from './LeadFormulier'
import { LEAD_STATUSSEN, STATUS_LABEL, BRON_LABEL, isStatus, type Lead, type LeadStatus } from '@/lib/lifeos/leads/leads'
import { veldStijl } from './stijl'
import { LeadKop } from './LeadKop'

// De lead tracker van één PT'er: bovenaan snel een gesprek toevoegen, daaronder
// je leads met hun status. Mobiel eerst — dit vul je in tussen twee klanten door.

interface Props {
  code: string
  naam: string
  begin: Lead[]
  leesFout: boolean
}

const DAG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

export function LeadTracker({ code, naam, begin, leesFout }: Props) {
  const [leads, setLeads] = useState<Lead[]>(begin)
  const [fout, setFout] = useState<string | null>(null)
  // Eén vast "nu" per paginaload: de telling verspringt niet tijdens het renderen.
  const [weekGrens] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000)
  const dezeWeek = leads.filter((l) => new Date(l.aangemaaktOp).getTime() >= weekGrens).length
  const klanten = leads.filter((l) => l.status === 'klant').length

  async function wijzigStatus(id: string, status: LeadStatus) {
    setFout(null)
    const vorige = leads
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
    const res = await fetch(`/api/lead/${encodeURIComponent(code)}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => null)
    if (!res?.ok) {
      setLeads(vorige)
      setFout('Status opslaan mislukt. Probeer het opnieuw.')
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'grid', gap: 22 }}>
      <LeadKop titel={`Hoi ${naam}, wie heb je gesproken?`}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--text-2)' }}>
          Vul elk gesprek met een potentiële klant in. We bespreken je leads elke week in het coachgesprek.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
          {dezeWeek} deze week · {leads.length} totaal · {klanten} klant{klanten === 1 ? '' : 'en'} geworden
        </p>
      </LeadKop>

      <LeadFormulier code={code} onToegevoegd={(l) => setLeads((ls) => [l, ...ls])} />

      <section aria-labelledby="mijn-leads" style={{ display: 'grid', gap: 10 }}>
        <h2 id="mijn-leads" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}>Mijn leads</h2>
        {leesFout ? <Foutmelding bericht="Je eerdere leads konden niet geladen worden. Vernieuw de pagina." /> : null}
        {fout ? <Foutmelding bericht={fout} /> : null}
        {!leesFout && leads.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)' }}>Nog geen leads. Je eerste gesprek komt hier te staan.</p>
        ) : null}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {leads.map((l) => (
            <LeadRij key={l.id} lead={l} onStatus={(s) => void wijzigStatus(l.id, s)} />
          ))}
        </ul>
      </section>

      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--text-3)' }}>
        Deze pagina is persoonlijk: deel je pincode niet. Vul alleen in wat nodig is om op te volgen (naam, eventueel een nummer of
        Instagram) en vraag of je diegene mag benaderen. Gegevens staan in de EU en zijn alleen zichtbaar voor jou en Kane.
      </p>
    </div>
  )
}

function LeadRij({ lead, onStatus }: { lead: Lead; onStatus: (s: LeadStatus) => void }) {
  const id = `status-${lead.id}`
  return (
    <li style={{ display: 'grid', gap: 6, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', overflowWrap: 'anywhere' }}>{lead.naam}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {lead.gesprokenOp ? DAG.format(new Date(`${lead.gesprokenOp}T12:00:00`)) : ''} · {BRON_LABEL[lead.bron]}
        </span>
      </div>
      {lead.contact ? <span style={{ fontSize: 13, color: 'var(--text-2)', overflowWrap: 'anywhere' }}>{lead.contact}</span> : null}
      {lead.notitie ? <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{lead.notitie}</span> : null}
      <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
        Status
        <select
          id={id}
          value={lead.status}
          onChange={(e) => {
            if (isStatus(e.target.value)) onStatus(e.target.value)
          }}
          style={{ ...selectStijl, color: lead.status === 'klant' ? 'var(--brand)' : 'var(--text-1)' }}
        >
          {LEAD_STATUSSEN.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
    </li>
  )
}

const selectStijl: React.CSSProperties = { ...veldStijl, appearance: 'auto', width: 'auto', fontSize: 14, padding: '7px 10px' }
