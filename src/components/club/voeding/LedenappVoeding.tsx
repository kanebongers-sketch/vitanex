import { DISCLAIMER, type PlanVoorLid } from '@/lib/club/voeding/model'
import { verdeling } from '@/lib/club/voeding/rekenhulp'
import { PlanInhoud } from './PlanInhoud'
import { datumLang, doelLabel } from './weergave'
import './voeding.css'

// Voeding in de ledenapp: het dagdoel als rustige cijfers en balken, de
// adviezen en de voorbeelddag. Alleen wat een lid mag zien (planVoorLid():
// geen interne notitie, geen rekenhulp). Data komt van de server:
//   const plan = await haalPlan(admin, userId, lid.id)
//   <LedenappVoeding plan={plan ? planVoorLid(plan) : null} />

export interface LedenappVoedingProps {
  /** null = de trainer heeft nog geen plan gemaakt (of het kon niet worden geladen). */
  plan: PlanVoorLid | null
}

const RIJEN = [
  { sleutel: 'eiwit', label: 'Eiwit', veld: 'eiwitG', klasse: 'is-eiwit' },
  { sleutel: 'koolhydraten', label: 'Koolhydraten', veld: 'koolhydratenG', klasse: 'is-kh' },
  { sleutel: 'vet', label: 'Vet', veld: 'vetG', klasse: 'is-vet' },
] as const

export function LedenappVoeding({ plan }: LedenappVoedingProps) {
  if (!plan) {
    return (
      <section className="club-voeding club-voeding-app" aria-labelledby="lidapp-voeding-kop">
        <h2 id="lidapp-voeding-kop" className="club-lidapp-kop">Voeding</h2>
        <p className="club-voeding-app-leeg">Je hebt nog geen voedingsplan. Vraag je trainer ernaar; die maakt samen met jou een dagdoel dat bij je past.</p>
      </section>
    )
  }
  const v = verdeling(plan)
  return (
    <section className="club-voeding club-voeding-app" aria-labelledby="lidapp-voeding-kop">
      <h2 id="lidapp-voeding-kop" className="club-lidapp-kop">Voeding</h2>
      <div className="club-voeding-app-blok">
        <span className="club-lidapp-label">Jouw dagdoel</span>
        <p className="club-voeding-kcal">
          <strong>{plan.kcal.toLocaleString('nl-NL')}</strong>
          <span>kcal</span>
        </p>
        <p className="club-voeding-app-doel">{doelLabel(plan.doel)}{plan.bijgewerktOp && ` · van ${datumLang(plan.bijgewerktOp)}`}</p>
        {RIJEN.map((r) => (
          <div key={r.sleutel} className="club-voeding-app-rij">
            <div className="club-voeding-app-rij-kop">
              <span>{r.label}</span>
              <span>{plan[r.veld]} gram</span>
            </div>
            <div className="club-voeding-app-spoor" aria-hidden>
              <span className={r.klasse} style={{ width: `${Math.max(2, v[r.sleutel])}%` }} />
            </div>
          </div>
        ))}
        <p className="club-voeding-app-doel">Eiwit {v.eiwit}%, koolhydraten {v.koolhydraten}% en vet {v.vet}% van je kcal.</p>
      </div>
      {(plan.adviezen.length > 0 || plan.maaltijden.length > 0) && (
        <div className="club-voeding-app-blok">
          <PlanInhoud adviezen={plan.adviezen} maaltijden={plan.maaltijden} idPrefix="lidapp-voeding" />
        </div>
      )}
      <p className="club-voeding-disclaimer">{DISCLAIMER}</p>
    </section>
  )
}
