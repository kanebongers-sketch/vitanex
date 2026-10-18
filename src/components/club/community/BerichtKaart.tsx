'use client'

import { useState, type FormEvent } from 'react'
import { Flag, Hand, ThumbsUp, Trash2 } from 'lucide-react'
import { MELD_REDENEN, MELD_REDEN_LABEL, MAX_TOELICHTING, REACTIE_LABEL, type MeldReden, type ReactieSoort, type TijdlijnBericht } from '@/lib/club/community/model'
import { geledenLabel } from '@/lib/club/meldingen/model'
import { useActie } from './useActie'
import { Terugkoppeling } from './Terugkoppeling'

// Een bericht in de tijdlijn: schrijver (privacynaam), tijd, tekst, reacties
// en voor een bericht van een ander "Melden"; voor een eigen bericht
// "Verwijderen". Reactieknoppen zijn wisselknoppen (aria-pressed).

interface Props {
  bericht: TijdlijnBericht
  nu: string
  alleenLezen: boolean
}

const ICOON: Record<ReactieSoort, typeof ThumbsUp> = { duim: ThumbsUp, highfive: Hand }

const STATUS_LABEL: Partial<Record<TijdlijnBericht['status'], string>> = {
  vastgehouden: 'Wacht op de sportschool',
  verborgen: 'Verborgen door de sportschool',
}

export function BerichtKaart({ bericht: b, nu, alleenLezen }: Props) {
  const { bezig, melding, doe } = useActie()
  const [meldOpen, setMeldOpen] = useState(false)
  const [reden, setReden] = useState<MeldReden | null>(null)
  const [toelichting, setToelichting] = useState('')
  const url = `/api/club/lid/community/berichten/${encodeURIComponent(b.id)}`
  const kanReageren = !alleenLezen && !b.eigen && b.status === 'zichtbaar'

  async function meld(e: FormEvent) {
    e.preventDefault()
    if (!reden) return
    const ok = await doe('meld', `${url}/melden`, 'POST', { reden, toelichting }, 'Bedankt. De sportschool bekijkt dit bericht.')
    if (ok) setMeldOpen(false)
  }

  return (
    <li className={`club-cm-bericht${b.eigen ? ' is-eigen' : ''}${b.status !== 'zichtbaar' ? ' is-wacht' : ''}`}>
      <div className="club-cm-bericht-kop">
        <span className="club-cm-avatar" aria-hidden>
          {b.auteur.charAt(0)}
        </span>
        <strong>{b.auteur}</strong>
        <time dateTime={b.op}>{geledenLabel(b.op, new Date(nu))}</time>
      </div>
      {STATUS_LABEL[b.status] && <p className="club-cm-bericht-status">{STATUS_LABEL[b.status]}</p>}
      <p className="club-cm-bericht-tekst">{b.tekst}</p>
      <div className="club-cm-bericht-voet">
        <div className="club-cm-reacties">
          {(['duim', 'highfive'] as const).map((soort) => {
            const Icoon = ICOON[soort]
            const gegeven = b.reacties.eigen.includes(soort)
            const aantal = b.reacties[soort]
            if (!kanReageren && aantal === 0) return null
            return (
              <button
                key={soort}
                type="button"
                className="club-cm-reactie"
                aria-pressed={gegeven}
                aria-label={`${REACTIE_LABEL[soort].label}${aantal ? `, ${aantal}` : ''}`}
                disabled={!kanReageren || bezig === soort}
                onClick={() => void doe(soort, `${url}/reactie`, gegeven ? 'DELETE' : 'POST', { soort })}
              >
                <Icoon size={16} aria-hidden />
                {aantal > 0 && <span>{aantal}</span>}
              </button>
            )
          })}
        </div>
        {!alleenLezen && b.eigen && (
          <button type="button" className="club-cm-tekstknop" disabled={bezig === 'weg'} onClick={() => void doe('weg', url, 'DELETE', undefined, 'Je bericht is verwijderd.')}>
            <Trash2 size={14} aria-hidden /> Verwijderen
          </button>
        )}
        {kanReageren && !b.gemeld && !meldOpen && (
          <button type="button" className="club-cm-tekstknop" onClick={() => setMeldOpen(true)}>
            <Flag size={14} aria-hidden /> Melden
          </button>
        )}
        {b.gemeld && <span className="club-cm-gemeld">Gemeld</span>}
      </div>
      {meldOpen && (
        <form className="club-cm-meld" onSubmit={(e) => void meld(e)}>
          <fieldset>
            <legend>Waarom meld je dit bericht?</legend>
            {MELD_REDENEN.map((r) => (
              <label key={r} className="club-cm-keus">
                <input type="radio" name={`reden-${b.id}`} value={r} checked={reden === r} onChange={() => setReden(r)} />
                <span>{MELD_REDEN_LABEL[r]}</span>
              </label>
            ))}
          </fieldset>
          <label className="club-cm-veld">
            <span>Toelichting (mag leeg)</span>
            <textarea rows={2} maxLength={MAX_TOELICHTING} value={toelichting} onChange={(e) => setToelichting(e.target.value)} />
          </label>
          <p className="club-cm-noot">De schrijver ziet niet wie het bericht meldde.</p>
          <div className="club-cm-meld-knoppen">
            <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setMeldOpen(false)}>
              Annuleren
            </button>
            <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair" disabled={!reden || bezig === 'meld'}>
              {bezig === 'meld' ? 'Versturen...' : 'Meld bericht'}
            </button>
          </div>
        </form>
      )}
      <Terugkoppeling melding={melding} />
    </li>
  )
}
