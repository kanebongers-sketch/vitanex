'use client'

import { plusDagen } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagLang } from '@/lib/lifeos/pt-dashboard/datum'
import { Veld } from './velden'

// De periode van een bevriezing: vanaf (verplicht) en tot en met (mag leeg,
// maar invullen is beter: daarna staat de klant vanzelf weer op actief).

interface Props {
  id: string
  startdatum: string
  van: string | null
  tot: string | null
  onVan: (dag: string | null) => void
  onTot: (dag: string | null) => void
}

export function BevriesVelden({ id, startdatum, van, tot, onVan, onTot }: Props) {
  const totHint = tot
    ? `Vanaf ${dagLang(plusDagen(tot, 1))} telt de klant vanzelf weer als actief.`
    : 'Weet je de einddatum? Vul hem in: daarna telt de klant vanzelf weer als actief. Leeg = einddatum onbekend.'
  return (
    <>
      <p className="ptd-hint">
        Bevroren (blessure, ziekte): het abonnement loopt door. In de bevroren dagen telt de klant niet mee in de sessies per week en in de omzet van die maand.
      </p>
      <div className="ptd-raster">
        <Veld label="Bevroren vanaf *" id={`kbvan-${id}`}>
          <input
            id={`kbvan-${id}`}
            type="date"
            className="ptd-invoer"
            min={startdatum}
            value={van ?? ''}
            onChange={(e) => onVan(e.target.value || null)}
            required
          />
        </Veld>
        <Veld label="Bevroren tot en met" id={`kbtot-${id}`} hint={totHint}>
          <input
            id={`kbtot-${id}`}
            type="date"
            className="ptd-invoer"
            min={van ?? startdatum}
            value={tot ?? ''}
            onChange={(e) => onTot(e.target.value || null)}
          />
        </Veld>
      </div>
    </>
  )
}
