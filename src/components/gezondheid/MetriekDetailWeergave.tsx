'use client'

// Presentational: detail van één metriek bij geladen data. Periodekeuze via
// Tabs (de container bewaart hem in de URL), grafiek met je normaal, highlight,
// slaapfases/trainingen waar relevant, uitleg en bronnen.

import { Pin, PinOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/Tabs'
import { METRIEKEN, metriekLabel, metriekUitleg, metriekenInGroep } from '@/lib/health/gezondheid-metrics'
import { berekenHighlight } from '@/lib/gezondheid/highlights'
import { berekenNormaal, metingenVoorNormaal } from '@/lib/gezondheid/normaal'
import { bronnenVan, vatMetriekSamen } from '@/lib/gezondheid/samenvatting'
import {
  PERIODES, bouwTrend, isPeriode, periodeLabel, periodeOmschrijving, periodeSamenvatting, type Periode,
} from '@/lib/gezondheid/trends'
import type { GezondheidAntwoord, MetriekSleutel } from '@/lib/gezondheid/types'
import { CompactRegel } from './AlleMetrieken'
import { HighlightLijst } from './HighlightLijst'
import { MetriekWaarde } from './MetriekWaarde'
import { NormaalBlok } from './NormaalBlok'
import { SlaapFasesBlok } from './SlaapFasesBlok'
import { TrendGrafiek } from './TrendGrafiek'
import { WorkoutLijst } from './WorkoutLijst'
import { useTaalset } from './useTaalset'
import styles from './gezondheid.module.css'

interface MetriekDetailWeergaveProps {
  data: GezondheidAntwoord
  sleutel: MetriekSleutel
  periode: Periode
  onPeriode: (periode: Periode) => void
  isVastgezet: boolean
  onWisselVastgezet: () => void
}

function PeriodeStat({ data, sleutel, periode }: { data: GezondheidAntwoord; sleutel: MetriekSleutel; periode: Periode }) {
  const ts = useTaalset()
  const omschrijving = periodeOmschrijving(periode, ts)
  const { waarde, dagen } = periodeSamenvatting(bouwTrend(data.dagen, sleutel, periode, data.vandaag, ts), sleutel)
  const isTotaal = METRIEKEN[sleutel].aggregatie === 'totaal'
  const dagenSleutel = `lichaam.detail.${isTotaal ? 'metTraining' : 'metMeting'}${dagen === 1 ? 'Een' : 'Meer'}`
  return (
    <div className={styles.detailStat}>
      <span className={styles.detailStatLabel}>{ts.t(isTotaal ? 'lichaam.detail.totaal' : 'lichaam.detail.gemiddeld', { periode: omschrijving })}</span>
      {waarde === null
        ? <p className={styles.blokWaarde}>{ts.t('lichaam.detail.geenMetingen')}</p>
        : <MetriekWaarde sleutel={sleutel} waarde={waarde} />}
      {waarde !== null && <span className={styles.kleineTekst}>{ts.t(dagenSleutel, { dagen })}</span>}
    </div>
  )
}

function Verwant({ data, sleutel }: { data: GezondheidAntwoord; sleutel: MetriekSleutel }) {
  const ts = useTaalset()
  const lijst = metriekenInGroep(METRIEKEN[sleutel].groep)
    .filter((s) => s !== sleutel)
    .map((s) => vatMetriekSamen(data.dagen, s, data.vandaag))
    .filter((s) => s !== null)
  if (lijst.length === 0) return null
  return (
    <section className={styles.sectie} aria-labelledby="kop-verwant">
      <h2 id="kop-verwant" className={styles.sectieKop}>{ts.t('lichaam.detail.verwant')}</h2>
      <ul className={styles.compactLijst}>
        {lijst.map((s) => <li key={s.sleutel}><CompactRegel s={s} vandaag={data.vandaag} /></li>)}
      </ul>
    </section>
  )
}

export function MetriekDetailWeergave({
  data, sleutel, periode, onPeriode, isVastgezet, onWisselVastgezet,
}: MetriekDetailWeergaveProps) {
  const ts = useTaalset()
  const label = metriekLabel(sleutel, ts)
  const normaal = berekenNormaal(data.dagen, sleutel, data.vandaag)
  const highlight = berekenHighlight(data.dagen, sleutel, data.vandaag, ts)
  const bronnen = bronnenVan(data.dagen, sleutel, ts)

  return (
    <>
      <PeriodeStat data={data} sleutel={sleutel} periode={periode} />

      <TabsRoot value={periode} onValueChange={(w) => { if (isPeriode(w)) onPeriode(w) }}>
        <TabsList aria-label={ts.t('lichaam.detail.periodeAria')}>
          {PERIODES.map((p) => <TabsTrigger key={p} value={p}>{periodeLabel(p, ts)}</TabsTrigger>)}
        </TabsList>
        {PERIODES.map((p) => (
          <TabsContent key={p} value={p}>
            <TrendGrafiek
              sleutel={sleutel}
              punten={bouwTrend(data.dagen, sleutel, p, data.vandaag, ts)}
              normaal={normaal}
              periode={p}
              omschrijving={`${periodeLabel(p, ts).toLowerCase()}, ${periodeOmschrijving(p, ts)}`}
            />
          </TabsContent>
        ))}
      </TabsRoot>

      {highlight && (
        <section className={styles.sectie} aria-label={ts.t('lichaam.overzicht.opvalt')}>
          <HighlightLijst highlights={[highlight]} metLink={false} />
        </section>
      )}

      <div className={`${styles.sectie} ${styles.tweeKolom}`}>
        <NormaalBlok
          sleutel={sleutel}
          normaal={normaal}
          metingenInVenster={metingenVoorNormaal(data.dagen, sleutel, data.vandaag)}
          samenvatting={vatMetriekSamen(data.dagen, sleutel, data.vandaag)}
          vandaag={data.vandaag}
        />
        <section aria-labelledby="kop-over">
          <h2 id="kop-over" className={styles.blokTitel}>{ts.t('lichaam.detail.over', { label: label.toLowerCase() })}</h2>
          <p className={styles.kleineTekst}>{metriekUitleg(sleutel, ts)}</p>
          {bronnen.length > 0 && (
            <p className={`${styles.kleineTekst} ${styles.hint}`}>{ts.t('lichaam.detail.bron', { bronnen: bronnen.join(', ') })}</p>
          )}
        </section>
      </div>

      {sleutel === 'slaap' && (
        <div className={styles.sectie}><SlaapFasesBlok dagen={data.dagen} vandaag={data.vandaag} /></div>
      )}
      {sleutel === 'workouts' && (
        <div className={styles.sectie}><WorkoutLijst workouts={data.workouts} vandaag={data.vandaag} /></div>
      )}

      <Verwant data={data} sleutel={sleutel} />

      <div className={styles.acties}>
        <Button
          variant="secondary"
          onClick={onWisselVastgezet}
          leftIcon={isVastgezet ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
        >
          {ts.t(isVastgezet ? 'lichaam.detail.losmaken' : 'lichaam.detail.vastzetten')}
        </Button>
      </div>
    </>
  )
}
