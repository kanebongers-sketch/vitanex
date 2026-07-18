'use client'

import { type CSSProperties } from 'react'
import type { KalenderJson } from '@/lib/lifeos/agenda/agenda'

// De agenda-zijbalk: per Google-agenda een vinkje (tonen/verbergen in de
// weergave), een kleur-stipje in de eigen agenda-kleur, en de naam. Kleur is hier
// informatief — hij zegt WELKE agenda, precies zoals in het rooster. Bewust iets
// anders dan de schrijf-doel-kiezer eronder (waar nieuwe afspraken heen gaan).
//
// Presentationeel: de data en het opslaan komen van de container
// (`AgendaKalenders`). Toegankelijk: echte <input type=checkbox> met een gekoppeld
// <label>, cyaan accent en de focus-ring uit globals.css.

interface AgendaKalenderLijstProps {
  kalenders: KalenderJson[]
  /** De agenda waarvan het vinkje nu wordt opgeslagen (disabled), of null. */
  bezigId: string | null
  onToggle: (kalenderId: string, zichtbaar: boolean) => void
}

export function AgendaKalenderLijst({ kalenders, bezigId, onToggle }: AgendaKalenderLijstProps) {
  if (kalenders.length === 0) {
    return (
      <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>Geen agenda&apos;s gevonden.</p>
    )
  }

  const zichtbaarAantal = kalenders.filter((k) => k.zichtbaar).length

  return (
    <section aria-label="Agenda's tonen of verbergen" style={{ display: 'grid', gap: 8 }}>
      <p style={LABEL}>
        Mijn agenda&apos;s{' '}
        <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>
          · {zichtbaarAantal} van {kalenders.length} zichtbaar
        </span>
      </p>
      <ul style={LIJST}>
        {kalenders.map((k) => (
          <AgendaRij
            key={k.id}
            kalender={k}
            bezig={bezigId === k.id}
            onToggle={(zichtbaar) => onToggle(k.id, zichtbaar)}
          />
        ))}
      </ul>
    </section>
  )
}

function AgendaRij({
  kalender,
  bezig,
  onToggle,
}: {
  kalender: KalenderJson
  bezig: boolean
  onToggle: (zichtbaar: boolean) => void
}) {
  const id = `agenda-zichtbaar-${kalender.id}`
  const dotKleur = kalender.kleur ?? 'var(--text-4)'

  return (
    <li style={{ margin: 0 }}>
      <label
        htmlFor={id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '6px 8px',
          borderRadius: 8,
          cursor: bezig ? 'wait' : 'pointer',
          // Verborgen agenda's rustig dimmen — je ziet in één oogopslag wat aan staat.
          opacity: kalender.zichtbaar ? 1 : 0.55,
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={kalender.zichtbaar}
          disabled={bezig}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: 'var(--brand)', cursor: 'inherit', flexShrink: 0 }}
        />
        <span
          aria-hidden="true"
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: dotKleur,
            flexShrink: 0,
            border: '1px solid color-mix(in srgb, #060E1C 30%, transparent)',
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {kalender.naam}
          {kalender.primair ? (
            <span style={{ color: 'var(--text-4)', fontSize: 11 }}> · hoofdagenda</span>
          ) : null}
        </span>
      </label>
    </li>
  )
}

const LABEL: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
  margin: 0,
}

const LIJST: CSSProperties = {
  display: 'grid',
  gap: 1,
  listStyle: 'none',
  padding: 0,
  margin: 0,
  // Veel agenda's? Scroll binnenin, zodat de kaart niet explodeert.
  maxHeight: 220,
  overflowY: 'auto',
}
