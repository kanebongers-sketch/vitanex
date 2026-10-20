'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { KLEURMODI, KLEURMODUS_LABEL, type Kleurmodus, type WidgetInstellingen } from '@/lib/club/widget/invoer'

// Instellen van de boekingswidget voor een vestiging: aan of uit, websites,
// lessen, kleurmodus en privacylink. Daaronder de code om te plakken en een
// link naar de voorvertoning.

interface Props {
  vestiging: string
  begin: WidgetInstellingen
  lestypen: readonly { id: string; naam: string }[]
  code: string | null
  voorbeeldPad: string | null
}

type Melding = { ok: boolean; tekst: string } | null

function KopieerCode({ code }: { code: string }) {
  const [gekopieerd, setGekopieerd] = useState(false)
  async function kopieer() {
    try {
      await navigator.clipboard.writeText(code)
      setGekopieerd(true)
      window.setTimeout(() => setGekopieerd(false), 2000)
    } catch {
      setGekopieerd(false)
    }
  }
  return (
    <div className="club-wb-code">
      <pre tabIndex={0} aria-label="Code voor je website"><code>{code}</code></pre>
      <button type="button" className="club-knop" onClick={() => void kopieer()}>
        {gekopieerd ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        {gekopieerd ? 'Gekopieerd' : 'Kopieer code'}
      </button>
    </div>
  )
}

export function WidgetInstellingenFormulier({ vestiging, begin, lestypen, code, voorbeeldPad }: Props) {
  const router = useRouter()
  const [aan, setAan] = useState(begin.aan)
  const [domeinen, setDomeinen] = useState(begin.domeinen.join('\n'))
  const [alle, setAlle] = useState(begin.lestypeIds.length === 0)
  const [gekozen, setGekozen] = useState<string[]>(begin.lestypeIds)
  const [kleurmodus, setKleurmodus] = useState<Kleurmodus>(begin.kleurmodus)
  const [privacyUrl, setPrivacyUrl] = useState(begin.privacyUrl ?? '')
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<Melding>(null)

  function wissel(id: string) {
    setGekozen((oud) => (oud.includes(id) ? oud.filter((x) => x !== id) : [...oud, id]))
  }

  async function bewaar() {
    if (!alle && gekozen.length === 0) return setMelding({ ok: false, tekst: 'Kies minstens een les, of zet Alle lessen aan.' })
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/widget', 'PATCH', { vestiging, aan, domeinen, lestypeIds: alle ? [] : gekozen, kleurmodus, privacyUrl })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: aan ? 'Opgeslagen. De widget toont dit meteen.' : 'Opgeslagen. De widget staat uit voor deze vestiging.' })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier club-wb">
      <label className="club-beheer-keuze">
        <input type="checkbox" checked={aan} onChange={(e) => setAan(e.target.checked)} />
        <span>
          Widget aan voor deze vestiging
          <small className="club-hint club-wb-blok">Uit: de widget bestaat niet voor bezoekers (een lege pagina met niet gevonden).</small>
        </span>
      </label>

      <label className="club-wb-veld">
        <span className="club-label">Websites waarop de widget mag staan</span>
        <textarea rows={3} value={domeinen} onChange={(e) => setDomeinen(e.target.value)} placeholder={'jouwsportschool.nl\nwww.jouwsportschool.nl'} spellCheck={false} />
        <small className="club-hint">Een per regel, maximaal 10. Leeg: elke website mag hem tonen. Met *.jouwsportschool.nl tellen alle subdomeinen mee.</small>
      </label>

      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">Welke lessen komen erin?</legend>
        <label className="club-beheer-keuze">
          <input type="checkbox" checked={alle} onChange={(e) => setAlle(e.target.checked)} />
          <span>Alle groepslessen</span>
        </label>
        {!alle && (
          <div className="club-wb-lessen">
            {lestypen.length === 0 && <p className="club-hint">Er zijn nog geen lestypen.</p>}
            {lestypen.map((l) => (
              <label key={l.id} className="club-beheer-keuze">
                <input type="checkbox" checked={gekozen.includes(l.id)} onChange={() => wissel(l.id)} />
                <span>{l.naam}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">Kleuren</legend>
        <div className="club-wb-modi">
          {KLEURMODI.map((m) => (
            <label key={m} className="club-beheer-keuze">
              <input type="radio" name="widget-kleurmodus" value={m} checked={kleurmodus === m} onChange={() => setKleurmodus(m)} />
              <span>{KLEURMODUS_LABEL[m]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="club-wb-veld">
        <span className="club-label">Link naar je privacyverklaring (optioneel)</span>
        <input type="url" value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} placeholder="https://jouwsportschool.nl/privacy" maxLength={300} />
        <small className="club-hint">Staat bij het vinkje voor toestemming in het aanvraagformulier.</small>
      </label>

      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar()}>
          {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>

      {code && voorbeeldPad && (
        <section className="club-wb-plakken" aria-labelledby="widget-code-kop">
          <h2 id="widget-code-kop" className="club-label">Op je website zetten</h2>
          <p className="club-hint">Plak deze regel op de pagina waar het rooster moet komen. De hoogte past zich vanzelf aan.</p>
          <KopieerCode code={code} />
          <a className="club-wb-voorbeeld" href={`${voorbeeldPad}&modus=${kleurmodus}`} target="_blank" rel="noopener">
            Voorvertoning openen <ExternalLink size={15} aria-hidden />
          </a>
        </section>
      )}
    </div>
  )
}
