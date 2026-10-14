'use client'

import { useState } from 'react'
import { WEEKDAG_LABEL } from '@/lib/club/rooster/openingstijden'
import type { Beschikbaarheid } from '@/lib/club/personeel/typen'
import { API, stuur, useActie } from './vraag'

// Vaste beschikbaarheid per weekdag: kan (eventueel tussen bepaalde tijden),
// kan niet, of geen voorkeur.

type Keuze = 'leeg' | 'ja' | 'nee'

interface Dag {
  keuze: Keuze
  van: string
  tot: string
}

function beginDagen(regels: readonly Beschikbaarheid[]): Dag[] {
  return Array.from({ length: 7 }, (_, i) => {
    const r = regels.find((x) => x.weekdag === i + 1)
    if (!r) return { keuze: 'leeg', van: '', tot: '' }
    return { keuze: r.beschikbaar ? 'ja' : 'nee', van: r.van ?? '', tot: r.tot ?? '' }
  })
}

export function VasteWeek({ medewerkerId, regels }: { medewerkerId: string; regels: Beschikbaarheid[] }) {
  const [dagen, setDagen] = useState<Dag[]>(() => beginDagen(regels))
  const [klaar, setKlaar] = useState(false)
  const { bezig, fout, voerUit } = useActie()
  const zet = (i: number, deel: Partial<Dag>) => {
    setKlaar(false)
    setDagen((oud) => oud.map((d, j) => (j === i ? { ...d, ...deel } : d)))
  }

  function bewaar() {
    const body = { medewerkerId, dagen: dagen.map((d) => ({ beschikbaar: d.keuze === 'leeg' ? null : d.keuze === 'ja', van: d.van || null, tot: d.tot || null })) }
    void voerUit(() => stuur(`${API}/beschikbaarheid/vast`, 'PUT', body), () => setKlaar(true))
  }

  return (
    <section className="club-kaart" aria-labelledby="club-personeel-vast">
      <h2 id="club-personeel-vast">Vaste week</h2>
      <div className="club-personeel-vastraster" role="table" aria-label="Vaste beschikbaarheid per dag">
        {dagen.map((d, i) => (
          <div key={WEEKDAG_LABEL[i]} className="club-personeel-vastrij" role="row" data-keuze={d.keuze}>
            <span role="rowheader" className="club-personeel-vastdag">{WEEKDAG_LABEL[i]}</span>
            <span role="cell">
              <select className="club-invoer" aria-label={`${WEEKDAG_LABEL[i]}: beschikbaar`} value={d.keuze} onChange={(e) => zet(i, { keuze: e.target.value === 'ja' ? 'ja' : e.target.value === 'nee' ? 'nee' : 'leeg' })}>
                <option value="leeg">Geen voorkeur</option>
                <option value="ja">Kan</option>
                <option value="nee">Kan niet</option>
              </select>
            </span>
            <span role="cell" className="club-personeel-vasttijd">
              {d.keuze === 'ja' && (
                <>
                  <input className="club-invoer" type="time" step={900} aria-label={`${WEEKDAG_LABEL[i]} vanaf`} value={d.van} onChange={(e) => zet(i, { van: e.target.value })} />
                  <span className="club-zacht">tot</span>
                  <input className="club-invoer" type="time" step={900} aria-label={`${WEEKDAG_LABEL[i]} tot`} value={d.tot} onChange={(e) => zet(i, { tot: e.target.value })} />
                </>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="club-hint">Leeg laten bij &quot;Kan&quot; betekent de hele dag. Losse datums (verlof, ziek) gaan altijd voor de vaste week.</p>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
      {klaar && <p className="club-hint" role="status">Vaste week opgeslagen.</p>}
      <button type="button" className="club-knop" disabled={bezig} onClick={bewaar}>
        Vaste week opslaan
      </button>
    </section>
  )
}
