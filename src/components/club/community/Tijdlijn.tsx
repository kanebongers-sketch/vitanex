'use client'

import { useId, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { MAX_TEKST, type TijdlijnBericht } from '@/lib/club/community/model'
import { useActie } from './useActie'
import { Terugkoppeling } from './Terugkoppeling'
import { BerichtKaart } from './BerichtKaart'
import type { CommunityTekst } from '@/lib/aiyourgym/taal/woorden/club/community'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

// De tijdlijn van een groep: bovenin een vak voor een nieuw bericht, daaronder
// de berichten (nieuwste eerst) met reacties. Een bericht met een woord uit de
// filter wordt vastgehouden; de schrijver ziet dat eerlijk terug.

interface Props {
  groepId: string
  groepNaam: string
  berichten: TijdlijnBericht[]
  nu: string
  alleenLezen: boolean
}

function naPlaatsen(data: unknown, t: CommunityTekst['tijdlijn']): string {
  const status = typeof data === 'object' && data !== null && 'status' in data ? (data as { status: unknown }).status : null
  return status === 'vastgehouden' ? t.vastgehouden : t.geplaatst
}

export function Tijdlijn({ groepId, groepNaam, berichten, nu, alleenLezen }: Props) {
  const [tekst, setTekst] = useState('')
  const { bezig, melding, doe } = useActie()
  const t = useTekst(COMMUNITY).tijdlijn
  const veldId = useId()
  const over = MAX_TEKST - tekst.length

  async function plaats(e: FormEvent) {
    e.preventDefault()
    if (!tekst.trim()) return
    const ok = await doe('plaats', `/api/club/lid/community/groepen/${encodeURIComponent(groepId)}/berichten`, 'POST', { tekst }, (data) => naPlaatsen(data, t))
    if (ok) setTekst('')
  }

  return (
    <section className="club-cm-tijdlijn" aria-label={t.label(groepNaam)}>
      {alleenLezen ? (
        <p className="club-cm-noot">{t.voorvertoning}</p>
      ) : (
        <form className="club-cm-schrijf" onSubmit={(e) => void plaats(e)}>
          <label htmlFor={veldId} className="club-sr">
            {t.nieuw(groepNaam)}
          </label>
          <textarea
            id={veldId}
            value={tekst}
            onChange={(e) => setTekst(e.target.value.slice(0, MAX_TEKST))}
            maxLength={MAX_TEKST}
            rows={3}
            placeholder={t.plaatshouder}
            aria-describedby={`${veldId}-teller`}
          />
          <div className="club-cm-schrijf-voet">
            <span id={`${veldId}-teller`} className={`club-cm-teller-tekens${over < 40 ? ' is-bijna' : ''}`} aria-live="polite">
              {over < 100 ? t.nogTekens(over) : t.hoogstens(MAX_TEKST)}
            </span>
            <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair" disabled={!tekst.trim() || bezig === 'plaats'}>
              <Send size={16} aria-hidden /> {bezig === 'plaats' ? t.bezig : t.plaats}
            </button>
          </div>
        </form>
      )}
      <Terugkoppeling melding={melding} />
      {berichten.length > 0 ? (
        <ul className="club-cm-berichten">
          {berichten.map((b) => (
            <BerichtKaart key={b.id} bericht={b} nu={nu} alleenLezen={alleenLezen} />
          ))}
        </ul>
      ) : (
        <p className="club-cm-leeg">{t.leeg}</p>
      )}
    </section>
  )
}
