import { Lock } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { geldendDoel, telOp, weekGemiddelde, weekOverzicht } from '@/lib/club/voeding/dagboek/berekeningen'
import { haalDagboekVoorTrainer } from '@/lib/club/voeding/dagboek/opslag'
import type { VoedingPlan } from '@/lib/club/voeding/model'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { VOEDING_DAGBOEK } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { WeekBalken } from './WeekBalken'
import './dagboek.css'

// Het voedingsdagboek van een lid op de ledenkaart (tabblad Training), voor
// wie het onderdeel Voeding mag. ALLEEN als het lid dat in de ledenapp heeft
// aangezet (club_voeding_instellingen.trainer_zien, AVG: gezondheidsgerelateerd).
// Anders alleen dat het niet gedeeld wordt; geen cijfers, geen hint over inhoud.

interface Props {
  admin: SupabaseClient
  userId: string
  lidId: string
  vandaag: string
  /** Het plan van de coach (voor het doel); undefined of null = geen of niet geladen. */
  plan: VoedingPlan | undefined | null
}

export async function DagboekOpKaart({ admin, userId, lidId, vandaag, plan }: Props) {
  const taal = await getTaal()
  const t = VOEDING_DAGBOEK[taal]
  const tk = t.kaart
  const data = await haalDagboekVoorTrainer(admin, userId, lidId, vandaag)

  let inhoud
  if (data.staat === 'fout') inhoud = <p className="club-melding club-melding--fout" role="status">{tk.laadFout}</p>
  else if (data.staat === 'niet-gestart') inhoud = <p className="club-hint">{tk.nietGestart}</p>
  else if (data.staat === 'niet-gedeeld') {
    inhoud = (
      <p className="club-hint">
        <Lock size={14} aria-hidden /> {tk.nietGedeeld}
      </p>
    )
  } else {
    const { doel } = geldendDoel(plan ?? null, data.eigenDoelen)
    const week = weekOverzicht(data.regels, vandaag)
    const gem = weekGemiddelde(week)
    const vandaagTotaal = telOp(data.regels.filter((r) => r.datum === vandaag))
    inhoud = data.regels.length === 0 ? (
      <p className="club-hint">{tk.leeg}</p>
    ) : (
      <>
        <div className="club-vd-kaart-cijfers">
          <div className="club-vd-kaart-cijfer">
            <span>{tk.gemiddeld}</span>
            <strong>{gem ? gem.kcal : 0} {t.macro.kcal}</strong>
            {gem && doel && <span>{tk.tovDoel(Math.round((gem.kcal / doel.kcal) * 100))}</span>}
          </div>
          <div className="club-vd-kaart-cijfer">
            <span>{t.macro.eiwit}</span>
            <strong>{t.ring.gram(gem ? Math.round(gem.eiwitG) : 0)}</strong>
            {doel && <span>{t.ring.vanGram(doel.eiwitG)}</span>}
          </div>
          <div className="club-vd-kaart-cijfer">
            <span>{tk.vandaag}</span>
            <strong>{vandaagTotaal.kcal} {t.macro.kcal}</strong>
            {vandaagTotaal.kcal === 0 && <span>{tk.geenVandaag}</span>}
          </div>
        </div>
        <WeekBalken week={week} doelKcal={doel?.kcal ?? null} t={t} taal={taal} />
        <p className="club-hint">{tk.dagenGelogd(week.filter((d) => d.gelogd).length)}</p>
      </>
    )
  }

  return (
    <section className="club-kaart club-vd-kaartblok" aria-labelledby="voeding-dagboek-kop" id="voeding-dagboek">
      <div className="club-sectiekop">
        <h2 id="voeding-dagboek-kop">{tk.titel}</h2>
        {data.staat === 'gedeeld' && <span className="club-hint">{tk.laatste7}</span>}
      </div>
      {inhoud}
      {data.staat === 'gedeeld' && data.sinds && <p className="club-hint">{tk.gedeeldSinds(formatDatum(data.sinds, taal, 'lang'))}</p>}
    </section>
  )
}
