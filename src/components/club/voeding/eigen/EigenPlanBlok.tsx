'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Apple, Pencil, Send, Sparkles, UserRound } from 'lucide-react'
import type { PlanVoorLid } from '@/lib/club/voeding/model'
import type { LidPlanModus } from '@/lib/club/voeding/eigen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { VOEDING_EIGEN } from '@/lib/aiyourgym/taal/woorden/club/voeding-eigen'
import { stuur } from '@/components/club/app/verzoek'
import { voedingUrl } from '../dagboek/api'
import { Wizard } from './Wizard'
import './eigen.css'

// Mijn voedingsplan in de ledenapp: van wie het plan is (eigen plan of "Van je
// trainer, Daan"), en de knoppen om zelf een plan te maken, aan te passen, een
// voorstel te sturen of in te trekken. Het plan zelf (children) staat eronder
// zolang de stappen dicht zijn.

interface EigenPlanBlokProps {
  plan: PlanVoorLid | null
  modus: LidPlanModus
  voor: string | null
  alleenLezen: boolean
  children?: ReactNode
}

export function EigenPlanBlok({ plan, modus, voor, alleenLezen, children = null }: EigenPlanBlokProps) {
  const t = useTekst(VOEDING_EIGEN)
  const taal = useTaal()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [zeker, setZeker] = useState(false)
  const [bezig, setBezig] = useState(false)
  const ta = t.app

  function klaar(soort: 'opgeslagen' | 'voorstel') {
    setOpen(false)
    setMelding(soort === 'voorstel' ? t.wizard.klaarVoorstel : t.wizard.klaarOpgeslagen)
    router.refresh()
  }

  async function weg(wat: 'plan' | 'voorstel') {
    if (wat === 'plan' && !zeker) return setZeker(true)
    setBezig(true)
    setFout(null)
    const a = await stuur(voedingUrl(`/plan?wat=${wat}`, voor), 'DELETE')
    setBezig(false)
    setZeker(false)
    if (!a.ok) return setFout(a.status === 403 ? t.fout.voorvertoning : t.fout.verwijderen)
    setMelding(null)
    router.refresh()
  }

  if (open) return <Wizard plan={plan} modus={modus} voor={voor} onKlaar={klaar} onSluit={() => setOpen(false)} />

  const openen = () => {
    setMelding(null)
    setOpen(true)
  }

  if (!plan) {
    return (
      <section className="club-ve-leeg" aria-labelledby="ve-leeg-kop">
        <span className="club-ve-leeg-icoon" aria-hidden><Apple size={26} strokeWidth={1.75} /></span>
        <h3 id="ve-leeg-kop">{ta.leegTitel}</h3>
        <p>{ta.leegTekst}</p>
        <button type="button" className="club-vd-hoofdknop" onClick={openen} disabled={alleenLezen}>
          <Sparkles size={18} aria-hidden /> {ta.maken}
        </button>
        <small>{ta.eenMinuut}</small>
        {melding && <p className="club-ve-goed" role="status">{melding}</p>}
      </section>
    )
  }

  const vanTrainer = plan.bron === 'trainer'
  return (
    <>
      <div className="club-ve-bron">
        <span className={`club-ve-label${vanTrainer ? ' is-trainer' : ''}`}>
          <UserRound size={14} aria-hidden />
          {vanTrainer ? (plan.trainerNaam ? ta.vanTrainer(plan.trainerNaam) : ta.vanTrainerZonderNaam) : ta.eigen}
        </span>
        <div className="club-ve-acties">
          {modus === 'voorstel' ? (
            <button type="button" className="club-lidapp-knop" onClick={openen} disabled={alleenLezen || bezig}>
              <Send size={15} aria-hidden /> {ta.voorstellen}
            </button>
          ) : (
            <button type="button" className="club-lidapp-knop" onClick={openen} disabled={alleenLezen || bezig}>
              <Pencil size={15} aria-hidden /> {ta.aanpassen}
            </button>
          )}
        </div>
      </div>
      {plan.voorstelOp && (
        <div className="club-ve-melding">
          <p>{ta.voorstelLigt(formatDatum(plan.voorstelOp, taal, 'lang'))}</p>
          <button type="button" className="club-ve-tekstknop" onClick={() => void weg('voorstel')} disabled={alleenLezen || bezig}>{ta.intrekken}</button>
        </div>
      )}
      {melding && <p className="club-ve-goed" role="status">{melding}</p>}
      {fout && <p className="club-ve-fout" role="alert">{fout}</p>}
      {children}
      {!vanTrainer && (
        <div className="club-ve-weg">
          {zeker && <p role="alert">{ta.weghalenZeker}</p>}
          <div className="club-ve-acties">
            {zeker && <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setZeker(false)} disabled={bezig}>{ta.nee}</button>}
            <button type="button" className="club-ve-tekstknop is-gevaar" onClick={() => void weg('plan')} disabled={alleenLezen || bezig}>
              {zeker ? ta.weghalenJa : ta.weghalen}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
