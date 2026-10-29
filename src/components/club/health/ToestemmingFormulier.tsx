'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DATA_SOORTEN, type BronId, type DataSoort } from '@/lib/club/health/typen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { HEALTH } from '@/lib/aiyourgym/taal/woorden/ledenapp/health'
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
  const taal = useTaal()
  const h = useTekst(HEALTH)
  const z = h.toestemming

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
    setMelding({ soort: 'goed', tekst: z.opgeslagen })
    router.refresh()
  }

  const intrekken = async () => {
    if (!window.confirm(z.intrekkenVraag)) return
    setBezig(true)
    const r = await stuur(healthUrl('/toestemming', voor), 'DELETE')
    setBezig(false)
    if (!r.ok) return setMelding({ soort: 'fout', tekst: r.fout })
    setDelen([])
    setTrainer([])
    setBronnen([])
    setMelding({ soort: 'goed', tekst: z.ingetrokken })
    router.refresh()
  }

  return (
    <section className="club-hl-sectie" aria-labelledby="hl-toestemming">
      <h3 id="hl-toestemming">{z.titel}</h3>
      <div className="club-hl-uitleg">
        {taal !== 'nl' && <p>{z.nlTekst}</p>}
        <div lang="nl">
          {tekst.regels.map((r) => (
            <p key={r}>{r}</p>
          ))}
        </div>
        {toestemming.gegevenOp && <p>{z.laatst(datumKort(toestemming.gegevenOp, taal))}</p>}
      </div>
      <div className="club-hl-tabel" role="group" aria-label={z.perSoort}>
        <div className="club-hl-rij club-hl-rij--kop" aria-hidden>
          <span>{z.soort}</span>
          <span className="club-hl-kolom">{z.delen}</span>
          <span className="club-hl-kolom">{z.trainer}</span>
        </div>
        {DATA_SOORTEN.map((s) => (
          <div key={s} className="club-hl-rij">
            <div>
              <strong>{h.soorten[s].label}</strong>
              <span>{h.soorten[s].uitleg}</span>
            </div>
            <span className="club-hl-kolom">
              <input type="checkbox" className="club-hl-vink" checked={delen.includes(s)} disabled={alleenLezen} onChange={(e) => wissel(s, e.target.checked)} aria-label={z.delenMet(h.soorten[s].label, sportschool)} />
            </span>
            <span className="club-hl-kolom">
              <input type="checkbox" className="club-hl-vink" checked={trainer.includes(s)} disabled={alleenLezen || !delen.includes(s)} onChange={(e) => wisselTrainer(s, e.target.checked)} aria-label={z.trainerZien(h.soorten[s].label)} />
            </span>
          </div>
        ))}
        {apartBronnen.map((b) => (
          <div key={b.id} className="club-hl-rij">
            <div>
              <strong>{z.bronTitel(h.bronnen[b.id].naam)}</strong>
              <span>{z.bronUitleg(h.bronnen[b.id].naam)}</span>
            </div>
            <span className="club-hl-kolom" aria-hidden />
            <span className="club-hl-kolom">
              <input type="checkbox" className="club-hl-vink" checked={bronnen.includes(b.id)} disabled={alleenLezen || !trainer.includes('training')} onChange={(e) => wisselBron(b.id, e.target.checked)} aria-label={z.bronTitel(h.bronnen[b.id].naam)} />
            </span>
          </div>
        ))}
      </div>
      {!alleenLezen && (
        <>
          <label className="club-hl-akkoord">
            <input type="checkbox" className="club-hl-vink" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} />
            <span>{z.akkoord(sportschool)}</span>
          </label>
          <div className="club-hl-acties">
            <button type="button" className="club-lidapp-knop club-lidapp-knop--primair" disabled={!akkoord || bezig} onClick={opslaan}>
              {z.opslaan}
            </button>
            {toestemming.delen.length > 0 && (
              <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" disabled={bezig} onClick={intrekken}>
                {z.intrekken}
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
