'use client'

import { useState } from 'react'
import { FileUp, Plus, Search } from 'lucide-react'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesZoekResultaten, type ZoekJson } from '@/lib/lifeos/beleggen/lees'

// Toevoegen: zoek op ticker, naam of ISIN → kies de notering → aantal + GAK.
// Of: importeer je DEGIRO-export (Portefeuille → Exporteren → CSV).

interface Props {
  onVoegToe: (v: { symbool: string; aantal: string; aankoopprijs: string }) => Promise<boolean>
  onImporteer: (csv: string) => Promise<string | null>
}

export function Toevoegen({ onVoegToe, onImporteer }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [resultaten, setResultaten] = useState<ZoekJson[]>([])
  const [gekozen, setGekozen] = useState<ZoekJson | null>(null)
  const [form, setForm] = useState({ aantal: '', aankoopprijs: '' })
  const [melding, setMelding] = useState<string | null>(null)

  async function zoek() {
    if (q.trim().length < 2) return
    const uit = await haalJson(`/api/lifeos/beleggen/zoek?q=${encodeURIComponent(q.trim())}`, leesZoekResultaten)
    setResultaten(uit.ok ? uit.waarde : [])
    setMelding(uit.ok && uit.waarde.length === 0 ? 'Niets gevonden — probeer de ticker of ISIN.' : null)
  }

  async function importeer(bestand: File | undefined) {
    if (!bestand) return
    setMelding('Bezig met inlezen…')
    setMelding(await onImporteer(await bestand.text()))
  }

  if (!open) {
    return (
      <div className="bel__toevoegen-knoppen">
        <button type="button" className="bel__knop" onClick={() => setOpen(true)}><Plus size={14} aria-hidden /> Positie toevoegen</button>
        <label className="bel__knop">
          <FileUp size={14} aria-hidden /> DEGIRO-export importeren
          <input type="file" accept=".csv,text/csv" className="bel__verborgen" onChange={(e) => void importeer(e.target.files?.[0])} />
        </label>
        {melding ? <p className="bel__sub" role="status">{melding}</p> : null}
      </div>
    )
  }

  return (
    <div className="bel__toevoegen">
      {!gekozen ? (
        <>
          <form className="bel__zoek" onSubmit={(e) => { e.preventDefault(); void zoek() }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ticker, naam of ISIN — bv. VUSA, ASML, IE00B3XXRP09" aria-label="Zoek een aandeel of ETF" autoFocus />
            <button type="submit" className="bel__knop" aria-label="Zoeken"><Search size={14} aria-hidden /></button>
          </form>
          {resultaten.length > 0 ? (
            <ul className="bel__resultaten">
              {resultaten.map((r) => (
                <li key={r.symbool}>
                  <button type="button" onClick={() => setGekozen(r)}>
                    <strong>{r.symbool}</strong> {r.naam} <span className="bel__sub">· {r.beurs}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <form className="bel__velden" onSubmit={async (e) => {
          e.preventDefault()
          if (await onVoegToe({ symbool: gekozen.symbool, ...form })) {
            setOpen(false); setGekozen(null); setQ(''); setResultaten([]); setForm({ aantal: '', aankoopprijs: '' })
          }
        }}>
          <p className="bel__naam">{gekozen.naam} <span className="bel__sub">({gekozen.symbool} · {gekozen.beurs})</span></p>
          <label>Aantal<input inputMode="decimal" required value={form.aantal} onChange={(e) => setForm({ ...form, aantal: e.target.value })} /></label>
          <label>GAK per stuk (optioneel)<input inputMode="decimal" value={form.aankoopprijs} onChange={(e) => setForm({ ...form, aankoopprijs: e.target.value })} /></label>
          <div className="bel__knoppen">
            <button type="submit" className="bel__knop bel__knop--primair">Toevoegen</button>
            <button type="button" className="bel__knop" onClick={() => setGekozen(null)}>Andere kiezen</button>
          </div>
        </form>
      )}
      {melding ? <p className="bel__sub" role="status">{melding}</p> : null}
      <button type="button" className="bel__knop bel__knop--stil" onClick={() => { setOpen(false); setGekozen(null) }}>Sluiten</button>
    </div>
  )
}
