'use client'

import { useState } from 'react'
import { Minus, Plus, Star } from 'lucide-react'
import { schaalNaarPortie } from '@/lib/club/voeding/dagboek/berekeningen'
import { HUISHOUDMATEN, gramVoor, type MaatId } from '@/lib/club/voeding/dagboek/huishoudmaten'
import type { Product } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'

// De portie kiezen: een huishoudmaat (chips) of grammen, met de macro's die
// meteen meeschalen. Standaard staat de laatst gebruikte of gangbare portie
// klaar, zodat "Toevoegen" meteen kan (snel loggen in 3 tikken).

export interface PortieKeuze {
  gram: number
  maat: MaatId | null
  aantal: number | null
}

interface PortieStapProps {
  product: Product
  t: VoedingDagboekTekst
  bezig: boolean
  favoriet: boolean | null
  onFavoriet?: () => void
  onToevoegen: (keuze: PortieKeuze) => void
}

export function PortieStap({ product, t, bezig, favoriet, onFavoriet, onToevoegen }: PortieStapProps) {
  const [gramTekst, setGramTekst] = useState(String(product.portieGram ?? 100))
  const [maat, setMaat] = useState<MaatId | null>(null)
  const [aantal, setAantal] = useState(1)
  const gram = Number(gramTekst.replace(',', '.'))
  const geldig = Number.isFinite(gram) && gram > 0 && gram <= 5000
  const m = schaalNaarPortie(product.per100, geldig ? gram : 0)

  function kiesMaat(id: MaatId) {
    setMaat(id)
    setGramTekst(String(gramVoor(id, aantal) ?? 100))
  }

  function zetAantal(n: number) {
    const veilig = Math.min(20, Math.max(0.5, n))
    setAantal(veilig)
    if (maat) setGramTekst(String(gramVoor(maat, veilig) ?? 100))
  }

  return (
    <div className="club-vd-portie">
      <div className="club-vd-portie-kop">
        <div>
          <strong>{product.naam}</strong>
          {(product.merk || product.hoeveelheid) && <span className="club-vd-hint">{[product.merk, product.hoeveelheid].filter(Boolean).join(' · ')}</span>}
        </div>
        {favoriet !== null && onFavoriet && (
          <button type="button" className={`club-vd-ster${favoriet ? ' is-aan' : ''}`} onClick={onFavoriet} aria-pressed={favoriet} aria-label={favoriet ? t.portieStap.favorietUit : t.portieStap.favorietAan}>
            <Star size={20} aria-hidden fill={favoriet ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <p className="club-vd-portie-macros" aria-live="polite">
        <strong>{m.kcal}</strong> {t.macro.kcal}
        <span>{t.macro.kortEiwit} {m.eiwitG}</span>
        <span>{t.macro.kortKh} {m.koolhydratenG}</span>
        <span>{t.macro.kortVet} {m.vetG}</span>
      </p>

      <span className="club-lidapp-label">{t.portieStap.hoeveel}</span>
      <div className="club-vd-chips" role="group" aria-label={t.portieStap.hoeveel}>
        {HUISHOUDMATEN.map((h) => (
          <button key={h.id} type="button" className={`club-vd-chip${maat === h.id ? ' is-aan' : ''}`} aria-pressed={maat === h.id} onClick={() => kiesMaat(h.id)}>
            {t.maten[h.id]}
          </button>
        ))}
      </div>

      <div className="club-vd-portie-velden">
        {maat && (
          <label className="club-vd-veld">
            <span>{t.portieStap.aantalLabel}</span>
            <span className="club-vd-stapper">
              <button type="button" onClick={() => zetAantal(aantal - 0.5)} aria-label={t.portieStap.minder}><Minus size={18} aria-hidden /></button>
              <output>{aantal}</output>
              <button type="button" onClick={() => zetAantal(aantal + 0.5)} aria-label={t.portieStap.meer}><Plus size={18} aria-hidden /></button>
            </span>
          </label>
        )}
        <label className="club-vd-veld">
          <span>{t.portieStap.gramLabel}</span>
          <input inputMode="decimal" value={gramTekst} onChange={(e) => { setGramTekst(e.target.value); setMaat(null) }} aria-invalid={!geldig} />
        </label>
      </div>
      {maat && <p className="club-vd-hint">{t.portieStap.maatUitleg}</p>}

      <button type="button" className="club-vd-hoofdknop" disabled={!geldig || bezig} onClick={() => onToevoegen({ gram: Math.round(gram * 10) / 10, maat, aantal: maat ? aantal : null })}>
        {bezig ? t.portieStap.bezig : t.portieStap.toevoegen}
      </button>
    </div>
  )
}
