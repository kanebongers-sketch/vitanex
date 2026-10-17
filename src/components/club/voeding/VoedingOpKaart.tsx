import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { clubPad } from '@/lib/club/kern/vestiging'
import type { VoedingPlan } from '@/lib/club/voeding/model'
import { MacroBord } from './MacroBord'
import { PlanInhoud } from './PlanInhoud'
import { datumLang, doelLabel } from './weergave'
import './voeding.css'

// Blok Voeding op de ledenkaart: het huidige plan, met een link naar bewerken.

interface VoedingOpKaartProps {
  lidId: string
  vestiging: string
  /** undefined = nog geen plan; null = kon niet worden geladen. */
  plan: VoedingPlan | undefined | null
}

export function VoedingOpKaart({ lidId, vestiging, plan }: VoedingOpKaartProps) {
  const href = clubPad(`/voeding/lid/${lidId}`, vestiging)
  return (
    <section className="club-kaart club-voeding club-voeding-kaart" aria-labelledby="voeding-kop" id="voeding">
      <div className="club-sectiekop">
        <h2 id="voeding-kop">Voeding</h2>
        {plan ? (
          <Link href={href} className="club-knop club-knop--klein">
            <Pencil size={14} aria-hidden /> Plan bewerken
          </Link>
        ) : plan === undefined ? (
          <Link href={href} className="club-knop club-knop--klein club-knop--primair">
            <Plus size={14} aria-hidden /> Plan maken
          </Link>
        ) : null}
      </div>
      {plan === null && <p className="club-melding club-melding--fout" role="status">Het voedingsplan kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.</p>}
      {plan === undefined && <p className="club-hint">Nog geen voedingsplan. Met de rekenhulp zet je in een paar minuten een dagdoel neer, of kies een sjabloon van je sportschool.</p>}
      {plan && (
        <>
          <div className="club-voeding-kaart-raster">
            <MacroBord doelen={plan} compact />
            <div className="club-voeding-blok">
              <PlanInhoud adviezen={plan.adviezen.slice(0, 4)} maaltijden={[]} idPrefix="kaart-voeding" />
              {plan.adviezen.length > 4 && <p className="club-hint">En nog {plan.adviezen.length - 4} adviezen.</p>}
              {plan.maaltijden.length > 0 && <p className="club-hint">Dagindeling met {plan.maaltijden.length} {plan.maaltijden.length === 1 ? 'maaltijd' : 'maaltijden'}.</p>}
            </div>
          </div>
          <p className="club-voeding-meta">
            {doelLabel(plan.doel)}
            {plan.bijgewerktOp && ` · bijgewerkt op ${datumLang(plan.bijgewerktOp)}`}
            {plan.bijgewerktDoor && ` door ${plan.bijgewerktDoor}`}
          </p>
        </>
      )}
    </section>
  )
}
