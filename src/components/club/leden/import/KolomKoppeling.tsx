'use client'

import { IMPORT_VELDEN, IMPORT_VELD_LABEL, VERPLICHTE_VELDEN, type ImportVeld, type Koppeling } from '@/lib/club/leden/import/kolommen'

// Stap 2: welke kolom uit het bestand hoort bij welk veld. Vooraf ingevuld met
// wat we herkennen; met een voorbeeldwaarde uit de eerste rij ernaast.

interface KolomKoppelingProps {
  koppen: string[]
  eersteRij: string[] | null
  koppeling: Koppeling
  onWijzig: (veld: ImportVeld, kolom: number | null) => void
}

export function KolomKoppeling({ koppen, eersteRij, koppeling, onWijzig }: KolomKoppelingProps) {
  return (
    <div className="club-import-koppeling">
      {IMPORT_VELDEN.map((veld) => {
        const kolom = koppeling[veld]
        const voorbeeld = kolom !== null ? eersteRij?.[kolom] : null
        const verplicht = VERPLICHTE_VELDEN.includes(veld)
        return (
          <label key={veld} className="club-import-veld" data-leeg={kolom === null || undefined}>
            <span className="club-import-veldnaam">
              {IMPORT_VELD_LABEL[veld]}
              {verplicht && <span className="club-import-verplicht"> verplicht</span>}
            </span>
            <select
              className="club-invoer"
              value={kolom ?? ''}
              onChange={(e) => onWijzig(veld, e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">Niet inlezen</option>
              {koppen.map((kop, i) => (
                <option key={i} value={i}>
                  {kop || `Kolom ${i + 1}`}
                </option>
              ))}
            </select>
            <span className="club-import-voorbeeld">{voorbeeld ? `bv. ${voorbeeld.slice(0, 40)}` : ' '}</span>
          </label>
        )
      })}
    </div>
  )
}
