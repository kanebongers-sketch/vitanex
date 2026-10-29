'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { KLEURMODI, type Kleurmodus, type WidgetInstellingen } from '@/lib/club/widget/invoer'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { WIDGET } from '@/lib/aiyourgym/taal/woorden/club/widget'

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
  const t = useTekst(WIDGET).beheer
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
      <pre tabIndex={0} aria-label={t.codeLabel}><code>{code}</code></pre>
      <button type="button" className="club-knop" onClick={() => void kopieer()}>
        {gekopieerd ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        {gekopieerd ? t.gekopieerd : t.kopieer}
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
  const t = useTekst(WIDGET).beheer

  function wissel(id: string) {
    setGekozen((oud) => (oud.includes(id) ? oud.filter((x) => x !== id) : [...oud, id]))
  }

  async function bewaar() {
    if (!alle && gekozen.length === 0) return setMelding({ ok: false, tekst: t.kiesLes })
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/widget', 'PATCH', { vestiging, aan, domeinen, lestypeIds: alle ? [] : gekozen, kleurmodus, privacyUrl })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: aan ? t.opgeslagenAan : t.opgeslagenUit })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier club-wb">
      <label className="club-beheer-keuze">
        <input type="checkbox" checked={aan} onChange={(e) => setAan(e.target.checked)} />
        <span>
          {t.aan}
          <small className="club-hint club-wb-blok">{t.aanUitleg}</small>
        </span>
      </label>

      <label className="club-wb-veld">
        <span className="club-label">{t.websites}</span>
        <textarea rows={3} value={domeinen} onChange={(e) => setDomeinen(e.target.value)} placeholder={t.websitesPlaats} spellCheck={false} />
        <small className="club-hint">{t.websitesUitleg}</small>
      </label>

      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">{t.welkeLessen}</legend>
        <label className="club-beheer-keuze">
          <input type="checkbox" checked={alle} onChange={(e) => setAlle(e.target.checked)} />
          <span>{t.alleGroepslessen}</span>
        </label>
        {!alle && (
          <div className="club-wb-lessen">
            {lestypen.length === 0 && <p className="club-hint">{t.geenLestypen}</p>}
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
        <legend className="club-label">{t.kleuren}</legend>
        <div className="club-wb-modi">
          {KLEURMODI.map((m) => (
            <label key={m} className="club-beheer-keuze">
              <input type="radio" name="widget-kleurmodus" value={m} checked={kleurmodus === m} onChange={() => setKleurmodus(m)} />
              <span>{t.kleurmodus[m]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="club-wb-veld">
        <span className="club-label">{t.privacy}</span>
        <input type="url" value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} placeholder={t.privacyPlaats} maxLength={300} />
        <small className="club-hint">{t.privacyUitleg}</small>
      </label>

      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar()}>
          {bezig ? t.bezig : t.opslaan}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>

      {code && voorbeeldPad && (
        <section className="club-wb-plakken" aria-labelledby="widget-code-kop">
          <h2 id="widget-code-kop" className="club-label">{t.plakkenKop}</h2>
          <p className="club-hint">{t.plakkenUitleg}</p>
          <KopieerCode code={code} />
          <a className="club-wb-voorbeeld" href={`${voorbeeldPad}&modus=${kleurmodus}`} target="_blank" rel="noopener">
            {t.voorvertoning} <ExternalLink size={15} aria-hidden />
          </a>
        </section>
      )}
    </div>
  )
}
