'use client'

import { useState } from 'react'
import type { GeplandeRij, ImportActie } from '@/lib/club/leden/import/plan'

// Stap 3: wat het inlezen gaat doen, voordat er iets verandert.

export interface Controle {
  telling: Record<ImportActie, number>
  nietInBestand: number
  fouten: { regel: number; fout: string }[]
  waarschuwingen: number
  rijen: GeplandeRij[]
}

const ACTIE: Record<ImportActie, { label: string; sub: string; chip: string }> = {
  nieuw: { label: 'Nieuw', sub: 'Worden toegevoegd', chip: 'club-chip--ok' },
  bijwerken: { label: 'Bijwerken', sub: 'Gegevens veranderen', chip: 'club-chip--info' },
  gelijk: { label: 'Al gelijk', sub: 'Er verandert niets', chip: 'club-chip--uit' },
  dubbel: { label: 'Dubbel', sub: 'Staat vaker in het bestand', chip: 'club-chip--let-op' },
}

const KOLOM_LABEL: Record<string, string> = {
  vestiging: 'verhuist naar deze vestiging', voornaam: 'voornaam', achternaam: 'achternaam', email: 'e-mail', telefoon: 'telefoon',
  geboortedatum: 'geboortedatum', geslacht: 'geslacht', abonnement: 'abonnement', status: 'status',
  lid_sinds: 'lid sinds', einddatum: 'einddatum', lidnummer: 'lidnummer', sportivity_id: 'extern klantnummer',
}

const TOON = 150

export function ImportOverzicht({ controle }: { controle: Controle }) {
  const [filter, setFilter] = useState<ImportActie | null>(null)
  const zichtbaar = controle.rijen.filter((r) => !filter || r.actie === filter)
  return (
    <div className="club-import-overzicht">
      <div className="club-import-tegels" role="group" aria-label="Filter op wat er gebeurt">
        {(Object.keys(ACTIE) as ImportActie[]).map((actie) => (
          <button
            key={actie}
            type="button"
            className="club-import-tegel"
            data-actie={actie}
            aria-pressed={filter === actie}
            onClick={() => setFilter(filter === actie ? null : actie)}
          >
            <span className="club-tegel-label">{ACTIE[actie].label}</span>
            <span className="club-import-tegel-getal club-getal">{controle.telling[actie]}</span>
            <span className="club-tegel-sub">{ACTIE[actie].sub}</span>
          </button>
        ))}
      </div>

      <ul className="club-import-notities">
        {controle.nietInBestand > 0 && (
          <li>
            {controle.nietInBestand} leden van deze vestiging staan niet in het bestand. Die blijven gewoon staan; er wordt nooit een lid verwijderd.
          </li>
        )}
        {controle.waarschuwingen > 0 && <li>{controle.waarschuwingen} velden hadden een onbekende waarde (bijvoorbeeld een datum) en worden leeg gelaten.</li>}
        <li>Coach, tags en QR-code van bestaande leden blijven altijd staan. Lege cellen wissen niets.</li>
      </ul>

      {controle.fouten.length > 0 && (
        <div className="club-melding club-melding--fout" role="alert">
          <strong>{controle.fouten.length} regels worden overgeslagen:</strong>
          <ul className="club-import-fouten">
            {controle.fouten.slice(0, 12).map((f) => (
              <li key={f.regel}>Regel {f.regel}: {f.fout}</li>
            ))}
            {controle.fouten.length > 12 && <li>En nog {controle.fouten.length - 12} andere.</li>}
          </ul>
        </div>
      )}

      <div className="club-tabel-wrap club-import-tabel">
        <table className="club-tabel">
          <thead>
            <tr>
              <th scope="col">Regel</th>
              <th scope="col">Naam</th>
              <th scope="col">Wat er gebeurt</th>
              <th scope="col">Verandert</th>
            </tr>
          </thead>
          <tbody>
            {zichtbaar.slice(0, TOON).map((r) => (
              <tr key={r.regel}>
                <td className="club-getal">{r.regel}</td>
                <td>{r.naam}</td>
                <td>
                  <span className={`club-chip ${ACTIE[r.actie].chip}`}>{ACTIE[r.actie].label}</span>
                </td>
                <td className="club-import-wijziging">{Object.keys(r.wijziging).map((k) => KOLOM_LABEL[k] ?? k).join(', ') || ' '}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {zichtbaar.length > TOON && <p className="club-hint">De eerste {TOON} van {zichtbaar.length} regels worden getoond.</p>}
    </div>
  )
}
