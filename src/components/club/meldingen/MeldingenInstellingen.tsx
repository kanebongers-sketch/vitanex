'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import {
  AFSPRAAK_HERINNER_KEUZES,
  LES_HERINNER_KEUZES,
  SOORTEN_AFSPRAAK,
  SOORTEN_LES,
  SOORT_LABEL,
  duurLabel,
  type MeldingInstellingen,
  type Soort,
} from '@/lib/club/meldingen/soorten'
import './meldingen.css'

// Meldingen aan leden instellen: welke soorten aan staan en hoe lang van
// tevoren de herinneringen gaan. Geldt voor de mail en de lijst in de app.

interface MeldingenInstellingenProps {
  begin: MeldingInstellingen
}

interface GroepProps {
  titel: string
  soorten: readonly Soort[]
  uit: readonly Soort[]
  onWissel: (soort: Soort, aan: boolean) => void
  herinnering: { soort: Soort; waarde: number; keuzes: readonly number[]; onKies: (n: number) => void }
}

function Groep({ titel, soorten, uit, onWissel, herinnering }: GroepProps) {
  const id = `meldingen-${herinnering.soort}`
  return (
    <fieldset className="club-beheer-keuzes club-meldingen-groep">
      <legend className="club-label">{titel}</legend>
      {soorten.map((s) => (
        <label key={s} className="club-beheer-keuze club-meldingen-keuze">
          <input type="checkbox" checked={!uit.includes(s)} onChange={(e) => onWissel(s, e.target.checked)} />
          <span>
            <strong>{SOORT_LABEL[s].label}</strong>
            <small>{SOORT_LABEL[s].uitleg}</small>
          </span>
        </label>
      ))}
      <label className="club-veld club-meldingen-tijd" htmlFor={id}>
        <span>Herinnering gaat</span>
        <select id={id} className="club-invoer" value={herinnering.waarde} disabled={uit.includes(herinnering.soort)} onChange={(e) => herinnering.onKies(Number(e.target.value))}>
          {herinnering.keuzes.map((k) => (
            <option key={k} value={k}>
              {duurLabel(k)} voor de start
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  )
}

export function MeldingenInstellingen({ begin }: MeldingenInstellingenProps) {
  const router = useRouter()
  const [uit, setUit] = useState<Soort[]>(begin.uit)
  const [lesMin, setLesMin] = useState(begin.lesHerinneringMin)
  const [afspraakMin, setAfspraakMin] = useState(begin.afspraakHerinneringMin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  const wissel = (soort: Soort, aan: boolean) => setUit((huidig) => (aan ? huidig.filter((s) => s !== soort) : [...huidig, soort]))

  async function bewaar() {
    setBezig(true)
    setMelding(null)
    const antwoord = await stuur('/api/club/meldingen', 'PATCH', { uit, lesHerinneringMin: lesMin, afspraakHerinneringMin: afspraakMin })
    setBezig(false)
    if (!antwoord.ok) return setMelding({ ok: false, tekst: antwoord.fout })
    setMelding({ ok: true, tekst: 'Opgeslagen. Nieuwe boekingen volgen deze instellingen meteen.' })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier">
      <Groep
        titel="Groepslessen"
        soorten={SOORTEN_LES}
        uit={uit}
        onWissel={wissel}
        herinnering={{ soort: 'les_herinnering', waarde: lesMin, keuzes: LES_HERINNER_KEUZES, onKies: setLesMin }}
      />
      <Groep
        titel="Afspraken met een trainer"
        soorten={SOORTEN_AFSPRAAK}
        uit={uit}
        onWissel={wissel}
        herinnering={{ soort: 'afspraak_herinnering', waarde: afspraakMin, keuzes: AFSPRAAK_HERINNER_KEUZES, onKies: setAfspraakMin }}
      />
      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar()}>
          {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
