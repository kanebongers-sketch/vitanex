'use client'

import { useRef, useState, type FormEvent } from 'react'
import { ScanBarcode, Search } from 'lucide-react'
import type { Product } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { haal, voedingUrl } from './api'
import { ProductRij } from './ProductRij'

// Zoeken in Open Food Facts en een barcode scannen (geporteerd uit MentaForce).
// Scannen: een foto van de barcode, gelezen met BarcodeDetector van de browser
// (Chrome, Android, nieuwere Safari); kan dat niet, dan typ je de cijfers.

interface Props {
  t: VoedingDagboekTekst
  voor: string | null
  modus: 'zoeken' | 'scannen'
  onKies: (p: Product) => void
  onEigen: (barcode: string | null) => void
}

interface DetectorKlasse {
  new (opties: { formats: string[] }): { detect(bron: ImageBitmap): Promise<{ rawValue: string }[]> }
}

function detector(): DetectorKlasse | null {
  const w = window as unknown as { BarcodeDetector?: DetectorKlasse }
  return typeof w.BarcodeDetector === 'function' ? w.BarcodeDetector : null
}

export function ZoekPaneel({ t, voor, modus, onKies, onEigen }: Props) {
  const tz = t.toevoegen
  const [term, setTerm] = useState('')
  const [code, setCode] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [resultaten, setResultaten] = useState<Product[] | null>(null)
  const [onbekend, setOnbekend] = useState<string | null>(null)
  const bestand = useRef<HTMLInputElement>(null)

  async function zoek(e: FormEvent) {
    e.preventDefault()
    if (term.trim().length < 2) return
    setBezig(true)
    setFout(null)
    const r = await haal<{ producten: Product[] }>(voedingUrl(`/zoek?q=${encodeURIComponent(term.trim())}`, voor), t.fout, t.fout.zoeken)
    setBezig(false)
    if (r.ok) setResultaten(r.data.producten)
    else setFout(r.fout)
  }

  async function zoekCode(cijfers: string) {
    setBezig(true)
    setFout(null)
    setOnbekend(null)
    const r = await haal<{ product: Product | null }>(voedingUrl(`/barcode?code=${encodeURIComponent(cijfers)}`, voor), t.fout, t.fout.zoeken)
    setBezig(false)
    if (!r.ok) return setFout(r.fout)
    if (r.data.product) onKies(r.data.product)
    else setOnbekend(cijfers)
  }

  async function leesFoto(f: File | undefined) {
    if (!f) return
    const Klasse = detector()
    if (!Klasse) return setFout(tz.scanGeenDetector)
    try {
      const beeld = await createImageBitmap(f)
      const gevonden = await new Klasse({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }).detect(beeld)
      const cijfers = gevonden[0]?.rawValue?.replace(/\D/g, '') ?? ''
      if (cijfers.length >= 6) {
        setCode(cijfers)
        await zoekCode(cijfers)
      } else setFout(tz.scanNietGelezen)
    } catch {
      setFout(tz.scanNietGelezen)
    }
  }

  if (modus === 'scannen') {
    return (
      <div className="club-vd-paneel">
        <p className="club-vd-hint">{tz.scanUitleg}</p>
        <input ref={bestand} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void leesFoto(e.target.files?.[0])} />
        <button type="button" className="club-vd-hoofdknop" onClick={() => bestand.current?.click()} disabled={bezig}>
          <ScanBarcode size={20} aria-hidden /> {tz.scanKnop}
        </button>
        <form className="club-vd-zoekbalk" onSubmit={(e) => { e.preventDefault(); if (/^\d{6,14}$/.test(code)) void zoekCode(code) }}>
          <label className="club-vd-veld">
            <span>{tz.codeLabel}</span>
            <input inputMode="numeric" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 14))} />
          </label>
          <button type="submit" className="club-lidapp-knop" disabled={bezig || !/^\d{6,14}$/.test(code)}>{bezig ? tz.bezig : tz.codeZoeken}</button>
        </form>
        {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
        {onbekend && (
          <div className="club-vd-melding">
            <p>{tz.codeOnbekend}</p>
            <button type="button" className="club-lidapp-knop" onClick={() => onEigen(onbekend)}>{tz.eigenNieuw}</button>
          </div>
        )}
        <p className="club-vd-bron">{tz.bron}</p>
      </div>
    )
  }

  return (
    <div className="club-vd-paneel">
      <form className="club-vd-zoekbalk" onSubmit={(e) => void zoek(e)} role="search">
        <label className="club-vd-veld club-vd-veld--breed">
          <span className="club-vd-sr">{tz.zoekLabel}</span>
          <input type="search" enterKeyHint="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={tz.zoekHint} autoFocus />
        </label>
        <button type="submit" className="club-lidapp-knop" disabled={bezig || term.trim().length < 2} aria-label={tz.zoeken}>
          <Search size={18} aria-hidden />
        </button>
      </form>
      {bezig && <p className="club-vd-hint" role="status">{tz.bezig}</p>}
      {fout && <p className="club-vd-fout" role="alert">{fout}</p>}
      {resultaten && resultaten.length === 0 && !bezig && <p className="club-vd-hint">{tz.geenResultaat}</p>}
      {resultaten && resultaten.length > 0 && (
        <ul className="club-vd-lijst">
          {resultaten.map((p) => (
            <li key={p.sleutel ?? p.naam}>
              <ProductRij product={p} t={t} onKies={() => onKies(p)} />
            </li>
          ))}
        </ul>
      )}
      <p className="club-vd-bron">{tz.bron}</p>
    </div>
  )
}
