'use client'

import { useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { TRAINING, type Oefening } from '@/lib/lifeos/programma/programma-data'

// Training-weergave: kies een sessie (Push A … Legs B) en zie de oefeningen met
// sets × reps · RPE · startgewicht. Cardio staat als afsluiter onder de tabel.

function gewichtTekst(g: number | null): string {
  // null = geen betrouwbaar startgewicht (lichaamsgewicht of ontbrekend in de bron).
  return g === null ? '—' : `${g} kg`
}

function OefeningRij({ oef }: { oef: Oefening }) {
  const setsReps =
    oef.sets !== null && oef.reps
      ? `${oef.sets} × ${oef.reps}`
      : (oef.reps ?? (oef.sets !== null ? `${oef.sets}` : '—'))
  return (
    <tr>
      <td className="prog-naam">{oef.naam}</td>
      <td className="prog-num">{setsReps}</td>
      <td className="prog-num">{oef.rpe ?? '—'}</td>
      <td className="prog-num">{gewichtTekst(oef.gewicht)}</td>
    </tr>
  )
}

export function TrainingWeergave() {
  const [sessieIndex, setSessieIndex] = useState(0)
  const sessie = TRAINING.sessies[sessieIndex]

  return (
    <div>
      <div className="prog-chips" role="group" aria-label="Kies een trainingssessie">
        {TRAINING.sessies.map((s, i) => (
          <button
            key={s.naam}
            type="button"
            className="prog-chip"
            aria-pressed={i === sessieIndex}
            onClick={() => setSessieIndex(i)}
          >
            {s.naam}
          </button>
        ))}
      </div>

      <div className="prog-sectie">
        <div className="prog-sectie-kop">
          <h2 className="prog-sectie-titel">{sessie.naam}</h2>
          <span className="prog-sectie-tag">{sessie.oefeningen.length} oefeningen</span>
        </div>

        <div className="prog-tablewrap">
          <table className="prog-table">
            <caption className="prog-sr">Oefeningen voor {sessie.naam}</caption>
            <thead>
              <tr>
                <th scope="col">Oefening</th>
                <th scope="col" className="prog-th-num">Sets × reps</th>
                <th scope="col" className="prog-th-num">RPE</th>
                <th scope="col" className="prog-th-num">Gewicht</th>
              </tr>
            </thead>
            <tbody>
              {sessie.oefeningen.map((oef) => (
                <OefeningRij key={oef.naam} oef={oef} />
              ))}
            </tbody>
          </table>
        </div>

        {sessie.cardio && (
          <p className="prog-cardio">
            <span className="prog-cardio-ico">
              <HeartPulse size={15} strokeWidth={2} aria-hidden="true" />
            </span>
            <span><b>Cardio</b> — {sessie.cardio}</span>
          </p>
        )}
      </div>

      <p className="prog-meta" style={{ marginTop: 6 }}>
        Sets, reps en gewicht zijn de startwaarden uit week&nbsp;{TRAINING.week} van je schema.
      </p>
    </div>
  )
}
