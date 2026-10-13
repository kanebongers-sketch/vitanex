'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { STANDAARD_MATEN, voorraadPerArtikel, type KledingArtikel, type VoorraadRegel } from '@/lib/lifeos/pt-dashboard/kleding'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { kledingActie } from './kleding-api'

// Kane: een nieuw artikel aanmaken, en kleding uitgeven aan een PT'er (gaat
// van de voorraad in Eersel af; de database weigert als er te weinig is).

export function ArtikelFormulier() {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [maten, setMaten] = useState<readonly string[]>(['S', 'M', 'L', 'XL'])
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const wissel = (m: string) => setMaten((nu) => (nu.includes(m) ? nu.filter((x) => x !== m) : STANDAARD_MATEN.filter((x) => x === m || nu.includes(x))))

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const f = await kledingActie({ actie: 'artikel', naam, maten })
    setBezig(false)
    if (f) return setFout(f)
    setNaam('')
    router.refresh()
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-labelledby="kl-art-kop">
      <h3 id="kl-art-kop">Artikel toevoegen</h3>
      <div className="ptd-veld">
        <label htmlFor="kl-naam">Naam *</label>
        <input id="kl-naam" className="ptd-invoer" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={60} placeholder="bv. Shirt, Hoodie, Short" required />
      </div>
      <fieldset className="ptd-veld">
        <legend>Maten *</legend>
        <div className="ptd-filters">
          {STANDAARD_MATEN.map((m) => (
            <button key={m} type="button" className="ptd-chip" aria-pressed={maten.includes(m)} onClick={() => wissel(m)}>{m}</button>
          ))}
        </div>
      </fieldset>
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig || maten.length === 0}>
          <Plus size={16} aria-hidden /> {bezig ? 'Opslaan…' : 'Toevoegen'}
        </button>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}

interface UitgifteProps {
  artikelen: readonly KledingArtikel[]
  voorraad: readonly VoorraadRegel[]
  team: readonly { id: string; naam: string }[]
  vandaag: string
}

export function UitgifteFormulier({ artikelen, voorraad, team, vandaag }: UitgifteProps) {
  const router = useRouter()
  const [persoon, setPersoon] = useState('')
  const [artikel, setArtikel] = useState(artikelen[0]?.id ?? '')
  const [maat, setMaat] = useState('')
  const [aantal, setAantal] = useState('1')
  const [datum, setDatum] = useState(vandaag)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const gekozen = artikelen.find((a) => a.id === artikel)
  const opVoorraad = voorraadPerArtikel(artikelen, voorraad).get(artikel)

  async function geef(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!persoon) return setFout("Kies de PT'er.")
    if (!maat) return setFout('Kies de maat.')
    setBezig(true)
    setFout(null)
    const f = await kledingActie({ actie: 'uitgeven', persoonId: persoon, artikelId: artikel, maat, aantal: Number(aantal), datum })
    setBezig(false)
    if (f) return setFout(f)
    setAantal('1')
    router.refresh()
  }

  if (artikelen.length === 0) return null
  return (
    <form className="ptd-form" onSubmit={(e) => void geef(e)} aria-labelledby="kl-uit-kop">
      <h3 id="kl-uit-kop">Kleding uitgeven</h3>
      <div className="ptd-raster">
        <div className="ptd-veld">
          <label htmlFor="kl-pt">PT&apos;er *</label>
          <select id="kl-pt" className="ptd-invoer" value={persoon} onChange={(e) => setPersoon(e.target.value)} required>
            <option value="" disabled>Kies…</option>
            {team.map((p) => <option key={p.id} value={p.id}>{p.naam}</option>)}
          </select>
        </div>
        <div className="ptd-veld">
          <label htmlFor="kl-art">Artikel *</label>
          <select id="kl-art" className="ptd-invoer" value={artikel} onChange={(e) => { setArtikel(e.target.value); setMaat('') }}>
            {artikelen.map((a) => <option key={a.id} value={a.id}>{a.naam}</option>)}
          </select>
        </div>
        <div className="ptd-veld">
          <label htmlFor="kl-maat">Maat *</label>
          <select id="kl-maat" className="ptd-invoer" value={maat} onChange={(e) => setMaat(e.target.value)} required>
            <option value="" disabled>Kies…</option>
            {gekozen?.maten.map((m) => {
              const n = opVoorraad?.get(m) ?? 0
              return <option key={m} value={m} disabled={n === 0}>{m} ({n} op voorraad)</option>
            })}
          </select>
        </div>
        <div className="ptd-veld">
          <label htmlFor="kl-aantal">Aantal *</label>
          <input id="kl-aantal" className="ptd-invoer" type="number" inputMode="numeric" min={1} max={50} value={aantal} onChange={(e) => setAantal(e.target.value)} required />
        </div>
        <div className="ptd-veld">
          <label htmlFor="kl-datum">Datum</label>
          <input id="kl-datum" className="ptd-invoer" type="date" value={datum} max={vandaag} onChange={(e) => setDatum(e.target.value || vandaag)} />
        </div>
      </div>
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Uitgeven'}</button>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
