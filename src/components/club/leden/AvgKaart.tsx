'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText, RotateCcw, Trash2 } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { naamKlopt, VERWIJDER_DAGEN } from '@/lib/club/leden/avg/verwijderen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDKAART_BLOKKEN } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import './avg.css'

// "Privacy (AVG)" op de ledenkaart. Inzage: alles wat Club over het lid bewaart
// als JSON-bestand plus een korte samenvatting. Verwijderen (alleen Kane en de
// eigenaar): eerst 30 dagen "wordt verwijderd", terug te draaien, daarna
// definitief door de database. Bevestigen door de volledige naam te typen.

interface Props {
  lidId: string
  voornaam: string
  achternaam: string
  magVerwijderen: boolean
  /** Tekst over het lopende verzoek ("Wordt over 12 dagen ..."), of null als er geen loopt. */
  verzoekTekst: string | null
}

export function AvgKaart({ lidId, voornaam, achternaam, magVerwijderen, verzoekTekst }: Props) {
  const router = useRouter()
  const t = useTekst(LIDKAART_BLOKKEN).avg
  const basis = `/api/club/leden/${encodeURIComponent(lidId)}`
  const naam = `${voornaam} ${achternaam}`
  const [open, setOpen] = useState(false)
  const [invoer, setInvoer] = useState('')
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ tekst: string; fout: boolean } | null>(null)
  const klopt = naamKlopt(invoer, { voornaam, achternaam })

  async function aanvragen() {
    if (!klopt) return
    setBezig(true)
    setMelding(null)
    const uit = await stuur(`${basis}/verwijderen`, 'POST', { bevestiging: invoer })
    setBezig(false)
    if (!uit.ok) return setMelding({ tekst: uit.fout, fout: true })
    setOpen(false)
    setInvoer('')
    setMelding({ tekst: t.aangevraagd(voornaam, VERWIJDER_DAGEN), fout: false })
    router.refresh()
  }

  async function terugdraaien() {
    if (!window.confirm(t.vraagTerug(naam, voornaam))) return
    setBezig(true)
    setMelding(null)
    const uit = await stuur(`${basis}/verwijderen`, 'DELETE')
    setBezig(false)
    if (!uit.ok) return setMelding({ tekst: uit.fout, fout: true })
    setMelding({ tekst: t.teruggedraaid, fout: false })
    router.refresh()
  }

  return (
    <section className="club-kaart club-avg" aria-labelledby="avg-kop" id="privacy">
      <div className="club-sectiekop">
        <h2 id="avg-kop">{t.kop}</h2>
        {verzoekTekst ? <span className="club-chip club-chip--let-op">{t.wordtVerwijderd}</span> : null}
      </div>

      {verzoekTekst ? (
        <div className="club-avg-verzoek" role="status">
          <p>
            <strong>{verzoekTekst}</strong> {t.totDan(voornaam)}
          </p>
          {magVerwijderen ? (
            <button type="button" className="club-knop" disabled={bezig} onClick={() => void terugdraaien()}>
              <RotateCcw size={16} aria-hidden /> {t.terugdraaien}
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="club-hint">{t.inzageUitleg}</p>
      <div className="club-avg-knoppen">
        <a className="club-knop" href={`${basis}/gegevens`} download>
          <Download size={16} aria-hidden /> {t.downloaden}
        </a>
        <a className="club-knop club-knop--stil" href={`${basis}/gegevens?vorm=tekst`} download>
          <FileText size={16} aria-hidden /> {t.samenvatting}
        </a>
      </div>

      {magVerwijderen && !verzoekTekst ? (
        open ? (
          <div className="club-avg-bevestig">
            <p>
              <strong>{t.bevestigKop(naam, VERWIJDER_DAGEN)}</strong> {t.bevestigTekst(voornaam, VERWIJDER_DAGEN)}
            </p>
            <p className="club-hint">{t.tip}</p>
            <label className="club-veld">
              <span>{t.typNaam}</span>
              <input className="club-invoer" value={invoer} onChange={(e) => setInvoer(e.target.value)} placeholder={naam} autoComplete="off" spellCheck={false} />
            </label>
            <div className="club-avg-knoppen">
              <button type="button" className="club-knop club-knop--gevaar" disabled={!klopt || bezig} onClick={() => void aanvragen()}>
                <Trash2 size={16} aria-hidden /> {t.definitief(VERWIJDER_DAGEN)}
              </button>
              <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => { setOpen(false); setInvoer('') }}>
                {t.annuleren}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="club-knop club-knop--gevaar club-avg-start" onClick={() => setOpen(true)}>
            <Trash2 size={16} aria-hidden /> {t.start}
          </button>
        )
      ) : null}

      <p className={melding?.fout ? 'club-melding club-melding--fout' : 'club-avg-status'} role="status" aria-live="polite">
        {melding?.tekst}
      </p>
    </section>
  )
}
