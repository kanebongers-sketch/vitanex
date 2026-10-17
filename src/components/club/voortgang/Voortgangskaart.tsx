'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { VoortgangData } from '@/lib/club/voortgang/model'
import { BMI_KANTTEKENING, beschikbareReeksen, laatsteBloeddruk, reeksVoor, verschillen, type ReeksSleutel } from '@/lib/club/voortgang/tijdlijn'
import { MetingFormulier, type MedewerkerKeuze } from './MetingFormulier'
import { MetingLijst } from './MetingLijst'
import { ReeksKop } from './ReeksKop'
import { TrainingStrook } from './TrainingStrook'
import { VoortgangGrafiek } from './VoortgangGrafiek'
import { useVoortgang } from './useVoortgang'
import { datumLang } from './weergave'
import './voortgang.css'

interface VoortgangskaartProps {
  /** Uit haalVoortgang() op de server. */
  begin: VoortgangData
  /** Medewerkers om "gemeten door" te kiezen. */
  medewerkers: readonly MedewerkerKeuze[]
  /** Vandaag in Nederland, yyyy-mm-dd (dagSleutelNl). */
  vandaag: string
  /** Nu als ISO-tekst, voor de weken. */
  nu: string
}

type Modus = { soort: 'kijk' } | { soort: 'nieuw' } | { soort: 'wijzig'; id: string }

/** Voortgang op de ledenkaart: grafiek per meetwaarde, verschillen, trainingen per week en metingen beheren. */
export function Voortgangskaart({ begin, medewerkers, vandaag, nu }: VoortgangskaartProps) {
  const { voortgang, bezig, melding, voegToe, wijzig, verwijder } = useVoortgang(begin)
  const [modus, setModus] = useState<Modus>({ soort: 'kijk' })
  const [keuze, setKeuze] = useState<ReeksSleutel>('gewicht_kg')

  const reeksen = beschikbareReeksen(voortgang.punten)
  const info = reeksen.find((r) => r.sleutel === keuze) ?? reeksen[0]
  const reeks = info ? reeksVoor(voortgang.punten, info.sleutel) : []
  const verschil = verschillen(reeks)
  const bloeddruk = laatsteBloeddruk(voortgang.punten)
  const teWijzigen = modus.soort === 'wijzig' ? voortgang.metingen.find((m) => m.id === modus.id) : undefined
  const sluit = () => setModus({ soort: 'kijk' })

  return (
    <section className="club-kaart club-voortgang" aria-labelledby="voortgang-kop">
      <div className="club-voortgang-kop">
        <div>
          <h2 id="voortgang-kop">Voortgang</h2>
          <p className="club-voortgang-ondertitel">Metingen uit intakes en tussendoor, plus de trainingen uit de app.</p>
        </div>
        {modus.soort === 'kijk' && (
          <button type="button" className="club-knop club-knop--primair club-knop--klein" onClick={() => setModus({ soort: 'nieuw' })}>
            <Plus aria-hidden size={16} /> Meting toevoegen
          </button>
        )}
      </div>

      <div aria-live="polite" className="club-voortgang-meldplek">
        {melding && <p className={`club-melding ${melding.soort === 'ok' ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
      {voortgang.fouten.length > 0 && (
        <p className="club-melding club-melding--fout" role="alert">
          Niet alles kon worden geladen ({voortgang.fouten.join(', ')}). Ververs de pagina om het opnieuw te proberen.
        </p>
      )}

      {modus.soort !== 'kijk' && (
        <MetingFormulier
          key={modus.soort === 'wijzig' ? modus.id : 'nieuw'}
          meting={teWijzigen}
          medewerkers={medewerkers}
          vandaag={vandaag}
          bezig={bezig}
          onOpslaan={(velden) => (teWijzigen ? wijzig(teWijzigen.id, velden) : voegToe(velden))}
          onAnnuleer={sluit}
        />
      )}

      {info && verschil ? (
        <div className="club-voortgang-hoofd">
          <ReeksKop info={info} verschil={verschil} reeksen={reeksen} gekozen={info.sleutel} onKies={setKeuze} />
          <VoortgangGrafiek reeks={reeks} info={info} />
          <p className="club-voortgang-legenda">
            <span className="club-voortgang-legenda-ruit" aria-hidden /> Intake <span className="club-voortgang-legenda-rond" aria-hidden /> Losse meting
            {bloeddruk && <span className="club-voortgang-legenda-extra">Laatste bloeddruk {bloeddruk.waarde} ({datumLang(bloeddruk.datum)})</span>}
          </p>
          {info.sleutel === 'bmi' && <p className="club-voortgang-kanttekening">{BMI_KANTTEKENING}</p>}
        </div>
      ) : (
        <p className="club-leeg">Nog geen metingen. Voeg de eerste toe, met toestemming van het lid.</p>
      )}

      <TrainingStrook trainingen={voortgang.trainingen} totaal={voortgang.totaalTrainingen} nu={nu} />

      <MetingLijst
        punten={voortgang.punten}
        metingen={voortgang.metingen}
        medewerkers={medewerkers}
        bezig={bezig}
        onWijzig={(id) => setModus({ soort: 'wijzig', id })}
        onVerwijder={verwijder}
      />
    </section>
  )
}
