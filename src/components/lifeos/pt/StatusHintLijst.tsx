'use client'

import { UserCheck } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import type { PtStatusHint } from '@/lib/lifeos/pt-klant/klantstatus'
import { useBevestig } from './useBevestig'
import { KOP, LIJST, RIJ, SECTIE, TOELICHTING } from './lijstStijl'

// Klanten die al trainen maar in je CRM nog als prospect staan (zie
// `pt-klant/klantstatus`). Zolang de status niet klopt, tellen ze niet mee in je
// weekplanning. LifeOS stelt voor; één tik zet ze op Actieve klant. Niemand → niets.

const LIMIET = 5

interface Props {
  hints: readonly PtStatusHint[]
  onGewijzigd: () => Promise<void>
}

export function StatusHintLijst({ hints, onGewijzigd }: Props) {
  const { bezig, fout, voerUit } = useBevestig(onGewijzigd)
  if (hints.length === 0) return null
  const zichtbaar = hints.slice(0, LIMIET)
  const rest = hints.length - zichtbaar.length

  return (
    <section aria-labelledby="pt-statushint-kop" style={SECTIE}>
      <h3 id="pt-statushint-kop" style={KOP}>
        <UserCheck size={14} strokeWidth={2.2} aria-hidden style={{ color: 'var(--brand)' }} />
        Traint al, staat als prospect
      </h3>
      <p style={TOELICHTING}>Deze klanten tellen niet mee in je weekplanning tot je ze op Actieve klant zet.</p>
      <ul style={LIJST}>
        {zichtbaar.map((h) => (
          <li key={h.id} style={RIJ}>
            <span style={{ color: 'var(--text-1)', minWidth: 0 }}>
              {h.naam}{' '}
              <span style={{ color: 'var(--text-3)' }}>
                · <span className="os-cijfer">{h.sessies}×</span> · {h.statusLabel}
              </span>
            </span>
            <Knop
              disabled={bezig !== null}
              aria-label={`Zet ${h.naam} op Actieve klant`}
              onClick={() =>
                void voerUit(h.id, [
                  { pad: `/api/lifeos/crm/personen/${h.id}`, methode: 'PATCH', body: { groep: 'pt_klant', status: 'actieve_klant' } },
                ])
              }
            >
              {bezig === h.id ? 'Bezig…' : 'Zet op actief'}
            </Knop>
          </li>
        ))}
      </ul>
      {rest > 0 ? <p style={TOELICHTING}>en nog {rest} {rest === 1 ? 'klant' : 'klanten'}</p> : null}
      {fout ? <Foutmelding bericht={fout} /> : null}
    </section>
  )
}
