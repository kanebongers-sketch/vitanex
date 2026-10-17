'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { CHALLENGE_SOORTEN, MAX_DOEL, MAX_TITEL, MAX_UITLEG, SOORT_INFO, type Challenge, type ChallengeSoort, type Deelname } from '@/lib/club/challenges/model'
import { ChallengeOpties } from './ChallengeOpties'

// Een challenge maken of wijzigen. Na opslaan opent de challenge zelf.

export interface ChallengeFormulierProps {
  begin?: Challenge
  /** Voor een nieuwe challenge: standaard de huidige maand. */
  standaardStart: string
  standaardEind: string
  /** De pagina zonder formulier (annuleren); altijd met ?v=..., dus &c=<id> kan erachter. */
  terugHref: string
}

export interface FormStaat {
  titel: string
  uitleg: string
  soort: ChallengeSoort
  doel: string
  start: string
  eind: string
  /** Leeg = alle vestigingen. */
  vestigingen: string[]
  deelname: Deelname
  zichtbaarApp: boolean
  ranglijst: boolean
}

function beginStaat(c: Challenge | undefined, start: string, eind: string): FormStaat {
  return {
    titel: c?.titel ?? '',
    uitleg: c?.uitleg ?? '',
    soort: c?.soort ?? 'bezoeken',
    doel: String(c?.doel ?? 12),
    start: c?.start ?? start,
    eind: c?.eind ?? eind,
    vestigingen: c?.vestigingen ?? [],
    deelname: c?.deelname ?? 'automatisch',
    zichtbaarApp: c?.zichtbaarApp ?? true,
    ranglijst: c?.ranglijst ?? false,
  }
}

export function ChallengeFormulier({ begin, standaardStart, standaardEind, terugHref }: ChallengeFormulierProps) {
  const router = useRouter()
  const vestigingen = useVestigingen()
  const id = useId()
  const [s, setS] = useState<FormStaat>(() => beginStaat(begin, standaardStart, standaardEind))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const zet = <K extends keyof FormStaat>(k: K, v: FormStaat[K]) => setS((oud) => ({ ...oud, [k]: v }))

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const body = { ...s, doel: Number(s.doel), uitleg: s.uitleg.trim() || null }
    const uit = begin ? await stuur(`/api/club/challenges/${begin.id}`, 'PATCH', body) : await stuur('/api/club/challenges', 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    const nieuwId = typeof uit.data === 'object' && uit.data !== null && 'id' in uit.data ? String(uit.data.id) : begin?.id
    router.push(nieuwId ? `${terugHref}&c=${encodeURIComponent(nieuwId)}` : terugHref, { scroll: false })
    router.refresh()
  }

  return (
    <form className="club-challenges-form" onSubmit={(e) => void bewaar(e)} aria-labelledby={`${id}-kop`} aria-describedby={fout ? `${id}-fout` : undefined}>
      <h2 id={`${id}-kop`}>{begin ? 'Challenge wijzigen' : 'Nieuwe challenge'}</h2>

      <label className="club-veld">
        <span>Titel</span>
        <input className="club-invoer" required maxLength={MAX_TITEL} value={s.titel} placeholder="Bijvoorbeeld: 12 keer trainen in november" onChange={(e) => zet('titel', e.target.value)} />
      </label>

      <label className="club-veld">
        <span>Uitleg voor leden (mag leeg)</span>
        <textarea className="club-invoer" rows={3} maxLength={MAX_UITLEG} value={s.uitleg} onChange={(e) => zet('uitleg', e.target.value)} />
      </label>

      <fieldset className="club-challenges-veldset">
        <legend className="club-label">Wat telt</legend>
        <div className="club-challenges-soorten">
          {CHALLENGE_SOORTEN.map((soort) => (
            <label key={soort} className="club-challenges-soort">
              <input type="radio" name={`${id}-soort`} value={soort} checked={s.soort === soort} onChange={() => zet('soort', soort)} />
              <span>
                <strong>{SOORT_INFO[soort].label}</strong>
                <small>{SOORT_INFO[soort].uitleg}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="club-formrij">
        <label className="club-veld">
          <span>Doel ({SOORT_INFO[s.soort].meer})</span>
          <input className="club-invoer" type="number" inputMode="numeric" required min={1} max={MAX_DOEL} step={1} value={s.doel} onChange={(e) => zet('doel', e.target.value)} />
        </label>
        <label className="club-veld">
          <span>Start</span>
          <input className="club-invoer" type="date" required value={s.start} onChange={(e) => zet('start', e.target.value)} />
        </label>
        <label className="club-veld">
          <span>Eind (telt mee)</span>
          <input className="club-invoer" type="date" required min={s.start} value={s.eind} onChange={(e) => zet('eind', e.target.value)} />
        </label>
      </div>

      <ChallengeOpties staat={s} vestigingen={vestigingen} zet={zet} />

      <div className="club-challenges-formacties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? 'Opslaan...' : begin ? 'Opslaan' : 'Challenge maken'}
        </button>
        <Link href={terugHref} scroll={false} className="club-knop club-knop--stil">
          Annuleren
        </Link>
      </div>
      <div role="alert" aria-live="assertive">
        {fout && (
          <p id={`${id}-fout`} className="club-melding club-melding--fout">
            {fout}
          </p>
        )}
      </div>
    </form>
  )
}
