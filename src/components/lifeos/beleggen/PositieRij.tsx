'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { PositieRegel } from '@/lib/lifeos/beleggen/portefeuille'
import { aantal, euro, euroMetTeken, koers, procent, richting } from './formaat'

// Eén positie: naam, koers + vandaag, waarde, winst/verlies. Potlood → aantal,
// GAK en (optioneel) je inleg in euro aanpassen. Prullenbak = verkocht.

interface Props {
  r: PositieRegel
  onBewaar: (id: string, w: { aantal: string; aankoopprijs: string; inlegEur: string }) => Promise<boolean>
  onVerwijder: (id: string) => Promise<void>
}

export function PositieRij({ r, onBewaar, onVerwijder }: Props) {
  const [bewerk, setBewerk] = useState(false)
  const [form, setForm] = useState({ aantal: String(r.aantal), aankoopprijs: r.aankoopprijs?.toString() ?? '', inlegEur: r.inlegEur?.toString() ?? '' })
  const vreemd = r.koersValuta !== 'EUR'

  if (bewerk) {
    return (
      <li className="bel__rij bel__rij--bewerk">
        <p className="bel__naam">{r.naam}</p>
        <div className="bel__velden">
          <label>Aantal<input inputMode="decimal" value={form.aantal} onChange={(e) => setForm({ ...form, aantal: e.target.value })} /></label>
          <label>GAK ({r.koersValuta})<input inputMode="decimal" value={form.aankoopprijs} placeholder="bv. 110,578" onChange={(e) => setForm({ ...form, aankoopprijs: e.target.value })} /></label>
          {vreemd ? (
            <label>Inleg in € (optioneel)<input inputMode="decimal" value={form.inlegEur} placeholder="waarde − W/V uit DEGIRO" onChange={(e) => setForm({ ...form, inlegEur: e.target.value })} /></label>
          ) : null}
        </div>
        <div className="bel__knoppen">
          <button type="button" className="bel__knop bel__knop--primair" onClick={async () => { if (await onBewaar(r.id, form)) setBewerk(false) }}>Opslaan</button>
          <button type="button" className="bel__knop" onClick={() => setBewerk(false)}>Annuleren</button>
        </div>
      </li>
    )
  }

  return (
    <li className="bel__rij">
      <div className="bel__wie">
        <p className="bel__naam">{r.naam}</p>
        <p className="bel__sub">
          {r.symbool} · {aantal(r.aantal)} st.
          {r.koers !== null ? <> · {koers(r.koers, r.koersValuta)}</> : <> · geen koers</>}
          {r.dagPct !== null ? <span className={richting(r.dagPct)}> {procent(r.dagPct)} vandaag</span> : null}
        </p>
      </div>
      <div className="bel__getal">
        <p className="bel__waarde">{r.waardeEur !== null ? euro(r.waardeEur) : '—'}</p>
        <p className={`bel__sub ${richting(r.winstEur)}`}>
          {r.winstEur !== null && r.winstPct !== null ? `${euroMetTeken(r.winstEur)} (${procent(r.winstPct)})` : 'GAK invullen'}
        </p>
      </div>
      <div className="bel__acties">
        <button type="button" className="bel__icoon" aria-label={`${r.naam} bewerken`} onClick={() => setBewerk(true)}><Pencil size={14} aria-hidden /></button>
        <button type="button" className="bel__icoon" aria-label={`${r.naam} verwijderen`} onClick={() => { if (window.confirm(`${r.naam} verwijderen uit je overzicht?`)) void onVerwijder(r.id) }}><Trash2 size={14} aria-hidden /></button>
      </div>
    </li>
  )
}
