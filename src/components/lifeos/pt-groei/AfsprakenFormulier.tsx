'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AFSPRAAK_LABEL, AFSPRAAK_MAX, type Afspraak, type AfspraakSoort } from '@/lib/lifeos/pt-dashboard/checkup'
import { ptApi, leesLeeg } from '@/components/lifeos/pt-dashboard/api'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// Kane, aan het eind van de checkup: wat spreken we af tot de volgende keer?
// Alleen meetbare afspraken; de volgende checkup laat zien of ze gehaald zijn.
// Begint met de vorige afspraak ingevuld (vaak blijft het grotendeels gelijk).

const SOORTEN: readonly AfspraakSoort[] = ['gesprekken', 'nieuweKlanten', 'referrals']
const HINT: Record<AfspraakSoort, string> = {
  gesprekken: 'leads vastgelegd',
  nieuweKlanten: 'klanten gestart',
  referrals: 'klanten om een referral gevraagd',
}

const tekst = (n: number | null | undefined) => (n ? String(n) : '')

export function AfsprakenFormulier({ code, persoonId, naam, vorige }: { code: string; persoonId: string; naam: string; vorige: Afspraak | null }) {
  const router = useRouter()
  const [aantal, setAantal] = useState<Record<AfspraakSoort, string>>({
    gesprekken: tekst(vorige?.gesprekken),
    nieuweKlanten: tekst(vorige?.nieuweKlanten),
    referrals: tekst(vorige?.referrals),
  })
  const [nietsTeLaat, setNietsTeLaat] = useState(vorige?.nietsTeLaat ?? true)
  const [notitie, setNotitie] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState(false)

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, 'afspraken', 'POST', { persoonId, ...aantal, nietsTeLaat, notitie }, leesLeeg)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setKlaar(true)
    setNotitie('')
    router.refresh()
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-labelledby="ck-afspraak-kop">
      <h3 id="ck-afspraak-kop">Afspraken tot de volgende checkup</h3>
      <p className="ptd-hint">Leeg = geen afspraak over. De volgende checkup meet {naam} hierop, vanaf vandaag.</p>
      <div className="ptd-raster">
        {SOORTEN.map((s) => (
          <div key={s} className="ptd-veld">
            <label htmlFor={`ck-${s}`}>{AFSPRAAK_LABEL[s]}</label>
            <input
              id={`ck-${s}`}
              className="ptd-invoer"
              type="number"
              inputMode="numeric"
              min={1}
              max={AFSPRAAK_MAX[s]}
              step={1}
              value={aantal[s]}
              onChange={(e) => setAantal((nu) => ({ ...nu, [s]: e.target.value }))}
              aria-describedby={`ck-${s}-hint`}
            />
            <span id={`ck-${s}-hint`} className="ptd-hint">minstens, {HINT[s]}</span>
          </div>
        ))}
      </div>
      <label className="ck-vinkje">
        <input type="checkbox" checked={nietsTeLaat} onChange={(e) => setNietsTeLaat(e.target.checked)} />
        <span>Bij de volgende checkup staat er geen lead te laat</span>
      </label>
      <div className="ptd-veld">
        <label htmlFor="ck-notitie">Toelichting</label>
        <input id="ck-notitie" className="ptd-invoer" value={notitie} onChange={(e) => setNotitie(e.target.value)} maxLength={300} placeholder="bv. referral vragen bij de klanten die hun doel haalden" />
      </div>
      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Afspraken vastleggen'}</button>
        {klaar ? <span className="ptd-hint" role="status">Vastgelegd. De meting begint vandaag.</span> : null}
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
