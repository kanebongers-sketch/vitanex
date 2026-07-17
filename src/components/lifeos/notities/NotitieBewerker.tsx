'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { Knop } from '@/components/lifeos/os/Knop'
import { MAX_TITEL_LENGTE } from '@/lib/lifeos/notities/links'
import { MAX_TEKST_LENGTE, type Notitie, type NotitieWijziging } from '@/lib/lifeos/notities/notities'

// Een notitie bewerken: de tekst, en optioneel een titel.
//
// ─── WAAROM DIT BESTAAT ─────────────────────────────────────────────────────
//   De PATCH kon alleen tags en categorie. Een typefout corrigeren betekende dus:
//   weggooien en opnieuw typen — met een nieuw id, een nieuwe aangemaakt_op en
//   verbroken backlinks. Dat is geen bewerken maar dataverlies met een omweg.
//
// ─── WAAROM DE TITEL HIER ZIT EN NIET BIJ DE CAPTURE ────────────────────────
//   De capture is één tik: "Wat zit er in je hoofd?" en klaar. Een titelveld
//   daarbij is precies de drempel waardoor je je hoofd niet meer leegmaakt.
//   Titels zijn post-hoc: je benoemt een notitie op het moment dat je er iets
//   aan wil hángen — en dan is dit scherm de plek.
//
// Presentational: krijgt een notitie, geeft de wijziging terug. Geen fetch.

interface NotitieBewerkerProps {
  notitie: Notitie
  onBewaar: (wijziging: NotitieWijziging) => void
  onAnnuleer: () => void
}

export function NotitieBewerker({ notitie, onBewaar, onAnnuleer }: NotitieBewerkerProps) {
  const [tekst, setTekst] = useState(notitie.tekst)
  const [titel, setTitel] = useState(notitie.titel ?? '')

  const tekstLeeg = tekst.trim().length === 0
  const idBasis = `bewerk-${notitie.id}`

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (tekstLeeg) return

    onBewaar({
      tekst: tekst.trim(),
      // Leeg veld = titel weghalen. `null` is een waarde ("wis 'm"), niet
      // "niet meegestuurd" — zie `leesNotitieWijziging`.
      titel: titel.trim().length === 0 ? null : titel.trim(),
    })
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gap: 3 }}>
        <label htmlFor={`${idBasis}-titel`} style={LABEL}>
          Titel <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>— optioneel, maakt de notitie vindbaar met [[…]]</span>
        </label>
        <input
          id={`${idBasis}-titel`}
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Zonder titel"
          maxLength={MAX_TITEL_LENGTE}
          autoComplete="off"
          style={INVOER}
        />
      </div>

      <div style={{ display: 'grid', gap: 3 }}>
        <label htmlFor={`${idBasis}-tekst`} style={LABEL}>
          Tekst
        </label>
        <textarea
          id={`${idBasis}-tekst`}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          maxLength={MAX_TEKST_LENGTE}
          rows={Math.min(Math.max(tekst.split('\n').length + 1, 3), 12)}
          autoFocus
          style={{ ...INVOER, resize: 'vertical', lineHeight: 1.55 }}
        />
        <p style={HINT}>
          **vet** · *cursief* · `code` · # kop · - lijst · [[verwijzing naar een andere notitie]]
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Knop type="submit" variant="primair" disabled={tekstLeeg}>
          Bewaren
        </Knop>
        <Knop onClick={onAnnuleer}>Annuleren</Knop>
      </div>
    </form>
  )
}

const LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-3)',
}

const INVOER: CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}

const HINT: CSSProperties = {
  margin: 0,
  fontSize: 10,
  lineHeight: 1.5,
  color: 'var(--text-4)',
  fontFamily: 'var(--font-mono)',
}
