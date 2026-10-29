'use client'

import { useState } from 'react'
import type { GeplandeRij, ImportActie } from '@/lib/club/leden/import/plan'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

// Stap 3: wat het inlezen gaat doen, voordat er iets verandert.

export interface Controle {
  telling: Record<ImportActie, number>
  nietInBestand: number
  fouten: { regel: number; fout: string }[]
  waarschuwingen: number
  rijen: GeplandeRij[]
}

const ACTIE_CHIP: Record<ImportActie, string> = {
  nieuw: 'club-chip--ok',
  bijwerken: 'club-chip--info',
  gelijk: 'club-chip--uit',
  dubbel: 'club-chip--let-op',
}

const TOON = 150

export function ImportOverzicht({ controle }: { controle: Controle }) {
  const [filter, setFilter] = useState<ImportActie | null>(null)
  const t = useTekst(LEDEN).import
  const kolomLabel: Record<string, string> = t.kolomLabels
  const zichtbaar = controle.rijen.filter((r) => !filter || r.actie === filter)
  return (
    <div className="club-import-overzicht">
      <div className="club-import-tegels" role="group" aria-label={t.filterLabel}>
        {(Object.keys(ACTIE_CHIP) as ImportActie[]).map((actie) => (
          <button
            key={actie}
            type="button"
            className="club-import-tegel"
            data-actie={actie}
            aria-pressed={filter === actie}
            onClick={() => setFilter(filter === actie ? null : actie)}
          >
            <span className="club-tegel-label">{t.acties[actie].label}</span>
            <span className="club-import-tegel-getal club-getal">{controle.telling[actie]}</span>
            <span className="club-tegel-sub">{t.acties[actie].sub}</span>
          </button>
        ))}
      </div>

      <ul className="club-import-notities">
        {controle.nietInBestand > 0 && (
          <li>{t.nietInBestand(controle.nietInBestand)}</li>
        )}
        {controle.waarschuwingen > 0 && <li>{t.waarschuwingen(controle.waarschuwingen)}</li>}
        <li>{t.blijftStaan}</li>
      </ul>

      {controle.fouten.length > 0 && (
        <div className="club-melding club-melding--fout" role="alert">
          <strong>{t.overgeslagen(controle.fouten.length)}</strong>
          <ul className="club-import-fouten">
            {controle.fouten.slice(0, 12).map((f) => (
              <li key={f.regel}>{t.regelFout(f.regel, f.fout)}</li>
            ))}
            {controle.fouten.length > 12 && <li>{t.nogAndere(controle.fouten.length - 12)}</li>}
          </ul>
        </div>
      )}

      <div className="club-tabel-wrap club-import-tabel">
        <table className="club-tabel">
          <thead>
            <tr>
              <th scope="col">{t.kopRegel}</th>
              <th scope="col">{t.kopNaam}</th>
              <th scope="col">{t.kopWat}</th>
              <th scope="col">{t.kopVerandert}</th>
            </tr>
          </thead>
          <tbody>
            {zichtbaar.slice(0, TOON).map((r) => (
              <tr key={r.regel}>
                <td className="club-getal">{r.regel}</td>
                <td>{r.naam}</td>
                <td>
                  <span className={`club-chip ${ACTIE_CHIP[r.actie]}`}>{t.acties[r.actie].label}</span>
                </td>
                <td className="club-import-wijziging">{Object.keys(r.wijziging).map((k) => kolomLabel[k] ?? k).join(', ') || ' '}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {zichtbaar.length > TOON && <p className="club-hint">{t.eersteRegels(TOON, zichtbaar.length)}</p>}
    </div>
  )
}
