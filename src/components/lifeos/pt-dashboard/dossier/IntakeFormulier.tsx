'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import {
  INTAKE, STRESS_NIVEAU_LABEL, aantalMedischJa, leesIntake, stressScore, toelichtingId, voortgang,
  type Antwoord, type Intake, type IntakeSectie,
} from '@/lib/lifeos/pt-dashboard/intake'
import { ptApi } from '../api'
import { IntakeVeld } from './IntakeVeld'

// Het intakeformulier, digitaal: per sectie uitklapbaar, met voortgang. Een
// half ingevulde intake mag je opslaan; wat verplicht is en nog open staat,
// zie je onder de voortgang.

interface Props {
  code: string
  klantId: string
  begin: Intake | null
  onOpgeslagen: (i: Intake) => void
  /** Meekijken (eigenaar): alle velden dicht, geen opslaan. */
  alleenLezen?: boolean
}

type Concept = Record<string, Antwoord>

function SectieExtra({ sectie, a }: { sectie: IntakeSectie; a: Concept }) {
  if (sectie.id === 'medisch') {
    const n = aantalMedischJa(a)
    return <p className="ffdos-uitkomst">Aantal keer ja: <strong>{n}</strong>{n > 0 ? ' · overleg met de huisarts vóór de start' : ''}</p>
  }
  if (sectie.id === 'stress') {
    const s = stressScore(a)
    return (
      <p className="ffdos-uitkomst">
        Totaalscore: <strong>{s.score}</strong> van {s.totaal * 4}
        {s.niveau ? ` · ${STRESS_NIVEAU_LABEL[s.niveau]} (indeling van het intakeformulier)` : ` · ${s.beantwoord} van ${s.totaal} stellingen ingevuld`}
      </p>
    )
  }
  return null
}

export function IntakeFormulier({ code, klantId, begin, onOpgeslagen, alleenLezen = false }: Props) {
  const [a, setA] = useState<Concept>(() => ({ ...(begin?.antwoorden ?? {}) }))
  const [gewijzigd, setGewijzigd] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const v = useMemo(() => voortgang(a), [a])

  function wijzig(id: string, w: Antwoord | undefined) {
    setA((oud) => {
      // "Nee" of leeg bij een ja/nee-vraag → de toelichting hoort er niet meer bij.
      const weg = w !== true && typeof oud[id] === 'boolean' ? [id, toelichtingId(id)] : [id]
      const rest: Concept = Object.fromEntries(Object.entries(oud).filter(([k]) => !weg.includes(k)))
      return w === undefined ? rest : { ...rest, [id]: w }
    })
    setGewijzigd(true)
    setOpgeslagen(false)
  }

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, `klanten/${klantId}/intake`, 'PUT', { antwoorden: a }, leesIntake)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setA({ ...uit.waarde.antwoorden })
    setGewijzigd(false)
    setOpgeslagen(true)
    onOpgeslagen(uit.waarde)
  }

  return (
    <form className="ffdos-intake" onSubmit={(e) => void opslaan(e)} aria-labelledby="ffdos-intake-kop">
      <div className="ptd-sectiekop">
        <h2 id="ffdos-intake-kop">Intake</h2>
        <span>{v.beantwoord} van {v.totaal} beantwoord</span>
      </div>
      <div className="ptd-balk" role="progressbar" aria-label="Intake ingevuld" aria-valuemin={0} aria-valuemax={v.totaal} aria-valuenow={v.beantwoord}>
        <span className="ptd-balk-vul" style={{ transform: `scaleX(${v.totaal === 0 ? 0 : v.beantwoord / v.totaal})` }} />
      </div>
      {v.openVerplicht.length > 0 || v.zonderToelichting.length > 0 ? (
        <p className="ptd-hint">
          {v.openVerplicht.length > 0 ? `Nog open (verplicht): ${v.openVerplicht.join(', ')}. ` : ''}
          {v.zonderToelichting.length > 0 ? `Toelichting ontbreekt bij: ${v.zonderToelichting.join(', ')}.` : ''}
        </p>
      ) : (
        <p className="ptd-hint">Alle verplichte vragen zijn ingevuld.</p>
      )}

      {INTAKE.map((s, i) => {
        const sv = v.perSectie[i]
        return (
          <details key={s.id} className="ptd-kaart ptd-details ffdos-sectie" open={i === 0 && !begin}>
            <summary>
              <span>{s.titel}</span>
              <span className="ffdos-sectie-stand">{sv.beantwoord}/{sv.totaal}</span>
            </summary>
            <fieldset className="ptd-details-inhoud ffdos-velden" disabled={alleenLezen}>
              <legend className="sr-only">{s.titel}</legend>
              {s.uitleg ? <p className="ptd-hint">{s.uitleg}</p> : null}
              {s.velden.map((veld) => (
                <IntakeVeld key={veld.id} veld={veld} waarde={a[veld.id]} toelichting={a[toelichtingId(veld.id)] as string | undefined} onWijzig={wijzig} />
              ))}
              <SectieExtra sectie={s} a={a} />
            </fieldset>
          </details>
        )
      })}

      {fout ? <Foutmelding bericht={fout} /> : null}
      {alleenLezen ? null : (
      <div className="ptd-acties ffdos-opslaan">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig || !gewijzigd}>
          {bezig ? 'Opslaan…' : 'Intake opslaan'}
        </button>
        <span className="ptd-hint" role="status">
          {gewijzigd ? 'Niet opgeslagen wijzigingen' : opgeslagen ? (
            <>
              <Check size={14} aria-hidden /> Opgeslagen
            </>
          ) : null}
        </span>
      </div>
      )}
    </form>
  )
}
