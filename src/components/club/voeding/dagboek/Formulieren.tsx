'use client'

import { useState, type FormEvent } from 'react'
import type { EigenProduct } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { schrijf, voedingUrl } from './api'

// Twee kleine formulieren: een eigen product (waarden per 100 gram van de
// verpakking) en zelf invullen (een gerecht waarvan je de waarden weet).

function Veld({ label, waarde, onWaarde, getal = true, verplicht = false }: { label: string; waarde: string; onWaarde: (v: string) => void; getal?: boolean; verplicht?: boolean }) {
  return (
    <label className="club-vd-veld">
      <span>{label}</span>
      <input inputMode={getal ? 'decimal' : 'text'} value={waarde} onChange={(e) => onWaarde(e.target.value)} required={verplicht} />
    </label>
  )
}

const n = (s: string): number | null => (s.trim() === '' ? null : Number(s.replace(',', '.')))

interface EigenProps {
  t: VoedingDagboekTekst
  voor: string | null
  barcode: string | null
  onKlaar: (p: EigenProduct) => void
}

export function EigenProductFormulier({ t, voor, barcode, onKlaar }: EigenProps) {
  const te = t.eigenProduct
  const [v, setV] = useState({ naam: '', merk: '', barcode: barcode ?? '', kcal: '', eiwit: '', kh: '', vet: '', vezels: '', portie: '' })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const zet = (k: keyof typeof v) => (w: string) => setV((oud) => ({ ...oud, [k]: w }))

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const body = { naam: v.naam, merk: v.merk, barcode: v.barcode || null, per100: { kcal: n(v.kcal), eiwitG: n(v.eiwit) ?? 0, koolhydratenG: n(v.kh) ?? 0, vetG: n(v.vet) ?? 0, vezelsG: n(v.vezels) }, portieGram: n(v.portie) }
    const r = await schrijf<{ product: EigenProduct }>(voedingUrl('/producten', voor), 'POST', body, t.fout, t.fout.opslaan)
    setBezig(false)
    if (r.ok) onKlaar(r.data.product)
    else setFout(r.fout)
  }

  return (
    <form className="club-vd-paneel club-vd-formulier" onSubmit={(e) => void opslaan(e)}>
      <Veld label={te.naam} waarde={v.naam} onWaarde={zet('naam')} getal={false} verplicht />
      <Veld label={te.merk} waarde={v.merk} onWaarde={zet('merk')} getal={false} />
      <Veld label={te.barcode} waarde={v.barcode} onWaarde={(w) => zet('barcode')(w.replace(/\D/g, '').slice(0, 14))} />
      <span className="club-lidapp-label">{te.per100}</span>
      <div className="club-vd-raster">
        <Veld label={te.kcal} waarde={v.kcal} onWaarde={zet('kcal')} verplicht />
        <Veld label={te.eiwit} waarde={v.eiwit} onWaarde={zet('eiwit')} />
        <Veld label={te.koolhydraten} waarde={v.kh} onWaarde={zet('kh')} />
        <Veld label={te.vet} waarde={v.vet} onWaarde={zet('vet')} />
      </div>
      <Veld label={te.vezels} waarde={v.vezels} onWaarde={zet('vezels')} />
      <Veld label={te.portie} waarde={v.portie} onWaarde={zet('portie')} />
      {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
      <button type="submit" className="club-vd-hoofdknop" disabled={bezig}>{bezig ? te.bezig : te.opslaan}</button>
    </form>
  )
}

export interface HandmatigeInvoer {
  naam: string
  gram: number | null
  kcal: number
  eiwitG: number
  koolhydratenG: number
  vetG: number
}

interface HandmatigProps {
  t: VoedingDagboekTekst
  bezig: boolean
  fout: string | null
  onToevoegen: (invoer: HandmatigeInvoer) => void
}

export function HandmatigFormulier({ t, bezig, fout, onToevoegen }: HandmatigProps) {
  const th = t.handmatig
  const [v, setV] = useState({ naam: '', gram: '', kcal: '', eiwit: '', kh: '', vet: '' })
  const zet = (k: keyof typeof v) => (w: string) => setV((oud) => ({ ...oud, [k]: w }))
  const kcal = n(v.kcal)
  const geldig = v.naam.trim().length > 0 && kcal !== null && Number.isFinite(kcal) && kcal >= 0

  return (
    <form
      className="club-vd-paneel club-vd-formulier"
      onSubmit={(e) => {
        e.preventDefault()
        if (geldig) onToevoegen({ naam: v.naam, gram: n(v.gram), kcal: kcal ?? 0, eiwitG: n(v.eiwit) ?? 0, koolhydratenG: n(v.kh) ?? 0, vetG: n(v.vet) ?? 0 })
      }}
    >
      <p className="club-vd-hint">{th.uitleg}</p>
      <Veld label={th.naam} waarde={v.naam} onWaarde={zet('naam')} getal={false} verplicht />
      <div className="club-vd-raster">
        <Veld label={th.kcal} waarde={v.kcal} onWaarde={zet('kcal')} verplicht />
        <Veld label={th.gram} waarde={v.gram} onWaarde={zet('gram')} />
        <Veld label={th.eiwit} waarde={v.eiwit} onWaarde={zet('eiwit')} />
        <Veld label={th.koolhydraten} waarde={v.kh} onWaarde={zet('kh')} />
        <Veld label={th.vet} waarde={v.vet} onWaarde={zet('vet')} />
      </div>
      {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
      <button type="submit" className="club-vd-hoofdknop" disabled={!geldig || bezig}>{bezig ? t.portieStap.bezig : th.toevoegen}</button>
    </form>
  )
}
