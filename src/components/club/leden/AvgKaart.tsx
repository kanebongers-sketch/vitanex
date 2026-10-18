'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText, RotateCcw, Trash2 } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { naamKlopt, VERWIJDER_DAGEN } from '@/lib/club/leden/avg/verwijderen'
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
    setMelding({ tekst: `${voornaam} wordt over ${VERWIJDER_DAGEN} dagen definitief verwijderd.`, fout: false })
    router.refresh()
  }

  async function terugdraaien() {
    if (!window.confirm(`Het verwijderen van ${naam} terugdraaien? ${voornaam} krijgt de oude status terug. Geannuleerde lessen en afspraken komen niet terug.`)) return
    setBezig(true)
    setMelding(null)
    const uit = await stuur(`${basis}/verwijderen`, 'DELETE')
    setBezig(false)
    if (!uit.ok) return setMelding({ tekst: uit.fout, fout: true })
    setMelding({ tekst: 'Teruggedraaid. Het lid is er weer.', fout: false })
    router.refresh()
  }

  return (
    <section className="club-kaart club-avg" aria-labelledby="avg-kop" id="privacy">
      <div className="club-sectiekop">
        <h2 id="avg-kop">Privacy (AVG)</h2>
        {verzoekTekst ? <span className="club-chip club-chip--let-op">Wordt verwijderd</span> : null}
      </div>

      {verzoekTekst ? (
        <div className="club-avg-verzoek" role="status">
          <p>
            <strong>{verzoekTekst}</strong> Tot dan kan {voornaam} niet inloggen, inchecken of boeken.
          </p>
          {magVerwijderen ? (
            <button type="button" className="club-knop" disabled={bezig} onClick={() => void terugdraaien()}>
              <RotateCcw size={16} aria-hidden /> Verwijderen terugdraaien
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="club-hint">Een lid mag altijd vragen welke gegevens de sportschool bewaart. Het bestand bevat alles uit Club, ook metingen en intake.</p>
      <div className="club-avg-knoppen">
        <a className="club-knop" href={`${basis}/gegevens`} download>
          <Download size={16} aria-hidden /> Gegevens van dit lid downloaden
        </a>
        <a className="club-knop club-knop--stil" href={`${basis}/gegevens?vorm=tekst`} download>
          <FileText size={16} aria-hidden /> Samenvatting
        </a>
      </div>

      {magVerwijderen && !verzoekTekst ? (
        open ? (
          <div className="club-avg-bevestig">
            <p>
              <strong>{naam} wordt over {VERWIJDER_DAGEN} dagen definitief verwijderd.</strong> Vanaf nu kan {voornaam} niet meer inloggen, inchecken of boeken, en
              geplande lessen en afspraken vervallen. Binnen {VERWIJDER_DAGEN} dagen kun je dit terugdraaien. Daarna zijn alle gegevens weg; bezoeken en lesbezetting
              blijven alleen anoniem meetellen in de cijfers.
            </p>
            <p className="club-hint">Tip: download eerst de gegevens als het lid daarom vraagt.</p>
            <label className="club-veld">
              <span>Typ de naam ter bevestiging</span>
              <input className="club-invoer" value={invoer} onChange={(e) => setInvoer(e.target.value)} placeholder={naam} autoComplete="off" spellCheck={false} />
            </label>
            <div className="club-avg-knoppen">
              <button type="button" className="club-knop club-knop--gevaar" disabled={!klopt || bezig} onClick={() => void aanvragen()}>
                <Trash2 size={16} aria-hidden /> Definitief verwijderen over {VERWIJDER_DAGEN} dagen
              </button>
              <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => { setOpen(false); setInvoer('') }}>
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="club-knop club-knop--gevaar club-avg-start" onClick={() => setOpen(true)}>
            <Trash2 size={16} aria-hidden /> Lid verwijderen (AVG)
          </button>
        )
      ) : null}

      <p className={melding?.fout ? 'club-melding club-melding--fout' : 'club-avg-status'} role="status" aria-live="polite">
        {melding?.tekst}
      </p>
    </section>
  )
}
