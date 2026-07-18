'use client'

import { type CSSProperties } from 'react'
import { PencilLine } from 'lucide-react'
import type { KalenderJson } from '@/lib/lifeos/agenda/agenda'

// De schrijf-doel-kiezer: in wélke Google-agenda NIEUWE afspraken en focusblokken
// landen. Bewust iets anders dan de weergave-vinkjes ernaast (die bepalen wat je
// ZIET). Presentationeel: de data en het opslaan komen van de container
// (`AgendaKalenders`); dit component toont alleen de keuze.

interface AgendaKiezerProps {
  /** Alleen de beschrijfbare agenda's (owner/writer) — in de rest kun je niet plannen. */
  kalenders: KalenderJson[]
  /** De huidige keuze (kalender-id), of null = de primaire agenda. */
  schrijfDoel: string | null
  /** Staat er een opslag-actie open? Dan disablen we de select. */
  bezig: boolean
  onKies: (kalenderId: string) => void
}

export function AgendaKiezer({ kalenders, schrijfDoel, bezig, onKies }: AgendaKiezerProps) {
  // Geen beschrijfbare agenda gevonden: niets te kiezen. Eerlijk melden i.p.v. een
  // lege select tonen.
  if (kalenders.length === 0) {
    return (
      <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
        Geen agenda gevonden waarin je mag schrijven.
      </p>
    )
  }

  // null (nog geen keuze) = de primaire agenda: toon die als geselecteerd.
  const gekozenId =
    schrijfDoel ??
    kalenders.find((k) => k.primair)?.id ??
    kalenders[0]?.id ??
    ''

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label htmlFor="agenda-schrijfdoel" style={LABEL}>
        Nieuwe afspraken gaan naar
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <PencilLine
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
          style={{ position: 'absolute', left: 11, color: 'var(--text-4)', pointerEvents: 'none' }}
        />
        <select
          id="agenda-schrijfdoel"
          value={gekozenId}
          disabled={bezig}
          onChange={(e) => onKies(e.target.value)}
          style={SELECT}
        >
          {kalenders.map((k) => (
            <option key={k.id} value={k.id}>
              {k.primair ? `${k.naam} (hoofdagenda)` : k.naam}
            </option>
          ))}
        </select>
      </div>
      {bezig ? <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Bijwerken…</span> : null}
    </div>
  )
}

const LABEL: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
}

const SELECT: CSSProperties = {
  width: '100%',
  minWidth: 0,
  // Ruimte links voor het icoon, rechts voor de eigen dropdown-pijl.
  padding: '9px 12px 9px 34px',
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
  colorScheme: 'dark',
}
