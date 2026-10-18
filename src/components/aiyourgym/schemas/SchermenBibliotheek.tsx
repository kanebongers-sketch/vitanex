import { Award, Flame, RotateCcw, Search, X } from 'lucide-react'
import { volgendeMijlpaal } from '@/lib/club/voortgang/frequentie'
import type { VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { Toestel, Venster } from '@/components/aiyourgym/mockups/kaders'

// Bibliotheek, eigen coachtekst, een oefening in de ledenapp en voortgang.
// Getekend in HTML en CSS met voorbeeldgegevens; de coaching is de echte tekst.

interface Props {
  oefeningen: readonly VoorbeeldOefening[]
}

export function BibliotheekScherm({ oefeningen, aantal }: Props & { aantal: number }) {
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>Oefeningen</b>
          <i>{aantal} met coaching</i>
        </span>
        <span className="aygm-knopje">Eigen oefening</span>
      </div>
      <span className="ayg-ss-filters">
        <span className="ayg-ss-zoek">
          <Search size={11} aria-hidden /> Naam van de oefening
        </span>
        <i>Alle spieren</i>
        <i>Materiaal</i>
        <i>Niveau</i>
      </span>
      <span className="ayg-ss-bieb">
        {oefeningen.map((o) => (
          <span key={o.naam} className="ayg-ss-bieb-kaart">
            <img src={o.beeldStart} alt="" width={120} height={120} loading="lazy" decoding="async" />
            <b>{o.naam}</b>
            <small>{o.coaching.kernpunten.length} kernpunten</small>
          </span>
        ))}
      </span>
    </Venster>
  )
}

export function CoachtekstScherm({ oefening }: { oefening: VoorbeeldOefening }) {
  const kern = oefening.coaching.kernpunten.slice(0, 3)
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>{oefening.naam}</b>
          <i>Eigen tekst van Voorbeeld Gym</i>
        </span>
      </div>
      <p className="aygm-boven">Kernpunten</p>
      <span className="ayg-ss-invoer-lijst">
        {kern.map((k, i) => (
          <span key={k.punt} className="ayg-ss-invoer-rij">
            <span className="ayg-ss-invoer-nr">{i + 1}</span>
            <span className="ayg-ss-invoer" data-actief={i === 0 ? '' : undefined}>
              {i === 0 ? 'Kettlebell tegen je borstbeen' : k.punt}
            </span>
            <span className="ayg-ss-invoer ayg-ss-invoer--lang">{k.uitleg}</span>
            <X size={11} aria-hidden />
          </span>
        ))}
      </span>
      <span className="ayg-ss-werkbalk">
        <span className="aygm-knopje">Opslaan</span>
        <span className="ayg-ss-knop">Annuleren</span>
        <span className="ayg-ss-knop">
          <RotateCcw size={11} aria-hidden /> Terug naar de standaard
        </span>
      </span>
    </Venster>
  )
}

export function OefeningToestel({ oefening }: { oefening: VoorbeeldOefening }) {
  return (
    <div className="aygm">
      <Toestel tab="Schema">
        <div className="ayg-ss-blad">
          <p className="ayg-cd-app-kop">{oefening.naam}</p>
          <span className="ayg-ss-blad-beeld">
            <img src={oefening.beeldStart} alt="" width={240} height={240} loading="lazy" decoding="async" />
            <img className="ayg-ss-blad-eind" src={oefening.beeldEind} alt="" width={240} height={240} loading="lazy" decoding="async" />
          </span>
          <span className="ayg-ss-blad-regel">{oefening.voorschrift}</span>
          <span className="ayg-ss-blad-notitie">Van je trainer: hielen op de grond</span>
          <ol className="ayg-ss-blad-kern">
            {oefening.coaching.kernpunten.map((k, i) => (
              <li key={k.punt}>
                <i>{i + 1}</i>
                <span>
                  <b>{k.punt}</b>
                  <small>{k.uitleg}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Toestel>
    </div>
  )
}

const WEKEN = [2, 3, 2, 3, 3, 2, 3, 3]
const GEWICHT = [74.5, 74.1, 73.6, 73.4, 72.9, 72.6]

function lijn(waarden: readonly number[], b: number, h: number): string {
  const min = Math.min(...waarden)
  const max = Math.max(...waarden)
  return waarden.map((w, i) => `${(i / (waarden.length - 1)) * b},${h - ((w - min) / (max - min || 1)) * h}`).join(' ')
}

export function VoortgangToestel() {
  const totaal = WEKEN.reduce((a, b) => a + b, 0)
  const volgende = volgendeMijlpaal(totaal)
  const max = Math.max(...WEKEN)
  return (
    <div className="aygm">
      <Toestel tab="Voortgang">
        <div className="ayg-ss-vg">
          <p className="ayg-cd-app-kop">Voortgang</p>
          <span className="ayg-ss-vg-tegels">
            <span>
              <Flame size={13} aria-hidden />
              <b>{WEKEN.length}</b>
              <small>weken op rij</small>
            </span>
            <span>
              <b>{totaal}</b>
              <small>trainingen</small>
            </span>
          </span>
          <span className="ayg-ss-vg-kaart">
            <small>Trainingen per week</small>
            <span className="ayg-ss-vg-balken">
              {WEKEN.map((w, i) => (
                <i key={i} style={{ transform: `scaleY(${w / max})` }} />
              ))}
            </span>
          </span>
          <span className="ayg-ss-vg-kaart">
            <small>Gewicht · {GEWICHT[GEWICHT.length - 1].toString().replace('.', ',')} kg</small>
            <svg viewBox="-4 -4 208 68" aria-hidden>
              <polyline points={lijn(GEWICHT, 200, 60)} />
            </svg>
          </span>
          {volgende && (
            <span className="ayg-ss-vg-mijlpaal">
              <Award size={14} aria-hidden />
              <span>
                <b>Op weg naar {volgende.titel.toLowerCase()}</b>
                <small>Nog {volgende.nogTeGaan} te gaan</small>
              </span>
            </span>
          )}
        </div>
      </Toestel>
    </div>
  )
}
