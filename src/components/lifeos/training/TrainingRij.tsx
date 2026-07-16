'use client'

import { Check, Trash2 } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { duurLabel } from '@/lib/lifeos/datum/datum'
import { trainingLabel, type Rpe, type Training } from '@/lib/lifeos/training/training'
import { RpeKiezer } from './RpeKiezer'

// Eén regel in de trainingkaart. Presentational: props in → UI uit, geen fetch.
//
// ─── HET VERSCHIL DAT JE MOET ZIEN ──────────────────────────────────────────
// Een voornemen en een meting mogen er nooit hetzelfde uitzien. Gepland krijgt
// daarom een expliciet label en een cyaan streep, en draagt per definitie geen
// cijfers — het staat er nog niet, dus er valt niets te tonen. Wie die twee
// visueel gelijk trekt, laat je op je plan terugkijken alsof het gebeurd is.

interface TrainingRijProps {
  training: Training
  onAfronden: (training: Training) => void
  onRpe: (training: Training, rpe: Rpe | null) => void
  onVerwijder: (training: Training) => void
  /** Er loopt een schrijfactie: even niets aanraken. */
  bezig?: boolean
}

export function TrainingRij({
  training,
  onAfronden,
  onRpe,
  onVerwijder,
  bezig = false,
}: TrainingRijProps) {
  return (
    <li
      style={{
        display: 'grid',
        gap: 10,
        padding: '11px 0',
        borderTop: '1px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {training.gepland ? (
          <span
            style={{
              flexShrink: 0,
              padding: '2px 7px',
              borderRadius: 5,
              border: '1px solid var(--brand)',
              color: 'var(--brand)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            Gepland
          </span>
        ) : null}

        <p
          style={{
            flex: 1,
            minWidth: 0,
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-1)',
            lineHeight: 1.4,
          }}
        >
          {trainingLabel(training)}
        </p>

        {training.gepland ? (
          <Knop variant="primair" onClick={() => onAfronden(training)} disabled={bezig}>
            <Check size={13} strokeWidth={2.6} aria-hidden="true" />
            Gedaan
          </Knop>
        ) : null}

        <Knop
          onClick={() => onVerwijder(training)}
          disabled={bezig}
          aria-label={`${trainingLabel(training)} verwijderen`}
        >
          <Trash2 size={13} strokeWidth={2.2} aria-hidden="true" />
        </Knop>
      </div>

      {/* Een voornemen draagt geen metingen (migratie 070) — dus is er hier
          niets te tonen. Geen "0 min", geen "RPE —": dat zou suggereren dat we
          iets meten aan iets dat nog niet gebeurd is. */}
      {training.gepland ? null : (
        <>
          <Meta training={training} />
          <RpeKiezer
            legenda="Hoe zwaar voelde het?"
            waarde={training.rpe}
            onKies={(rpe) => onRpe(training, rpe)}
            disabled={bezig}
            compact
          />
        </>
      )}
    </li>
  )
}

/**
 * De gemeten cijfers. Alleen wat er écht staat: een veld zonder meting valt
 * gewoon weg. Nergens een 0 of een streepje dat op een meting lijkt.
 */
function Meta({ training }: { training: Training }) {
  const delen: string[] = []
  if (training.duurMinuten !== null) delen.push(duurLabel(training.duurMinuten))
  if (training.actieveMinuten !== null) {
    delen.push(`${training.actieveMinuten} min actief`)
  }
  if (delen.length === 0) return null

  return (
    <p
      style={{
        margin: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-3)',
        letterSpacing: '0.02em',
      }}
    >
      {delen.join(' · ')}
    </p>
  )
}
