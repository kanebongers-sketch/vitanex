'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, UserRound, X } from 'lucide-react'
import type { Doelen, PlanBron as Bron, PlanVoorstel } from '@/lib/club/voeding/model'
import type { TrainerActie } from '@/lib/club/voeding/eigen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum, formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'
import { VOEDING_EIGEN } from '@/lib/aiyourgym/taal/woorden/club/voeding-eigen'

// Op de ledenkaart en in de editor: komt het plan van het lid zelf of van de
// trainer, en ligt er een voorstel van het lid? De trainer neemt een eigen plan
// over, of neemt een voorstel over of wijst het af. Aanpassen gaat via de editor.

interface PlanBronProps {
  lidId: string
  bron: Bron
  huidig: Doelen
  voorstel: PlanVoorstel | null
  voorstelOp: string | null
  /** Het lid bewaarde lichaamsgegevens bij het eigen plan (met toestemming). */
  metGegevens: boolean
}

const RIJEN = [
  ['kcal', 'kcal'],
  ['eiwitG', 'eiwit'],
  ['koolhydratenG', 'koolhydraten'],
  ['vetG', 'vet'],
] as const

export function PlanBron({ lidId, bron, huidig, voorstel, voorstelOp, metGegevens }: PlanBronProps) {
  const t = useTekst(VOEDING_EIGEN).kaart
  const tv = useTekst(VOEDING)
  const taal = useTaal()
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function doe(actie: TrainerActie) {
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch(`/api/club/voeding/leden/${encodeURIComponent(lidId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actie }) })
      if (!res.ok) throw new Error(String(res.status))
      router.refresh()
    } catch {
      setFout(t.mislukt)
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="club-voeding-bron">
      <div className="club-voeding-bron-rij">
        <span className={`club-voeding-bron-label${bron === 'lid' ? ' is-lid' : ''}`}>
          <UserRound size={13} aria-hidden /> {bron === 'lid' ? t.bronLid : t.bronTrainer}
        </span>
        {bron === 'lid' && (
          <button type="button" className="club-knop club-knop--klein" onClick={() => void doe('overnemen')} disabled={bezig}>
            <Check size={14} aria-hidden /> {bezig ? t.bezig : t.overnemen}
          </button>
        )}
      </div>
      {bron === 'lid' && <p className="club-hint">{t.lidUitleg}{metGegevens && ` ${t.gegevensBewaard}`}</p>}
      {voorstel && (
        <div className="club-voeding-voorstel" role="group" aria-label={t.voorstel}>
          <strong>{t.voorstelTitel(voorstelOp ? formatDatum(voorstelOp, taal, 'lang') : '')}</strong>
          <p className="club-hint">{t.voorstelUitleg}</p>
          <table>
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">{tv.macro.kcal}</span></th>
                <th scope="col">{t.huidig}</th>
                <th scope="col">{t.voorstel}</th>
              </tr>
            </thead>
            <tbody>
              {RIJEN.map(([veld, sleutel]) => (
                <tr key={veld} className={huidig[veld] !== voorstel[veld] ? 'is-anders' : undefined}>
                  <th scope="row">{tv.macro[sleutel]}</th>
                  <td>{formatGetal(huidig[veld], taal)}</td>
                  <td>{formatGetal(voorstel[veld], taal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {voorstel.doel && <p className="club-hint">{tv.doel[voorstel.doel].label}</p>}
          <div className="club-voeding-voorstel-knoppen">
            <button type="button" className="club-knop club-knop--klein club-knop--primair" onClick={() => void doe('voorstelOvernemen')} disabled={bezig}>
              <Check size={14} aria-hidden /> {t.voorstelOvernemen}
            </button>
            <button type="button" className="club-knop club-knop--klein" onClick={() => void doe('voorstelAfwijzen')} disabled={bezig}>
              <X size={14} aria-hidden /> {t.afwijzen}
            </button>
          </div>
        </div>
      )}
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </div>
  )
}
