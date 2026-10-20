'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, ShieldCheck, Trash2 } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { medewerkerNaamKlopt, medewerkerWisBlokkade } from '@/lib/club/personeel/avg'
import '@/components/club/leden/avg.css'

// "Privacy (AVG)" bij een medewerker. Inzage: alles wat Club over hem of haar
// bewaart als JSON-bestand. Wissen (Kane en eigenaar): alleen na uit dienst,
// direct en onomkeerbaar, bevestigen door de naam te typen. Diensten en uren
// blijven zonder naam bewaard (fiscale bewaarplicht).

interface MedewerkerPrivacyProps {
  medewerkerId: string
  naam: string
  actief: boolean
  gewist: boolean
  magWissen: boolean
}

export function MedewerkerPrivacy({ medewerkerId, naam, actief, gewist, magWissen }: MedewerkerPrivacyProps) {
  const router = useRouter()
  const basis = `/api/club/instellingen/medewerkers/${encodeURIComponent(medewerkerId)}`
  const [open, setOpen] = useState(false)
  const [invoer, setInvoer] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const klopt = medewerkerNaamKlopt(invoer, naam)
  const blokkade = medewerkerWisBlokkade({ actief, gewist })

  async function wis() {
    if (!klopt || bezig) return
    setBezig(true)
    setFout(null)
    const uit = await stuur(`${basis}/wissen`, 'POST', { bevestiging: invoer })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setOpen(false)
    setInvoer('')
    router.refresh()
  }

  return (
    <section className="club-mwlogin club-avg" aria-label={`Privacy van ${naam}`}>
      <div className="club-mwlogin-kop">
        <ShieldCheck aria-hidden size={15} />
        <span className="club-label">Privacy (AVG)</span>
        {gewist ? <span className="club-chip club-chip--uit">Gewist</span> : null}
      </div>

      {gewist ? (
        <p className="club-hint">Naam, e-mail, inlog, beschikbaarheid en notities zijn gewist. Diensten en uren blijven zonder naam bewaard (fiscale bewaarplicht).</p>
      ) : null}
      <div className="club-avg-knoppen">
        <a className="club-knop club-knop--klein" href={`${basis}/gegevens`} download>
          <Download size={14} aria-hidden /> Gegevens downloaden
        </a>
        {magWissen && !blokkade && !open ? (
          <button type="button" className="club-knop club-knop--klein club-knop--gevaar" onClick={() => setOpen(true)}>
            <Trash2 size={14} aria-hidden /> Gegevens wissen
          </button>
        ) : null}
      </div>
      {magWissen && !gewist && actief ? <p className="club-hint">Wissen kan als de medewerker uit dienst is.</p> : null}

      {magWissen && !blokkade && open ? (
        <div className="club-avg-bevestig">
          <p>
            <strong>De gegevens van {naam} worden nu gewist.</strong> De naam wordt &quot;Oud-medewerker&quot;, e-mail, inlog, beschikbaarheid en notities gaan direct
            weg. Diensten en uren blijven zonder naam bewaard voor de administratie. Dit is niet terug te draaien.
          </p>
          <p className="club-hint">Tip: download eerst de gegevens als de medewerker daarom vraagt.</p>
          <label className="club-veld">
            <span>Typ de naam ter bevestiging</span>
            <input className="club-invoer" value={invoer} onChange={(e) => setInvoer(e.target.value)} placeholder={naam} autoComplete="off" spellCheck={false} />
          </label>
          <div className="club-avg-knoppen">
            <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={!klopt || bezig} onClick={() => void wis()}>
              <Trash2 size={14} aria-hidden /> Nu definitief wissen
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig} onClick={() => { setOpen(false); setInvoer('') }}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}

      {fout ? <p className="club-fout" role="alert">{fout}</p> : null}
    </section>
  )
}
