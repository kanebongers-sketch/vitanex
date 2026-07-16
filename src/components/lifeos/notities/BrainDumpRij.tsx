'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Notitie } from '@/lib/lifeos/notities/notities'

// Eén regel uit de brain dump. Presentational: krijgt props, geeft UI terug,
// weet niets van fetch of optimistische updates.

interface BrainDumpRijProps {
  notitie: Notitie
  onWeg: (notitie: Notitie) => void
  /** Optimistisch toegevoegd en nog niet bevestigd door de server. */
  onbevestigd?: boolean
}

export function BrainDumpRij({ notitie, onWeg, onbevestigd = false }: BrainDumpRijProps) {
  const [hover, setHover] = useState(false)

  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
        padding: '9px 2px 9px 0',
        borderBottom: '1px solid var(--line)',
        // Alleen opacity: geen layout-properties animeren.
        opacity: onbevestigd ? 0.55 : 1,
        transition: 'opacity 180ms var(--ease)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text-2)',
          // Een gedachte is geen titel: hij mag afbreken en meerdere regels zijn.
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
        }}
      >
        {notitie.tekst}
      </p>

      <button
        type="button"
        onClick={() => onWeg(notitie)}
        // Nog niet bevestigd = er is nog geen id om te verwijderen. Uitzetten in
        // plaats van de klik stil laten verdampen: een knop die niets doet zonder
        // dat te zeggen, is een kapotte knop.
        disabled={onbevestigd}
        aria-label={`Verwijder notitie: ${notitie.tekst}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 24,
          height: 24,
          padding: 0,
          borderRadius: 999,
          border: '1px solid transparent',
          background: 'transparent',
          color: hover ? 'var(--text-2)' : 'var(--text-4)',
          cursor: onbevestigd ? 'not-allowed' : 'pointer',
          // Altijd in de DOM en altijd bereikbaar: een knop die pas bij hover
          // verschijnt, bestaat niet voor een toetsenbord of een touchscreen.
          // Hij wordt alleen rustiger als je 'm niet nodig hebt.
          opacity: onbevestigd ? 0.3 : hover ? 1 : 0.5,
          transition: 'opacity 180ms var(--ease), color 180ms var(--ease)',
        }}
      >
        <X size={13} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </li>
  )
}
