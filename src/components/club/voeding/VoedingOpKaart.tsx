import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { clubPad } from '@/lib/club/kern/vestiging'
import type { VoedingPlan } from '@/lib/club/voeding/model'
import { MacroBord } from './MacroBord'
import { PlanInhoud } from './PlanInhoud'
import { PlanBron } from './PlanBron'
import { datumLang, doelLabel } from './weergave'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'
import './voeding.css'

// Blok Voeding op de ledenkaart: het huidige plan, met een link naar bewerken.

interface VoedingOpKaartProps {
  lidId: string
  vestiging: string
  /** undefined = nog geen plan; null = kon niet worden geladen. */
  plan: VoedingPlan | undefined | null
}

export async function VoedingOpKaart({ lidId, vestiging, plan }: VoedingOpKaartProps) {
  const taal = await getTaal()
  const t = VOEDING[taal].kaart
  const href = clubPad(`/voeding/lid/${lidId}`, vestiging)
  return (
    <section className="club-kaart club-voeding club-voeding-kaart" aria-labelledby="voeding-kop" id="voeding">
      <div className="club-sectiekop">
        <h2 id="voeding-kop">{t.titel}</h2>
        {plan ? (
          <Link href={href} className="club-knop club-knop--klein">
            <Pencil size={14} aria-hidden /> {t.bewerken}
          </Link>
        ) : plan === undefined ? (
          <Link href={href} className="club-knop club-knop--klein club-knop--primair">
            <Plus size={14} aria-hidden /> {t.maken}
          </Link>
        ) : null}
      </div>
      {plan === null && <p className="club-melding club-melding--fout" role="status">{t.laadFout}</p>}
      {plan === undefined && <p className="club-hint">{t.leeg}</p>}
      {plan && (
        <>
          <PlanBron lidId={lidId} bron={plan.bron} huidig={plan} voorstel={plan.voorstel} voorstelOp={plan.voorstelOp} metGegevens={plan.bron === 'lid' && plan.lidToestemmingOp !== null && plan.berekening !== null} />
          <div className="club-voeding-kaart-raster">
            <MacroBord doelen={plan} compact taal={taal} />
            <div className="club-voeding-blok">
              <PlanInhoud adviezen={plan.adviezen.slice(0, 4)} maaltijden={[]} idPrefix="kaart-voeding" taal={taal} />
              {plan.adviezen.length > 4 && <p className="club-hint">{t.nogAdviezen(plan.adviezen.length - 4)}</p>}
              {plan.maaltijden.length > 0 && <p className="club-hint">{t.dagindeling(plan.maaltijden.length)}</p>}
            </div>
          </div>
          <p className="club-voeding-meta">
            {doelLabel(plan.doel, taal)}
            {plan.bijgewerktOp && t.bijgewerkt(datumLang(plan.bijgewerktOp, taal))}
            {plan.bijgewerktDoor && t.door(plan.bijgewerktDoor)}
          </p>
        </>
      )}
    </section>
  )
}
