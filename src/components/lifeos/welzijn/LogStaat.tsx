import { NogNiets } from '@/components/lifeos/os/Kaart'
import { tijdLabel } from '@/lib/lifeos/datum/datum'
import type { WelzijnLog } from './useWelzijnLog'

// ─── Gedeelde staten van de logkaarten ──────────────────────────────────────
// Stress en stemming tonen hetzelfde kopje ("dit logde je het laatst") en
// hetzelfde skelet. Puur presentational: props erin, UI eruit — geen fetch,
// geen state. Daarom ook géén 'use client': dit rendert prima op de server, en
// de kaarten die 'm gebruiken zijn zelf al client-eilanden.

interface LaatsteLogProps {
  /** `null` = nog nooit gelogd. Nadrukkelijk geen 0: dat leest als een meting. */
  laatste: WelzijnLog | null
  /** Wat er staat als er nog niets gelogd is. Eerlijk over wat het oplevert. */
  leeg: string
  /** De waarde in woorden. Nooit alleen een cijfer. */
  beschrijf: (log: WelzijnLog) => string
  kleurVan: (log: WelzijnLog) => string
}

export function LaatsteLog({ laatste, leeg, beschrijf, kleurVan }: LaatsteLogProps) {
  if (laatste === null) {
    return <NogNiets wat="Nog niet gelogd" waarom={leeg} />
  }

  const moment = new Date(laatste.op)
  const geldig = !Number.isNaN(moment.getTime())

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
      <p
        className="os-cijfer"
        style={{ fontSize: 34, fontWeight: 500, color: kleurVan(laatste), margin: 0, lineHeight: 0.9 }}
      >
        {laatste.waarde}
      </p>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 2px' }}>
          {beschrijf(laatste)}
        </p>
        {/* Wanneer, niet hoe vaak. Een teller zou hier een streak worden. */}
        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
          {geldig ? `Laatst gelogd om ${tijdLabel(moment)}` : 'Laatst gelogd'}
        </p>
      </div>
    </div>
  )
}

export function LogSkelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 14 }}>
      <div style={{ height: 32, width: '46%', borderRadius: 8, background: 'var(--bg-raised)' }} />
      <div style={{ height: 36, width: '100%', borderRadius: 9, background: 'var(--bg-raised)' }} />
      <div style={{ height: 34, width: '52%', borderRadius: 999, background: 'var(--bg-raised)' }} />
    </div>
  )
}
