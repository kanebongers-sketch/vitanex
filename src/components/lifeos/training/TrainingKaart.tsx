'use client'

import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { TrainingRij } from './TrainingRij'
import { LogFormulier } from './LogFormulier'
import { useTrainingen } from './useTrainingen'

// De trainingkaart voor het Nu-moment. Vervangt de workout-logger — niet door er
// een na te bouwen (geen programma's, geen schema's, geen 1RM-rekenmachine),
// maar door de enige twee vragen te beantwoorden die tellen: wat staat er
// vandaag, en wat werd het?
//
// Dit bestand tekent alleen. Ophalen, optimistisch schrijven en terugdraaien
// zitten in `useTrainingen` — container/presentational gescheiden.
//
// ─── DRIE STATEN, EXPLICIET GESCHEIDEN ──────────────────────────────────────
//   fout           → `Foutmelding` (met een weg terug)
//   niets vandaag  → `NogNiets`
//   gelogd         → de rijen
//
// Een netwerkfout mag NOOIT als "je trainde niet" renderen. Dat die twee
// verschillende componenten zijn, is geen stijlkeuze — het is de reden dat
// `Foutmelding` bestaat.

export function TrainingKaart() {
  const { staat, actieFout, bezig, opnieuw, log, afronden, zetRpe, verwijder } = useTrainingen()

  return (
    <Kaart titel="Training" vervangt="Workout logger">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {staat.trainingen.length === 0 ? (
            <NogNiets
              wat="Nog niets vandaag"
              waarom="Wat je deed, en op welke RPE. Meer heeft het niet nodig."
            />
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {staat.trainingen.map((training) => (
                <TrainingRij
                  key={training.id}
                  training={training}
                  onAfronden={afronden}
                  onRpe={zetRpe}
                  onVerwijder={verwijder}
                  bezig={bezig}
                />
              ))}
            </ul>
          )}

          <LogFormulier onLog={log} bezig={bezig} />

          {actieFout ? <Foutmelding bericht={actieFout} /> : null}
        </div>
      ) : null}
    </Kaart>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      {[58, 44, 66].map((breedte) => (
        <div
          key={breedte}
          style={{
            height: 14,
            width: `${breedte}%`,
            borderRadius: 4,
            background: 'var(--bg-raised)',
          }}
        />
      ))}
    </div>
  )
}
