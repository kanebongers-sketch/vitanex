import type { PlanVoorLid } from '@/lib/club/voeding/model'
import { verdeling } from '@/lib/club/voeding/rekenhulp'
import { Apple, TriangleAlert } from 'lucide-react'
import { LegeStaat } from '@/components/club/app/LegeStaat'
import { PlanInhoud } from './PlanInhoud'
import { datumLang, doelLabel } from './weergave'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'
import './voeding.css'

// Voeding in de ledenapp: het dagdoel als rustige cijfers en balken, de
// adviezen en de voorbeelddag. Alleen wat een lid mag zien (planVoorLid():
// geen interne notitie, geen rekenhulp). Data komt van de server:
//   const voeding = voedingVoorApp(await haalPlan(admin, userId, lid.id))
//   <LedenappVoeding plan={voeding.staat === 'plan' ? voeding.plan : null} fout={voeding.staat === 'fout'} />

export interface LedenappVoedingProps {
  /** null = de trainer heeft nog geen plan gemaakt, of het kon niet worden geladen (zie fout). */
  plan: PlanVoorLid | null
  /** Het plan kon niet worden gelezen: een foutmelding in plaats van "nog geen plan". */
  fout?: boolean
}

const RIJEN = [
  { sleutel: 'eiwit', veld: 'eiwitG', klasse: 'is-eiwit' },
  { sleutel: 'koolhydraten', veld: 'koolhydratenG', klasse: 'is-kh' },
  { sleutel: 'vet', veld: 'vetG', klasse: 'is-vet' },
] as const

export async function LedenappVoeding({ plan, fout = false }: LedenappVoedingProps) {
  const taal = await getTaal()
  const tv = VOEDING[taal]
  const t = tv.app
  if (fout) {
    return (
      <section className="club-voeding club-voeding-app" aria-labelledby="lidapp-voeding-kop">
        <h2 id="lidapp-voeding-kop" className="club-lidapp-kop">{t.titel}</h2>
        <LegeStaat Icoon={TriangleAlert} titel={t.nietBeschikbaar} fout>
          {t.laadFout}
        </LegeStaat>
      </section>
    )
  }
  if (!plan) {
    return (
      <section className="club-voeding club-voeding-app" aria-labelledby="lidapp-voeding-kop">
        <h2 id="lidapp-voeding-kop" className="club-lidapp-kop">{t.titel}</h2>
        <LegeStaat Icoon={Apple} titel={t.geenPlan}>
          {t.vraag}
        </LegeStaat>
      </section>
    )
  }
  const v = verdeling(plan)
  return (
    <section className="club-voeding club-voeding-app" aria-labelledby="lidapp-voeding-kop">
      <h2 id="lidapp-voeding-kop" className="club-lidapp-kop">{t.titel}</h2>
      <div className="club-voeding-app-blok">
        <span className="club-lidapp-label">{t.dagdoel}</span>
        <p className="club-voeding-kcal">
          <strong>{formatGetal(plan.kcal, taal)}</strong>
          <span>kcal</span>
        </p>
        <p className="club-voeding-app-doel">{doelLabel(plan.doel, taal)}{plan.bijgewerktOp && t.van(datumLang(plan.bijgewerktOp, taal))}</p>
        {RIJEN.map((r) => (
          <div key={r.sleutel} className="club-voeding-app-rij">
            <div className="club-voeding-app-rij-kop">
              <span>{tv.macro[r.sleutel]}</span>
              <span>{t.gram(plan[r.veld])}</span>
            </div>
            <div className="club-voeding-app-spoor" aria-hidden>
              <span className={r.klasse} style={{ width: `${Math.max(2, v[r.sleutel])}%` }} />
            </div>
          </div>
        ))}
        <p className="club-voeding-app-doel">{t.verdeling(v.eiwit, v.koolhydraten, v.vet)}</p>
      </div>
      {(plan.adviezen.length > 0 || plan.maaltijden.length > 0) && (
        <div className="club-voeding-app-blok">
          <PlanInhoud adviezen={plan.adviezen} maaltijden={plan.maaltijden} idPrefix="lidapp-voeding" taal={taal} />
        </div>
      )}
      <p className="club-voeding-disclaimer">{tv.disclaimer}</p>
    </section>
  )
}
