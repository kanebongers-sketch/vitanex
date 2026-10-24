import { Award, Flame, RotateCcw, Search, X } from 'lucide-react'
import { volgendeMijlpaal } from '@/lib/club/voortgang/frequentie'
import type { VoorbeeldOefening } from '@/components/aiyourgym/inhoud/voorbeeldschema'
import { Toestel, Venster } from '@/components/aiyourgym/mockups/kaders'
import { OefTegel } from '@/components/aiyourgym/mockups/OefTegel'
import { Oefenbeeld } from '@/components/aiyourgym/mockups/Oefenbeeld'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { SCHEMA_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/schemas'

// Bibliotheek, eigen coachtekst, een oefening in de ledenapp en voortgang.
// Getekend in HTML en CSS met voorbeeldgegevens; de coaching is de echte tekst
// (uit de bibliotheek van Club, voorlopig alleen in het Nederlands) en de
// geopende oefening is ons eigen 3D-figuur.

interface Props {
  oefeningen: readonly VoorbeeldOefening[]
}

export async function BibliotheekScherm({ oefeningen, aantal }: Props & { aantal: number }) {
  const t = SCHEMA_SCHERMEN[await getSiteTaal()].bibliotheek
  const [spieren, materiaal, niveau] = t.filters
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>{t.oefeningen}</b>
          <i>{t.metCoaching(aantal)}</i>
        </span>
        <span className="aygm-knopje">{t.eigenOefening}</span>
      </div>
      <span className="ayg-ss-filters">
        <span className="ayg-ss-zoek">
          <Search size={11} aria-hidden /> {t.zoeken}
        </span>
        <i>{spieren}</i>
        <i>{materiaal}</i>
        <i>{niveau}</i>
      </span>
      <span className="ayg-ss-bieb">
        {oefeningen.map((o) => (
          <span key={o.naam} className="ayg-ss-bieb-kaart">
            <OefTegel naam={o.naam} />
            <b>{o.naam}</b>
            <small>{t.kernpunten(o.coaching.kernpunten.length)}</small>
          </span>
        ))}
      </span>
    </Venster>
  )
}

export async function CoachtekstScherm({ oefening }: { oefening: VoorbeeldOefening }) {
  const t = SCHEMA_SCHERMEN[await getSiteTaal()].coachtekst
  const kern = oefening.coaching.kernpunten.slice(0, 3)
  return (
    <Venster actief="Coaching">
      <div className="ayg-ss-kop">
        <span>
          <b>{oefening.naam}</b>
          <i>{t.eigenTekst}</i>
        </span>
      </div>
      <p className="aygm-boven">{t.kernpunten}</p>
      <span className="ayg-ss-invoer-lijst">
        {kern.map((k, i) => (
          <span key={k.punt} className="ayg-ss-invoer-rij">
            <span className="ayg-ss-invoer-nr">{i + 1}</span>
            <span className="ayg-ss-invoer" data-actief={i === 0 ? '' : undefined}>
              {i === 0 ? t.voorbeeldPunt : k.punt}
            </span>
            <span className="ayg-ss-invoer ayg-ss-invoer--lang">{k.uitleg}</span>
            <X size={11} aria-hidden />
          </span>
        ))}
      </span>
      <span className="ayg-ss-werkbalk">
        <span className="aygm-knopje">{t.opslaan}</span>
        <span className="ayg-ss-knop">{t.annuleren}</span>
        <span className="ayg-ss-knop">
          <RotateCcw size={11} aria-hidden /> {t.standaard}
        </span>
      </span>
    </Venster>
  )
}

export async function OefeningToestel({ oefening }: { oefening: VoorbeeldOefening }) {
  const s = SCHEMA_SCHERMEN[await getSiteTaal()]
  const t = s.oefening
  return (
    <div className="aygm">
      <Toestel tab="Schema">
        <div className="ayg-ss-blad">
          <p className="ayg-cd-app-kop">{oefening.naam}</p>
          <span className="ayg-ss-blad-beeld">
            <Oefenbeeld naam={oefening.naam} label={t.bewegend(oefening.naam)} className="ayg-3d--vul" />
          </span>
          <span className="ayg-ss-blad-regel">{s.voorschrift(oefening.voorschrift)}</span>
          <span className="ayg-ss-blad-notitie">{t.notitie}</span>
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

export async function VoortgangToestel() {
  const taal = await getSiteTaal()
  const t = SCHEMA_SCHERMEN[taal].voortgang
  const totaal = WEKEN.reduce((a, b) => a + b, 0)
  const volgende = volgendeMijlpaal(totaal)
  const max = Math.max(...WEKEN)
  return (
    <div className="aygm">
      <Toestel tab="Voortgang">
        <div className="ayg-ss-vg">
          <p className="ayg-cd-app-kop">{t.titel}</p>
          <span className="ayg-ss-vg-tegels">
            <span>
              <Flame size={13} aria-hidden />
              <b>{WEKEN.length}</b>
              <small>{t.wekenOpRij}</small>
            </span>
            <span>
              <b>{totaal}</b>
              <small>{t.trainingen}</small>
            </span>
          </span>
          <span className="ayg-ss-vg-kaart">
            <small>{t.perWeek}</small>
            <span className="ayg-ss-vg-balken">
              {WEKEN.map((w, i) => (
                <i key={i} style={{ transform: `scaleY(${w / max})` }} />
              ))}
            </span>
          </span>
          <span className="ayg-ss-vg-kaart">
            <small>
              {t.gewicht} · {formatGetal(GEWICHT[GEWICHT.length - 1], taal)} kg
            </small>
            <svg viewBox="-4 -4 208 68" aria-hidden>
              <polyline points={lijn(GEWICHT, 200, 60)} />
            </svg>
          </span>
          {volgende && (
            <span className="ayg-ss-vg-mijlpaal">
              <Award size={14} aria-hidden />
              <span>
                <b>{t.opWeg(totaal + volgende.nogTeGaan)}</b>
                <small>{t.nogTeGaan(volgende.nogTeGaan)}</small>
              </span>
            </span>
          )}
        </div>
      </Toestel>
    </div>
  )
}
