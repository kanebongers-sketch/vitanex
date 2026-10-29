'use client'

import { IMPORT_VELDEN, importVeldLabel, isVerplicht, type ImportVeld, type Koppeling } from '@/lib/club/leden/import/kolommen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

// Stap 2: welke kolom uit het bestand hoort bij welk veld. Vooraf ingevuld met
// wat we herkennen; met een voorbeeldwaarde uit de eerste rij ernaast. Met een
// kolom Volledige naam zijn voornaam en achternaam niet meer verplicht.

interface KolomKoppelingProps {
  koppen: string[]
  eersteRij: string[] | null
  koppeling: Koppeling
  onWijzig: (veld: ImportVeld, kolom: number | null) => void
}

export function KolomKoppeling({ koppen, eersteRij, koppeling, onWijzig }: KolomKoppelingProps) {
  const taal = useTaal()
  const t = useTekst(LEDEN).import
  return (
    <div className="club-import-koppeling">
      {IMPORT_VELDEN.map((veld) => {
        const kolom = koppeling[veld]
        const voorbeeld = kolom !== null ? eersteRij?.[kolom] : null
        const verplicht = isVerplicht(veld, koppeling)
        return (
          <label key={veld} className="club-import-veld" data-leeg={kolom === null || undefined}>
            <span className="club-import-veldnaam">
              {importVeldLabel(veld, taal)}
              {verplicht && <span className="club-import-verplicht"> {t.verplicht}</span>}
              {veld === 'volledigeNaam' && <span className="club-zacht"> {t.alsGeenNaam}</span>}
            </span>
            <select
              aria-required={verplicht}
              aria-invalid={verplicht && kolom === null}
              className="club-invoer"
              value={kolom ?? ''}
              onChange={(e) => onWijzig(veld, e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">{t.nietInlezen}</option>
              {koppen.map((kop, i) => (
                <option key={i} value={i}>
                  {kop || t.kolom(i + 1)}
                </option>
              ))}
            </select>
            <span className="club-import-voorbeeld">{voorbeeld ? t.voorbeeld(voorbeeld.slice(0, 40)) : ' '}</span>
          </label>
        )
      })}
    </div>
  )
}
