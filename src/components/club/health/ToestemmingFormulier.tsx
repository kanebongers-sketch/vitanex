'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DATA_SOORTEN, SOORT_INFO, type BronId, type DataSoort } from '@/lib/club/health/typen'
import type { Toestemming } from '@/lib/club/health/toestemming'
import { stuur } from '@/components/club/app/verzoek'
import { datumKort, healthUrl } from './paden'

// De toestemming: per soort twee aparte schakelaars (delen, en trainers mogen
// zien), plus een eigen schakelaar voor Strava. Eerst de uitleg lezen en
// akkoord geven; elke keuze wordt met tijd en tekstversie bewaard.

interface ToestemmingFormulierProps {
  toestemming: Toestemming
  tekst: { versie: string; regels: readonly string[] }
  /** Bronnen met een eigen trainerschakelaar die de sportschool aanbiedt. */
  apartBronnen: readonly { id: BronId; naam: string }[]
  sportschool: string
  voor: string | null
  alleenLezen: boolean
}

type Melding = { soort: 'goed' | 'fout'; tekst: string } | null

export function ToestemmingFormulier({ toestemming, tekst, apartBronnen, sportschool, voor, alleenLezen }: ToestemmingFormulierProps) {
  const router = useRouter()
  const [delen, setDelen] = useState<DataSoort[]>([...toestemming.delen])
  const [trainer, setTrainer] = useState<DataSoort[]>([...toestemming.trainerZien])
  const [bronnen, setBronnen] = useState<BronId[]>([...toestemming.trainerBronnen])
  const [akkoord, setAkkoord] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<Melding>(null)

  const wissel = (soort: DataSoort, aan: boolean) => {
    setDelen((d) => (aan ? [...d, soort] : d.filter((s) => s !== soort)))
    if (!aan) setTrainer((t) => t.filter((s) => s !== soort))
  }
  const wisselTrainer = (soort: DataSoort, aan: boolean) => setTrainer((t) => (aan ? [...t, soort] : t.filter((s) => s !== soort)))
  const wisselBron = (bron: BronId, aan: boolean) => setBronnen((b) => (aan ? [...b, bron] : b.filter((x) => x !== bron)))

  const opslaan = async () => {
    setBezig(true)
    setMelding(null)
    const r = await stuur(healthUrl('/toestemming', voor), 'POST', { akkoord, versie: tekst.versie, delen, trainerZien: trainer, trainerBronnen: bronnen })
    setBezig(false)
    if (!r.ok) return setMelding({ soort: 'fout', tekst: r.fout })
    setAkkoord(false)
    setMelding({ soort: 'goed', tekst: 'Je keuze is opgeslagen.' })
    router.refresh()
  }

  const intrekken = async () => {
    if (!window.confirm('Alles intrekken? We halen dan niets meer op en wissen alle gegevens uit je apps bij de sportschool.')) return
    setBezig(true)
    const r = await stuur(healthUrl('/toestemming', voor), 'DELETE')
    setBezig(false)
    if (!r.ok) return setMelding({ soort: 'fout', tekst: r.fout })
    setDelen([])
    setTrainer([])
    setBronnen([])
    setMelding({ soort: 'goed', tekst: 'Je toestemming is ingetrokken en je gegevens zijn gewist.' })
    router.refresh()
  }

  return (
    <section className="club-hl-sectie" aria-labelledby="hl-toestemming">
      <h3 id="hl-toestemming">Wat deel je</h3>
      <div className="club-hl-uitleg">
        {tekst.regels.map((r) => (
          <p key={r}>{r}</p>
        ))}
        {toestemming.gegevenOp && <p>Laatst gekozen op {datumKort(toestemming.gegevenOp)}.</p>}
      </div>
      <div className="club-hl-tabel" role="group" aria-label="Toestemming per soort">
        <div className="club-hl-rij club-hl-rij--kop" aria-hidden>
          <span>Soort</span>
          <span className="club-hl-kolom">Delen</span>
          <span className="club-hl-kolom">Trainer</span>
        </div>
        {DATA_SOORTEN.map((s) => (
          <div key={s} className="club-hl-rij">
            <div>
              <strong>{SOORT_INFO[s].label}</strong>
              <span>{SOORT_INFO[s].uitleg}</span>
            </div>
            <span className="club-hl-kolom">
              <input type="checkbox" className="club-hl-vink" checked={delen.includes(s)} disabled={alleenLezen} onChange={(e) => wissel(s, e.target.checked)} aria-label={`${SOORT_INFO[s].label} delen met ${sportschool}`} />
            </span>
            <span className="club-hl-kolom">
              <input type="checkbox" className="club-hl-vink" checked={trainer.includes(s)} disabled={alleenLezen || !delen.includes(s)} onChange={(e) => wisselTrainer(s, e.target.checked)} aria-label={`Trainers mogen ${SOORT_INFO[s].label.toLowerCase()} zien`} />
            </span>
          </div>
        ))}
        {apartBronnen.map((b) => (
          <div key={b.id} className="club-hl-rij">
            <div>
              <strong>Trainers mogen mijn {b.naam}-trainingen zien</strong>
              <span>{b.naam} vraagt hier een aparte toestemming voor. Zonder dit vinkje zie alleen jij ze.</span>
            </div>
            <span className="club-hl-kolom" aria-hidden />
            <span className="club-hl-kolom">
              <input type="checkbox" className="club-hl-vink" checked={bronnen.includes(b.id)} disabled={alleenLezen || !trainer.includes('training')} onChange={(e) => wisselBron(b.id, e.target.checked)} aria-label={`Trainers mogen mijn ${b.naam}-trainingen zien`} />
            </span>
          </div>
        ))}
      </div>
      {!alleenLezen && (
        <>
          <label className="club-hl-akkoord">
            <input type="checkbox" className="club-hl-vink" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} />
            <span>Ik heb de uitleg gelezen en geef {sportschool} uitdrukkelijk toestemming voor wat ik hierboven aanvink.</span>
          </label>
          <div className="club-hl-acties">
            <button type="button" className="club-lidapp-knop club-lidapp-knop--primair" disabled={!akkoord || bezig} onClick={opslaan}>
              Keuze opslaan
            </button>
            {toestemming.delen.length > 0 && (
              <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" disabled={bezig} onClick={intrekken}>
                Alles intrekken
              </button>
            )}
          </div>
        </>
      )}
      <p className="club-hl-melding" data-soort={melding?.soort} role="status">
        {melding?.tekst}
      </p>
    </section>
  )
}
