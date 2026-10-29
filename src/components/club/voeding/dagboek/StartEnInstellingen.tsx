'use client'

import { useState, type FormEvent } from 'react'
import { NotebookPen } from 'lucide-react'
import type { DagboekInstellingen, Macros } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { schrijf, voedingUrl } from './api'

// Starten (de uitdrukkelijke keuze van het lid, met de keuze of de trainer mag
// meekijken; standaard niet) en de instellingen: delen aan of uit, een eigen
// dagdoel zonder voedingsplan van de coach, en alles wissen.

interface StartProps {
  t: VoedingDagboekTekst
  voor: string | null
  sportschool: string
  alleenLezen: boolean
  onGestart: (i: DagboekInstellingen) => void
}

export function StartKaart({ t, voor, sportschool, alleenLezen, onGestart }: StartProps) {
  const ts = t.start
  const [trainer, setTrainer] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function start() {
    setBezig(true)
    setFout(null)
    const r = await schrijf<{ instellingen: DagboekInstellingen }>(voedingUrl('/instellingen', voor), 'POST', { soort: 'start', trainerZien: trainer }, t.fout, t.fout.opslaan)
    setBezig(false)
    if (r.ok) onGestart(r.data.instellingen)
    else setFout(r.fout)
  }

  return (
    <section className="club-vd-start" aria-labelledby="vd-start-kop">
      <span className="club-vd-start-icoon" aria-hidden><NotebookPen size={26} strokeWidth={1.75} /></span>
      <h3 id="vd-start-kop">{ts.titel}</h3>
      {ts.uitleg.map((zin) => <p key={zin}>{zin}</p>)}
      <label className="club-vd-vink">
        <input type="checkbox" checked={trainer} onChange={(e) => setTrainer(e.target.checked)} disabled={alleenLezen} />
        <span>{ts.trainerKeuze(sportschool)}</span>
      </label>
      {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
      <button type="button" className="club-vd-hoofdknop" onClick={() => void start()} disabled={bezig || alleenLezen}>{bezig ? ts.bezig : ts.knop}</button>
    </section>
  )
}

interface InstellingenProps {
  t: VoedingDagboekTekst
  voor: string | null
  instellingen: DagboekInstellingen
  heeftPlan: boolean
  alleenLezen: boolean
  onWijzig: (i: DagboekInstellingen) => void
  onGewist: () => void
}

export function DagboekInstellingenBlok({ t, voor, instellingen, heeftPlan, alleenLezen, onWijzig, onGewist }: InstellingenProps) {
  const ti = t.instellingen
  const d = instellingen.eigenDoelen
  const [doel, setDoel] = useState({ kcal: String(d?.kcal ?? ''), eiwit: String(d?.eiwitG ?? ''), kh: String(d?.koolhydratenG ?? ''), vet: String(d?.vetG ?? '') })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [zeker, setZeker] = useState(false)

  async function bewaar(body: unknown) {
    setBezig(true)
    setFout(null)
    const r = await schrijf<{ instellingen: DagboekInstellingen }>(voedingUrl('/instellingen', voor), 'POST', body, t.fout, t.fout.opslaan)
    setBezig(false)
    if (r.ok) onWijzig(r.data.instellingen)
    else setFout(r.fout)
  }

  function bewaarDoel(e: FormEvent) {
    e.preventDefault()
    const n = (s: string) => Number(s.replace(',', '.'))
    const doelen: Macros = { kcal: n(doel.kcal), eiwitG: n(doel.eiwit), koolhydratenG: n(doel.kh), vetG: n(doel.vet) }
    void bewaar({ soort: 'doelen', doelen })
  }

  async function wis() {
    if (!zeker) return setZeker(true)
    setBezig(true)
    const r = await schrijf<unknown>(voedingUrl('/instellingen', voor), 'DELETE', undefined, t.fout, t.fout.verwijderen)
    setBezig(false)
    setZeker(false)
    if (r.ok) onGewist()
    else setFout(r.fout)
  }

  return (
    <details className="club-vd-instellingen">
      <summary>{ti.titel}</summary>
      <div className="club-vd-instellingen-blok">
        <p>{instellingen.trainerZien ? ti.trainerAan : ti.trainerUit}</p>
        <button type="button" className="club-lidapp-knop" disabled={bezig || alleenLezen} onClick={() => void bewaar({ soort: 'trainer', trainerZien: !instellingen.trainerZien })}>
          {instellingen.trainerZien ? ti.trainerKnopUit : ti.trainerKnopAan}
        </button>
      </div>
      <div className="club-vd-instellingen-blok">
        <strong>{ti.doelenTitel}</strong>
        {heeftPlan ? (
          <p className="club-vd-hint">{ti.doelenCoach}</p>
        ) : (
          <form className="club-vd-formulier" onSubmit={bewaarDoel}>
            <p className="club-vd-hint">{ti.doelenUitleg}</p>
            <div className="club-vd-raster">
              {([['kcal', t.macro.kcal], ['eiwit', t.eigenProduct.eiwit], ['kh', t.eigenProduct.koolhydraten], ['vet', t.eigenProduct.vet]] as const).map(([k, label]) => (
                <label key={k} className="club-vd-veld">
                  <span>{label}</span>
                  <input inputMode="numeric" value={doel[k]} onChange={(e) => setDoel((oud) => ({ ...oud, [k]: e.target.value }))} />
                </label>
              ))}
            </div>
            <div className="club-vd-knoppen">
              {d && <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" disabled={bezig || alleenLezen} onClick={() => void bewaar({ soort: 'doelen', doelen: null })}>{ti.doelWeghalen}</button>}
              <button type="submit" className="club-lidapp-knop" disabled={bezig || alleenLezen}>{ti.doelOpslaan}</button>
            </div>
          </form>
        )}
      </div>
      <div className="club-vd-instellingen-blok">
        <strong>{ti.wissenTitel}</strong>
        <p className="club-vd-hint">{ti.wissenUitleg}</p>
        {zeker && <p className="club-vd-fout" role="alert">{ti.wissenZeker}</p>}
        <button type="button" className="club-lidapp-knop club-vd-gevaar" disabled={bezig || alleenLezen} onClick={() => void wis()}>{ti.wissenKnop}</button>
      </div>
      {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
    </details>
  )
}
