'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import {
  AFSPRAAK_HERINNER_KEUZES,
  LES_HERINNER_KEUZES,
  SOORTEN_AFSPRAAK,
  SOORTEN_LES,
  type MeldingInstellingen,
  type Soort,
} from '@/lib/club/meldingen/soorten'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { MELDINGEN } from '@/lib/aiyourgym/taal/woorden/club/meldingen'
import './meldingen.css'

type Tekst = (typeof MELDINGEN)['nl']

/** "1 dag", "2 uur" of "30 minuten" in de gekozen taal. */
function duurIn(minuten: number, d: Tekst['instellingen']['duur']): string {
  if (minuten % 1440 === 0) return minuten === 1440 ? d.dag : d.dagen(minuten / 1440)
  if (minuten % 60 === 0) return d.uur(minuten / 60)
  return d.minuten(minuten)
}

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
  const t = useTekst(MELDINGEN)
  return (
    <fieldset className="club-beheer-keuzes club-meldingen-groep">
      <legend className="club-label">{titel}</legend>
      {soorten.map((s) => (
        <label key={s} className="club-beheer-keuze club-meldingen-keuze">
          <input type="checkbox" checked={!uit.includes(s)} onChange={(e) => onWissel(s, e.target.checked)} />
          <span>
            <strong>{t.soort[s].label}</strong>
            <small>{t.soort[s].uitleg}</small>
          </span>
        </label>
      ))}
      <label className="club-veld club-meldingen-tijd" htmlFor={id}>
        <span>{t.instellingen.herinnering}</span>
        <select id={id} className="club-invoer" value={herinnering.waarde} disabled={uit.includes(herinnering.soort)} onChange={(e) => herinnering.onKies(Number(e.target.value))}>
          {herinnering.keuzes.map((k) => (
            <option key={k} value={k}>
              {t.instellingen.voorStart(duurIn(k, t.instellingen.duur))}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  )
}

export function MeldingenInstellingen({ begin }: MeldingenInstellingenProps) {
  const router = useRouter()
  const t = useTekst(MELDINGEN).instellingen
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
    setMelding({ ok: true, tekst: t.opgeslagen })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier">
      <Groep
        titel={t.lessen}
        soorten={SOORTEN_LES}
        uit={uit}
        onWissel={wissel}
        herinnering={{ soort: 'les_herinnering', waarde: lesMin, keuzes: LES_HERINNER_KEUZES, onKies: setLesMin }}
      />
      <Groep
        titel={t.afspraken}
        soorten={SOORTEN_AFSPRAAK}
        uit={uit}
        onWissel={wissel}
        herinnering={{ soort: 'afspraak_herinnering', waarde: afspraakMin, keuzes: AFSPRAAK_HERINNER_KEUZES, onKies: setAfspraakMin }}
      />
      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar()}>
          {bezig ? t.opslaanBezig : t.opslaan}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
