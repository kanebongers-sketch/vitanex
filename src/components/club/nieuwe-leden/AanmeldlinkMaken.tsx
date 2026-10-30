'use client'

import { useState, type FormEvent } from 'react'
import { QrCode } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { aanmeldPad, GELDIG_KEUZES, type GeldigKeuze, type LinkSoort } from '@/lib/club/nieuwe-leden/regels'
import type { LinkOpScherm } from '@/lib/club/nieuwe-leden/links-opslag'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'
import { QrPaneel } from './QrPaneel'
import type { VormKeuze } from './NieuweLedenKnoppen'

// Een aanmeldlink maken: voor een persoon (werkt een keer) of voor iedereen met
// de link (balie, flyer), hoe lang hij geldig is, en of het lidmaatschap vast
// ligt. Met slimme standaarden: een persoon 7 dagen, iedereen 90 dagen.
// Daarna meteen de QR, groot, om te scannen, te delen, te downloaden of te printen.

interface Props {
  vestiging: string
  vormen: VormKeuze[]
  sportschool: string
  /** Het adres van de sportschool (https://aiyourgym.com/<slug>), zonder slash aan het eind. */
  basis: string
  mailKlaar: boolean
  onGemaakt?: (link: LinkOpScherm) => void
}

const STANDAARD: Record<LinkSoort, GeldigKeuze> = { eenmalig: 7, herbruikbaar: 90 }

export function aanmeldUrl(basis: string, code: string): string {
  return `${basis}${aanmeldPad(code)}`
}

export function AanmeldlinkMaken({ vestiging, vormen, sportschool, basis, mailKlaar, onGemaakt }: Props) {
  const tekst = useTekst(NIEUWE_LEDEN)
  const w = tekst.link
  const [soort, setSoort] = useState<LinkSoort>('herbruikbaar')
  const [geldig, setGeldig] = useState<GeldigKeuze>(STANDAARD.herbruikbaar)
  const [vormId, setVormId] = useState('')
  const [naam, setNaam] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [link, setLink] = useState<LinkOpScherm | null>(null)

  function kiesSoort(s: LinkSoort) {
    setSoort(s)
    setGeldig(STANDAARD[s])
  }

  async function maak(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const r = await stuur('/api/club/leden/aanmeldlinks', 'POST', { vestiging, soort, geldig, vormId: vormId || null, naam })
    setBezig(false)
    if (!r.ok) return setFout(r.fout)
    const nieuw = (r.data as { link?: LinkOpScherm } | null)?.link
    if (!nieuw) return setFout(tekst.fouten.opslaan)
    setLink(nieuw)
    onGemaakt?.(nieuw)
  }

  if (link) return <QrPaneel url={aanmeldUrl(basis, link.code)} sportschool={sportschool} posterHref={`/club/leden/aanmeldlinks/${link.id}/poster`} />

  const keuzes = soort === 'eenmalig' ? GELDIG_KEUZES.filter((g) => g !== 0) : GELDIG_KEUZES
  return (
    <form className="club-nl-form" onSubmit={(e) => void maak(e)}>
      <fieldset className="club-nl-groep">
        <legend>{w.soort}</legend>
        <div className="club-nl-tegels">
          {(['herbruikbaar', 'eenmalig'] as const).map((s) => (
            <button key={s} type="button" className="club-nl-tegel" aria-pressed={soort === s} onClick={() => kiesSoort(s)}>
              <strong>{s === 'eenmalig' ? w.eenmalig : w.herbruikbaar}</strong>
              <small>{s === 'eenmalig' ? w.eenmaligUitleg : w.herbruikbaarUitleg}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="club-nl-groep">
        <legend>{w.geldig}</legend>
        <div className="club-nl-pillen">
          {keuzes.map((g) => (
            <button key={g} type="button" className="club-nl-pil" aria-pressed={geldig === g} onClick={() => setGeldig(g)}>{g === 0 ? w.altijd : w.dagen(g)}</button>
          ))}
        </div>
      </fieldset>
      <div className="club-nl-rij">
        {vormen.length > 0 && (
          <label className="club-veld">
            <span>{w.vorm}</span>
            <select className="club-invoer" value={vormId} onChange={(e) => setVormId(e.target.value)}>
              <option value="">{w.vormKiest}</option>
              {vormen.map((v) => <option key={v.id} value={v.id}>{v.naam}</option>)}
            </select>
          </label>
        )}
        <label className="club-veld">
          <span>{w.naam}</span>
          <input className="club-invoer" maxLength={80} value={naam} onChange={(e) => setNaam(e.target.value)} aria-describedby="club-nl-naam-hint" />
          <small id="club-nl-naam-hint" className="club-hint">{w.naamHint}</small>
        </label>
      </div>
      <p className="club-hint">{w.proef}</p>
      {!mailKlaar && <p className="club-melding club-melding--fout" role="status">{w.geenMail}</p>}
      <div aria-live="assertive">{fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}</div>
      <div className="club-nl-voet">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig} aria-busy={bezig || undefined}>
          <QrCode size={16} aria-hidden /> {bezig ? w.bezig : w.knop}
        </button>
      </div>
    </form>
  )
}
